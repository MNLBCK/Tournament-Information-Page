#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "[1/5] JSON-Dateien validieren"
python3 -m json.tool data/config.json >/dev/null
python3 -m json.tool data/event.json >/dev/null
python3 -m json.tool data/catering.json >/dev/null
python3 -m json.tool data/anfahrt.json >/dev/null
python3 -m json.tool data/spielfeldlayout.json >/dev/null
python3 -m json.tool data/spielplan.json >/dev/null
python3 -m json.tool data/admin.json >/dev/null
python3 -m json.tool data/events/index.json >/dev/null
while IFS= read -r file; do python3 -m json.tool "$file" >/dev/null; done < <(find data/events -maxdepth 1 -name '*.json' ! -name 'index.json' -type f)

echo "[2/5] Referenzierte Seiten prüfen"
html_files=(index.html turnier.html verpflegung.html anfahrt.html spielfeldlayout.html spielplan.html admin.html)
missing=0
for file in "${html_files[@]}"; do
  while IFS= read -r href; do
    target="${href#href=\"}"
    target="${target%\"}"
    [[ "$target" == http* ]] && continue
    [[ "$target" == \#* ]] && continue
    target="${target%%\?*}"
    if [[ ! -f "$target" ]]; then
      echo "Fehlender Link in $file: $target"
      missing=1
    fi
  done < <(grep -o 'href="[^"]\+"' "$file")
done

if [[ $missing -ne 0 ]]; then
  echo "Linkprüfung fehlgeschlagen"
  exit 1
fi

echo "[3/5] Asset-Dateien prüfen"
required_assets=(styles.css script.js admin.js favicon.svg)
for asset in "${required_assets[@]}"; do
  [[ -f "$asset" ]] || { echo "Fehlendes Asset: $asset"; exit 1; }
done

echo "[4/5] Hostlogos aller Turniere prüfen"
python3 - <<'PY'
import json
from pathlib import Path

logo_folder = Path("images/hosts")
index = json.loads(Path("data/events/index.json").read_text(encoding="utf-8"))
for item in index["events"]:
    event = json.loads((Path("data/events") / item["file"]).read_text(encoding="utf-8"))
    logo = (event.get("organizer") or {}).get("logo") or {}
    url = str(logo.get("url") or "").strip()
    if url:
        path = Path(url)
        if path.parent != logo_folder or not path.is_file():
            raise SystemExit(f"Hostlogo fehlt oder ist nicht in images/hosts/: {url} ({item['id']})")
        if not str(logo.get("alt") or "").strip():
            raise SystemExit(f"Hostlogo ohne Alt-Text: {item['id']}")
PY

echo "[5/5] Datenquellen im Script prüfen"
grep -En './data/config.json|./data/events/index.json' script.js >/dev/null

echo "Pages-Preflight erfolgreich."
