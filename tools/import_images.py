"""Lädt Bilder aus import/images.json herunter, optimiert sie und legt sie in static/img ab.
Format: [{"url": "...", "files": ["hero-start.jpg", ...]}, ...]"""
import io, json, sys, urllib.request
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parent.parent
items = json.loads((root / "import" / "images.json").read_text())
out = root / "static" / "img"
out.mkdir(parents=True, exist_ok=True)
for it in items:
    data = urllib.request.urlopen(it["url"], timeout=60).read()
    im = Image.open(io.BytesIO(data)).convert("RGB")
    if im.width > 2400:
        im = im.resize((2400, round(im.height * 2400 / im.width)), Image.LANCZOS)
    for f in it["files"]:
        im.save(out / f, "JPEG", quality=80, optimize=True, progressive=True)
        print("ok", f, im.size)
(root / "import" / "images.json").unlink()
