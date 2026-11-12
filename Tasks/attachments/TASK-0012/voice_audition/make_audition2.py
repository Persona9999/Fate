"""第二輪試聽（Tim 2026-11-12：「希望妳的聲音改用 G5 然後Gemini的聲線可以更往大肥魚靠攏(透過調整大肥魚聲線來提供候選)」）。
本小姐＝G5 那一組（fr-FR-VivienneMultilingualNeural，rate +10%、pitch +8Hz）；大肥魚不動（zh-CN-XiaoyiNeural，+12%、+18Hz）；
Gemini 的候選＝同一個 Xiaoyi 調語速與音高。每個候選做一段三人接話（大肥魚 → Gemini → 本小姐），聽得出三個人分不分得開。
用法：python -X utf8 make_audition2.py <ffmpeg 的 bin 資料夾>
"""
import asyncio, base64, html, json, os, re, subprocess, sys
import edge_tts

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
FF, FP = os.path.join(sys.argv[1], "ffmpeg.exe"), os.path.join(sys.argv[1], "ffprobe.exe")
SDIR = os.path.join(HERE, "samples2"); os.makedirs(SDIR, exist_ok=True)

F_LINE = ("zh-CN-XiaoyiNeural", "+12%", "+18Hz", "那是不是只有有质量的东西，才能把时空压弯呀？")
O_LINE = ("fr-FR-VivienneMultilingualNeural", "+10%", "+8Hz", "实锤。爱因斯坦场方程的右边，写的就是能量和动量。……哼，才不是特地为你盖的呢。")
G_TEXT = "掉坑里了吧！弯曲时空的是能量和动量。光没有静止质量，照样能把时空压弯！……什、什么叫编的！这叫大胆假设！"
G_SHOW = "掉進坑裡了吧！彎曲時空的是能量和動量。光沒有靜止質量，照樣能把時空壓彎！……什、什麼叫編的！這叫大膽假設！"
# Gemini 候選：都是 Xiaoyi，只調語速與音高（大肥魚是 +12%／+18Hz）
CAND = [
    ("H1", "+10%", "+6Hz", "比大肥魚低一點、慢一點"),
    ("H2", "+8%", "-4Hz", "接近原本的音高，稍快"),
    ("H3", "+6%", "-14Hz", "明顯壓低：比較像姐姐"),
    ("H4", "+2%", "-24Hz", "壓得更低、放慢：沉穩"),
    ("H5", "+16%", "-8Hz", "壓低但講得快：急性子"),
    ("H6", "+14%", "+30Hz", "比大肥魚還高、還快"),
    ("H7", "+0%", "+10Hz", "音高接近大肥魚，但放慢"),
]
AF = ("silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.06,"
      "areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.06,areverse")


async def tts(name, voice, rate, pitch, text):
    mp3, wav = os.path.join(SDIR, name + ".mp3"), os.path.join(SDIR, name + ".wav")
    for attempt in range(3):
        try:
            await asyncio.wait_for(edge_tts.Communicate(text, voice, rate=rate, pitch=pitch).save(mp3), timeout=60)
            break
        except Exception as e:
            print(f"{name} attempt {attempt + 1}: {type(e).__name__} {e}")
            if attempt == 2:
                raise
    subprocess.run([FF, "-y", "-hide_banner", "-loglevel", "error", "-i", mp3, "-af", AF, "-ar", "48000", "-ac", "1", wav], check=True)
    r = subprocess.run([FF, "-hide_banner", "-i", wav, "-af", "volumedetect", "-f", "null", "-"], capture_output=True, text=True, encoding="utf-8", errors="replace")
    dur = float(subprocess.run([FP, "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", wav], capture_output=True, text=True).stdout.strip())
    return wav, dur, float(re.search(r"mean_volume: (-?[\d.]+) dB", r.stderr).group(1))


def b64(path):
    return base64.b64encode(open(path, "rb").read()).decode()


async def main():
    fw, fd, fdb = await tts("F", *F_LINE)
    ow, od, odb = await tts("O_G5", *O_LINE)
    print("F", fd, fdb, "| O(G5)", od, odb)
    subprocess.run([FF, "-y", "-hide_banner", "-loglevel", "error", "-i", ow, "-c:a", "libmp3lame", "-b:a", "64k", os.path.join(SDIR, "O_G5_solo.mp3")], check=True)
    res, rows = [], []
    for code, rate, pitch, note in CAND:
        gw, gd, gdb = await tts(code, "zh-CN-XiaoyiNeural", rate, pitch, G_TEXT)
        # 三人接話：大肥魚 → Gemini 候選 → 本小姐；三個人照量到的平均音量調到差不多一樣大，中間各留 0.4 秒
        out = os.path.join(SDIR, code + "_trio.mp3")
        tgt = -21.0
        fc = (f"[0:a]volume={tgt - fdb:.1f}dB,apad=pad_dur=0.4[a];[1:a]volume={tgt - gdb:.1f}dB,apad=pad_dur=0.4[b];[2:a]volume={tgt - odb:.1f}dB[c];"
              "[a][b][c]concat=n=3:v=0:a=1[o]")
        subprocess.run([FF, "-y", "-hide_banner", "-loglevel", "error", "-i", fw, "-i", gw, "-i", ow, "-filter_complex", fc, "-map", "[o]",
                        "-c:a", "libmp3lame", "-b:a", "64k", out], check=True)
        solo = os.path.join(SDIR, code + "_solo.mp3")
        subprocess.run([FF, "-y", "-hide_banner", "-loglevel", "error", "-i", gw, "-c:a", "libmp3lame", "-b:a", "64k", solo], check=True)
        res.append({"code": code, "voice": "zh-CN-XiaoyiNeural", "rate": rate, "pitch": pitch, "note": note, "dur": round(gd, 2), "mean_db": gdb})
        print(code, rate, pitch, round(gd, 2), gdb)
        rows.append(f'<tr><td class="code">{code}</td><td>{html.escape(note)}<div class="v">zh-CN-XiaoyiNeural · rate {rate} · pitch {pitch} · {gd:.1f} 秒</div></td>'
                    f'<td><div class="lab">只有 Gemini</div><audio controls preload="none" src="data:audio/mpeg;base64,{b64(solo)}"></audio>'
                    f'<div class="lab">三人接話：大肥魚 → Gemini → 本小姐</div><audio controls preload="none" src="data:audio/mpeg;base64,{b64(out)}"></audio></td></tr>')
    json.dump({"fish": F_LINE, "ojousama": O_LINE, "gemini_candidates": res}, open(os.path.join(HERE, "audition2.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    page = f"""<!doctype html>
<html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>配音試聽（第二輪）：Gemini 往大肥魚靠</title>
<style>
:root{{--bg:#15131b;--fg:#f3ede6;--dim:#a9a2b3;--line:#3a3446;--o:#d97757;--g:#a98bf5;--f:#6fb6f2}}
body{{margin:0;background:var(--bg);color:var(--fg);font:16px/1.6 "Microsoft JhengHei","Noto Sans TC",sans-serif}}
main{{max-width:900px;margin:0 auto;padding:24px 16px 60px}}
h1{{font-size:24px;margin:0 0 6px}} h2{{font-size:19px;margin:30px 0 4px;padding-left:10px;border-left:5px solid var(--g)}} h2.o{{border-color:var(--o)}}
p{{color:var(--dim);margin:6px 0}} .line{{color:var(--fg);background:#1e1a27;border:1px solid var(--line);border-radius:8px;padding:8px 12px;margin:8px 0 12px}}
table{{width:100%;border-collapse:collapse}} td{{border-top:1px solid var(--line);padding:10px 6px;vertical-align:middle}}
.code{{font:700 18px Consolas,monospace;width:46px}} .v{{color:var(--dim);font:13px Consolas,monospace}} .lab{{color:var(--dim);font-size:13px;margin-top:4px}} audio{{width:320px;max-width:100%}}
</style></head><body><main>
<h1>配音試聽（第二輪）</h1>
<p>本小姐的聲音照你選的改成上一輪的 G5。Gemini 的候選全部是大肥魚那個聲音，只調語速與音高（大肥魚本人是語速 +12%、音高 +18Hz）。
每個候選有兩段：只有 Gemini，以及「大肥魚 → Gemini → 本小姐」三人接話，聽三個人分不分得開。回代號就好，例如「H3」。</p>
<h2 class="o">本小姐（已定：上一輪的 G5）</h2>
<div class="line">實證。愛因斯坦場方程式的右邊，寫的就是能量和動量。……哼，才不是特地為你蓋的呢。</div>
<table><tr><td class="code">G5</td><td>Vivienne（多語言聲音念中文）<div class="v">{O_LINE[0]} · rate {O_LINE[1]} · pitch {O_LINE[2]} · {od:.1f} 秒</div></td>
<td><audio controls preload="none" src="data:audio/mpeg;base64,{b64(os.path.join(SDIR, "O_G5_solo.mp3"))}"></audio></td></tr></table>
<h2>Gemini 大小姐的候選（大肥魚的聲線調參數）</h2>
<div class="line">{html.escape(G_SHOW)}</div>
<table>{''.join(rows)}</table>
<p style="margin-top:28px">三人接話裡，三個人的音量照量到的平均值調到一樣大。樣本念的是簡體版的用詞；繁中版會照繁中的台詞另外念。</p>
</main></body></html>"""
    open(os.path.join(HERE, "audition2.html"), "w", encoding="utf-8", newline="\n").write(page)
    print("page bytes", len(page.encode("utf-8")), "audio tags", page.count("<audio"))


asyncio.run(main())
