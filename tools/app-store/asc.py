"""Client minimal de l'API App Store Connect (jeton JWT ES256), partagé par les scripts.

Variables d'environnement : ASC_KEY_ID, ASC_ISSUER_ID, et la clé .p8 soit dans le fichier
ASC_KEY_PATH, soit dans ASC_API_KEY_BASE64 (base64 ou texte PEM brut, comme le secret GitHub).
"""
import base64
import binascii
import os
import re
import sys
import time

import jwt
import requests

API = "https://api.appstoreconnect.apple.com/v1"
BUNDLE_ID = "com.mainlyb.awzan"


def private_key():
    if os.environ.get("ASC_KEY_PATH"):
        return open(os.environ["ASC_KEY_PATH"]).read()
    raw = os.environ["ASC_API_KEY_BASE64"].strip()
    if "BEGIN PRIVATE KEY" in raw:
        return raw
    cleaned = re.sub(r"[^A-Za-z0-9+/=]", "", raw).rstrip("=")
    cleaned += "=" * (-len(cleaned) % 4)
    try:
        return base64.b64decode(cleaned).decode("utf-8")
    except (binascii.Error, UnicodeDecodeError) as e:
        sys.exit(f"Clé API illisible ({e}) : ni PEM, ni base64 d'un PEM.")


def token():
    now = int(time.time())
    return jwt.encode(
        {"iss": os.environ["ASC_ISSUER_ID"], "iat": now, "exp": now + 1100,
         "aud": "appstoreconnect-v1"},
        private_key(), algorithm="ES256", headers={"kid": os.environ["ASC_KEY_ID"]},
    )


def call(method, path, body=None, params=None):
    url = path if path.startswith("http") else API + path
    r = requests.request(method, url, params=params, json=body,
                         headers={"Authorization": f"Bearer {token()}"}, timeout=60)
    if r.status_code >= 400:
        print(f"ERREUR {method} {path} → {r.status_code}\n{r.text}", file=sys.stderr)
        r.raise_for_status()
    return r.json() if r.text else {}


def app_id():
    apps = call("GET", "/apps", params={"filter[bundleId]": BUNDLE_ID})["data"]
    if not apps:
        sys.exit(f"Aucune app « {BUNDLE_ID} » dans App Store Connect : créez-la d'abord "
                 "(Apps → + → Nouvelle app, identifiant de lot com.mainlyb.awzan).")
    return apps[0]["id"]
