"""白底立繪 → 去背全身圖（高 900）＋頭像（392x392）。

用法：python -I cut_assets.py <原圖資料夾> <輸出資料夾>
需要：Pillow、numpy、scipy。

去背兩步：
1. 連到圖邊、三個色版都 >= 236 的白 ⇒ 透明（人物內部的白不動）。
2. 被頭髮圍住、連不到圖邊的白底：機器分不出它跟白色蕾絲、耳毛、襪子 ⇒
   把 >= 600 px 的封閉白塊照面積由大到小編號，人看過標號圖之後把「是背景」的號碼寫在 HOLES。
   換原圖、改門檻，編號就會變 ⇒ 要重看一次標號圖（帶第三個參數 debug 會另存 <名字>_debug.png）。
   沒列進 HOLES 的封閉白塊一律留著（寧可留一小塊白底，不挖掉衣服）。
"""
import hashlib, json, os, sys
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

SRC, OUT = sys.argv[1], sys.argv[2]
DEBUG = len(sys.argv) > 3
TH, MIN_HOLE = 236, 600
JOBS = [
    # 原檔, 名字, 頭像裁切框（原圖像素）, 是背景的封閉白塊編號
    ("Gemini_Generated_Image_9f1dtb9f1dtb9f1d.jpg", "gemini", (590, 55, 1195, 660),
     [0, 1, 2, 3, 5, 6, 7, 10, 11, 14, 20, 21, 22, 32, 34, 42]),
    ("Gemini_Generated_Image_br2zldbr2zldbr2z.jpg", "gemini_q", (520, 65, 1360, 905),
     [0, 1, 2, 5, 11, 12, 16, 39]),
]

report = []
os.makedirs(OUT, exist_ok=True)
for fn, name, box, holes in JOBS:
    src = os.path.join(SRC, fn)
    im = Image.open(src).convert("RGB")
    a = np.asarray(im)
    white = (a >= TH).all(axis=2)
    lab, n = ndimage.label(white)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    sizes = ndimage.sum(white, lab, range(1, n + 1))
    enclosed = sorted([(int(sizes[i]), i + 1) for i in range(n) if (i + 1) not in edge and sizes[i] >= MIN_HOLE], reverse=True)
    clear = np.isin(lab, list(edge))
    n_edge = int(clear.sum())
    picked = [enclosed[k][1] for k in holes]
    clear |= np.isin(lab, picked)
    alpha = np.where(clear, 0, 255).astype(np.uint8)
    cut = Image.fromarray(np.dstack([a, alpha]), "RGBA")
    h = 900
    full = cut.resize((round(cut.width * h / cut.height), h), Image.LANCZOS)
    full.save(os.path.join(OUT, f"{name}_full.png"), optimize=True)
    cut.crop(box).resize((392, 392), Image.LANCZOS).save(os.path.join(OUT, f"{name}_head.png"), optimize=True)
    if DEBUG:
        d = a.copy()
        d[np.isin(lab, list(edge))] = (40, 70, 60)
        objs = ndimage.find_objects(lab)
        dbg = None
        for k, (s, l) in enumerate(enclosed):
            d[lab == l] = (255, 0, 200)
        dbg = Image.fromarray(d)
        dr = ImageDraw.Draw(dbg)
        for k, (s, l) in enumerate(enclosed):
            o = objs[l - 1]
            dr.text(((o[1].start + o[1].stop) // 2 - 10, (o[0].start + o[0].stop) // 2 - 10), str(k), fill=(255, 255, 0), stroke_width=2, stroke_fill=(0, 0, 0))
        dbg.save(os.path.join(OUT, f"{name}_debug.png"))
    report.append({
        "name": name, "source": fn, "source_size": list(im.size),
        "source_sha256": hashlib.sha256(open(src, "rb").read()).hexdigest(),
        "edge_transparent_px": n_edge, "hole_transparent_px": int(clear.sum()) - n_edge,
        "holes_picked": holes, "enclosed_candidates": len(enclosed), "total_px": im.width * im.height,
        "full": [f"{name}_full.png", list(full.size)], "head": [f"{name}_head.png", [392, 392]], "head_box": list(box),
    })
json.dump(report, open(os.path.join(OUT, "assets.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(json.dumps(report, ensure_ascii=False))
