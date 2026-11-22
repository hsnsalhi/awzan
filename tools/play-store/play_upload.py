#!/usr/bin/env python3
"""Envoie l'App Bundle de Zellige des awzān sur Google Play (API androidpublisher v3).

Crée une modification (edit), importe l'AAB, l'affecte à la piste demandée, et, avec
`--listing`, met aussi à jour la fiche : titre, descriptions (ar, fr-FR, en-US depuis
tools/store/listing.json), icône, image de présentation et captures téléphone.

Variable d'environnement : PLAY_SERVICE_ACCOUNT_JSON (clé JSON du compte de service,
invité dans Play Console avec le droit de publier sur l'app com.mainlyb.awzan).
Dépendances : google-api-python-client, google-auth.

    python3 tools/play-store/play_upload.py --aab app-release.aab --track internal [--status draft] [--listing]
    python3 tools/play-store/play_upload.py --listing          # fiche seule, sans AAB
"""
import argparse
import glob
import json
import os

from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

PACKAGE = "com.mainlyb.awzan"
ROOT = os.path.join(os.path.dirname(__file__), "..", "..")
LISTING = json.load(open(os.path.join(ROOT, "tools", "store", "listing.json"), encoding="utf8"))
LANGS = {"ar": "ar", "fr-FR": "fr", "en-US": "en"}
IMAGES = {
    "icon": [os.path.join(ROOT, "docs", "stores", "icon_512.png")],
    "featureGraphic": [os.path.join(ROOT, "tools", "branding", "out", "feature_1024x500.png")],
    "phoneScreenshots": sorted(glob.glob(os.path.join(ROOT, "docs", "stores", "screenshots", "android", "*.png"))),
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--aab")
    ap.add_argument("--track", default="internal")
    ap.add_argument("--status", default="completed",
                    help="completed (publier / envoyer en revue) ou draft")
    ap.add_argument("--listing", action="store_true", help="mettre aussi à jour la fiche")
    a = ap.parse_args()

    creds = service_account.Credentials.from_service_account_info(
        json.loads(os.environ["PLAY_SERVICE_ACCOUNT_JSON"]),
        scopes=["https://www.googleapis.com/auth/androidpublisher"],
    )
    edits = build("androidpublisher", "v3", credentials=creds, cache_discovery=False).edits()
    edit_id = edits.insert(packageName=PACKAGE, body={}).execute()["id"]

    if a.aab:
        bundle = edits.bundles().upload(
            packageName=PACKAGE, editId=edit_id,
            media_body=MediaFileUpload(a.aab, mimetype="application/octet-stream", resumable=True),
        ).execute()
        code = bundle["versionCode"]
        print(f"AAB importé : versionCode {code}")
        edits.tracks().update(
            packageName=PACKAGE, editId=edit_id, track=a.track,
            body={"track": a.track, "releases": [{
                "versionCodes": [str(code)],
                "status": a.status,
                "releaseNotes": [{"language": lang, "text": LISTING[k]["whats_new"]}
                                 for lang, k in LANGS.items()],
            }]},
        ).execute()

    if a.listing:
        for lang, k in LANGS.items():
            t = LISTING[k]
            edits.listings().update(packageName=PACKAGE, editId=edit_id, language=lang, body={
                "language": lang, "title": t["name"], "shortDescription": t["short"],
                "fullDescription": t["description"]}).execute()
            for kind, files in IMAGES.items():
                edits.images().deleteall(packageName=PACKAGE, editId=edit_id,
                                         language=lang, imageType=kind).execute()
                for f in files:
                    edits.images().upload(packageName=PACKAGE, editId=edit_id, language=lang,
                                          imageType=kind, media_body=MediaFileUpload(f, mimetype="image/png")).execute()
            print(f"fiche {lang} : textes et {sum(len(f) for f in IMAGES.values())} images")
        edits.details().patch(packageName=PACKAGE, editId=edit_id, body={
            "contactEmail": LISTING["email"], "contactWebsite": LISTING["support_url"],
            "defaultLanguage": "ar"}).execute()

    edits.commit(packageName=PACKAGE, editId=edit_id).execute()
    print(f"Modification validée{f' : piste « {a.track} » ({a.status})' if a.aab else ''}.")


if __name__ == "__main__":
    main()
