"""
clean_assets.py — Limpeza de metadados OPSEC para assets do MangaReader.

Uso:
  python scripts/clean_assets.py                  # limpa frontend/assets/
  python scripts/clean_assets.py path/to/img.jpg  # arquivo único
  python scripts/clean_assets.py --report         # apenas audita, não modifica
"""
import sys
import json
import shutil
import argparse
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("Execute: pip install pillow")
    sys.exit(1)

ROOT = Path(__file__).parent.parent
ASSETS_DIR = ROOT / "frontend" / "assets"
SUPPORTED = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tiff", ".tif"}


def audit(path: Path) -> dict:
    result = {"file": path.name, "fields": {}, "risk": "clean"}
    high_risk = {"gps", "artist", "creator", "software", "make", "model", "serial", "comment"}
    try:
        with Image.open(path) as img:
            exif = img._getexif() if hasattr(img, "_getexif") else None
            if exif:
                from PIL.ExifTags import TAGS
                for tag_id, val in exif.items():
                    tag = TAGS.get(tag_id, str(tag_id)).lower()
                    result["fields"][tag] = str(val)[:80]
                    if any(r in tag for r in high_risk):
                        result["risk"] = "HIGH"
            for k, v in getattr(img, "info", {}).items():
                result["fields"][f"chunk:{k}"] = str(v)[:80]
    except Exception as e:
        result["fields"]["_error"] = str(e)
    return result


def clean(path: Path) -> bool:
    try:
        with Image.open(path) as img:
            mode = img.mode
            if path.suffix.lower() in {".jpg", ".jpeg"} and mode in ("RGBA", "P", "LA"):
                img = img.convert("RGB")
                mode = "RGB"
            clean_img = Image.new(mode, img.size)
            clean_img.putdata(list(img.getdata()))
            fmt = "JPEG" if path.suffix.lower() in {".jpg", ".jpeg"} else "PNG"
            kw = {"quality": 95, "optimize": True} if fmt == "JPEG" else {"optimize": True}
            tmp = path.with_suffix(".tmp" + path.suffix)
            clean_img.save(str(tmp), format=fmt, **kw)
            shutil.move(str(tmp), str(path))
        return True
    except Exception as e:
        print(f"  ERRO {path.name}: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(description="Limpa metadados de imagens de assets.")
    parser.add_argument("input", nargs="?", default=str(ASSETS_DIR))
    parser.add_argument("--report", action="store_true", help="Apenas audita, não modifica")
    args = parser.parse_args()

    src = Path(args.input).resolve()
    files = [src] if src.is_file() else [
        f for f in src.rglob("*") if f.is_file() and f.suffix.lower() in SUPPORTED
    ]

    if not files:
        print("Nenhuma imagem encontrada.")
        return

    print(f"{'AUDITORIA' if args.report else 'LIMPEZA'} — {len(files)} arquivo(s)\n")
    ok = warn = 0

    for f in files:
        info = audit(f)
        status = f"[{info['risk']}]"
        n = len(info["fields"])
        print(f"  {status:8} {f.name} — {n} campo(s)")
        if info["risk"] == "HIGH":
            for k, v in info["fields"].items():
                print(f"           {k}: {v}")

        if not args.report:
            if n > 0:
                success = clean(f)
                if success:
                    print(f"           -> limpa OK")
                    ok += 1
                else:
                    warn += 1
            else:
                print(f"           -> ja limpa")
                ok += 1

    print(f"\n{'Auditoria' if args.report else 'Resultado'}: {ok} OK  {warn} falhou")


if __name__ == "__main__":
    main()
