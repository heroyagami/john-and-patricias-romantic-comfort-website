from pathlib import Path

import qrcode
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public" / "media" / "wedding-share-cover.jpg"
OUTPUT = ROOT / "public" / "media" / "wedding-moments-poster.jpg"
URL = "https://www.ganggame.cn/"


def main():
    canvas = Image.new("RGB", (1080, 1440), "#f6f0e5")
    cover = Image.open(SOURCE).convert("RGB").resize((1080, 1080), Image.Resampling.LANCZOS)
    canvas.paste(cover, (0, 0))

    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=12,
        border=4,
    )
    qr.add_data(URL)
    qr.make(fit=True)
    qr_image = qr.make_image(fill_color="#30251f", back_color="white").convert("RGB")
    qr_image = qr_image.resize((230, 230), Image.Resampling.NEAREST)

    draw = ImageDraw.Draw(canvas)
    draw.line((72, 1110, 1008, 1110), fill="#c8a15c", width=2)
    draw.rounded_rectangle((62, 1140, 312, 1390), radius=18, fill="white", outline="#d8c29b", width=2)
    canvas.paste(qr_image, (72, 1150))

    title_font = ImageFont.truetype(r"C:\Windows\Fonts\msyhbd.ttc", 38)
    body_font = ImageFont.truetype(r"C:\Windows\Fonts\msyh.ttc", 26)
    url_font = ImageFont.truetype(r"C:\Windows\Fonts\msyh.ttc", 22)
    draw.text((350, 1180), "长按识别二维码", font=title_font, fill="#6d4a2d")
    draw.text((350, 1248), "查看我们的婚礼邀请函", font=body_font, fill="#4a4038")
    draw.text((350, 1310), "www.ganggame.cn", font=url_font, fill="#8b755f")

    canvas.save(OUTPUT, quality=92, optimize=True, progressive=True)
    print(OUTPUT)


if __name__ == "__main__":
    main()
