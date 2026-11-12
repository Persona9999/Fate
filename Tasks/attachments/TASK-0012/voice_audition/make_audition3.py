"""第三輪試聽：Qwen3-TTS（本機，0.6B CustomVoice 的預設女聲）當 Gemini 的候選。
Tim 2026-11-12：「Qwen3-TTS 可以下載」。要用獨立環境的 python 跑（qwen-tts 釘死 transformers 4.57.3，不能裝進系統 Python）。
第一次跑會從 Hugging Face 下載模型（Qwen/Qwen3-TTS-12Hz-0.6B-CustomVoice，約 2.50 GB）。
三人接話沿用第二輪的大肥魚（samples2/F.wav）與本小姐（samples2/O_G5.wav）。
用法：<qwen 環境的 python> make_audition3.py <ffmpeg 的 bin 資料夾> [模型名]
"""
import base64, html, json, os, re, subprocess, sys, time

sys.stdout.reconfigure(encoding="utf-8")
import torch
import soundfile as sf
from qwen_tts import Qwen3TTSModel

HERE = os.path.dirname(os.path.abspath(__file__))
FF, FP = os.path.join(sys.argv[1], "ffmpeg.exe"), os.path.join(sys.argv[1], "ffprobe.exe")
MODEL = sys.argv[2] if len(sys.argv) > 2 else "Qwen/Qwen3-TTS-12Hz-0.6B-CustomVoice"
SDIR, S2 = os.path.join(HERE, "samples3"), os.path.join(HERE, "samples2"); os.makedirs(SDIR, exist_ok=True)
G_TEXT = "掉坑里了吧！弯曲时空的是能量和动量。光没有静止质量，照样能把时空压弯！什、什么叫编的！这叫大胆假设！"
G_SHOW = "掉進坑裡了吧！彎曲時空的是能量和動量。光沒有靜止質量，照樣能把時空壓彎！什、什麼叫編的！這叫大膽假設！"
CAND = [("Q1", "Vivian", "Vivian：明亮、帶一點銳利的年輕女聲（中文）"), ("Q2", "Serena", "Serena：溫暖柔和的年輕女聲（中文）"),
        ("Q3", "Ono_Anna", "Ono_Anna：俏皮輕快的女聲（母語日文，念中文）"), ("Q4", "Sohee", "Sohee：情感豐富的女聲（母語韓文，念中文）")]


def vol(path):
    r = subprocess.run([FF, "-hide_banner", "-i", path, "-af", "volumedetect", "-f", "null", "-"], capture_output=True, text=True, encoding="utf-8", errors="replace")
    return float(re.search(r"mean_volume: (-?[\d.]+) dB", r.stderr).group(1))


def b64(path):
    return base64.b64encode(open(path, "rb").read()).decode()


t0 = time.time()
# 🩸 float16 在這張卡（RTX 2060）上取樣時會炸（CUDA device-side assert：機率出現 NaN）⇒ 預設用官方範例的 bfloat16；第三個參數可改 float32
DTYPE = {"bfloat16": torch.bfloat16, "float32": torch.float32, "float16": torch.float16}[sys.argv[3] if len(sys.argv) > 3 else "bfloat16"]
model = Qwen3TTSModel.from_pretrained(MODEL, device_map="cuda:0", dtype=DTYPE)
print(f"loaded {MODEL} in {time.time() - t0:.1f}s; vram {torch.cuda.memory_allocated() / 2**20:.0f} MiB; speakers {model.get_supported_speakers()}")
fw, ow = os.path.join(S2, "F.wav"), os.path.join(S2, "O_G5.wav")
fdb, odb = vol(fw), vol(ow)
res, rows = [], []
for code, spk, note in CAND:
    torch.manual_seed(20261112); t1 = time.time()
    wavs, sr = model.generate_custom_voice(text=G_TEXT, language="Chinese", speaker=spk)
    raw = os.path.join(SDIR, code + "_raw.wav"); sf.write(raw, wavs[0], sr)
    gw = os.path.join(SDIR, code + ".wav")
    subprocess.run([FF, "-y", "-hide_banner", "-loglevel", "error", "-i", raw, "-ar", "48000", "-ac", "1", gw], check=True)
    dur = len(wavs[0]) / sr; gdb = vol(gw)
    solo, trio = os.path.join(SDIR, code + "_solo.mp3"), os.path.join(SDIR, code + "_trio.mp3")
    subprocess.run([FF, "-y", "-hide_banner", "-loglevel", "error", "-i", gw, "-c:a", "libmp3lame", "-b:a", "64k", solo], check=True)
    tgt = -21.0
    fc = (f"[0:a]volume={tgt - fdb:.1f}dB,apad=pad_dur=0.4[a];[1:a]volume={tgt - gdb:.1f}dB,apad=pad_dur=0.4[b];[2:a]volume={tgt - odb:.1f}dB[c];[a][b][c]concat=n=3:v=0:a=1[o]")
    subprocess.run([FF, "-y", "-hide_banner", "-loglevel", "error", "-i", fw, "-i", gw, "-i", ow, "-filter_complex", fc, "-map", "[o]", "-c:a", "libmp3lame", "-b:a", "64k", trio], check=True)
    r = {"code": code, "speaker": spk, "note": note, "dur": round(dur, 2), "gen_seconds": round(time.time() - t1, 1), "mean_db": gdb, "sr": sr,
         "vram_peak_mib": round(torch.cuda.max_memory_allocated() / 2**20)}
    res.append(r); print(r)
    rows.append(f'<tr><td class="code">{code}</td><td>{html.escape(note)}<div class="v">{html.escape(MODEL.split("/")[-1])} · speaker {spk} · {dur:.1f} 秒</div></td>'
                f'<td><div class="lab">只有 Gemini</div><audio controls preload="none" src="data:audio/mpeg;base64,{b64(solo)}"></audio>'
                f'<div class="lab">三人接話：大肥魚 → Gemini → 本小姐</div><audio controls preload="none" src="data:audio/mpeg;base64,{b64(trio)}"></audio></td></tr>')
json.dump({"model": MODEL, "torch": torch.__version__, "candidates": res}, open(os.path.join(HERE, "audition3.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
page = f"""<!doctype html>
<html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>配音試聽（第三輪）：Qwen3-TTS</title>
<style>
:root{{--bg:#15131b;--fg:#f3ede6;--dim:#a9a2b3;--line:#3a3446;--g:#a98bf5}}
body{{margin:0;background:var(--bg);color:var(--fg);font:16px/1.6 "Microsoft JhengHei","Noto Sans TC",sans-serif}}
main{{max-width:900px;margin:0 auto;padding:24px 16px 60px}}
h1{{font-size:24px;margin:0 0 6px}} h2{{font-size:19px;margin:30px 0 4px;padding-left:10px;border-left:5px solid var(--g)}}
p{{color:var(--dim);margin:6px 0}} .line{{color:var(--fg);background:#1e1a27;border:1px solid var(--line);border-radius:8px;padding:8px 12px;margin:8px 0 12px}}
table{{width:100%;border-collapse:collapse}} td{{border-top:1px solid var(--line);padding:10px 6px;vertical-align:middle}}
.code{{font:700 18px Consolas,monospace;width:46px}} .v{{color:var(--dim);font:13px Consolas,monospace}} .lab{{color:var(--dim);font-size:13px;margin-top:4px}} audio{{width:320px;max-width:100%}}
</style></head><body><main>
<h1>配音試聽（第三輪）：Qwen3-TTS</h1>
<p>Qwen3-TTS（阿里開源的語音模型）在這台本機跑出來的預設女聲，當 Gemini 的候選。跟第二輪一樣，每個候選有「只有 Gemini」與「大肥魚 → Gemini → 本小姐」兩段。
這個小模型（0.6B）不吃語氣指令，語速也調不了；念法每次生成會略有不同。回代號就好，例如「Q1」；也可以跟第二輪的 H1～H7 一起比。</p>
<h2>Gemini 大小姐的候選</h2>
<div class="line">{html.escape(G_SHOW)}</div>
<table>{''.join(rows)}</table>
</main></body></html>"""
open(os.path.join(HERE, "audition3.html"), "w", encoding="utf-8", newline="\n").write(page)
print("page bytes", len(page.encode("utf-8")), "audio tags", page.count("<audio"), "total", round(time.time() - t0, 1), "s")
