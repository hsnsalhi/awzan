#!/usr/bin/env python3
"""Prépare (et soumet, sur demande) une version App Store de Zellige des awzān.

Étapes : version iOS `--version` (créée si besoin) ← build `--build` ; textes de la fiche
(description, mots-clés, texte promotionnel, URL, nouveautés après la 1re version) depuis
tools/store/listing.json ; nom, sous-titre et URL de confidentialité ; catégories ;
déclaration d'âge (4+) ; captures 6,5" (docs/stores/screenshots/ios_6.5/) si absentes ;
puis, avec `--submit`, envoi à App Review (publication automatique après approbation).

À faire une fois à la main dans App Store Connect (non exposé par l'API) : créer l'app,
prix (gratuit) et disponibilité, questionnaire « Confidentialité de l'app » (aucune donnée).

    python3 tools/app-store/asc_release.py --version 1.0.0 --build 1 [--submit]
"""
import argparse
import glob
import hashlib
import json
import os
import sys

import requests

sys.path.insert(0, os.path.dirname(__file__))
from asc import app_id, call  # noqa: E402

ROOT = os.path.join(os.path.dirname(__file__), "..", "..")
LISTING = json.load(open(os.path.join(ROOT, "tools", "store", "listing.json"), encoding="utf8"))
SHOTS = {"APP_IPHONE_65": os.path.join(ROOT, "docs", "stores", "screenshots", "ios_6.5")}
EDITABLE = {"PREPARE_FOR_SUBMISSION", "DEVELOPER_REJECTED", "REJECTED",
            "METADATA_REJECTED", "INVALID_BINARY"}
REVIEW_NOTES = (
    "Zellige of Awzan is a fully offline study tool for the verb patterns (awzān) of the Quran. "
    "All content (941 roots, 1,474 verbs, every verse in Uthmani script, two classical "
    "dictionaries) is bundled in the app; no account, no network access, no data collection. "
    "Tap a star to open a root, tap a petal to see a verb form with its verses; use the "
    "pattern bar at the bottom to light up a pattern across the wall; ✦ opens a quiz."
)


def loc_texts(locale):
    for prefix in ("ar", "fr", "en"):
        if locale.lower().startswith(prefix):
            return LISTING[prefix]
    return None


def upload_screenshots(loc_id, locale):
    sets = call("GET", f"/appStoreVersionLocalizations/{loc_id}/appScreenshotSets")["data"]
    for display, folder in SHOTS.items():
        files = sorted(glob.glob(os.path.join(folder, "*.png")))
        if not files:
            continue
        s = next((x for x in sets if x["attributes"]["screenshotDisplayType"] == display), None)
        if s and call("GET", f"/appScreenshotSets/{s['id']}/appScreenshots")["data"]:
            print(f"captures {locale} {display} : déjà présentes")
            continue
        if not s:
            s = call("POST", "/appScreenshotSets", {"data": {
                "type": "appScreenshotSets", "attributes": {"screenshotDisplayType": display},
                "relationships": {"appStoreVersionLocalization": {"data": {
                    "type": "appStoreVersionLocalizations", "id": loc_id}}}}})["data"]
        for path in files:
            data = open(path, "rb").read()
            shot = call("POST", "/appScreenshots", {"data": {
                "type": "appScreenshots",
                "attributes": {"fileName": os.path.basename(path), "fileSize": len(data)},
                "relationships": {"appScreenshotSet": {"data": {
                    "type": "appScreenshotSets", "id": s["id"]}}}}})["data"]
            for op in shot["attributes"]["uploadOperations"]:
                chunk = data[op["offset"]:op["offset"] + op["length"]]
                headers = {h["name"]: h["value"] for h in op["requestHeaders"]}
                requests.request(op["method"], op["url"], data=chunk, headers=headers,
                                 timeout=120).raise_for_status()
            call("PATCH", f"/appScreenshots/{shot['id']}", {"data": {
                "type": "appScreenshots", "id": shot["id"],
                "attributes": {"uploaded": True,
                               "sourceFileChecksum": hashlib.md5(data).hexdigest()}}})
        print(f"captures {locale} {display} : {len(files)} envoyées")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--version", required=True)
    ap.add_argument("--build", required=True)
    ap.add_argument("--submit", action="store_true")
    a = ap.parse_args()
    APP_ID = app_id()
    print(f"app {APP_ID}")

    # 1. Version éditable (créée si besoin).
    versions = call("GET", f"/apps/{APP_ID}/appStoreVersions",
                    params={"filter[platform]": "IOS", "limit": 20})["data"]
    first_release = not any(v["attributes"]["appStoreState"] == "READY_FOR_SALE" for v in versions)
    version = next((v for v in versions if v["attributes"]["versionString"] == a.version), None)
    if version is None:
        editable = next((v for v in versions if v["attributes"]["appStoreState"] in EDITABLE), None)
        if editable:
            version = call("PATCH", f"/appStoreVersions/{editable['id']}", {"data": {
                "type": "appStoreVersions", "id": editable["id"],
                "attributes": {"versionString": a.version}}})["data"]
        else:
            version = call("POST", "/appStoreVersions", {"data": {
                "type": "appStoreVersions",
                "attributes": {"platform": "IOS", "versionString": a.version,
                               "releaseType": "AFTER_APPROVAL"},
                "relationships": {"app": {"data": {"type": "apps", "id": APP_ID}}}}})["data"]
    state = version["attributes"]["appStoreState"]
    if state not in EDITABLE:
        sys.exit(f"La version {a.version} est en état {state} : rien à modifier.")
    vid = version["id"]
    call("PATCH", f"/appStoreVersions/{vid}", {"data": {
        "type": "appStoreVersions", "id": vid, "attributes": {"copyright": LISTING["copyright"]}}})
    print(f"version {a.version} : {state}")

    # 2. Build.
    builds = call("GET", "/builds", params={
        "filter[app]": APP_ID, "filter[version]": a.build,
        "filter[preReleaseVersion.version]": a.version})["data"]
    if not builds:
        sys.exit(f"Build {a.build} de la version {a.version} introuvable (TestFlight).")
    build = builds[0]
    if build["attributes"]["processingState"] != "VALID":
        sys.exit("Le build n'est pas encore traité par Apple.")
    if build["attributes"].get("usesNonExemptEncryption") is None:
        call("PATCH", f"/builds/{build['id']}", {"data": {
            "type": "builds", "id": build["id"], "attributes": {"usesNonExemptEncryption": False}}})
    call("PATCH", f"/appStoreVersions/{vid}/relationships/build",
         {"data": {"type": "builds", "id": build["id"]}})
    print(f"build {a.build} attaché")

    # 3. Textes et captures de la version, par langue.
    for loc in call("GET", f"/appStoreVersions/{vid}/appStoreVersionLocalizations")["data"]:
        code, t = loc["attributes"]["locale"], loc_texts(loc["attributes"]["locale"])
        if not t:
            continue
        attrs = {"description": t["description"], "keywords": t["keywords"],
                 "promotionalText": t["promo"], "supportUrl": LISTING["support_url"],
                 "marketingUrl": LISTING["marketing_url"]}
        if not first_release:
            attrs["whatsNew"] = t["whats_new"]
        call("PATCH", f"/appStoreVersionLocalizations/{loc['id']}", {"data": {
            "type": "appStoreVersionLocalizations", "id": loc["id"], "attributes": attrs}})
        print(f"textes {code}")
        upload_screenshots(loc["id"], code)

    # 4. Fiche : nom, sous-titre, confidentialité, catégories, âge.
    infos = call("GET", f"/apps/{APP_ID}/appInfos")["data"]
    info = next((i for i in infos if i["attributes"].get("appStoreState") in EDITABLE
                 or i["attributes"].get("state") in ("PREPARE_FOR_SUBMISSION",
                                                     "READY_FOR_REVIEW")), infos[0])
    for loc in call("GET", f"/appInfos/{info['id']}/appInfoLocalizations")["data"]:
        code, t = loc["attributes"]["locale"], loc_texts(loc["attributes"]["locale"])
        attrs = {"privacyPolicyUrl": LISTING["privacy_url"]}
        if t:
            attrs.update(name=t["name"], subtitle=t["subtitle"])
        try:
            call("PATCH", f"/appInfoLocalizations/{loc['id']}", {"data": {
                "type": "appInfoLocalizations", "id": loc["id"], "attributes": attrs}})
            print(f"fiche {code}")
        except requests.HTTPError:
            print(f"fiche {code} : non modifiée (voir l'erreur ci-dessus)")
    try:
        call("PATCH", f"/appInfos/{info['id']}", {"data": {"type": "appInfos", "id": info["id"],
             "relationships": {
                 "primaryCategory": {"data": {"type": "appCategories", "id": "EDUCATION"}},
                 "secondaryCategory": {"data": {"type": "appCategories", "id": "REFERENCE"}}}}})
        print("catégories : Éducation, Référence")
    except requests.HTTPError:
        print("catégories : à régler dans App Store Connect")
    try:
        age = call("GET", f"/appInfos/{info['id']}/ageRatingDeclaration")["data"]
        none = {k: "NONE" for k, v in age["attributes"].items() if isinstance(v, str) and v in
                ("NONE", "INFREQUENT_OR_MILD", "FREQUENT_OR_INTENSE")}
        flags = {k: False for k, v in age["attributes"].items() if isinstance(v, bool)}
        call("PATCH", f"/ageRatingDeclarations/{age['id']}", {"data": {
            "type": "ageRatingDeclarations", "id": age["id"], "attributes": {**none, **flags}}})
        print("âge : 4+")
    except requests.HTTPError:
        print("âge : questionnaire à remplir dans App Store Connect")

    # 5. Coordonnées et notes pour App Review.
    detail = call("GET", f"/appStoreVersions/{vid}/appStoreReviewDetail").get("data")
    attrs = {"contactEmail": LISTING["email"], "notes": REVIEW_NOTES, "demoAccountRequired": False}
    if detail:
        call("PATCH", f"/appStoreReviewDetails/{detail['id']}", {"data": {
            "type": "appStoreReviewDetails", "id": detail["id"], "attributes": attrs}})
    else:
        print("coordonnées App Review : prénom, nom et téléphone à saisir une fois dans App Store Connect")

    if not a.submit:
        print("Préparation terminée (sans envoi à App Review).")
        return

    # 6. Envoi à App Review.
    sub = call("POST", "/reviewSubmissions", {"data": {
        "type": "reviewSubmissions", "attributes": {"platform": "IOS"},
        "relationships": {"app": {"data": {"type": "apps", "id": APP_ID}}}}})["data"]
    call("POST", "/reviewSubmissionItems", {"data": {
        "type": "reviewSubmissionItems",
        "relationships": {"reviewSubmission": {"data": {"type": "reviewSubmissions", "id": sub["id"]}},
                          "appStoreVersion": {"data": {"type": "appStoreVersions", "id": vid}}}}})
    call("PATCH", f"/reviewSubmissions/{sub['id']}", {"data": {
        "type": "reviewSubmissions", "id": sub["id"], "attributes": {"submitted": True}}})
    print(f"Version {a.version} (build {a.build}) envoyée à App Review.")


if __name__ == "__main__":
    main()
