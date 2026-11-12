"""用 Qwen3-TTS（本機）把台詞檔裡 engine=qwen 的角色先念好，放進 site/voice_qwen/（簡體、繁中兩版共用，同一句只念一次）。
Tim 2026-11-12：「Gemini用Q4吧」＝ Qwen3-TTS-12Hz-0.6B-CustomVoice 的預設聲線 Sohee。
要用獨立環境的 python 跑（%LOCALAPPDATA%\\Programs\\qwen3-tts\\venv）；之後 tools/tts.py 會從這個資料夾拿檔，不再叫 edge-tts 念這個角色。
這個模型不吃語氣指令、語速調不了；每次生成略有不同 ⇒ 固定亂數種子，長度離譜（太短或太長）就換種子重念，最多三次。
用法：<qwen 環境的 python> tools/tts_qwen.py <ffmpeg.exe> site tools/lines_cn.json tools/lines_tw.json
"""
import hashlib, json, os, re, subprocess, sys, time

sys.stdout.reconfigure(encoding="utf-8")
import torch
import soundfile as sf
from qwen_tts import Qwen3TTSModel

FF, SITE = sys.argv[1], os.path.abspath(sys.argv[2])
QDIR = os.path.join(SITE, "voice_qwen"); os.makedirs(QDIR, exist_ok=True)
AF = ("silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.06,"
      "areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.06,areverse")


def key(model, speaker, text):
    return hashlib.sha1(f"{model}|{speaker}|{text}".encode("utf-8")).hexdigest()[:16]


jobs = {}
for path in sys.argv[3:]:
    cfg = json.load(open(path, encoding="utf-8"))
    for i, ln in enumerate(cfg["lines"]):
        sp = cfg["speakers"][ln["who"]]
        if sp.get("engine") == "qwen":
            jobs.setdefault(key(sp["model"], sp["speaker"], ln["tts"]), {"model": sp["model"], "speaker": sp["speaker"], "text": ln["tts"], "used": []})["used"].append(f"{os.path.basename(path)}#{i + 1}")
models = {j["model"] for j in jobs.values()}
assert len(models) == 1, models
t0 = time.time()
# 🩸 float16 在 RTX 2060 上取樣會炸（CUDA device-side assert）⇒ bfloat16
# 沒有 NVIDIA 顯卡的主機走 CPU＋float32（很慢；⚠ 這條路沒有實跑過）
DEV = "cuda:0" if torch.cuda.is_available() else "cpu"
model = Qwen3TTSModel.from_pretrained(models.pop(), device_map=DEV, dtype=torch.bfloat16 if DEV != "cpu" else torch.float32)
print(f"loaded on {DEV} in {time.time() - t0:.1f}s; {len(jobs)} unique lines")
report = []
for k, j in jobs.items():
    out = os.path.join(QDIR, k + ".wav")
    n_han = len(re.findall(r"[一-鿿]", j["text"])); expect = n_han / 4.0
    if os.path.exists(out):
        print("cached", k, j["used"]); continue
    for attempt in range(3):
        torch.manual_seed(20261112 + attempt); t1 = time.time()
        wavs, sr = model.generate_custom_voice(text=j["text"], language="Chinese", speaker=j["speaker"])
        raw = os.path.join(QDIR, k + "_raw.wav"); sf.write(raw, wavs[0], sr)
        subprocess.run([FF, "-y", "-hide_banner", "-loglevel", "error", "-i", raw, "-af", AF, "-ar", "48000", "-ac", "1", out], check=True)
        info = sf.info(out); dur = info.frames / info.samplerate
        ok = 0.55 * expect <= dur <= 1.75 * expect
        print(f"{k} try {attempt + 1}: {dur:.2f}s (expect ~{expect:.1f}s, {n_han} 字) gen {time.time() - t1:.0f}s {'ok' if ok else 'OUTLIER'} {j['used']}")
        if ok:
            break
    os.remove(raw)
    report.append({"key": k, "speaker": j["speaker"], "text": j["text"], "dur": round(dur, 2), "expect": round(expect, 1), "attempts": attempt + 1, "ok": ok, "used": j["used"]})
json.dump(report, open(os.path.join(QDIR, "_report.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"done {len(report)} generated, outliers {sum(1 for r in report if not r['ok'])}, total {time.time() - t0:.0f}s, vram peak {(torch.cuda.max_memory_allocated() / 2**20) if DEV != 'cpu' else 0:.0f} MiB")
