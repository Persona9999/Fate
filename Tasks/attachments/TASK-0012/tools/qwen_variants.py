"""某一句怎麼念都念糊的時候：同一句準備幾種寫法、每種念幾個亂數種子，存成候選檔，之後用 Whisper 聽寫挑最清楚的。
用 Qwen 的獨立環境跑。輸出在 site/voice_qwen/_variants/<名字>_<寫法>_<種子>.wav。
用法：<qwen 環境的 python> -u tools/qwen_variants.py <ffmpeg.exe> site <variants.json>
variants.json：{"名字": ["寫法一", "寫法二", …], …}；模型與聲線照 tools/lines_cn.json 的 G。
"""
import json, os, subprocess, sys, time

sys.stdout.reconfigure(encoding="utf-8")
import torch
import soundfile as sf
from qwen_tts import Qwen3TTSModel

FF, SITE, VFILE = sys.argv[1], os.path.abspath(sys.argv[2]), sys.argv[3]
SEEDS = [20261112, 20261113, 20261114][:int(sys.argv[4]) if len(sys.argv) > 4 else 3]
AF = ("silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.06,"
      "areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.06,areverse")
sp = json.load(open(os.path.join(os.path.dirname(SITE), "tools", "lines_cn.json"), encoding="utf-8"))["speakers"]["G"]
out_dir = os.path.join(SITE, "voice_qwen", "_variants"); os.makedirs(out_dir, exist_ok=True)
model = Qwen3TTSModel.from_pretrained(sp["model"], device_map="cuda:0", dtype=torch.bfloat16)
index = []
for name, texts in json.load(open(VFILE, encoding="utf-8")).items():
    for vi, text in enumerate(texts):
        for seed in SEEDS:
            torch.manual_seed(seed); t1 = time.time()
            wavs, sr = model.generate_custom_voice(text=text, language="Chinese", speaker=sp["speaker"])
            raw = os.path.join(out_dir, "_raw.wav"); sf.write(raw, wavs[0], sr)
            out = os.path.join(out_dir, f"{name}_v{vi}_{seed}.wav")
            subprocess.run([FF, "-y", "-hide_banner", "-loglevel", "error", "-i", raw, "-af", AF, "-ar", "48000", "-ac", "1", out], check=True)
            info = sf.info(out)
            index.append({"name": name, "variant": vi, "seed": seed, "text": text, "wav": out, "dur": round(info.frames / info.samplerate, 2)})
            print(f"{name} v{vi} seed {seed}: {index[-1]['dur']}s gen {time.time() - t1:.0f}s")
os.remove(os.path.join(out_dir, "_raw.wav"))
json.dump(index, open(os.path.join(out_dir, "_index.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
