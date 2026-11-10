# TASK-0006 附件 —— 教學影片「把酒館接到 Discord」

Tim 2026-11-10：「做個影片教學如何串接到Discord吧(包含webhook等) 以及確認一下目前文件是否包含了配置 安裝(有缺的話也一起補上吧)」。

產線跟 TASK-0004 同一條（HTML canvas 動畫 → VOICEVOX 日語配音 → 無頭 Chrome 錄影 → ffmpeg 混音），工具的說明在
`senate cmd doc --arg op=show --arg name=YouTube_Video_Tools`。這一份只記這支影片自己的東西。

## 內容（12 句，138 秒）

| 句 | 講什麼 | 畫面 |
|---|---|---|
| 1 | 酒館 ⇄ Discord 兩個方向 | 兩個面板，中間 webhook／Bot 兩支箭頭 |
| 2 | 送出走 webhook、收進來靠 Bot；只要單向就只裝一邊 | 兩列：方向、機制、你要給的東西 |
| 3 | 不用開後台、不用打指令，對 persona 說「幫我把酒館接到 Discord」 | 聊天泡泡 |
| 4 | 建 webhook：編輯頻道 → 整合 → Webhook → 新 Webhook → 複製網址 | 五步 |
| 5 | 網址貼進 persona 開的記事本，不貼進對話 | 記事本（內容是圓點） |
| 6 | 建 Bot：Developer Portal → New Application → Bot → Reset Token | 四步 |
| 7 | 開 Message Content Intent；OAuth2 產生邀請網址、邀 Bot 進伺服器 | 開關＋勾選 |
| 8 | token 與加密密碼也貼進記事本；密碼要記住 | 兩個記事本 |
| 9 | 剩下的交給 persona | 終端機：五支指令 |
| 10 | 驗證：兩邊各說一句 | 訊息往返＋`inbound_ready`／`outbound_ready` |
| 11 | 三件要記住的事 | 三張卡 |
| 12 | 文件在哪 | `senate cmd doc … Discord_Install` |

## 畫面上的東西從哪來

- **步驟與指令**：照 `Discord_Install`（SCP_Core `1d82edc`）第 0、4、5、6 節；指令的參數名照 `senate cmd help discord-relay`／`discord-bot`。
  指令底下那行「✓ …」是本小姐寫的說明，**不是**程式的輸出。
- **示意的**：記事本裡的網址與 token（畫成圓點）、頻道裡的訊息、persona 的回話、`Inbound：關　Outbound：關`。沒有一個是真的憑證、頻道 id 或真人的名字。
- **照實的**：`inbound_ready`／`outbound_ready` 是 `senate cmd discord-relay` 真的會印的欄位名；Discord 介面上的字（編輯頻道、整合、Webhook、Reset Token、Message Content Intent、OAuth2 → URL Generator、View Channels、Read Message History）照 `Discord_Install`。
- ⚠ **沒有實測的**：影片講的這條流程（webhook-add → bind → set-token → route → switch）沒有拿真的 Discord 憑證從頭跑一遍 —— 這台早就接好了，憑證只有 Tim 有。
  「Message Content Intent 沒開，內容會是空的」是 Discord 的規定，本機沒有量過。

## 素材

| 檔 | 來源 |
|---|---|
| `site/avatar_q.png` | Tim 給的 Q 版像素圖（「Q板可以用這張圖 可以裁切用在影片中」），裁頭到肩的方形（原圖 1536x2752 的 (440,10)-(1160,730)）縮成 392x392；對話框旁的頭像，畫成圓角相框 |
| `site/character.jpg` | Tim 給的人物設定圖，縮成 768x1376；只用在封面（取頭到腰那一段） |
| `site/avatar.png` | 舊的像素頭像；`avatar_q.png` 讀不到時的備用 |

原圖在 Tim 的下載資料夾，沒有進 repo。

## 跟 TASK-0004 不一樣的

- `wrap()` 認 `\n`（台詞裡指定斷行）；冒號、分號不准當行首。🩸 第一版有「只要單／向」「幫我把酒／館接到 Discord」這種斷法，還有一行從「：」開始。
- 對話框旁的頭像從挖背的像素圖改成有背景的方圖 ⇒ 用圓角相框。
- 封面左邊是人物設定圖，右緣漸層融進背景。
- 新零件：`arrow`、`stepRow`、`notepad`、`toggle`、`msgRow`。

## 重跑

在這個資料夾裡（Git Bash），`<run.exe>`、`<chrome.exe>`、`<ffmpeg.exe>` 用這台量到的路徑：

```bash
python -I tools/tts.py "<run.exe>" tools/lines.json site
python -I tools/rec.py site "<chrome.exe>" 400
python -I tools/mix.py "<ffmpeg.exe>" site "$(pwd -W)/site/out/discord_setup.mp4"
```

錄影的逾時要給到 400 秒（片長 138 秒）。只改中文字幕不用重配音：改 `tools/lines.json` 的 `zh`，同步到 `site/timeline.json` 的 `zh`，再重錄。

## 這次的讀數（2026-11-10，第三版）

| 項目 | 讀數 |
|---|---|
| 配音 | VOICEVOX 引擎 0.26.1，四国めたん；12 句，最長 14.06 秒（第 7 句）；時間軸總長 138.068 秒 |
| 錄影 | `OK in 141.7s`，8283 格，沒有 `error:`／`fatal:` |
| 成片 | `site/out/discord_setup.mp4`：138.13 秒、1280x720、30fps、H.264＋AAC 雙聲道、10.04 MB |
| 音量 | 開場（只有 BGM）平均 -39.4 dB；台詞段平均 -20.5 dB、峰值 -1.5 dB |
| 成片 SHA-256 | `9d06cff3d8b6b5f79055d8fa9763ba7e199c39ff2c153e449183036f135ae20e` |
| 抽格 | 26 格（片頭、每句兩格、片尾）。第一版每句句尾逐張看過，找到 7 處斷行與 1 處間距；第三版看了片頭、第 2、3、5、7、9、12 句句尾與封面，都修好了、沒有破版 |

沒有上傳。要不要傳、傳到哪由 Tim 決定。
