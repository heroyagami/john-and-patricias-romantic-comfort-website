"""Build small scene textures for mobile browsers from the current wedding atlases."""

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public" / "textures" / "day"
OUTPUT = ROOT / "public" / "textures" / "mobile"
MAX_SIZE = (1024, 1024)


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for source in sorted(SOURCE.glob("*_day.webp")):
        with Image.open(source) as opened:
            image = opened.convert("RGBA")
            image.thumbnail(MAX_SIZE, Image.Resampling.LANCZOS)
            destination = OUTPUT / source.name
            image.save(destination, "WEBP", quality=82, method=6)
            print(f"{source.name}: {destination.stat().st_size} bytes")


if __name__ == "__main__":
    main()
