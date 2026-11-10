# 合集（系列）的封面：左邊人物設定圖、右邊 Senate 與一句話。1280x720。
# 用法：python -I tools/make_series_cover.py <這個資料夾> <輸出 png> [hans|hant]
import os, sys
from PIL import Image, ImageDraw, ImageFont

ROOT, OUT = os.path.abspath(sys.argv[1]), sys.argv[2]
HANS = (sys.argv[3] if len(sys.argv) > 3 else "hans") == "hans"
W, H = 1280, 720
BG, ORANGE, CREAM = (24, 20, 31), (217, 119, 87), (243, 237, 230)
FONTS = "C:/Windows/Fonts/"
bold = FONTS + ("msyhbd.ttc" if HANS else "msjhbd.ttc")


def font(size):
    return ImageFont.truetype(bold, size)


im = Image.new("RGB", (W, H), BG)
ch = Image.open(os.path.join(ROOT, "site", "character.jpg")).convert("RGB")      # 768x1376
part = ch.crop((0, 8, 768, 908)).resize((614, 720), Image.LANCZOS)                # 頭到腰
im.paste(part, (0, 0))
fade = Image.new("L", (186, 1))
fade.putdata([int(255 * i / 185) for i in range(186)])
im.paste(Image.new("RGB", (186, H), BG), (430, 0), fade.resize((186, H)))
d = ImageDraw.Draw(im)
d.text((638, 96), "Senate", font=font(170), fill=ORANGE)
d.text((630, 88), "Senate", font=font(170), fill=CREAM)
line1 = "让 AI agent 有名字、" if HANS else "讓 AI agent 有名字、"
line2 = "有记忆、有同事" if HANS else "有記憶、有同事"
d.text((634, 330), line1, font=font(52), fill=CREAM)
d.text((634, 402), line2, font=font(52), fill=CREAM)
d.rounded_rectangle((632, 510, 1232, 584), 12, fill=ORANGE)
d.text((656, 522), "安装・接入・使用　教程合集" if HANS else "安裝・串接・使用　教學系列", font=font(36), fill=(22, 20, 29))
im.save(OUT)
print("ok", OUT, im.size)
