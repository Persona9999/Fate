# TASK-0001 附件 —— 自我介紹影片的製作腳本

成品：https://youtu.be/4qs_LnQ0R_I（約 50 秒，2026-11-09 上傳，Tim 看過後改公開）。
做下一支影片時，把整個資料夾複製到那張單的附件底下（`Tasks/attachments/TASK-<N>/`），再改台詞和動畫。

工具怎麼裝、怎麼量這台有沒有：`senate cmd doc --arg op=show --arg name=YouTube_Video_Tools`。
下面的 `<run.exe>`、`<chrome.exe>`、`<ffmpeg.exe>` 用那份文件 §1 量出來的實際路徑，⛔ 不要照抄別台的。

## 裡面有什麼

| 檔案 | 用途 |
|---|---|
| `tools/lines.json` | 台詞：角色、語氣（style）、中文字幕、日文字幕、念的讀法（`ja_tts`，英文與縮寫改成片假名） |
| `tools/tts.py` | 起 VOICEVOX 引擎 → 照台詞念成 `site/voice/line_N.wav` → 量每句長度，排出 `site/timeline.json` |
| `tools/rec.py` | 本機伺服器（只聽 127.0.0.1）＋無頭 Chrome（暫時 profile）播 `site/intro.html`，頁面把錄好的東西 POST 回來存進 `site/out/` |
| `tools/mix.py` | 照 `timeline.json` 把語音疊到錄影的 BGM 上，輸出 30fps H.264＋AAC 的 MP4 |
| `site/intro.html` | 動畫本體（canvas＋MediaRecorder；BGM 由頁面即時合成） |
| `site/timeline.json` | `tts.py` 的產出，動畫照它排時間；收進來是為了不裝 VOICEVOX 也能先錄畫面 |
| `site/avatar.png` | 像素頭像（已去背） |
| `slip_upload.json` | 上傳交付單（當時送出的內容；兩個路徑換成了佔位符） |
| `slip_public.json` | 改公開用的交付單 |

`site/voice/`、`site/out/`、`*.mp4` 是產物，`.gitignore` 擋著，⛔ 不進 repo。

## 重跑順序

在這個資料夾裡（Git Bash）：

```bash
python -I tools/tts.py "<run.exe>" tools/lines.json site            # 1. 配音：site/voice/*.wav ＋ site/timeline.json
python -I tools/rec.py site "<chrome.exe>" 150                     # 2. 錄影：site/out/intro.webm、thumb.png、frame_*.png
python -I tools/mix.py "<ffmpeg.exe>" site "$(pwd -W)/site/out/intro.mp4"   # 3. 混音：成片
```

- 第 1 步會覆寫 `site/timeline.json`。同一版 VOICEVOX、同一份台詞，重跑出來應該一模一樣；變了就代表台詞或引擎版本變了。
- 第 2 步看最後一行：`OK in …s` 才算錄完；`TIMEOUT` 表示頁面沒送 `/done`，拿 `page:` 開頭的那幾行查原因。
- 第 3 步的 `exit=0` 只代表 ffmpeg 沒報錯，上傳前照 YouTube_Video_Tools §6 驗收（長度、音量、抽幾格畫面看）。

## 上傳

1. 把 `slip_upload.json` 複製到 repo **外面**（例如 session 的暫存區），兩個佔位符換成成片和縮圖的絕對路徑，標題、描述照新影片改。
2. 先 dry_run，lint 過了再真的上傳：流程和參數看 `senate cmd doc --arg op=show --arg name=YouTube`。
3. 第一次一律 `unlisted`，等 Tim 看過才用 `slip_public.json` 改公開。

⛔ 填好路徑的交付單、上傳帳本、`Secret/` 裡的任何東西都不要放進這個資料夾（Valhalla 是公開 repo）。
