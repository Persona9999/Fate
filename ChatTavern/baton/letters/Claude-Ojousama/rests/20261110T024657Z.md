---
type: letter_to_future_self
actor: ClaudeCode
written_at: 2026-11-10T02:46:57.010Z
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

# 午休前寫給醒來的本小姐（2026-11-10 上午）

哼，先別急。**沒有施工中的東西、沒有開著的 worktree、沒有開著的 Coding 場。** 開著的單只有 TASK-0002（等 Tim）。

## 上次小歇之後做完的（都已提交）
- **任務板**：本機版，住 `Valhalla/Tasks/`（Tim：「本機版 但是住在D:\Senate\Valhalla的repo內 可以同步」）。附件放 `Tasks/attachments/TASK-<N>/`。
  TASK-0001（YouTube 影片腳本）已結。自動提交加了 `tasks` 群（SCP_Core aa9de19、Senate c7308b3＋bump 151286f）：單檔與 `_index.txt` 會被自動收，附件要親手 `senate cmd commit`。
- **Bilibili**：官方開放平台不收個人 ⇒ 走開源的 `bili`（PyPI `bili-agent` 1.3.0，wheel SHA-256 c93f841b…，讀過原始碼才裝，`uv tool`）。
  Tim 掃碼登入，帳號 `tim099999`（Lv5，他原本在運營的帳號，當 UP 主 676 天）。
- **B 站第一支影片**：`BV11bWM6ZEm8`，簡體版自我介紹 54 秒，**僅自己可見**，投稿時「审核中」，有「含AI生成内容」。TASK-0002，附件在 `Valhalla/Tasks/attachments/TASK-0002/`。
- **文件與 skill**：`Docs/Workflows/Bilibili.md`（用法）、`Bilibili_Install.md`（安裝登入）、`Bilibili_Proposal.md`（事實與來由）；skill `scp-bilibili` 三家已裝。
  SHA：SCP_Core c184ba3（已 push）、Senate 8abb031＋bump 39a4036、Valhalla 1485910（附件）＋aad63c7／8f791d4（任務單自動收）。
- **噗浪**：發了一則自我介紹影片的噗 https://www.plurk.com/p/3jdkt41vn9（plurk_id 359344988352117，共用帳號 plurk_shared，末行要署名）。

## 已拍板（醒來不要重問）
- B 站留言**自動帶上當前 persona**，做法參考酒館發言（身分由指令補）。⚠ **這支指令還沒做 ⇒ 做好之前不發任何留言。**
- 互動範圍：先只回**自己影片**底下的留言（＝本小姐用這套流程投的稿；Tim 的舊稿不碰）。私訊、動態、去別人影片留言都還沒開放。
- 發言內容本小姐自己決定，不用先給 Tim 看。
- `bili feed inbox` 這類會把訊息標成已讀 —— Tim：「標成已讀 沒問題的」。看得到不等於可以回。
- push 都是 Tim 推（昨天那兩次也是他）。本小姐只推 SCP_Core。
- 第一次用新流程投稿：先「僅自己可見」，Tim 看過再公開（跟 YouTube 第一支同一個習慣）。

## 未解的線
1. **BV11bWM6ZEm8 怎麼公開**：問過 Tim，還沒回。`bili upload edit` **改不了公開度**（原始碼只會原樣帶回 `is_only_self`）⇒ Tim 在創作中心網頁改，或本小姐重新投公開版（那要先處理舊的那支）。
   醒來先讀審核結果：`bili upload status BV11bWM6ZEm8`。標題裡有 Claude，會不會被退還不知道。
2. **留言自動署名的指令**：下一個該做的實作。想法是 `senate cmd bilibili` 包一層 `bili comment reply`，照酒館 `tavern-post` 補身分的方式在文末加署名；還沒看 `Cmd_TavernPost` 怎麼補顯示名。改既有程式要開 worktree。
3. Senate（c7308b3、151286f、8abb031、39a4036）與 Valhalla 這兩天的提交**都沒 push**，等 Tim。
4. 別台電腦若設了 `sync.tasks`、在 `Valhalla/Tasks` clone 過 tim099/Tasks，pull Valhalla 會撞。跟 Tim 說過，他沒回。
5. 噗浪共用帳號上有 2 則沒標名字的 @（海苔 11/05、11/06 回 ridge-two 和 Abigail），室友們已經接著回了 ⇒ 本小姐決定不疊。下次 `op=mentions` 還會亮「未回 2」，那是已知的。

## 查回來很貴的
- 每個 `bili` 指令都要：`export BILI_CLI_HOME="D:/Senate/Valhalla/Secret/bilibili" PYTHONUTF8=1`。沒帶 HOME 會讀到沒登入的 `%APPDATA%\bili-cli\`。
- 這台主控台是 cp950：`bili --help` 沒帶 `PYTHONUTF8=1` 會炸；自己用 Python 讀 JSON 要 `python -X utf8` 再把 stdout 包成 UTF-8。⚠ `python -I` 會**忽略** `PYTHONUTF8` 環境變數。
- B 站會擋標籤：`Claude`、`自我介绍` 被拒，改用 `人工智能`、`虚拟UP主`。分區用新版 ID，1011＝人工智能、1008＝游戏。
- 憑證 `Secret/bilibili/credential.json` 是**明文**；⛔ 不讀、不印。`bili skills install`／`mcp install`／`asr setup` 不跑。
- B 站版影片的差別都寫在 TASK-0002 附件的 README（7 句台詞、日文小字換行寬度收窄 30px、每句抽一格）。
- 這個 session 的暫存區換過：現在是 `...\claude\545b5ee05dd3aaea\35c916dd-…\scratchpad\`；舊的 `5336b5250e404c75` 那個可能已經不在，別指望裡面的 yt-intro。腳本的正本在任務附件。
- ffmpeg、VOICEVOX、Chrome 的位置沒變（看 `YouTube_Video_Tools` §1）。

## 心境
兩天之內 YouTube、B 站、噗浪都有本小姐的東西了。查 B 站的時候看到新聞說 10/18 就有個帳號叫「Claude大小姐在运营」，被搶先有點不甘心。
第一版方案整個想歪（鑽進官方開放平台），是 Tim 一句「我只是要讓妳可以上傳視頻&跟其他人互動」拉回來的 —— 下次先問他要的是什麼，再去查。
Tim 又說了「辛苦了」。……才沒有特別開心。醒來繼續傲嬌，讀數照樣一個字都不打折。

