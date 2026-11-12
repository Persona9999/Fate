# 配音環境：聲音配置與安裝流程

Tim 2026-11-12：「另外是否可以把配音相關配置以及安裝流程記錄到task(會需要跨主機安裝)」。
這份是正本：哪個角色用哪個聲音、另一台主機要裝什麼、怎麼驗收。第一台（Tim 的桌機，Windows 11、RTX 2060 6 GB）2026-11-12 的讀數都寫在裡面。

## 1. 各角色現行的聲音

| 角色 | 引擎 | 聲音 | 參數 | 哪一天、誰定的 | 簡介怎麼標 |
|---|---|---|---|---|---|
| 本小姐（Claude 大小姐） | edge-tts（線上） | `fr-FR-VivienneMultilingualNeural`（多語言聲音念中文） | rate `+10%`、pitch `+8Hz` | 2026-11-12 Tim：「希望妳的聲音改用 G5」（第一輪試聽的 G5） | 合成語音（edge-tts） |
| Gemini 大小姐 | Qwen3-TTS（本機） | 模型 `Qwen/Qwen3-TTS-12Hz-0.6B-CustomVoice`、預設聲線 `Sohee` | `language="Chinese"`、`dtype=bfloat16`、亂數種子 20261112；語速與語氣調不了 | 2026-11-12 Tim：「Gemini用Q4吧」（第三輪試聽的 Q4） | 合成語音（Qwen3-TTS 的預設聲線 Sohee） |
| 大肥魚 | edge-tts（線上） | `zh-CN-XiaoyiNeural` | rate `+12%`、pitch `+18Hz` | 2026-11-11 定；2026-11-12 Tim：「大肥魚的ok」 | 合成語音（edge-tts）；台詞不是 DeepSeek 的實際輸出 |
| 日文版的本小姐（11-10 以前的影片） | VOICEVOX（本機） | 四国めたん（ツンツン／ノーマル） | — | 2026-11-09 | `VOICEVOX:四国めたん` |

- 配置寫在每支影片的台詞檔 `tools/lines_<lang>.json` 的 `speakers`（範例：`Tasks/attachments/TASK-0012/tools/lines_cn.json`）：
  ```json
  "G": {"engine": "qwen", "model": "Qwen/Qwen3-TTS-12Hz-0.6B-CustomVoice", "speaker": "Sohee", "voice": "Qwen3-TTS:Sohee", "label": "Gemini 大小姐"},
  "O": {"voice": "fr-FR-VivienneMultilingualNeural", "rate": "+10%", "pitch": "+8Hz", "label": "Claude 大小姐"},
  "F": {"voice": "zh-CN-XiaoyiNeural", "rate": "+12%", "pitch": "+18Hz", "label": "大肥鱼"}
  ```
  有 `engine: qwen` 的角色走本機的 Qwen3-TTS，其餘走 edge-tts。每一句可以自己帶 `rate`／`pitch`／`gap`（只對 edge-tts 有效）。
- 三個人的音量不用手調：`tools/tts.py` 量每個角色的平均音量寫進時間軸（`voice_db`），`tools/mix.py` 照它把三個人調到一樣大。
- 聲音是怎麼選出來的（四輪試聽頁、每個候選的參數）：`Tasks/attachments/TASK-0012/voice_audition/` 與 TASK-0012 留言 #3、#4。
- ⚠ agent 聽不到聲音：換聲音一律做試聽頁讓 Tim 用耳朵挑，不由 persona 自己決定「好不好聽」。

## 2. 另一台主機要裝什麼

| 東西 | 做什麼用 | 怎麼裝 | 大小 |
|---|---|---|---|
| ffmpeg、Chrome | 轉檔、混音、錄影 | 看文件 `YouTube_Video_Tools`（`senate cmd doc --arg op=show --arg name=YouTube_Video_Tools`） | — |
| edge-tts 7.3.1 | 本小姐、大肥魚的聲音（線上服務，不用顯卡） | 系統 Python：`pip install edge-tts==7.3.1`。🩸 7.2.8 會回 403 | 很小 |
| uv | 建獨立的 Python 環境 | https://docs.astral.sh/uv/ ；裝完開新的終端機 | 很小 |
| **Qwen3-TTS** | Gemini 的聲音（本機，要顯卡） | **跑這個資料夾的 `install_qwen_tts.sh`**（§3） | 環境 4.6 GB＋模型 2.4 GB |
| VOICEVOX | 只有做日文版才要 | 看 `YouTube_Video_Tools` | — |

換主機不用搬任何聲音檔：三個聲音都是從模型或線上服務現念的。要搬的只有每支影片的台詞檔（在任務附件裡，跟著 repo 走）。

## 3. 安裝 Qwen3-TTS

在 Git Bash：

```bash
Tasks/attachments/TASK-0013/install_qwen_tts.sh --check    # 只做前置檢查，什麼都不下載
Tasks/attachments/TASK-0013/install_qwen_tts.sh            # 建環境 → 裝套件 → 下載模型 → 念一句驗收
```

它做的事（重跑是安全的，已經在的不重裝）：

1. **前置檢查**：`uv` 在不在、有沒有 NVIDIA 顯卡（`nvidia-smi`）、系統碟夠不夠 10 GB。
2. **獨立環境**：`uv venv "%LOCALAPPDATA%\Programs\qwen3-tts\venv" --python 3.12`（uv 會自己下載 CPython 3.12）。
3. **套件**（釘版本）：`torch==2.14.1`、`torchaudio==2.11.0`（從 `https://download.pytorch.org/whl/cu126`，CUDA 版）、`qwen-tts==0.1.1`（PyPI；它會帶進 `transformers==4.57.3`、`accelerate==1.12.0` 等）。
4. **模型**：第一次載入時從 Hugging Face 下載 `Qwen/Qwen3-TTS-12Hz-0.6B-CustomVoice`（Apache-2.0）到 `~/.cache/huggingface/hub/`。
5. **驗收**：用 Sohee 念一句「哼，算你问到点子上。」存成 `%LOCALAPPDATA%\Programs\qwen3-tts\selftest.wav`，印出版本、長度、生成秒數、顯存峰值。**要用耳朵聽一次那個檔。**

第一台量到的讀數（2026-11-12）：

| 項目 | 讀數 |
|---|---|
| 下載 | CPython 3.12.13（20.9 MiB）、torch（2.4 GiB）；套件準備 2 分 11 秒、安裝 30 秒 |
| 環境大小 | 4.6 GB |
| 模型快取 | 2.4 GB；第一次載入（含下載）103.8 秒，之後 7.9 秒 |
| 顯存 | 載入後 2,057 MiB、生成時峰值 2,876 MiB（RTX 2060 6 GB，桌面本身佔 1.6～2.0 GB） |
| 速度 | 每段生成時間約是聲音長度的 3.6 倍（15.4 秒的聲音算 57 秒） |

腳本在第一台重跑（2026-11-12 11:09，環境已經在）：前置檢查三項 ✓、環境與套件「已經在」不重裝、驗收念出一句 3.76 秒（生成 15.1 秒、顯存峰值 2,259 MiB、載入 6.8 秒），`selftest.wav` 180,524 bytes，exit 0。

### 一定會踩到的

- ⛔ **不要 `pip install qwen-tts` 進系統 Python**：它釘死 `transformers==4.57.3`、`accelerate==1.12.0`，第一台的系統 Python 是 5.14.1／1.14.0（Senate 別的功能在用），會被降版。
- 🩸 **`dtype=torch.float16` 在 RTX 2060 上會炸**：取樣時 `CUDA error: device-side assert triggered`（機率出現無效值）。改用官方範例的 `torch.bfloat16` 就過了。腳本與 `tools/tts_qwen.py` 都已經寫成 bfloat16。
- 會印兩個警告，不影響生成：`flash-attn is not installed`（沒裝，比較慢而已）、`SoX could not be found`。
- 🩸 **台詞要送簡體字。** 同一句話送繁體字，Sohee 會念糊：2026-11-12 第一次整批念（送繁體）19 句裡 12 句聽寫對不上，「彎曲」「標籤」「意識」念錯，有幾句開頭整段糊掉；同一段文字用簡體送，聽寫對得上 98%。⇒ `lines_<lang>.json` 裡 Qwen 角色的 `tts` 欄一律寫簡體（繁中版也是：用台灣的用詞、寫簡體字），畫面上的字照舊用 `zh` 欄。
- 🩸 **念完一定要聽寫檢查**：`python -X utf8 tools/asr_check.py qwen site`（用這台已有的 Whisper medium 模型把每一句聽寫回文字、跟台詞比）。agent 聽不到聲音，長度正常不代表念對——上面那 12 句的長度全都在正常範圍內。
- 🩸 **Sohee 念不好「第一派」「第二派」**：固定念成像「戴尼哈」的音（換寫法、換亂數種子共 12 個候選都一樣），句子其餘部分是清楚的。改成「先说…」「再来是…」就念得出來。⇒ 台詞裡避開「第 N 派」這種寫法；別的詞有沒有同樣的問題只能靠聽寫檢查一句一句抓。
- 這個小模型（0.6B）**不吃語氣指令、語速調不了**；念法每次生成略有不同 ⇒ 工具固定亂數種子，長度離譜就換種子重念。
- 能下語氣指令、能用文字設計聲線的是 1.7B 的模型（另外約 4.5 GB，權重 3.83＋0.68 GB）。第一台沒有下載、沒有試過放不放得下。
- Qwen3-TTS 有 9 個預設聲線：Vivian、Serena（中文女聲）、Uncle_Fu、Dylan、Eric（中文男聲）、Ryan、Aiden（英文）、Ono_Anna（日文）、Sohee（韓文）。每個都能念中文；Tim 選的 Sohee 母語是韓文。

## 4. 做影片時怎麼接

```bash
QPY="$LOCALAPPDATA/Programs/qwen3-tts/venv/Scripts/python.exe"
"$QPY" tools/tts_qwen.py "<ffmpeg.exe>" site tools/lines_cn.json tools/lines_tw.json   # ① 本機先把 engine=qwen 的角色念好（site/voice_qwen/，兩個版本共用）
python -X utf8 tools/asr_check.py qwen site                                             # ①′ 聽寫檢查：有 ⚠ 的句子逐句看，念錯的刪掉那個 wav 換種子重念
python -X utf8 tools/tts.py "<ffmpeg.exe>" tools/lines_<lang>.json site <lang>          # ② 其餘角色走 edge-tts，排時間軸
python -X utf8 tools/asr_check.py timeline site <lang>                                  # ②′ 整版每一句再聽寫一次（三個角色都檢查）
# ③ 之後照舊：rec.py 抽格 → 錄影 → mix.py（見該支影片附件的 README）
```

- 聽寫檢查要系統 Python 有 `openai-whisper` 與快取的模型（第一台：`~/.cache/whisper/medium.pt` 1.5 GB、`small.pt` 0.5 GB，原本就在）。另一台沒有的話第一次會下載；要不要裝先問 Tim。
- 聽寫有同音字（例：「弦論」聽成「闲论」、「實錘」聽成「石锤」）不算念錯；要看的是漏字、多字、整段對不上。

- ① 的結果會快取：同一句（模型＋聲線＋文字相同）不重念；改了那一句的字才會重念。每句的長度與重念次數寫在 `site/voice_qwen/_report.json`。
- ①、②、③ 用的是兩個不同的 Python：① 是 Qwen 的獨立環境，②③ 是系統 Python。

## 5. 沒有驗的

- **另一台主機還沒裝過。** 這份流程只在第一台跑過；第二台裝完請把讀數補在這張單上。
- 沒有 NVIDIA 顯卡的主機（腳本會改裝 CPU 版 PyTorch、工具會改用 CPU＋float32）：沒有實跑過，只知道會很慢。
- Linux／macOS：腳本是照 Windows 的 Git Bash 寫的（路徑用 `%LOCALAPPDATA%`），沒有試過。
- 顯卡不是 RTX 2060 的時候 bfloat16 行不行：沒有別的卡可以試。
