"""Turn the old attachment-theory flip cards into wedding story cards."""

from pathlib import Path
from textwrap import wrap

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
FONT = Path("C:/Windows/Fonts/msyh.ttc")
SERIF = Path("C:/Windows/Fonts/simkai.ttf")


def font(size: int, serif: bool = False) -> ImageFont.FreeTypeFont:
    path = SERIF if serif and SERIF.exists() else FONT
    return ImageFont.truetype(str(path), size)


def centered(draw, area, text, text_font, fill):
    x0, y0, x1, _ = area
    box = draw.textbbox((0, 0), text, font=text_font)
    draw.text(((x0 + x1 - (box[2] - box[0])) / 2, y0), text, font=text_font, fill=fill)


def paragraph(draw, xy, text, width, text_font, fill, spacing=20):
    x, y = xy
    char_width = max(8, int(width / max(text_font.size, 1) * 1.7))
    for line in wrap(text, width=char_width):
        draw.text((x, y), line, font=text_font, fill=fill)
        y += text_font.size + spacing
    return y


def make(path: Path, night: bool):
    original = Image.open(path).convert("RGBA").rotate(90, expand=True)
    alpha = original.getchannel("A")
    paper = (61, 52, 46, 255) if night else (239, 229, 210, 255)
    ink = (232, 218, 194, 255) if night else (69, 54, 43, 255)
    muted = (190, 164, 132, 255) if night else (126, 99, 73, 255)
    accent = (177, 130, 94, 255) if night else (151, 91, 62, 255)
    sage = (104, 128, 111, 255) if night else (69, 113, 98, 255)

    canvas = Image.new("RGBA", original.size, paper)
    draw = ImageDraw.Draw(canvas)
    page_start = 1056

    # Fine paper rules and a restrained double-page divider.
    for x in range(page_start + 80, 4096, 96):
        draw.line((x, 40, x, 4056), fill=(*muted[:3], 18), width=2)
    draw.line((page_start + 24, 2048, 4040, 2048), fill=muted, width=4)

    # Left page — shared story.
    centered(draw, (page_start + 130, 170, 3960, 0), "我们的故事", font(116, True), accent)
    centered(draw, (page_start + 130, 320, 3960, 0), "FROM THIS DAY FORWARD", font(34), muted)
    draw.line((page_start + 640, 410, 3460, 410), fill=accent, width=3)
    story = [
        ("相遇", "世界很大，我们刚好遇见。"),
        ("相知", "把平凡日子，慢慢过成共同的记忆。"),
        ("相守", "往后的四季，愿意继续并肩同行。"),
        ("成家", "2026年10月2日，邀请你见证我们的新篇章。"),
    ]
    x = page_start + 300
    for index, (title, body) in enumerate(story):
        y = 570 + index * 365
        draw.ellipse((x, y + 18, x + 42, y + 60), fill=sage)
        if index < len(story) - 1:
            draw.line((x + 21, y + 60, x + 21, y + 365), fill=sage, width=4)
        draw.text((x + 90, y), title, font=font(66, True), fill=ink)
        paragraph(draw, (x + 90, y + 92), body, 2350, font(42), muted, 14)
    centered(draw, (page_start + 130, 1870, 3960, 0), "吴昊  ×  舒倩", font(54, True), accent)

    # Right page — two messages, replacing the old attachment examples.
    centered(draw, (page_start + 130, 2205, 3960, 0), "给彼此的话", font(110, True), sage)
    centered(draw, (page_start + 130, 2350, 3960, 0), "TOGETHER, ALWAYS", font(34), muted)
    draw.rounded_rectangle((page_start + 300, 2510, 3780, 3070), 42, outline=accent, width=4)
    draw.text((page_start + 420, 2610), "吴昊", font=font(54, True), fill=accent)
    paragraph(
        draw,
        (page_start + 420, 2720),
        "谢谢你成为我的家。以后每一个清晨与黄昏，我都想和你一起度过。",
        2150,
        font(43),
        ink,
        16,
    )
    draw.rounded_rectangle((page_start + 300, 3200, 3780, 3760), 42, outline=sage, width=4)
    draw.text((page_start + 420, 3300), "舒倩", font=font(54, True), fill=sage)
    paragraph(
        draw,
        (page_start + 420, 3410),
        "从喜欢到相守，愿我们一直有话可说、有路同行，把日子过成喜欢的样子。",
        2150,
        font(43),
        ink,
        16,
    )
    centered(draw, (page_start + 130, 3900, 3960, 0), "2026 · 10 · 02", font(38), muted)

    # The narrow folded-back section receives a quiet monogram so every flip
    # state remains wedding-themed.
    centered(draw, (80, 1450, page_start - 80, 0), "W  &  S", font(76, True), accent)
    centered(draw, (80, 2550, page_start - 80, 0), "愿岁月温柔，朝暮与共", font(42, True), ink)

    canvas.putalpha(alpha)
    canvas.rotate(-90, expand=True).save(path, "WEBP", quality=94, method=6)


make(ROOT / "public/textures/day/ninth-attachment_day.webp", False)
make(ROOT / "public/textures/night/ninth-attachment_night.webp", True)
