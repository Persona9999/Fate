# 從 Wikimedia Commons 下載這支影片用的圖（縮到指定寬度的 JPEG），並把來源、作者、年代、授權、SHA-256 寫進 site/img/credits.json。
# 只收授權是 Public domain／CC0 的；不是的就停下來不下載。每張之間等幾秒（Commons 會回 429）。
# 用法：python -X utf8 -I tools/fetch_images.py site/img
import hashlib, json, os, re, sys, time, urllib.parse, urllib.request

sys.stdout.reconfigure(encoding="utf-8")
OUT = os.path.abspath(sys.argv[1])
os.makedirs(OUT, exist_ok=True)
UA = {"User-Agent": "senate-video-research/1.0 (educational video; public-domain image download)"}
WANT = [  # (存檔名, Commons 檔名, 寬度)
    ("cantino.jpg", "File:Cantino planisphere (1502).jpg", 2400),
    ("earth.jpg", "File:Blue Marble Next Generation + topography + bathymetry.jpg", 3600),
    ("brookes.jpg", "File:Slaveshipposter.jpg", 1600),
    ("antigua.jpg", "File:Slaves working on a plantation - Ten Views in the Island of Antigua (1823), plate III - BL.jpg", 1600),
    ("equiano.jpg", "File:Olaudah Equiano - The interesting Narrative of the Life of Olaudah Equiano (1789), frontispiece - BL.jpg", 900),
    ("elmina.jpg", "File:ElMina AtlasBlaeuvanderHem.jpg", 1600),
    ("ship.jpg", "File:A British Slave Ship, by William Jackson, c. 1780, Royal Museums Greenwich.jpg", 1600),
]
strip = lambda s: re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", s or "")).strip()


def get(url, tries=5):
    for i in range(tries):
        try:
            return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=90).read()
        except urllib.error.HTTPError as e:
            if e.code != 429 or i == tries - 1:
                raise
            print("  429, wait", 20 * (i + 1)); time.sleep(20 * (i + 1))


credits = []
for name, title, width in WANT:
    api = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode({
        "action": "query", "format": "json", "titles": title, "prop": "imageinfo",
        "iiprop": "url|size|extmetadata", "iiurlwidth": width,
        "iiextmetadatafilter": "LicenseShortName|Artist|DateTimeOriginal|Credit|ImageDescription"})
    page = next(iter(json.loads(get(api))["query"]["pages"].values()))
    if "imageinfo" not in page:
        raise SystemExit(f"not found: {title}")
    ii = page["imageinfo"][0]; m = ii.get("extmetadata", {})
    lic = strip(m.get("LicenseShortName", {}).get("value"))
    if lic not in ("Public domain", "CC0"):
        raise SystemExit(f"license not PD/CC0: {title} -> {lic}")
    time.sleep(6)
    data = get(ii.get("thumburl") or ii["url"])
    path = os.path.join(OUT, name)
    open(path, "wb").write(data)
    c = {"file": name, "commons": title, "page": ii["descriptionurl"], "license": lic,
         "artist": strip(m.get("Artist", {}).get("value"))[:160], "date": strip(m.get("DateTimeOriginal", {}).get("value"))[:80],
         "credit": strip(m.get("Credit", {}).get("value"))[:200], "original_size": f"{ii['width']}x{ii['height']}",
         "saved_width": ii.get("thumbwidth") or ii["width"], "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()}
    credits.append(c)
    print(f"{name}: {len(data)} bytes, {lic}, {c['artist'][:50]} / {c['date'][:30]}")
    time.sleep(8)
json.dump(credits, open(os.path.join(OUT, "credits.json"), "w", encoding="utf-8", newline="\n"), ensure_ascii=False, indent=1)
print("done", len(credits))
