# 從繁體版 site/ 產生 B 站用的簡體版 site_bili/（動畫只有一份正本，簡體版每次都重新產生）。
# 做法：先換用語（台灣 → 大陸的說法），再逐字繁轉簡。這台沒有繁簡轉換套件，也不為了這個去裝 ——
#       字表只收這支影片用到的字；正本多了表裡沒有的繁體字 ⇒ 下面的檢查會擋下來，補字表再跑。
# 產出：site_bili/intro.html、timeline.json（中文字幕換成簡體，時間與語音不變）、圖檔與 voice/ 照抄。
# 用法：python -I tools/make_bili.py <這個資料夾>
import io, json, os, re, shutil, sys

sys.stdout.reconfigure(encoding="utf-8")
ROOT = os.path.abspath(sys.argv[1])
SRC_DIR, DST_DIR = os.path.join(ROOT, "site"), os.path.join(ROOT, "site_bili")

# ── 用語（長的排前面） ──
WORDS = [
    ("檔案　編輯　檢視", "文件　编辑　查看"),
    ("Read Message History（讀取訊息歷史）", "Read Message History（读取消息历史）"),
    ("View Channels（檢視頻道）", "View Channels（查看频道）"),
    ("讀取訊息歷史", "读取消息历史"), ("檢視頻道", "查看频道"),
    ("本小姐先量這台現在的狀態", "本小姐先看一下这台现在的状态"),
    ("新增 Application", "新建 Application"),
    ("產生邀請網址，勾 bot", "生成邀请链接，勾 bot"), ("開啟產生的網址", "打开生成的网址"),
    ("串接教學", "接入教程"),
    ("私人頻道", "私密频道"),
    ("伺服器", "服务器"), ("訊息", "消息"), ("存檔", "保存"), ("指令", "命令"), ("資料", "数据"), ("影片", "视频"),
    ("貼上", "粘贴"), ("重設", "重置"), ("那一顆", "那一个"), ("多一則", "多一条"), ("發一則", "发一条"),
    # 文件本身
    ('lang="zh-Hant"', 'lang="zh-Hans"'),
    ("""'"Microsoft JhengHei","Noto Sans TC","PingFang TC","Microsoft YaHei",sans-serif'""",
     """'"Microsoft YaHei","Noto Sans SC","PingFang SC","Microsoft JhengHei",sans-serif'"""),
    ("""'Consolas,"Cascadia Mono","Microsoft JhengHei",monospace'""", """'Consolas,"Cascadia Mono","Microsoft YaHei","Microsoft JhengHei",monospace'"""),
]
# ── 逐字（繁 → 簡；只收這支影片用到的） ──
T = "並來個側內兩則啟單幫後態應換學實對當會東條樣檔檢權歷沒測為狀現產發碼稱組給綁網編聲腦與著補裝裡製複規視訊記設試話認說請證讀貼資輪輯這進過遠選邊開間關際電頁頻顆類顯館驗點齒員時"
S = "并来个侧内两则启单帮后态应换学实对当会东条样档检权历没测为状现产发码称组给绑网编声脑与着补装里制复规视讯记设试话认说请证读贴资轮辑这进过远选边开间关际电页频颗类显馆验点齿员时"
assert len(T) == len(S), (len(T), len(S))
CH = dict(zip(T, S))
KEEP = ["四国めたん"]                      # 配音角色的名字是日文，不轉


def conv(text):
    for a, b in WORDS:
        text = text.replace(a, b)
    return "".join(CH.get(c, c) for c in text)


def leftovers(text):
    """轉完之後還剩的『字表以外、看起來是繁體』的字：拿常見繁體字再掃一次。"""
    extra = "們麼於處還讓從畫語氣帶乾淨詞統鎮誕喚結環項領紙張紹寫問誰帳憶誰無雙廣場買賣車門風飛魚鳥龍體齊書長見覺親觀計許論變隻難雲響題願飯飲體髮麗黃點齡"
    return sorted({c for c in text if c in T or c in extra})


for must in ("幫我把酒館接到 Discord", "檔案　編輯　檢視", "伺服器"):
    assert must in io.open(os.path.join(SRC_DIR, "intro.html"), encoding="utf-8").read(), f"✗ 對不上：{must!r} 不在正本裡"

os.makedirs(DST_DIR, exist_ok=True)
html = conv(io.open(os.path.join(SRC_DIR, "intro.html"), encoding="utf-8").read())
# 簡體字型比較寬，第 7 句會把「网址」拆成兩行 ⇒ 這一句指定斷行（html 裡是 JS 字串 ⇒ 寫成跳脫的 \n；timeline 是 JSON 值 ⇒ 真的換行）
#   🩸 第一次只加斷行：第一行本身就超寬，變成三行蓋到日文 ⇒ 這一句連開頭一起縮短（少三個字）再斷
BREAK = "同一页打开 Message Content Intent。再到 OAuth2 生成邀请链接，勾 bot"
BREAK_TO = "再打开 Message Content Intent。到 OAuth2 生成邀请链接，"
assert BREAK in html
html = html.replace(BREAK, BREAK_TO + "\\n勾 bot")
html = html.replace("<title>Senate：把酒馆接到 Discord（教学视频）</title>", "<title>Senate：把酒馆接到 Discord（教程视频，B 站版）</title>")
bad = []
for ln in html.split("\n"):
    if ln.strip().startswith("//"):
        continue
    code = re.sub(r"\s//\s.*$", "", ln)
    for lit in re.findall(r"'([^']*)'|`([^`]*)`", code):
        t = lit[0] or lit[1]
        if any(k in t for k in KEEP):
            continue
        b = leftovers(t)
        if b:
            bad.append((t, "".join(b)))
tl = json.loads(io.open(os.path.join(SRC_DIR, "timeline.json"), encoding="utf-8").read())
for ln in tl["lines"]:
    ln["zh"] = conv(ln["zh"]).replace(BREAK, BREAK_TO + "\n勾 bot")
    b = leftovers(ln["zh"])
    if b:
        bad.append((ln["zh"], "".join(b)))
if bad:
    for t, b in bad:
        print(f"✗ 還有繁體：{b}　在　{t}")
    raise SystemExit(1)

io.open(os.path.join(DST_DIR, "intro.html"), "w", encoding="utf-8", newline="\n").write(html)
io.open(os.path.join(DST_DIR, "timeline.json"), "w", encoding="utf-8", newline="\n").write(json.dumps(tl, ensure_ascii=False, indent=1))
for f in ("avatar.png", "avatar_q.png", "character.jpg"):
    shutil.copyfile(os.path.join(SRC_DIR, f), os.path.join(DST_DIR, f))
if os.path.isdir(os.path.join(SRC_DIR, "voice")):
    shutil.copytree(os.path.join(SRC_DIR, "voice"), os.path.join(DST_DIR, "voice"), dirs_exist_ok=True)
print(f"ok: 用語 {len(WORDS)} 組、字表 {len(T)} 字 → site_bili/（intro.html {len(html)} 字元、timeline {len(tl['lines'])} 句）")
for ln in tl["lines"]:
    print("  ", ln["zh"].replace("\n", " ／ "))
