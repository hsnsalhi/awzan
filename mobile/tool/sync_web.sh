#!/bin/sh
# Copie le site (racine du dépôt) dans mobile/assets/web/ avant chaque build.
# Usage : sh tool/sync_web.sh   (depuis mobile/)
set -e
cd "$(dirname "$0")/.."
rm -rf assets/web
mkdir -p assets/web
cp ../index.html assets/web/
cp -R ../css ../js ../fonts ../data assets/web/
echo "assets/web : $(find assets/web -type f | wc -l | tr -d ' ') fichiers, $(du -sh assets/web | cut -f1)"
