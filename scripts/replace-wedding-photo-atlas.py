from pathlib import Path
import calendar

from PIL import Image, ImageDraw, ImageEnhance, ImageFont, ImageOps


PROJECT = Path(__file__).resolve().parents[1]
SOURCE_DIR = Path(r"E:\Projects\婚纱照合成")
DAY_PATH = PROJECT / "public/textures/day/second-photos_day.webp"
NIGHT_PATH = PROJECT / "public/textures/night/second-photos_night.webp"
SHARE_PATH = PROJECT / "public/media/og-image.webp"
CALENDAR_ART_PATH = PROJECT / "public/media/calendar-october-2026.png"
SERIF_FONT = Path(r"C:\Windows\Fonts\simsun.ttc")
SANS_FONT = Path(r"C:\Windows\Fonts\msyh.ttc")

# Pixel rectangles in the original 4096 × 4096 UV atlas.
SLOTS = [
    {"source": "4.png", "box": (2010, 300, 3068, 1088), "rotate": 0, "center": (0.5, 0.48)},
    {"source": "2-1.png", "box": (0, 1904, 1056, 2932), "rotate": 270, "center": (0.5, 0.44)},
    {"source": "5.png", "box": (2424, 2108, 3454, 3120), "rotate": 270, "center": (0.5, 0.43)},
    {"source": "8.png", "box": (2528, 3092, 3542, 4096), "rotate": 270, "center": (0.5, 0.38)},
]

QUOTE_BOX = (0, 872, 1022, 1888)
CALENDAR_GRID_BOX = (0, 2930, 1304, 4096)
CALENDAR_ART_BOX = (1315, 3120, 2525, 4096)


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


def make_quote_card(size: tuple[int, int]) -> Image.Image:
    card = Image.new("RGB", size, (239, 226, 207))
    draw = ImageDraw.Draw(card)
    title_font = ImageFont.truetype(str(SERIF_FONT), 74)
    signature_font = ImageFont.truetype(str(SANS_FONT), 34)
    ink = (83, 67, 48)
    lines = ["从今往后", "朝暮与共"]
    line_boxes = [draw.textbbox((0, 0), line, font=title_font) for line in lines]
    block_height = sum(box[3] - box[1] for box in line_boxes) + 44
    y = (size[1] - block_height) // 2 - 40
    for line, box in zip(lines, line_boxes):
        width = box[2] - box[0]
        draw.text(((size[0] - width) / 2, y), line, font=title_font, fill=ink)
        y += box[3] - box[1] + 44
    signature = "— 吴昊 & 舒倩"
    signature_box = draw.textbbox((0, 0), signature, font=signature_font)
    draw.text(
        (size[0] - (signature_box[2] - signature_box[0]) - 72, size[1] - 112),
        signature,
        font=signature_font,
        fill=(111, 91, 66),
    )
    return card


def make_calendar_grid() -> Image.Image:
    # Draw upright first, then rotate into the atlas UV orientation.
    upright_size = (CALENDAR_GRID_BOX[3] - CALENDAR_GRID_BOX[1], CALENDAR_GRID_BOX[2] - CALENDAR_GRID_BOX[0])
    page = Image.new("RGB", upright_size, (239, 227, 210))
    draw = ImageDraw.Draw(page)
    title_font = ImageFont.truetype(str(SERIF_FONT), 78)
    subtitle_font = ImageFont.truetype(str(SANS_FONT), 29)
    weekday_font = ImageFont.truetype(str(SANS_FONT), 28)
    day_font = ImageFont.truetype(str(SANS_FONT), 27)
    ink = (78, 65, 50)
    muted = (135, 112, 83)

    draw.text((58, 50), "十月", font=title_font, fill=ink)
    draw.text((60, 145), "OCTOBER  ·  2026", font=subtitle_font, fill=muted)

    left, right = 58, upright_size[0] - 58
    top, bottom = 235, upright_size[1] - 50
    columns, rows = 7, 5
    cell_w = (right - left) / columns
    cell_h = (bottom - top) / (rows + 1)
    weekdays = ["一", "二", "三", "四", "五", "六", "日"]
    for col, label in enumerate(weekdays):
        x = left + col * cell_w
        draw.text((x + 14, top + 12), label, font=weekday_font, fill=muted)

    grid_top = top + cell_h
    line = (191, 171, 145)
    for col in range(columns + 1):
        x = round(left + col * cell_w)
        draw.line((x, top, x, bottom), fill=line, width=2)
    for row in range(rows + 2):
        y = round(top + row * cell_h)
        draw.line((left, y, right, y), fill=line, width=2)

    for row, week in enumerate(calendar.monthcalendar(2026, 10)):
        for col, day in enumerate(week):
            if not day:
                continue
            x = left + col * cell_w
            y = grid_top + row * cell_h
            if day == 2:
                cx, cy = x + cell_w / 2, y + cell_h / 2
                radius = min(cell_w, cell_h) * 0.32
                draw.ellipse((cx - radius, cy - radius, cx + radius, cy + radius), fill=(172, 93, 75))
                day_color = (255, 245, 230)
            else:
                day_color = ink
            day_text = str(day)
            box = draw.textbbox((0, 0), day_text, font=day_font)
            draw.text(
                (x + (cell_w - (box[2] - box[0])) / 2, y + (cell_h - (box[3] - box[1])) / 2 - 5),
                day_text,
                font=day_font,
                fill=day_color,
            )
    return page.rotate(270, expand=True, resample=Image.Resampling.BICUBIC)


def add_personal_details(atlas: Image.Image, night: bool) -> None:
    quote_size = (QUOTE_BOX[2] - QUOTE_BOX[0], QUOTE_BOX[3] - QUOTE_BOX[1])
    quote = make_quote_card(quote_size)
    calendar_grid = make_calendar_grid()
    art_size = (CALENDAR_ART_BOX[2] - CALENDAR_ART_BOX[0], CALENDAR_ART_BOX[3] - CALENDAR_ART_BOX[1])
    with Image.open(CALENDAR_ART_PATH) as opened:
        art = ImageOps.fit(opened.convert("RGB"), art_size, Image.Resampling.LANCZOS, centering=(0.5, 0.52))
    if night:
        quote = night_treatment(quote)
        calendar_grid = night_treatment(calendar_grid)
        art = night_treatment(art)
    atlas.paste(quote, (QUOTE_BOX[0], QUOTE_BOX[1]))
    atlas.paste(calendar_grid, (CALENDAR_GRID_BOX[0], CALENDAR_GRID_BOX[1]))
    atlas.paste(art, (CALENDAR_ART_BOX[0], CALENDAR_ART_BOX[1]))


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

    add_personal_details(atlas, night)

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
