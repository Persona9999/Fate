# 把 site/out/frame_*.png 每 6 張拼成一張總覽圖（3x2，每格 640x360，左上角標時間），存到 site/out/sheets/。
# 用途：先掃一遍找破版，再挑有疑問的那幾格看原圖。用法：python -I tools/sheet.py <ffmpeg.exe> site/out
import glob, os, subprocess, sys
FFMPEG, OUT = sys.argv[1], os.path.abspath(sys.argv[2])
frames = sorted(glob.glob(os.path.join(OUT, "frame_*.png")))
sheets = os.path.join(OUT, "sheets"); os.makedirs(sheets, exist_ok=True)
for old in glob.glob(os.path.join(sheets, "*.jpg")): os.remove(old)
for n in range(0, len(frames), 6):
    part = frames[n:n + 6]
    args = [FFMPEG, "-y", "-hide_banner", "-loglevel", "error"]
    for f in part: args += ["-i", f]
    fc = []
    for i, f in enumerate(part):
        label = os.path.basename(f)[6:-4]
        fc.append(f"[{i}:v]scale=640:360,drawtext=fontfile='C\\:/Windows/Fonts/consola.ttf':text='{label}s':x=8:y=8:fontsize=22:fontcolor=yellow:box=1:boxcolor=black@0.7[s{i}]")
    pad = 6 - len(part)
    for j in range(pad): fc.append(f"color=c=black:s=640x360:d=1[s{len(part) + j}]")
    fc.append("".join(f"[s{i}]" for i in range(6)) + "xstack=inputs=6:layout=0_0|640_0|1280_0|0_360|640_360|1280_360[o]")
    out = os.path.join(sheets, f"sheet_{n // 6 + 1:02d}.jpg")
    r = subprocess.run(args + ["-filter_complex", ";".join(fc), "-map", "[o]", "-frames:v", "1", "-q:v", "3", out], capture_output=True, text=True)
    print(os.path.basename(out), [os.path.basename(f)[6:-4] for f in part], r.stderr.strip()[:200])
