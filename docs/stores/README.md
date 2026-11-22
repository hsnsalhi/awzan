# Zellige des awzān sur l'App Store et Google Play

Même chaîne que Chabaka : app Flutter (`mobile/`), workflows GitHub Actions, mêmes comptes
(équipe Apple `K69HUXQMGL`, compte Play TechLYB), mêmes clés.

| | iOS | Android |
|---|---|---|
| Identifiant | `com.mainlyb.awzan` | `com.mainlyb.awzan` |
| Nom | زليج الأوزان: أوزان الأفعال | idem |
| Catégorie | Éducation (+ Référence) | Éducation |
| Confidentialité | https://hsnsalhi.github.io/awzan/privacy.html — aucune donnée collectée | idem |
| Textes de fiche | `tools/store/listing.json` (ar, fr, en) | idem |
| Visuels | `docs/stores/screenshots/ios_6.5/` (1284×2778) | `docs/stores/icon_512.png`, `tools/branding/out/feature_1024x500.png`, `docs/stores/screenshots/android/` (1080×1920) |

## Architecture de l'app

Le site (index.html, css, js, data, fonts) est copié dans `mobile/assets/web/` par
`mobile/tool/sync_web.sh` (fait par les workflows). L'app démarre un serveur HTTP sur
127.0.0.1 qui sert ces fichiers à une WebView plein écran : 100 % hors ligne, sans réseau
externe. Retour Android → ferme le panneau ouvert ; liens externes → navigateur.

## 1. Secrets GitHub (une fois) — mêmes valeurs que dans le dépôt chabaka

Settings → Secrets and variables → Actions → New repository secret :

| Secret | Usage |
|---|---|
| `IOS_P12_BASE64`, `IOS_P12_PASSWORD` | certificat Apple Distribution |
| `APPLE_TEAM_ID` | `K69HUXQMGL` |
| `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_API_KEY_BASE64` | API App Store Connect (rôle Admin ou App Manager, pour créer l'identifiant et le profil) |
| `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` | clé d'upload Play (celle de Chabaka, valeurs dans `chabaka_android_secrets.txt`) |
| `PLAY_SERVICE_ACCOUNT_JSON` | compte de service `github-play` |

Pas de profil de provisionnement à fabriquer : `tools/app-store/asc_profile.py` crée
l'identifiant `com.mainlyb.awzan` et le profil « Awzan App Store » par l'API.

## 2. iOS

1. **App Store Connect → Apps → + → Nouvelle app** (l'API ne permet pas de créer une app) :
   plateforme iOS, nom `زليج الأوزان: أوزان الأفعال`, langue principale arabe, identifiant de lot
   `com.mainlyb.awzan` (il apparaît après le premier run du workflow TestFlight, sinon le créer
   dans Certificates, Identifiers & Profiles), SKU `awzan`.
   Ajouter les langues français et anglais (Informations sur l'app → localisations).
2. **Actions → « iOS → TestFlight » → Run workflow**, `build_number` = 1.
3. Une fois le build traité (≈ 15 min, e-mail d'Apple), tester via TestFlight.
4. Dans App Store Connect, une seule fois : **Prix et disponibilité** (gratuit, tous pays),
   **Confidentialité de l'app** (« Aucune donnée collectée »), coordonnées App Review
   (prénom, nom, téléphone).
5. **Actions → « iOS → App Store (soumission) »**, version `1.0.0`, build `1`, d'abord
   `submit` décoché (préparation : textes, captures, catégories, âge 4+, notes App Review),
   vérifier, puis relancer avec `submit` coché.

Risque de revue : Apple refuse parfois les apps « site web enveloppé » (règle 4.2). Ici tout le
contenu est embarqué et l'app marche hors ligne ; la note App Review (dans `asc_release.py`)
l'explique. En cas de refus, réponse type : contenu embarqué, hors ligne, outil d'étude
interactif ; pistes d'amélioration : favoris et historique natifs, partage d'une racine.

## 3. Android

1. **Play Console → Créer une application** : nom `زليج الأوزان: أوزان الأفعال`, langue par
   défaut arabe, application, gratuite.
2. **Utilisateurs et autorisations** : donner au compte de service `github-play` les droits
   sur cette app (publier, gérer les pistes de test).
3. Configurer l'app (obligatoire) : politique de confidentialité (URL ci-dessus), accès
   (sans conditions), annonces : non, classification du contenu (Référence/Éducation, tout à
   non), audience 13+, sécurité des données « aucune donnée collectée ni partagée »,
   catégorie Éducation, coordonnées contact@techlyb.com.
4. **Actions → « Android → Play Store »** : `build_number` 1, `track` `internal`,
   `status` `draft`, `listing` coché → AAB sur la piste de test interne (brouillon) + fiche
   (textes, icône, image de présentation, captures). Publier la release interne dans Play
   Console, tester.
5. Production : relancer avec `build_number` 2, `track` `production`, `status` `completed`
   (envoi en revue). Le compte TechLYB est un compte organisation : pas de test fermé
   obligatoire de 14 jours.

## 4. Versions suivantes

- Modifier le site (racine du dépôt) : l'app le reprend au prochain build.
- `mobile/pubspec.yaml` : `version: 1.0.1+N`. iOS : TestFlight puis soumission ; Android :
  workflow avec `track` `production`. Mettre à jour `whats_new` dans `listing.json`.
- Visuels : `node tools/branding/render.js`, captures : `python3 -m http.server 8765` puis
  `node tools/branding/screenshots.js http://localhost:8765`, icônes de l'app :
  `cd mobile && dart run flutter_launcher_icons`.

## Licences des données

Le Quranic Arabic Corpus est sous GNU GPL, Tanzil sous CC BY 3.0 (attribution dans l'app :
bouton « ؟ »). La GPL est réputée difficilement compatible avec les conditions de l'App Store :
à valider avant publication (par exemple en demandant l'accord de l'auteur du corpus, ou en
publiant le code de l'app sous GPL).
