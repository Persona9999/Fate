# 把語音照 timeline.json 疊到錄好的 intro.webm（裡面是畫面＋BGM）上，輸出 30fps CFR 的 H.264＋AAC MP4。
# 這一支（TASK-0012）多一個語言參數：讀 timeline_<lang>.json 與 out_<lang>/intro.webm。
# 用法：python -I mix.py <ffmpeg.exe> <site 資料夾> <lang> <輸出 mp4>
import json, os, subprocess, sys

sys.stdout.reconfigure(encoding="utf-8")
FFMPEG, SITE, LANG, OUT = sys.argv[1], os.path.abspath(sys.argv[2]), sys.argv[3], sys.argv[4]
# 每個角色的語音先各自調音量再混：最後那個 +8 dB 是照 VOICEVOX 調的，edge-tts 的聲音原本就大約 -20 dB，
# 直接加 8 dB 會一直頂在限幅器上（2026-11-11 量到台詞段平均 -15 dB）。大肥魚那個聲音比本小姐的小約 2.5 dB ⇒ 少減一點。
# 2026-11-12 量這一支的 wav（volumedetect 的 mean_volume）：O -19.7 dB、G -19.1 dB、F -21.9 dB ⇒ 三個人調到差不多一樣大。
# 2026-11-12 換聲音之後改成自動：每個角色的增益 ＝ 目標 -24.6 dB − tts.py 量到的平均音量（timeline 的 voice_db）。
TARGET_DB = -24.6
OFFSET = 0.05            # 頁面的 t=0 比錄影開頭晚 50 ms（T0 = now + 50）
tl = json.load(open(os.path.join(SITE, f"timeline_{LANG}.json"), encoding="utf-8"))
VOICE_DB = {k: round(TARGET_DB - v, 1) for k, v in tl["voice_db"].items()}
print("voice gain (dB):", VOICE_DB)
args = [FFMPEG, "-y", "-hide_banner", "-loglevel", "error", "-i", os.path.join(SITE, "out_" + LANG, "intro.webm")]
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
