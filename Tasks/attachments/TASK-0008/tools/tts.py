# 用 edge-tts（微軟 Edge「大聲朗讀」的線上語音，非官方用戶端）把 lines.json 的中文台詞念成 mp3，
# 轉成 48 kHz 單聲道 wav、量每句長度，排出 site/timeline.json（動畫照它排時間軸）。兩個角色各用自己的聲音。
# ⚠ 台詞文字會送到微軟的語音服務（公開要念出來的台詞，沒有別的東西）。
# 用法：python -X utf8 tools/tts.py <ffmpeg.exe> tools/lines.json site
import asyncio, json, os, subprocess, sys, wave
import edge_tts

sys.stdout.reconfigure(encoding="utf-8")
FFMPEG, LINES, SITE = sys.argv[1], sys.argv[2], os.path.abspath(sys.argv[3])
TITLE_END, FIRST_AT, OUTRO_PAD, OUTRO_LEN = 3.5, 4.0, 1.0, 4.0
cfg = json.load(open(LINES, encoding="utf-8"))
GAP = cfg.get("gap", 0.6)
VDIR = os.path.join(SITE, "voice")
os.makedirs(VDIR, exist_ok=True)


async def say(i, ln):
    sp = cfg["speakers"][ln["who"]]
    mp3 = os.path.join(VDIR, f"line_{i + 1}.mp3")
    for attempt in range(3):                       # 線上服務：逾時就重念這一句，最多三次
        try:
            await asyncio.wait_for(edge_tts.Communicate(ln["tts"], sp["voice"], rate=sp.get("rate", "+0%"),
                                                        pitch=sp.get("pitch", "+0Hz")).save(mp3), timeout=60)
            break
        except Exception as e:
            print(f"line {i + 1} attempt {attempt + 1}: {type(e).__name__} {e}")
            if attempt == 2:
                raise
    wav = os.path.join(VDIR, f"line_{i + 1}.wav")
    # 去掉頭尾的靜音（edge-tts 句尾常留近一秒），留 60 ms 的邊
    af = ("silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.06,"
          "areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.06,areverse")
    r = subprocess.run([FFMPEG, "-y", "-hide_banner", "-loglevel", "error", "-i", mp3, "-af", af, "-ar", "48000", "-ac", "1", wav],
                       capture_output=True, text=True, encoding="utf-8", errors="replace")
    if r.returncode:
        raise SystemExit(f"ffmpeg line {i + 1}: {r.stderr}")
    with wave.open(wav) as w:
        return w.getnframes() / w.getframerate()


async def main():
    out, at = [], FIRST_AT
    for i, ln in enumerate(cfg["lines"]):
        dur = await say(i, ln)
        out.append({"at": round(at, 3), "dur": round(dur, 3), "who": ln["who"], "zh": ln["zh"],
                    "shy": bool(ln.get("shy")), "wav": f"voice/line_{i + 1}.wav"})
        print(f"line {i + 1}: {ln['who']} {dur:.2f}s at {at:.2f}")
        at += dur + ln.get("gap", GAP)
    outro = out[-1]["at"] + out[-1]["dur"] + OUTRO_PAD
    tl = {"title_end": TITLE_END, "outro": round(outro, 3), "duration": round(outro + OUTRO_LEN, 3),
          "voice": " / ".join(f"edge-tts:{v['voice']}" for v in cfg["speakers"].values()),
          "labels": {k: v["label"] for k, v in cfg["speakers"].items()}, "lines": out}
    json.dump(tl, open(os.path.join(SITE, "timeline.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"timeline: outro {tl['outro']}s, duration {tl['duration']}s")


asyncio.run(main())
