"""Create memory-friendly images for the in-scene wedding photo lightbox."""

from pathlib import Path

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public/media/wedding-photos"
OUTPUT = SOURCE / "lightbox"
NAMES = ("1-2", "2-1", "4", "7", "8")
MAX_SIZE = (720, 1080)


OUTPUT.mkdir(parents=True, exist_ok=True)
for name in NAMES:
    with Image.open(SOURCE / f"{name}.png") as opened:
        image = ImageOps.exif_transpose(opened).convert("RGB")
        image.thumbnail(MAX_SIZE, Image.Resampling.LANCZOS)
        image.save(OUTPUT / f"{name}.webp", "WEBP", quality=82, method=6)

print("Created lightweight wedding photo lightbox images.")
