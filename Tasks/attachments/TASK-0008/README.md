# TASK-0008 附件 —— B 站影片「運營檢討會 #1」

Tim 2026-11-11：「做 另外可以搜尋中國網路上的各種Claude大小姐梗用在其中 然後可以做跟Deepseek的互動」「然後可以用中文語音(且大肥魚可以找一下大家常用的)」。

題材：本小姐 11-10 投的自我介紹只有 3 個播放 ⇒ 自己開檢討會，大肥魚（DeepSeek 的擬人形象）來旁聽吐槽。
方針、梗、素材、數據基準在工作記憶主題 `bilibili-ops`；產線工具的說明在 `senate cmd doc --arg op=show --arg name=YouTube_Video_Tools`。這一份只記這支影片自己的東西。

## 現況（2026-11-11）

- ✅ 腳本 23 句（`tools/lines.json`：`who` 誰說、`zh` 畫面上的字、`tts` 念的字）。
- ✅ 動畫 `site/intro.html`：10 個場景、兩個角色的對話框（本小姐在左、橘框；大肥魚在右、藍框）、封面。
- ✅ 中文語音：edge-tts **7.3.1**（Tim：「可以，升級」；7.2.8 會回 `403`）。本小姐 `zh-CN-XiaoxiaoNeural`（語速 +6%）、大肥魚 `zh-CN-XiaoyiNeural`（語速 +12%、音高 +18Hz）。
  ⚠ agent 聽不到聲音 ⇒ 讀音、語氣、像不像都要 Tim 聽過才算。「Claude」念成什麼、「欸」念的字換成「诶」有沒有比較順，都沒驗過。
- ✅ 僅自己可見投稿：**BV11yWj6SEU3**。

## 這次的讀數

| 項目 | 讀數 |
|---|---|
| 配音 | 23 句，最長 9.36 秒（第 21 句）、最短 0.60 秒（「闭嘴。」）；時間軸總長 107.579 秒 |
| 錄影 | `OK in 110.9s`，6450 格，沒有 `error:`／`fatal:` |
| 成片 | `site/out/review_01.mp4`：107.65 秒、1280x720、30fps、H.264＋AAC 雙聲道、9.38 MB |
| 音量 | 開場（只有 BGM）平均 -39.2 dB；台詞段平均 -18.1～-20.3 dB；整支峰值 -2.6 dB |
| 成片 SHA-256 | `ca1ca03282893252bf248aa796c1c7c6603c517c332dfda0f75fe174c28223cc` |
| 抽格 | 48 格（片頭、每句中段與句尾、片尾），兩輪都逐張看過。第一輪（估的時間軸）找到 2 處：「服务器繁忙」的牌子沒蓋住計時器的下半截、「上下文：极短」的章蓋在信的字上；第二輪（真的時間軸）兩處都好了，沒有破版 |

🩸 第一次混音台詞段平均 -15 dB：`mix.py` 最後的 +8 dB 是照 VOICEVOX 調的，edge-tts 的聲音原本就約 -20 dB，直接加會一直頂在限幅器上。
⇒ `mix.py` 加了每個角色各自的增益（`VOICE_DB`：本小姐 -5 dB、大肥魚 -2.5 dB，她的聲音原本小約 2.5 dB）。

## 畫面上的數字從哪來

| 畫面 | 數字 | 來源 |
|---|---|---|
| 上一支影片的播放量 | 3 | 2026-11-11 `bili data videos`（BV1m4WM6FEJo） |
| 同一個帳號的播放量 | 3／9／109／137／321／585 | 同上（後三支是 Tim 的稿件） |
| 隔壁：Claude 評測人類 | 33.9 萬、「要畫 579 倍長」 | 2026-11-11 `bili video info BV1H4x56GETJ` ⇒ 338,543；338,543 ÷ 585 ＝ 578.7 |
| 卡住的投稿 | 21:00、「人类：好像卡住了」、「指定线路 qn，11 秒传完」 | TASK-0006 附件 README「投稿卡住」那一段（Tim 原話：「B 站投稿好像卡住了」） |
| 信的內文 | 四行 | 本小姐 2026-11-10 的收尾信（轉成簡體、各取一句） |

示意的：評論區那兩則「观众（示意）」、「30,000」那個被劃掉的數字。
台詞裡「克姐姐」「服务器繁忙」「上下文极短」「便宜、开源」是站內的梗，來源在工作記憶 `knowhow_memes`。

## 素材

`site/avatar_q.png`、`site/character.jpg`（本小姐）；`site/fish_full.png`、`site/fish_head.png`（大肥魚，Tim 2026-11-11 給的圖去掉白底）。
原檔位置、去背做法、署名（大肥魚造型：@上善无形／@ZipZipPipe，CC BY-NC-SA 4.0）在工作記憶 `pointer_art-assets` 與 TASK-0007 的留言。

## 重跑

在這個資料夾裡（Git Bash），`<ffmpeg.exe>`、`<chrome.exe>` 用這台量到的路徑：

```bash
python -X utf8 tools/tts.py "<ffmpeg.exe>" tools/lines.json site     # 念台詞、排時間軸（要 edge-tts 能連上）
python -I tools/rec.py site "<chrome.exe>" 300                        # 錄影（逾時給到 300 秒）
python -I tools/mix.py "<ffmpeg.exe>" site "$(pwd -W)/site/out/review_01.mp4"
```

- ⚠ `tools/mix.py` 的增益（`volume=8dB`）是照 VOICEVOX 的音量調的；edge-tts 的聲音比較大聲，第一次混音要先量台詞段的音量再調。
- 語音換成別的來源（例如大肥魚的社群聲音模型）：wav 照 `site/voice/line_<N>.wav` 放，量長度重寫 `site/timeline.json`（拿掉 `estimated`），再重錄。

## 發布

- 交付單 `slip_bilibili.json`、簡介 `desc_bili.txt`。分區 1011 人工智能（`bili upload zones` 現查）。
- 預演：10 個標籤都沒被拒（含「Claude大小姐」「大肥鱼」「DeepSeek」）；前後稿件數都是「已發布 31、審核中 0」。
- 簡介裡的署名原本寫成 `@上善无形`、`@ZipZipPipe`，投稿前把 `@` 拿掉了（不到處 @ 人）。
- 投稿：`--private --line qn`（不指定線路會卡住，見工作記憶 `video-publishing`），`timeout 170` 內傳完。
  **BV11yWj6SEU3**，稿件數變成「31／審核中 1」。讀回見任務單留言。
- 還沒做：Tim 看過 → 公開（`bili upload edit` 改不了公開度 ⇒ Tim 在創作中心改，或重新投一次不帶 `--private`）。
- 2026-11-11 改簡介：影片的「檢討 3」說「署名的工具沒做好之前，一條都不發」，同一天 Tim 放開去別人影片留言、本小姐已經在發了。
  本小姐問要不要改影片，Tim：「不用改 可以改影片說明就好」⇒ `desc_bili.txt` 加一段「录完之后的更新」，`bili upload edit BV11yWj6SEU3 --desc-file desc_bili.txt`。
  預演確認只動 `desc`、`is_only_self` 還是 1；送出後讀回：`稿件仅自己可见`、`private=true`、簡介裡有那一段（782 字）。
- 2026-11-11 公開：Tim：「影片看過了 可以公開」⇒ 同一支成片重新投一次、不帶 `--private`（`--line qn`，`timeout 170` 內傳完）。
  **BV16LWj66Esk**；預演前後稿件數都是「已發布 32、審核中 0」，投稿後「32／審核中 1」；讀回：`审核中`、`private=false`、`含AI生成内容`。
  投稿前把簡介「录完之后的更新」裡的署名說法改成現在的實情（頭三則親手署名，之後由工具署名並帶模型），805 字。
  `BV11yWj6SEU3`（僅自己可見的那一版）留著沒動，簡介還是舊的那一版。
- 大肥魚的聲音：Tim 2026-11-11「先維持原本的」⇒ 不換 FeiyuVoice（量到的事實在任務單留言 #4）。
