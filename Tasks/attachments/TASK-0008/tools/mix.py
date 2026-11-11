# 把語音照 timeline.json 疊到錄好的 intro.webm（裡面是畫面＋BGM）上，輸出 30fps CFR 的 H.264＋AAC MP4。
# 用法：python -I mix.py <ffmpeg.exe> <site 資料夾> <輸出 mp4>
import json, os, subprocess, sys

sys.stdout.reconfigure(encoding="utf-8")
FFMPEG, SITE, OUT = sys.argv[1], os.path.abspath(sys.argv[2]), sys.argv[3]
# 每個角色的語音先各自調音量再混：最後那個 +8 dB 是照 VOICEVOX 調的，edge-tts 的聲音原本就大約 -20 dB，
# 直接加 8 dB 會一直頂在限幅器上（2026-11-11 量到台詞段平均 -15 dB）。大肥魚那個聲音比本小姐的小約 2.5 dB ⇒ 少減一點。
VOICE_DB = {"O": -5.0, "F": -2.5}
OFFSET = 0.05            # 頁面的 t=0 比錄影開頭晚 50 ms（T0 = now + 50）
tl = json.load(open(os.path.join(SITE, "timeline.json"), encoding="utf-8"))
args = [FFMPEG, "-y", "-hide_banner", "-loglevel", "error", "-i", os.path.join(SITE, "out", "intro.webm")]
parts = []
for i, ln in enumerate(tl["lines"]):
    args += ["-i", os.path.join(SITE, ln["wav"])]
    ms = int(round((ln["at"] + OFFSET) * 1000))
    parts.append(f"[{i + 1}:a]aresample=48000,volume={VOICE_DB.get(ln.get('who'), 0)}dB,adelay={ms}:all=1[v{i + 1}]")
n = len(tl["lines"])
voices = "".join(f"[v{i + 1}]" for i in range(n))
fc = ";".join(parts) + f";{voices}amix=inputs={n}:normalize=0[vo];" \
     f"[0:a]aresample=48000,volume=0.9[bg];[bg][vo]amix=inputs=2:normalize=0,volume=8dB,alimiter=limit=0.84:level=0[a]"
# ⚠ 不用單次 loudnorm：它是動態的，會把只有 BGM 的安靜段落拉到跟說話一樣大聲（2026-11-09 實測：開場 -19.4 dB ≈ 台詞段 -19.6 dB）。
#   ⇒ 固定增益 ＋ 限幅器（level=0：不自動補回音量）。
args += ["-filter_complex", fc, "-map", "0:v", "-map", "[a]", "-vf", "fps=30", "-ac", "2",
         "-t", f"{tl['duration'] + 0.1:.2f}",
         "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p",
         "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", OUT]
r = subprocess.run(args, capture_output=True, text=True, encoding="utf-8", errors="replace")
print(r.stderr.strip() or "ffmpeg ok", f"exit={r.returncode}")
sys.exit(r.returncode)
