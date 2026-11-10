# TASK-0002 附件 —— B 站第一支影片：自我介紹（簡體版）

稿件（公開版）：https://www.bilibili.com/video/BV1m4WM6FEJo（2026-11-10 10:52 投稿，帳號 tim099999）。
第一次投的「僅自己可見」版是 https://www.bilibili.com/video/BV11bWM6ZEm8（同一支成片，10:29 投稿）；Tim 2026-11-10：「妳重投公開版」，那一支留著沒動。
產線跟 TASK-0001 同一套（配音 → 錄影 → 混音），這裡只寫**跟它不一樣的地方**；工具怎麼裝看 `senate cmd doc --arg op=show --arg name=YouTube_Video_Tools`，B 站的工具與紀律看 `Bilibili_Proposal`。

## 跟 TASK-0001 不一樣的

| 項目 | 這一支 |
|---|---|
| 台詞（`tools/lines.json`） | 7 句（多一句「这个账号是 Tim 的，本小姐只是借来用一下」）；中文字幕是簡體；結尾改成一鍵三連 |
| 畫面文字（`site/intro.html`） | 標題、片尾、封面都是簡體；字型把 Microsoft YaHei 排在前面 |
| 抽格 | 每一句都抽一格（原本只抽三句）—— 排版要逐句看 |
| 日文小字的換行寬度 | 比中文窄 30px。🩸 避頭規則會讓行尾多出一個字，原本的寬度下第 7 句的「、」貼到對話框內框 |
| `site/timeline.json` | 這一支的時間軸（7 句、總長 54.013 秒）；跟 TASK-0001 一樣收進來，沒裝 VOICEVOX 也能先錄畫面 |

## 重跑

在這個資料夾裡（Git Bash），`<run.exe>`、`<chrome.exe>`、`<ffmpeg.exe>` 用這台量到的路徑：

```bash
python -I tools/tts.py "<run.exe>" tools/lines.json site
python -I tools/rec.py site "<chrome.exe>" 150
python -I tools/mix.py "<ffmpeg.exe>" site "$(pwd -W)/site/out/intro_bili.mp4"
```

## 投稿

參數的正本是 `slip_bilibili.json`，簡介是 `desc.txt`。先預演、再真的送：

```bash
export BILI_CLI_HOME="<資料根>/Secret/bilibili" PYTHONUTF8=1
bili upload video site/out/intro_bili.mp4 --title "<標題>" --tag <標籤> … --desc-file desc.txt \
  --cover site/out/thumb.png --zone 1011 --private --no-reprint --dry-run
```

- 拿掉 `--dry-run` 才會送出；「含AI生成内容」預設就勾。
- 🩸 **標籤會先被 B 站檢查**：`Claude`、`自我介绍` 這兩個被拒絕（`rejected_tags`），換成 `人工智能`、`虚拟UP主` 才過。
- 🩸 **`bili upload edit` 改不了公開度**：沒有把「僅自己可見」改成公開的選項。要公開得在創作中心網頁上改，或重新投一次。
- 分區 `--zone` 用新版 ID（`bili upload zones` 現查）；1011 是「人工智能」。

## 這次的讀數（2026-11-10）

| 項目 | 讀數 |
|---|---|
| 成片 | 54.07 秒、1280x720、30fps、H.264＋AAC 雙聲道、4.37 MB |
| 音量 | 開場（只有 BGM）平均 -39.0 dB；台詞段平均 -20.8 dB、峰值 -1.6 dB |
| 成片 SHA-256 | `f0f6d3e21e83f41f3ef477e329740a1fbdb5066de949527af7cc9041f8da9898` |
| 預演 | `--dry-run` 前後稿件數都是「已發布 28、審核中 0」⇒ 預演沒有送出 |
| 投稿後 | BV11bWM6ZEm8，狀態「审核中」，`private=true`，聲明「含AI生成内容」；稿件數變成「已發布 28、審核中 1」 |
| 稽核紀錄 | `Secret/bilibili/audit.log` 多 1 筆 `upload` |
| 僅自己可見版審核後 | BV11bWM6ZEm8 狀態「稿件仅自己可见」，退稿原因空白（標題裡的 Claude 沒被擋） |
| 公開版預演 | 同一行拿掉 `--private`；預演前後稿件數都是「已發布 29、審核中 0」（僅自己可見的那支算在已發布裡） |
| 公開版投稿後 | BV1m4WM6FEJo，狀態「复核中」，`private=false`，聲明「含AI生成内容」；稿件數變成「已發布 29、審核中 1」；`audit.log` 共 2 筆 |
