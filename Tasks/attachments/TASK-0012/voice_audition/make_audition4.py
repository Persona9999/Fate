"""第四輪試聽：用日文語音引擎（VOICEVOX：四国めたん）「說中文」的實驗。
Tim 2026-11-12：「另外如果嘗試用之前的日文模型說中文呢」。
VOICEVOX 只認日文的音節 ⇒ 做法是把每個漢字的拼音換成最接近的片假名，再把每個音節的音高改成中文四聲的樣子：
一聲高平、二聲由低往高、三聲壓低、四聲由高往低、輕聲略低。出來的是「日本腔的中文」，沒有中文的捲舌音與 ü、e 這些母音。
agent 聽不到 ⇒ 聽不聽得懂要 Tim 判斷。需要 VOICEVOX 引擎在 127.0.0.1:50021。
用法：python -X utf8 make_audition4.py <ffmpeg 的 bin 資料夾>
"""
import base64, html, json, os, re, subprocess, sys, urllib.parse, urllib.request

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
FF = os.path.join(sys.argv[1], "ffmpeg.exe")
SDIR = os.path.join(HERE, "samples4"); os.makedirs(SDIR, exist_ok=True)
BASE = "http://127.0.0.1:50021"


def api(path, params=None, body=None):
    url = BASE + path + ("?" + urllib.parse.urlencode(params) if params else "")
    req = urllib.request.Request(url, data=None if body is None else json.dumps(body).encode("utf-8"), method="POST" if (body is not None or path != "/speakers") else "GET",
                                 headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=120) as r:
        data = r.read()
    return data


# 一句 ＝ 幾個停頓段；一段 ＝ [(片假名, 聲調 0～4), …]，一個漢字一筆
O_SEGS = [
    ("慢著。", [("マン", 4), ("ジャ", 0)]),
    ("她負責講，", [("ター", 1), ("フー", 4), ("ゼー", 2), ("ジャン", 3)]),
    ("本小姐負責蓋章。", [("ベン", 3), ("シャオ", 3), ("ジエ", 3), ("フー", 4), ("ゼー", 2), ("ガイ", 4), ("ジャン", 1)]),
    ("哼，", [("フン", 4)]),
    ("才不是特地為你蓋的呢。", [("ツァイ", 2), ("ブー", 2), ("シー", 4), ("ター", 4), ("ディー", 4), ("ウェイ", 4), ("ニー", 3), ("ガイ", 4), ("ダ", 0), ("ナ", 0)]),
]
G_SEGS = [
    ("掉坑裡了吧！", [("ディアオ", 4), ("コン", 1), ("リー", 3), ("ラ", 0), ("バ", 0)]),
    ("彎曲時空的是能量和動量。", [("ワン", 1), ("チュー", 1), ("シー", 2), ("コン", 1), ("ダ", 0), ("シー", 4), ("ノン", 2), ("リャン", 4), ("ハー", 2), ("ドン", 4), ("リャン", 4)]),
    ("什麼叫編的！", [("シェン", 2), ("マ", 0), ("ジャオ", 4), ("ビエン", 1), ("ダ", 0)]),
    ("這叫大膽假設！", [("ジェー", 4), ("ジャオ", 4), ("ダー", 4), ("ダン", 3), ("ジャー", 3), ("シェー", 4)]),
]
LONG = {"タ": "ア", "フ": "ウ", "ゼ": "エ", "ブ": "ウ", "シ": "イ", "ィ": "イ", "ニ": "イ", "ュ": "ウ", "ェ": "エ", "ハ": "ア", "リ": "イ", "ダ": "ア", "ャ": "ア"}
SMALL = "ァィゥェォャュョ"
# 聲調 ⇒ 每個音節前半、後半相對於平均音高的偏移（VOICEVOX 的音高是對數頻率）
TONE = {1: (0.22, 0.22), 2: (-0.08, 0.28), 3: (-0.26, -0.18), 4: (0.34, -0.22), 0: (-0.10, -0.14)}


def build(segs, speaker, shaped):
    phrases = []
    for _, syls in segs:
        # 一個漢字一個重音段（重音放在第一拍），段與段之間不停；每個停頓段最後加頓號
        # 🩸 VOICEVOX 的假名記法不收長音符號「ー」（回 400 UNKNOWN_TEXT）、句尾也不能留「、」（EMPTY_PHRASE）
        #    ⇒ 長音改寫成前一個假名的母音；停頓改成在這一段最後一個重音段手動加 pause_mora
        def fix(k):
            out = ""
            for ch in k:
                out += LONG[out[-1]] if ch == "ー" else ch
            return out[:1 + (out[1:2] in SMALL)] + "'" + out[1 + (out[1:2] in SMALL):]
        kana = "/".join(fix(k) for k, _ in syls)
        aps = json.loads(api("/accent_phrases", {"text": kana, "speaker": speaker, "is_kana": "true"}, body={}))
        assert len(aps) == len(syls), (kana, len(aps), len(syls))
        aps[-1]["pause_mora"] = {"text": "、", "consonant": None, "consonant_length": None, "vowel": "pau", "vowel_length": 0.32, "pitch": 0.0}
        phrases.append((aps, syls))
    voiced = [m["pitch"] for aps, _ in phrases for ap in aps for m in ap["moras"] if m["pitch"] > 0]
    mean = sum(voiced) / len(voiced)
    out = []
    for aps, syls in phrases:
        for ap, (_, tone) in zip(aps, syls):
            if shaped:
                n = len(ap["moras"]); a, b = TONE[tone]
                for i, m in enumerate(ap["moras"]):
                    if m["pitch"] > 0:
                        f = 0 if n == 1 else i / (n - 1)
                        m["pitch"] = mean + a + (b - a) * f
            out.append(ap)
    q = json.loads(api("/audio_query", {"text": "あ", "speaker": speaker}, body={}))
    q["accent_phrases"] = out; q["speedScale"] = 1.08; q["intonationScale"] = 1.0; q["prePhonemeLength"] = 0.05; q["postPhonemeLength"] = 0.05
    return api("/synthesis", {"speaker": speaker}, body=q), mean


speakers = json.loads(api("/speakers"))
styles = {(s["name"], st["name"]): st["id"] for s in speakers for st in s["styles"]}
tsun, normal = styles[("四国めたん", "ツンツン")], styles[("四国めたん", "ノーマル")]
print("四国めたん ツンツン id", tsun, "ノーマル id", normal)
JOBS = [("J1", "本小姐的台詞｜四国めたん（ツンツン）｜照日文引擎自己的語調，不改音高", O_SEGS, tsun, False),
        ("J2", "本小姐的台詞｜四国めたん（ツンツン）｜音高改成中文四聲", O_SEGS, tsun, True),
        ("J3", "Gemini 的台詞｜四国めたん（ノーマル）｜音高改成中文四聲", G_SEGS, normal, True)]
rows, res = [], []
for code, note, segs, spk, shaped in JOBS:
    wav, mean = build(segs, spk, shaped)
    w = os.path.join(SDIR, code + ".wav"); open(w, "wb").write(wav)
    mp3 = os.path.join(SDIR, code + ".mp3")
    r = subprocess.run([FF, "-hide_banner", "-i", w, "-af", "volumedetect", "-f", "null", "-"], capture_output=True, text=True, encoding="utf-8", errors="replace")
    dur = float(re.search(r"Duration: (\d+):(\d+):([\d.]+)", r.stderr).group(3))
    db = float(re.search(r"mean_volume: (-?[\d.]+) dB", r.stderr).group(1))
    # VOICEVOX 的輸出比 edge-tts 小聲（量到 -22～-28 dB）⇒ 試聽檔調到跟其他幾輪一樣的 -21 dB
    subprocess.run([FF, "-y", "-hide_banner", "-loglevel", "error", "-i", w, "-af", f"volume={-21.0 - db:.1f}dB", "-c:a", "libmp3lame", "-b:a", "64k", mp3], check=True)
    text = "".join(t for t, _ in segs); kana = " ".join(k for _, s in segs for k, _ in s)
    res.append({"code": code, "note": note, "dur": dur, "mean_db": db, "mean_pitch": round(mean, 3), "kana": kana})
    print(code, dur, db, round(mean, 3))
    rows.append(f'<tr><td class="code">{code}</td><td>{html.escape(note)}<div class="line">{html.escape(text)}</div><div class="v">{html.escape(kana)}</div></td>'
                f'<td><audio controls preload="none" src="data:audio/mpeg;base64,{base64.b64encode(open(mp3, "rb").read()).decode()}"></audio></td></tr>')
json.dump(res, open(os.path.join(HERE, "audition4.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
page = f"""<!doctype html>
<html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>配音試聽（第四輪）：日文語音引擎說中文</title>
<style>
:root{{--bg:#15131b;--fg:#f3ede6;--dim:#a9a2b3;--line:#3a3446}}
body{{margin:0;background:var(--bg);color:var(--fg);font:16px/1.6 "Microsoft JhengHei","Noto Sans TC",sans-serif}}
main{{max-width:900px;margin:0 auto;padding:24px 16px 60px}} h1{{font-size:24px;margin:0 0 6px}} p{{color:var(--dim);margin:6px 0}}
.line{{color:var(--fg);background:#1e1a27;border:1px solid var(--line);border-radius:8px;padding:6px 10px;margin:6px 0}}
table{{width:100%;border-collapse:collapse;margin-top:14px}} td{{border-top:1px solid var(--line);padding:10px 6px;vertical-align:middle}}
.code{{font:700 18px Consolas,monospace;width:46px}} .v{{color:var(--dim);font-size:13px}} audio{{width:300px;max-width:100%}}
</style></head><body><main>
<h1>配音試聽（第四輪）：日文語音引擎說中文</h1>
<p>之前日文版用的 VOICEVOX（四国めたん）只認日文的音節。這裡把每個字的拼音換成最接近的片假名（寫在每一列下面），J2、J3 再把每個音節的音高改成中文四聲的樣子。
出來的是日本腔的中文：沒有捲舌音，也沒有 ü、e 這類母音。聽不聽得懂、要不要這種效果，請你判斷。</p>
<table>{''.join(rows)}</table>
<p style="margin-top:24px">用這個聲音的話，簡介要寫「VOICEVOX:四国めたん」。</p>
</main></body></html>"""
open(os.path.join(HERE, "audition4.html"), "w", encoding="utf-8", newline="\n").write(page)
print("page bytes", len(page.encode("utf-8")))
