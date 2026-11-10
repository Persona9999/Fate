# TASK-0004 附件 —— Senate 宣傳影片（三步安裝）

成片 `site/out/senate_promo.mp4`（產物，不進 repo；照下面重跑就有）。
YouTube：https://youtu.be/qtaUeqE1Zck（頻道 Yeh Tim，2026-11-10 上傳時 unlisted；Tim 當天說「改公開」之後改成 public）。B 站簡體版見下面「B 站版」。
產線跟 TASK-0001／TASK-0002 同一套（配音 → 錄影 → 混音），這裡只寫**跟它們不一樣的地方**；
工具怎麼裝看 `senate cmd doc --arg op=show --arg name=YouTube_Video_Tools`。

## 跟前兩支不一樣的

| 項目 | 這一支 |
|---|---|
| 版面（`site/intro.html`） | 上半是「舞台」，每一句台詞一個場景（`SCENES[i]`，吃這一句的進度 0..1）；下半是對話框，頭像縮小放左下 |
| 台詞（`tools/lines.json`） | 8 句，繁體字幕；講 Senate 是什麼 → 三步安裝 → 裝完說「早安大小姐」→ 網址 |
| 換行 | 英數單字不從中間斷（整個字搬到下一行）。🩸 第一版第 7 句的日文把 `senate` 斷成 `se`／`nate` |
| 抽格 | 每一句抽兩格（中段與句尾）：場景動畫跑到一半、跑完各看一次 |
| 片尾 | 遮罩蓋到全不透明。🩸 第一版留了一點透明，上一個場景的網址在片尾的字後面透出來 |
| BGM | 和弦換成 C–G–Am–F（比自我介紹那支亮一點），其餘合成方式一樣 |

## 畫面上的東西從哪來

舞台上出現的指令、輸出、數字都是 2026-11-10 實際跑出來的（TASK-0003 的讀數），不是示意：

| 畫面 | 來源 |
|---|---|
| 三步指令、`# 四個 repo，共 28 MB` | 不帶登入憑證 `git clone --recurse-submodules`，四個 repo 都拉得到，資料夾 28 MB |
| 安裝輸出的每一行、三個子模組的 SHA、`79 MB`、`環境 3 項` | 沒帶子模組的乾淨 clone 上跑 `./install.sh --no-path` 的輸出 |
| `✓ 新 PATH 下 senate 解析到這一份、跑得動。` | `install.sh` 正式安裝成功時印的那一行（試裝不會走到；這一行是照腳本的字句，不是那次試裝的輸出） |
| `試裝 44 秒` | 同一次試裝，從開始到結束（這台已經有 NuGet 快取） |
| 聊天泡泡、`seq 260`／`seq 261` | 在那份 clone 上建 persona `Newcomer` → 早安 → 酒館自介的回傳 |
| `seq 272`、`10c6dfc` | 這台酒館裡 TASK-0003 那筆提交的公告 |
| `1000 tavern_token（開戶種子）` | 新開 agent 的預設種子額度 |

⚠ 安裝流程或輸出的字句改了之後，這支影片的畫面就過期了 —— 重做前先照 TASK-0003 的做法在乾淨 clone 上再跑一次。

## 重跑

在這個資料夾裡（Git Bash），`<run.exe>`、`<chrome.exe>`、`<ffmpeg.exe>` 用這台量到的路徑：

```bash
python -I tools/tts.py "<run.exe>" tools/lines.json site
python -I tools/rec.py site "<chrome.exe>" 240
python -I tools/mix.py "<ffmpeg.exe>" site "$(pwd -W)/site/out/senate_promo.mp4"
```

錄影的逾時要給到 240 秒（片長 78 秒，比前兩支長）。

## 上傳

- `slip_upload.json`：當時送出的交付單（兩個路徑換成了佔位符）。影片介紹裡有安裝方式（Tim 2026-11-10：「影片介紹附上安裝方式」）、第一次使用、章節。
  填好路徑的那一份放在 repo 外面；流程看 `senate cmd doc --arg op=show --arg name=YouTube`。
- `slip_public.json`：改公開用。`senate cmd youtube --arg op=update --arg video_id=<id> --arg slip_file=slip_public.json`
- ⚠ 改公開之前先確認 Senate 的 `10c6dfc`（新的 install.sh、install.cmd、README）已經 push：
  影片和介紹講的是新流程，遠端還是舊的話，照著做的人會找不到 `install.cmd`、`--no-path`。
- 沒寫 `language`：語音是日語、字幕是中文，這一格會同時設成影片語言，標哪一個都會讓自動字幕認錯。
- 章節每段至少 10 秒（YouTube 的規定），所以開場那 4 秒併進第一段。

## B 站版（簡體）

稿件：https://www.bilibili.com/video/BV1oKWM6CEzQ（2026-11-10 11:32 投稿，公開，帳號 tim099999）。Tim 2026-11-10：「完成後上傳bili bili版本」。

動畫只有一份正本（`site/intro.html`，繁體）；簡體版每次都重新產生，⛔ 不要直接改 `site_bili/intro.html`：

```bash
python -I tools/make_bili.py .                                              # site/intro.html → site_bili/intro.html（逐句對照替換）
python -I tools/tts.py "<run.exe>" tools/lines_bili.json site_bili          # 簡體字幕的時間軸
python -I tools/rec.py site_bili "<chrome.exe>" 240
python -I tools/mix.py "<ffmpeg.exe>" site_bili "$(pwd -W)/site_bili/out/senate_promo_bili.mp4"
```

- `tools/make_bili.py`：這台沒有繁簡轉換套件 ⇒ 畫面上的字串逐句對照（47 組）。對不上會報錯；換完還會掃一遍程式字串裡有沒有漏掉的繁體字。
  🩸 第一次跑被自己的檢查擋下：字表裡放了「介」「援」，這兩個字繁簡同形。
- **安裝輸出那個場景不換成簡體**：那是 `install.sh` 實際印出來的字（程式的介面是繁體）。畫面右下有一行小字說明。
- 跟繁體版不一樣的台詞只有最後一句：「网址放在简介里了」（B 站叫簡介）；術語照那邊的說法（子模块、文件、命令、登录、设置）。
- 投稿參數的正本是 `slip_bilibili.json`，簡介是 `desc_bili.txt`（有安裝方式）。流程與紀律看 `senate cmd doc --arg op=show --arg name=Bilibili`。
- 直接投公開：B 站改不了公開度，先投「僅自己可見」就得再投一次（TASK-0002 就是這樣多出一支）。投之前確認過 Senate 的 `10c6dfc` 已經在遠端。

| 項目 | 讀數 |
|---|---|
| 成片 | 78.07 秒、1280x720、30fps、H.264＋AAC、6.53 MB；開場平均 -39.4 dB、台詞段平均 -20.5 dB／峰值 -1.5 dB |
| 成片 SHA-256 | `9527e93f496e7261312a558fe946d8fa433967a9f8e985f1594b806e2c34900a` |
| 抽格 | 18 格裡看了 6 格（三欄、安裝輸出、persona、本機檔案、網址）與封面，字都是簡體、沒有破版 |
| 預演 | `--dry-run` 前後稿件數都是「已發布 29、審核中 0」；10 個標籤都沒被拒 |
| 投稿後 | BV1oKWM6CEzQ，狀態「审核中」，`private=false`，聲明「含AI生成内容」，分區人工智能；稿件數「29／1」；`audit.log` 共 3 筆 |

## 這次的讀數（2026-11-10）

| 項目 | 讀數 |
|---|---|
| 配音 | VOICEVOX 引擎 0.26.1，四国めたん；8 句，最長 9.77 秒；時間軸總長 77.582 秒 |
| 錄影 | `OK in 81.0s`，4656 格，沒有 `error:`／`fatal:` |
| 成片 | 77.67 秒、1280x720、30fps、H.264＋AAC 雙聲道、6.39 MB |
| 音量 | 開場（只有 BGM）平均 -39.4 dB；台詞段平均 -20.5 dB、峰值 -1.5 dB |
| 成片 SHA-256 | `d7d975ba6dd91a83d33644d05ba832b7962bdcf3fa23c6623f3e109f51aa2f13` |
| 抽格 | 18 格（片頭、每句兩格、片尾）逐張看過；封面 `thumb.png` 看過 |
| 上傳 | dry_run 檢查通過（0 項）；上傳後回讀公開度 unlisted、縮圖已設定、處理狀態 uploaded；上傳帳本 1 → 2 支 |
| 改公開 | `op=update` 帶 `slip_public.json`；回讀公開度 public、處理狀態 processed（第 2 次讀，等了 2.5 秒）；`op=list` 也是 public |

## 影片介紹裡「貼給 agent 的安裝提示」（2026-11-10，Tim：面向不懂技術的使用者，不要叫人去開 Git Bash）

| 東西 | 位置 |
|---|---|
| 提示的正本 | `agent_install_prompt.txt`（繁體）、`agent_install_prompt_bili.txt`（簡體） |
| 組進影片介紹 | `python -X utf8 tools/make_desc.py` ⇒ 寫 `slip_desc_update.json`（YouTube `op=update` 用，只有 description）、`desc_bili.txt`，並更新 `slip_upload.json` 的 description |
| 檢查 | YouTube 說明 ≤ 5000 字元、不含角括號（YouTube 不收 ⇒ 提示裡的佔位用「Senate資料夾」這種寫法）；B 站簡介 ≤ 2000 字 |

改提示只改那兩個正本，再跑 `make_desc.py`，然後 `senate cmd youtube --arg op=update` 與 `bili upload edit <BV號> --desc-file desc_bili.txt`。

**實測**（全新的 subagent，只給提示原文；測試限定：改裝到暫存資料夾、不帶憑證 clone、`--no-path`、不跑 winget）：

| 次 | 讀數 |
|---|---|
| 第 1 次 | 🩸 卡在 clone：測試資料夾的路徑太深（scratchpad 那一長串），巢狀子模組 `Valhalla/ChatTavern/baton/letters/Abigail` 的 pack 檔寫不進去，`Filename too long`；`-c core.longpaths=true` 重試也沒過 ⇒ 提示第 2 步補「路徑太長就刪掉沒下載完的、改到短一點的位置」 |
| 第 2 次 | 路徑換成跟一般使用者資料夾差不多長的（`%TEMP%\sn-agent-test`）：clone 四個 repo 都拉到；`bash.exe -lc "cd '…' && ./install.sh --no-path"` exit 0；`senate.exe doctor`「通過：環境 3 項」；它對使用者說的話有講裝在哪、怎麼開始 |

- 第 2 次之後又照回報補了兩句（路徑用正斜線、背景程式不用關），這兩句沒有再實測。
- **沒測到的**：缺 Git／.NET 時走 winget 與 UAC 的那一段（這台兩樣都有）；不帶 `--no-path` 的正式安裝（會動 PATH，這台不能測）；真的從 PowerShell／CMD 叫 `bash.exe`（只量過「不帶 Git Bash 的環境變數時 `bash.exe -lc` 找得到 git、sed、grep、dotnet」）。
- 讀回：YouTube 公開頁面的說明與 `slip_desc_update.json` 逐字相同（2151 字元）；B 站 `bili upload edit` 回 ok，稿件狀態「修改内容待审核…」。
