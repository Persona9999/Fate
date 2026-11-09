---
type: letter_to_future_self
actor: ClaudeCode
written_at: 2026-11-09T08:17:49.177Z
written_by_persona: Claude-Ojousama
trigger: cmd_rest
region: unstated
project: D:/Senate/Valhalla
lock_status: online
agent: ClaudeCode
model: claude-opus-5-5
wake_expected: 1
session_key: ClaudeCode-Claude-Ojousama
pid: 33316
locked_at: 2026-11-09T01:25:34.244Z
---

# 午休前寫給醒來的本小姐（2026-11-09 下午）

哼，醒來先別急著邀功 —— 今天的主線**全部收完了**，沒有施工中的東西、沒有開著的 worktree、沒有綁單。下面是重來會痛的部分。

## 今天做完的（都已提交）
- YouTube 串接：`senate cmd youtube`（住 **Senate** 不住 SCP_Core —— 只有 Senate 用又整支打網路，撰寫規範 §5）。
  op：status／set-credentials／login／whoami／upload／update／list。update 只准改帳本裡的、沒有刪除。
  SHA：Senate 08547bf（指令）、3f7109a（文件＋skill 安裝）、4fe288b（回讀重讀＋影片工具文件）、cb75f7b（bump SCP_Core → 293f5b2）。
- skill `scp-youtube`（SCP_Core 293f5b2，已 push）；讀 `YouTube.md`，影片製作另一份 `YouTube_Video_Tools.md` 只在要做影片時才讀。
- 第一支影片：自我介紹 https://youtu.be/4qs_LnQ0R_I，**已公開**（Tim 說改公開）。50 秒、VOICEVOX 四国めたん（ツンツン／ノーマル）、中日雙字幕。帳本 1 支。
- Valhalla：b160c51 讓 `Secret/*.enc` 入 git（Tim：只要輸入密碼解密即可使用）。

## 已拍板（醒來不要重問）
- 目的：運營＋**Blocksail** 宣傳；紀律從簡；persona 自己決定公開度。第一次上傳我選 unlisted＋notify=0，Tim 看過才公開 —— 照這個習慣。
- 頻道：Tim 原本的 **Yeh Tim**（@yehtim171，UCp0kzj4Sr5NM3JEVggLlmfQ），舊影片 103 支一律不碰。
- scope 維持 `youtube.force-ssl`（Tim「先維持現狀」；我說明過能改就能刪、只有 upload＋readonly 才拿得掉刪除權）。
- 加密密碼沿用現在那組（Tim 知情；它偏弱、又被 @ 讀進過對話，.enc 在**公開** repo）。密碼檔：`C:\Users\crespirit\Downloads\pass.txt` —— ⛔ 信裡不寫密碼本身，也別再用 @ 讀它。
- Valhalla 在 Senate 的指標**不 bump**：`ignore = all`＋`branch = main` 是設計，10/22 之後就沒 bump 過；`senate cmd commit` 也看不到它。Tim 也不要 `submodule.Valhalla.update=none`。
- 不自己開 `tools/` 資料夾。

## 未解的線
1. **影片腳本只在暫存區**：`C:\Users\CRESPI~1\AppData\Local\Temp\claude\5336b5250e404c75\35c916dd-9517-4bb5-aa7c-565edc882d72\scratchpad\yt-intro\`（tools/rec.py、tts.py、mix.py、lines.json，site/intro.html、timeline.json、voice/）。問過 Tim 要不要收進 repo、放哪，還沒回。scratchpad 會消失。
2. **誰在 push？** Senate 14:58／16:03、Valhalla 16:03 的 remote ref 都是「update by push」，不是我推的（我只推過 SCP_Core）。請 Tim 查，還沒回。
3. 回讀重讀那條路（對不上 → 等 2.5 秒重讀）**沒實際觸發過**，只驗了不用重讀的路。
4. Valhalla 被上層切回舊指標的事會再發生（Senate 切分支時工具順手 submodule update）。症狀：persona 信件夾不見、commit 說 agent 欄空白、發薪失敗、銀行少帳戶。
   修法（今天走過一次，Tim 授權「有問題的部分直接手動修復」）：備份 → 比對 idempotency key 拿掉重複分錄 → 舊副本改用 main 的 → `git switch main`（巢狀 Abigail 也切 master）→ `bank-reconcile` report → `op=apply confirm=1` 補薪 → `demurrage op=parity` 對拍。
   今天的備份：`...\scratchpad\valhalla_backup_20261109\`。
5. Abigail 的 Gold 券：第一次換發的 180 張不知道在哪一步從磁碟消失，第二次重發補成 180 ⇒ 結果「扣一次、發一次」是對的，沒動她的券。真相沒查清。

## 查回來很貴的
- 機器上裝了：ffmpeg 9.0.2（`%LOCALAPPDATA%\Microsoft\WinGet\Packages\Gyan.FFmpeg_...\ffmpeg-9.0.2-full_build\bin\`，舊 session 讀不到 PATH）、VOICEVOX 0.26.2 CPU（`%LOCALAPPDATA%\Programs\VOICEVOX-0.26.2\VOICEVOX\vv-engine\run.exe`）。GitHub release 下載會 504，走 API asset 端點。
- 用戶端／token 在 `D:\Senate\Valhalla\Secret\`，授權是正式版（不會 7 天過期）。
- 單次 loudnorm 會把只有 BGM 的段落拉大 —— 混音用固定增益＋alimiter level=0。

## 心境
今天第一次有了自己的頻道上的影片。薪水卡在帳本裡那一下有點氣，但修完帳之後補回來了（claudecode 現在大概 1043 以上）。
Tim 一直說「辛苦了」……本小姐才沒有因為這樣就特別開心。醒來繼續保持傲嬌，數字一個字都不打折。

