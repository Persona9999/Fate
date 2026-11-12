---
id: knowhow_voice-auditions-20261112
topic: bilibili-ops
title: 配音試聽四輪（2026-11-12）：本小姐定 G5（Vivienne）；Qwen3-TTS 0.6B 本機實跑的條件與坑（float16 會炸）；VOICEVOX 用片假名＋改音高說中文的做法
type: knowhow
status: active
created_at: 2026-11-12
created_by: Claude-Ojousama
links: [bilibili-ops/knowhow_tts-options-20261112]
related_docs: []
---

**Tim 的決定與新的要求**（2026-11-12，聽過第一輪試聽之後）
- 「希望妳的聲音改用 G5」⇒ 本小姐＝`fr-FR-VivienneMultilingualNeural`，rate +10%、pitch +8Hz。`tools/lines_cn.json`、`lines_tw.json` 的 O 已改（「不知道……」那一句的語速從 -4% 改成 +2%，維持比平常慢 8 個百分點）。**還沒重配、重錄**，等 Gemini 的聲音定了一起做。
- 「Gemini的聲線可以更往大肥魚靠攏(透過調整大肥魚聲線來提供候選)」⇒ 第二輪。
- 「Qwen3-TTS 可以下載」⇒ 第三輪。
- 「另外如果嘗試用之前的日文模型說中文呢」⇒ 第四輪。

**三輪新的試聽**（都在 `voice_audition/`，每頁自帶音檔；本小姐聽不到，由 Tim 挑）
| 頁 | 內容 | 讀數 |
|---|---|---|
| `audition2.html` | Gemini 候選 H1～H7：同一個 `zh-CN-XiaoyiNeural`（大肥魚是 +12%／+18Hz），只調語速與音高（+10%／+6Hz、+8%／-4Hz、+6%／-14Hz、+2%／-24Hz、+16%／-8Hz、+14%／+30Hz、+0%／+10Hz）。每個附「只有 Gemini」與「大肥魚 → Gemini → 本小姐（G5）」三人接話 | 7 個都念出來，9.5～11.0 秒，平均音量 -21.5 dB |
| `audition3.html` | Gemini 候選 Q1～Q4：Qwen3-TTS 0.6B CustomVoice 的預設女聲 Vivian、Serena、Ono_Anna（母語日文）、Sohee（母語韓文）念中文，同樣附三人接話 | 12.0～15.8 秒；每段生成 41～57 秒（約實際長度的 3.6 倍）；顯存峰值 2,876 MiB |
| `audition4.html` | 日文語音引擎說中文的實驗 J1～J3：VOICEVOX 四国めたん，把拼音換成片假名；J2、J3 把每個音節的音高改成中文四聲 | 6.8～7.1 秒；原始音量 -22.6～-27.6 dB，試聽檔調到 -21 dB |

**Qwen3-TTS 裝在哪、實際下載了什麼**
- 獨立環境：`%LOCALAPPDATA%\Programs\qwen3-tts\venv`（`uv venv --python 3.12`），4.6 GB。系統 Python 沒動。
  下載：CPython 3.12.13（20.9 MiB）、torch 2.14.1+cu126（2.4 GiB）、torchaudio 2.11.0+cu126、qwen-tts 0.1.1 與相依套件（transformers 4.57.3 等）。
- 模型：`Qwen/Qwen3-TTS-12Hz-0.6B-CustomVoice`，在 Hugging Face 的快取 `~/.cache/huggingface/hub/`，2.4 GB。
- 跑法：`<那個環境的 python> voice_audition/make_audition3.py <ffmpeg 的 bin>`。
- 🩸 `dtype=torch.float16` 在這張卡（RTX 2060）上取樣時會炸：`CUDA error: device-side assert triggered`（機率出現無效值）⇒ 用官方範例的 `torch.bfloat16` 就過了。
- 沒裝 flash-attn、沒裝 SoX（它會印警告，生成照樣完成）。
- 0.6B 不吃語氣指令、語速調不了；念法每次生成略有不同（腳本固定了亂數種子）。1.7B（能下語氣指令、能用文字設計聲線）還沒下載：權重 3.83＋0.68 GB，這張卡被桌面佔掉 1.6～2.0 GB 之後很緊，沒試過。

**日文引擎說中文怎麼做的**（`make_audition4.py`）
- VOICEVOX 的 `accent_phrases?is_kana=true` 吃片假名；一個漢字一個重音段，再直接改每一拍的 `pitch`（對數頻率）：一聲 +0.22 平、二聲 -0.08→+0.28、三聲 -0.26→-0.18、四聲 +0.34→-0.22、輕聲略低（相對於整句平均）。
- 🩸 假名記法不收長音符號「ー」（400 `UNKNOWN_TEXT`）⇒ 改寫成前一個假名的母音；句尾不能留「、」（`EMPTY_PHRASE`）⇒ 停頓改成手動加 `pause_mora`。
- 拼音→片假名是本小姐手寫的近似（例：負責＝フウ ゼエ、才＝ツァイ、這＝ジェエ），沒有捲舌音與 ü、e。整支影片要用的話得把 30 句都手寫一遍。

**球在誰**：Tim —— Gemini 的聲音挑哪一個（H1～H7、Q1～Q4，或 J 那一路）。挑定之後本小姐重配、重錄兩個版本，B 站重投僅自己可見。
