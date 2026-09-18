from pathlib import Path
from PIL import Image, ImageEnhance, ImageOps


PROJECT = Path(__file__).resolve().parents[1]
SOURCE_DIR = Path(r"E:\Projects\婚纱照合成")
DAY_PATH = PROJECT / "public/textures/day/second-photos_day.webp"
NIGHT_PATH = PROJECT / "public/textures/night/second-photos_night.webp"
SHARE_PATH = PROJECT / "public/media/og-image.webp"

# Pixel rectangles in the original 4096 × 4096 UV atlas.
SLOTS = [
    {"source": "4.png", "box": (2010, 300, 3068, 1088), "rotate": 0, "center": (0.5, 0.48)},
    {"source": "2-1.png", "box": (0, 1904, 1056, 2932), "rotate": 270, "center": (0.5, 0.44)},
    {"source": "5.png", "box": (2424, 2108, 3454, 3120), "rotate": 270, "center": (0.5, 0.43)},
    {"source": "7.png", "box": (2528, 3092, 3542, 4096), "rotate": 270, "center": (0.5, 0.42)},
]


def fitted_photo(path: Path, size: tuple[int, int], rotate: int, center: tuple[float, float]) -> Image.Image:
    with Image.open(path) as opened:
        photo = ImageOps.exif_transpose(opened).convert("RGB")
    if rotate:
        target = (size[1], size[0])
        photo = ImageOps.fit(photo, target, method=Image.Resampling.LANCZOS, centering=center)
        photo = photo.rotate(rotate, expand=True, resample=Image.Resampling.BICUBIC)
    else:
        photo = ImageOps.fit(photo, size, method=Image.Resampling.LANCZOS, centering=center)
    return photo.resize(size, Image.Resampling.LANCZOS)


def night_treatment(photo: Image.Image) -> Image.Image:
    photo = ImageEnhance.Brightness(photo).enhance(0.34)
    photo = ImageEnhance.Contrast(photo).enhance(0.92)
    warm_shadow = Image.new("RGB", photo.size, (35, 19, 12))
    return Image.blend(photo, warm_shadow, 0.18)


def replace_atlas(base_path: Path, output_path: Path, night: bool = False) -> None:
    with Image.open(base_path) as opened:
        atlas = opened.convert("RGB")
    if atlas.size != (4096, 4096):
        raise ValueError(f"Unexpected atlas size: {atlas.size}")

    for slot in SLOTS:
        left, top, right, bottom = slot["box"]
        size = (right - left, bottom - top)
        photo = fitted_photo(SOURCE_DIR / slot["source"], size, slot["rotate"], slot["center"])
        if night:
            photo = night_treatment(photo)
        atlas.paste(photo, (left, top))

    atlas.save(output_path, "WEBP", quality=92, method=6)


def replace_share_image() -> None:
    with Image.open(SOURCE_DIR / "1-2.png") as opened:
        photo = ImageOps.exif_transpose(opened).convert("RGB")
    share = ImageOps.fit(
        photo,
        (1200, 630),
        method=Image.Resampling.LANCZOS,
        centering=(0.5, 0.25),
    )
    share.save(SHARE_PATH, "WEBP", quality=90, method=6)


if __name__ == "__main__":
    replace_atlas(DAY_PATH, DAY_PATH, night=False)
    replace_atlas(NIGHT_PATH, NIGHT_PATH, night=True)
    replace_share_image()
    print("Updated day/night wedding atlases and the social share image.")
