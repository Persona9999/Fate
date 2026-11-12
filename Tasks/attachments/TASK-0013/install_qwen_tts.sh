#!/usr/bin/env bash
# 安裝本機配音引擎 Qwen3-TTS（獨立的 Python 環境＋模型），裝完念一句驗收。Windows 的 Git Bash 用。
# 重跑是安全的：環境、套件、模型已經在就不重裝，只做驗收那一步。
#
#   ./install_qwen_tts.sh              # 前置檢查 → 建環境 → 裝套件 → 下載模型 → 念一句驗收
#   ./install_qwen_tts.sh --check      # 只做前置檢查，什麼都不下載
#
# 會下載（2026-11-12 在第一台量到的大小）：
#   CPython 3.12（uv 代管，20.9 MiB）、torch 2.14.1+cu126（2.4 GiB）、torchaudio 2.11.0+cu126、qwen-tts 0.1.1 與相依套件
#     ⇒ 環境共 4.6 GB，裝在 %LOCALAPPDATA%\Programs\qwen3-tts\venv
#   模型 Qwen/Qwen3-TTS-12Hz-0.6B-CustomVoice（Hugging Face，2.4 GB）⇒ 放在 ~/.cache/huggingface/hub/
# ⛔ 不裝進系統 Python：qwen-tts 釘死 transformers==4.57.3、accelerate==1.12.0，會把系統裡別的功能在用的版本降下來。
set -u
DIR="${LOCALAPPDATA:?這支腳本給 Windows 的 Git Bash 用}/Programs/qwen3-tts"
PY="$DIR/venv/Scripts/python.exe"
MODEL="Qwen/Qwen3-TTS-12Hz-0.6B-CustomVoice"
TORCH="2.14.1"; TORCHAUDIO="2.11.0"; QWEN="0.1.1"; CUDA_INDEX="https://download.pytorch.org/whl/cu126"
fail() { echo "✗ $*"; exit 1; }

echo "== 1. 前置檢查"
command -v uv >/dev/null 2>&1 && echo "✓ uv $(uv --version | cut -d' ' -f2)" || fail "找不到 uv（先裝 uv：https://docs.astral.sh/uv/ ；裝完開新的終端機）"
if command -v nvidia-smi >/dev/null 2>&1; then
  GPU="$(nvidia-smi --query-gpu=name,memory.total,memory.free --format=csv,noheader | head -1)"
  echo "✓ 顯卡：$GPU（這個模型量到的顯存峰值約 2.9 GB）"
  USE_CUDA=1
else
  echo "⚠ 找不到 nvidia-smi ⇒ 沒有 NVIDIA 顯卡，改裝 CPU 版的 PyTorch（念得很慢；這條路沒有實跑過）"
  USE_CUDA=0
fi
FREE_GB="$(df -BG --output=avail "$LOCALAPPDATA" 2>/dev/null | tail -1 | tr -dc '0-9')"
[ -n "$FREE_GB" ] && { [ "$FREE_GB" -ge 10 ] && echo "✓ 系統碟剩 ${FREE_GB} GB（要 10 GB 上下）" || fail "系統碟只剩 ${FREE_GB} GB，不夠（環境 4.6 GB＋模型 2.4 GB）"; }
[ "${1:-}" = "--check" ] && { echo "（--check：到這裡為止，沒有下載任何東西）"; exit 0; }

echo "== 2. 獨立環境"
if [ -x "$PY" ]; then echo "✓ 環境已經在：$DIR/venv"; else
  mkdir -p "$DIR" && uv venv "$DIR/venv" --python 3.12 || fail "建環境失敗"
fi

echo "== 3. 套件"
if "$PY" -c "import torch, torchaudio, qwen_tts" >/dev/null 2>&1; then echo "✓ torch／torchaudio／qwen-tts 已經在"; else
  if [ "$USE_CUDA" = 1 ]; then
    uv pip install --python "$PY" "torch==$TORCH" "torchaudio==$TORCHAUDIO" --index-url "$CUDA_INDEX" || fail "裝 PyTorch（CUDA）失敗"
  else
    uv pip install --python "$PY" "torch==$TORCH" "torchaudio==$TORCHAUDIO" || fail "裝 PyTorch（CPU）失敗"
  fi
  uv pip install --python "$PY" "qwen-tts==$QWEN" || fail "裝 qwen-tts 失敗"
fi

echo "== 4. 模型（第一次會下載 2.4 GB）＋ 念一句驗收"
OUT="$DIR/selftest.wav"
PYTHONUTF8=1 HF_HUB_DISABLE_PROGRESS_BARS=1 "$PY" - "$MODEL" "$OUT" <<'PYEOF' 2>&1 | grep -v "^\*\*\*\|flash-attn\|SoX\|sox\|sourceforge\|path variables\|^ *$\|pad_token_id"
import sys, time
import torch, torchaudio, transformers, soundfile as sf
from importlib.metadata import version
from qwen_tts import Qwen3TTSModel
model_name, out = sys.argv[1], sys.argv[2]
dev = "cuda:0" if torch.cuda.is_available() else "cpu"
print(f"torch {torch.__version__} / torchaudio {torchaudio.__version__} / transformers {transformers.__version__} / qwen-tts {version('qwen-tts')} / device {dev}")
t0 = time.time()
# 🩸 float16 在 RTX 2060 上取樣會炸（CUDA device-side assert）⇒ 顯卡用 bfloat16、CPU 用 float32
m = Qwen3TTSModel.from_pretrained(model_name, device_map=dev, dtype=torch.bfloat16 if dev != "cpu" else torch.float32)
print(f"model loaded in {time.time() - t0:.1f}s; speakers {m.get_supported_speakers()}")
torch.manual_seed(20261112); t1 = time.time()
wavs, sr = m.generate_custom_voice(text="哼，算你问到点子上。", language="Chinese", speaker="Sohee")
sf.write(out, wavs[0], sr)
peak = torch.cuda.max_memory_allocated() / 2**20 if dev != "cpu" else 0
print(f"SELFTEST dur={len(wavs[0]) / sr:.2f}s gen={time.time() - t1:.1f}s vram_peak={peak:.0f}MiB file={out}")
PYEOF
[ -s "$OUT" ] && echo "✓ 念出來了：$OUT（$(stat -c %s "$OUT") bytes）—— 用耳朵聽一下是不是一句中文" || fail "沒有念出檔案（看上面印的錯誤）"
echo "環境大小：$(du -sh "$DIR/venv" | cut -f1)　模型快取：$(du -sh "$HOME/.cache/huggingface/hub/models--Qwen--Qwen3-TTS-12Hz-0.6B-CustomVoice" 2>/dev/null | cut -f1)"
echo "== 完成。做影片時：<上面那個 python> tools/tts_qwen.py <ffmpeg.exe> site tools/lines_cn.json tools/lines_tw.json"
