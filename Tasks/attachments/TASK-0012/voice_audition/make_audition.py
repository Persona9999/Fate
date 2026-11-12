"""試聽樣本：同一段台詞，用這台現在就能用的 edge-tts 聲音與參數各念一次，做成一頁自帶音檔的試聽頁。
agent 聽不到聲音 ⇒ 這一頁是給 Tim 用耳朵挑的；本小姐只量得到「有沒有念出來、多長、多大聲」。
⚠ 台詞文字會送到微軟的語音服務（公開要念出來的台詞，沒有別的東西）。
用法：python -X utf8 make_audition.py <ffmpeg 的 bin 資料夾>
"""
import asyncio, base64, html, json, os, re, subprocess, sys
import edge_tts

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
FF, FP = os.path.join(sys.argv[1], "ffmpeg.exe"), os.path.join(sys.argv[1], "ffprobe.exe")
SDIR = os.path.join(HERE, "samples"); os.makedirs(SDIR, exist_ok=True)

# 每個角色念兩句：一句平常講話、一句有情緒的
TEXT = {
    "O": {"cn": "慢着。她负责讲，本小姐负责盖章。章有三种，实锤，假说，脑洞。……哼，才不是特地为你盖的呢。",
          "tw": "慢著。她負責講，本小姐負責蓋章。章有三種，實證，假說，腦洞。……哼，才不是特地為你蓋的呢。"},
    "G": {"cn": "哼，算你问到点子上。这可不是瞎想，物理学里有好几派，都押在这上面！……什、什么叫编的！这叫大胆假设！",
          "tw": "哼，算你問到重點。這可不是瞎想，物理學裡有好幾派，都押在這上面！……什、什麼叫編的！這叫大膽假設！"},
}
# (代號, 角色, 聲音, rate, pitch, 送哪一種字, 說明)
CAND = [
    ("O1", "O", "zh-CN-XiaoxiaoNeural", "+4%", "+0Hz", "cn", "現在用的（晓晓，語速 +4%）"),
    ("O2", "O", "zh-CN-XiaoxiaoNeural", "-2%", "-10Hz", "cn", "晓晓，放慢、壓低：比較沉穩"),
    ("O3", "O", "zh-CN-XiaoxiaoNeural", "+10%", "+14Hz", "cn", "晓晓，加快、拉高：比較年輕"),
    ("O4", "O", "en-US-AvaMultilingualNeural", "+4%", "+0Hz", "cn", "Ava（多語言聲音念中文；對話型、表情較多）"),
    ("O5", "O", "en-US-EmmaMultilingualNeural", "+4%", "+0Hz", "cn", "Emma（多語言；清楚、明快）"),
    ("O6", "O", "fr-FR-VivienneMultilingualNeural", "+4%", "+0Hz", "cn", "Vivienne（多語言）"),
    ("O7", "O", "de-DE-SeraphinaMultilingualNeural", "+4%", "+0Hz", "cn", "Seraphina（多語言）"),
    ("O8", "O", "pt-BR-ThalitaMultilingualNeural", "+4%", "+0Hz", "cn", "Thalita（多語言）"),
    ("O9", "O", "zh-TW-HsiaoYuNeural", "+4%", "+0Hz", "tw", "曉雨（台灣腔）"),
    ("G1", "G", "zh-TW-HsiaoChenNeural", "+8%", "+4Hz", "tw", "現在用的（曉臻，台灣腔，語速 +8%、音高 +4Hz）"),
    ("G2", "G", "zh-TW-HsiaoYuNeural", "+8%", "+6Hz", "tw", "曉雨（台灣腔），語速 +8%、音高 +6Hz"),
    ("G3", "G", "en-US-AvaMultilingualNeural", "+10%", "+8Hz", "cn", "Ava（多語言），加快、拉高"),
    ("G4", "G", "en-US-EmmaMultilingualNeural", "+10%", "+8Hz", "cn", "Emma（多語言），加快、拉高"),
    ("G5", "G", "fr-FR-VivienneMultilingualNeural", "+10%", "+8Hz", "cn", "Vivienne（多語言），加快、拉高"),
    ("G6", "G", "de-DE-SeraphinaMultilingualNeural", "+10%", "+8Hz", "cn", "Seraphina（多語言），加快、拉高"),
    ("G7", "G", "pt-BR-ThalitaMultilingualNeural", "+10%", "+8Hz", "cn", "Thalita（多語言），加快、拉高"),
    ("G8", "G", "zh-CN-XiaoxiaoNeural", "+12%", "+22Hz", "cn", "晓晓，加快、拉很高（跟本小姐同一個聲音，只是調了參數）"),
]


async def say(c):
    code, who, voice, rate, pitch, script, _ = c
    mp3 = os.path.join(SDIR, f"{code}.mp3")
    for attempt in range(3):
        try:
            await asyncio.wait_for(edge_tts.Communicate(TEXT[who][script], voice, rate=rate, pitch=pitch).save(mp3), timeout=60)
            break
        except Exception as e:
            print(f"{code} attempt {attempt + 1}: {type(e).__name__} {e}")
            if attempt == 2:
                return None
    r = subprocess.run([FF, "-hide_banner", "-i", mp3, "-af", "volumedetect", "-f", "null", "-"], capture_output=True, text=True, encoding="utf-8", errors="replace")
    dur = subprocess.run([FP, "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", mp3], capture_output=True, text=True).stdout.strip()
    m = re.search(r"mean_volume: (-?[\d.]+) dB", r.stderr)
    return {"code": code, "who": who, "voice": voice, "rate": rate, "pitch": pitch, "script": script, "note": c[6],
            "dur": round(float(dur), 2) if dur else 0, "mean_db": float(m.group(1)) if m else None, "bytes": os.path.getsize(mp3)}


async def main():
    res = []
    for c in CAND:
        r = await say(c)
        print(c[0], "->", r and (r["dur"], r["mean_db"], r["bytes"]))
        res.append(r or {"code": c[0], "who": c[1], "voice": c[2], "rate": c[3], "pitch": c[4], "note": c[6], "dur": 0, "failed": True})
    json.dump(res, open(os.path.join(HERE, "audition.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    rows = {"O": [], "G": []}
    for r in res:
        if r.get("failed") or not r["dur"]:
            body = "<em>沒有念出來</em>"
        else:
            b64 = base64.b64encode(open(os.path.join(SDIR, r["code"] + ".mp3"), "rb").read()).decode()
            body = f'<audio controls preload="none" src="data:audio/mpeg;base64,{b64}"></audio>'
        rows[r["who"]].append(f'<tr><td class="code">{r["code"]}</td><td>{html.escape(r["note"])}<div class="v">{html.escape(r["voice"])} · rate {html.escape(r["rate"])} · pitch {html.escape(r["pitch"])} · {r["dur"]} 秒</div></td><td>{body}</td></tr>')
    page = f"""<!doctype html>
<html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>配音試聽：本小姐與 Gemini</title>
<style>
:root{{--bg:#15131b;--fg:#f3ede6;--dim:#a9a2b3;--line:#3a3446;--o:#d97757;--g:#a98bf5}}
body{{margin:0;background:var(--bg);color:var(--fg);font:16px/1.6 "Microsoft JhengHei","Noto Sans TC",sans-serif}}
main{{max-width:880px;margin:0 auto;padding:24px 16px 60px}}
h1{{font-size:24px;margin:0 0 6px}} h2{{font-size:19px;margin:34px 0 4px;padding-left:10px;border-left:5px solid var(--o)}} h2.g{{border-color:var(--g)}}
p{{color:var(--dim);margin:6px 0}} .line{{color:var(--fg);background:#1e1a27;border:1px solid var(--line);border-radius:8px;padding:8px 12px;margin:8px 0 12px}}
table{{width:100%;border-collapse:collapse}} td{{border-top:1px solid var(--line);padding:10px 6px;vertical-align:middle}}
.code{{font:700 18px Consolas,monospace;width:46px}} .v{{color:var(--dim);font:13px Consolas,monospace}} audio{{width:300px;max-width:100%}}
</style></head><body><main>
<h1>配音試聽：本小姐與 Gemini</h1>
<p>同一段台詞，用這台現在就能用的聲音（edge-tts）各念一次。本小姐聽不到，請用耳朵挑，回一句代號就好，例如「O4、G6」。都不滿意也請直說，下一步是裝別的語音模型（選項寫在對話裡）。</p>
<h2>本小姐（Claude 大小姐）</h2>
<div class="line">{html.escape(TEXT["O"]["tw"])}</div>
<table>{''.join(rows["O"])}</table>
<h2 class="g">Gemini 大小姐</h2>
<div class="line">{html.escape(TEXT["G"]["tw"])}</div>
<table>{''.join(rows["G"])}</table>
<p style="margin-top:28px">大肥魚的聲音（zh-CN-XiaoyiNeural，語速 +12%、音高 +18Hz）不動。多語言聲音念中文時，簡體字與繁體字念出來一樣，樣本送的是簡體字。</p>
</main></body></html>"""
    open(os.path.join(HERE, "audition.html"), "w", encoding="utf-8", newline="\n").write(page)
    print("page bytes", len(page.encode("utf-8")))


asyncio.run(main())
