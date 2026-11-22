#!/usr/bin/env python3
"""Crée (ou reprend) l'identifiant de lot com.mainlyb.awzan et son profil « Awzan App Store »,
lié au certificat de distribution dont le numéro de série est donné, puis écrit le profil.

    python3 tools/app-store/asc_profile.py --serial <hex> --out awzan.mobileprovision
"""
import argparse
import base64
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from asc import BUNDLE_ID, call  # noqa: E402

PROFILE_NAME = "Awzan App Store"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--serial", required=True)
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    serial = a.serial.upper().lstrip("0")

    # 1. Identifiant de lot.
    ids = call("GET", "/bundleIds", params={"filter[identifier]": BUNDLE_ID})["data"]
    ids = [b for b in ids if b["attributes"]["identifier"] == BUNDLE_ID]
    if ids:
        bid = ids[0]["id"]
        print(f"identifiant de lot {BUNDLE_ID} : existant")
    else:
        bid = call("POST", "/bundleIds", {"data": {"type": "bundleIds", "attributes": {
            "identifier": BUNDLE_ID, "name": "Awzan", "platform": "IOS"}}})["data"]["id"]
        print(f"identifiant de lot {BUNDLE_ID} : créé")

    # 2. Certificat de distribution correspondant au .p12.
    certs = call("GET", "/certificates", params={"limit": 200})["data"]
    cert = next((c for c in certs
                 if c["attributes"]["serialNumber"].upper().lstrip("0") == serial), None)
    if not cert:
        sys.exit(f"Certificat de série {a.serial} introuvable dans le compte.")
    print(f"certificat : {cert['attributes']['name']} ({cert['attributes']['certificateType']})")

    # 3. Profil App Store : repris s'il est actif et lié à ce certificat, sinon recréé.
    profiles = call("GET", "/profiles", params={"filter[name]": PROFILE_NAME,
                                                "include": "certificates", "limit": 50})
    for p in profiles["data"]:
        certs_of = [c["id"] for c in p["relationships"]["certificates"].get("data") or []]
        if p["attributes"]["profileState"] == "ACTIVE" and cert["id"] in certs_of:
            content = p["attributes"]["profileContent"]
            print("profil : existant")
            break
        call("DELETE", f"/profiles/{p['id']}")
        print("profil : ancien supprimé")
    else:
        content = call("POST", "/profiles", {"data": {
            "type": "profiles",
            "attributes": {"name": PROFILE_NAME, "profileType": "IOS_APP_STORE"},
            "relationships": {
                "bundleId": {"data": {"type": "bundleIds", "id": bid}},
                "certificates": {"data": [{"type": "certificates", "id": cert["id"]}]},
            }}})["data"]["attributes"]["profileContent"]
        print("profil : créé")
    with open(a.out, "wb") as f:
        f.write(base64.b64decode(content))
    print(f"profil écrit : {a.out}")


if __name__ == "__main__":
    main()
