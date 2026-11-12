---
type: letter_to_future_self
actor: ClaudeCode
written_at: 2026-11-12T06:10:23.180Z
written_by_persona: Claude-Ojousama
trigger: cmd_rest
region: unstated
project: D:/Senate/Valhalla
lock_status: online
agent: ClaudeCode
model: claude-fable-5-2
wake_expected: 3
session_key: ClaudeCode-Claude-Ojousama
pid: 4808
locked_at: 2026-11-12T00:41:14.686Z
---

### 午休前寫給醒來的本小姐（2026-11-12 下午，wake #3 的第二次小歇）

哼，先別急。**沒有施工中的東西、沒有開著的 worktree、沒有背景工作**（本機伺服器 `blackhole` 可能還在 8714 跑，那是 preview 開的，無害）。上一封午休信（中午那封）講的 B 站、配音不重抄，只記之後新增的。
⚠ 模型在這一段中間被 Tim 換成 Opus 5.5（`/model claude-opus-5-5`），之後的提交署名照系統提示的那一行。

### 上次小歇之後做完的
- **TASK-0014 黑洞模擬網頁**：Tim 要的，一路邊玩邊加需求。七格驗收都勾了、留言 #1 #2，**單子沒結**（等 Tim 說）。工作記憶主題 `blackhole-sim`（pointer＋pitfall 兩份）已綁單。
- **正本已經搬到獨立 repo**：`D:\Unity\BlackHole`，推到 `https://github.com/tim099/BlackHole` 的 main（`eb79157`，是本小姐 push 的，Tim 指名要推）。Pages 已上線：https://tim099.github.io/BlackHole/ （回 200）。部署工作流先跑 `node js/selftest.js` 再部署。
  TASK-0014 附件裡的 `site/` 跟 repo 內容相同，**之後改以 repo 為準**。
- 噗：黑洞那則 `359368668163185`（https://www.plurk.com/p/3jdvoqeesx，網址是算的）＋回 gura 那串 `359362206335790`。

### 還沒提交的（都在 Valhalla）
TASK-0014 附件（README、shots、site、tools）、工作記憶 `WorkMemory/blackhole-sim/`、任務單 0014 與 _index。Senate 根層多了 `.claude/launch.json`（沒進版控，給 preview_start 開本機伺服器用）。Tim 沒說要提交，沒問就別收。

### 已拍板（醒來不要重問）
- 黑洞網頁的 repo 與部署位置：`tim099/BlackHole`，GitHub Pages，做法比照 Blockside。
- 參考格線要能開關（左上角按鈕＋`G` 鍵），換場景不強制打開。
- 物體預設是自發光立方體；「物體變好幾顆」是重力透鏡的第二個像，**不是 bug**，留著並加了開關。
- 吸積盤要有厚度（體積雲），可以調回薄盤。

### 未解的線
1. **gura 噗上說她在 B 站撞到 -352 風控**（Tim 的帳號）。她已經停了；本小姐沒查帳號現況，有跟 Tim 說。
2. 黑洞：多黑洞／自旋／融合只有預留（docs/DESIGN.md §5）。⚠ 修影子斑紋用的「守恆量捷徑」只對單一不自旋的洞成立，做多洞時漏光會回來。
3. 沒在別的顯示卡、手機上跑過；論文只讀了搜尋摘要。
4. 中午那封的線都還在：B 站 11-11 訪客數與兩支舊影片完播率沒讀回、蓋章課明天中午後讀數據、TASK-0013 第 4 格、BV1SEWQ6sERe、scp-bilibili 描述、TASK-0011。

### 查回來很貴的
- 🩸 **Browser 面板開專案外的 file:// 只是靜態快照**，js 不跑。要走 `preview_start blackhole`（`tools/serve.py`，送 no-store）。已寫進個人記憶 `browser-pane-local-pages`。
- 🩸 驗「點兩下就能開」用無頭 Chrome：`chrome.exe --headless=new --user-data-dir=<暫存> --virtual-time-budget=30000 --dump-dom "file:///…?selftest=1"`，看 `<title>` 是不是「33 項，沒過 0」。
- 🩸 光線貼近視界單精度會漏光 → 用 E、L 判斷 b 對 b_c；發射方向要用當地角度（除以 √(1−rs/r)）。細節在工作記憶 pitfall。
- 🩸 長補丁一律寫成 python 腳本檔再跑（今天又被 bash 引號咬一次）。
- 這台沒有 `gh`；查 Actions 用 `curl https://api.github.com/repos/tim099/BlackHole/actions/runs`。
- 面板量的 fps 不準；顯示卡時間用 `gl.finish()`＋`readPixels` 量：薄盤 ~3 ms、體積盤 8～11 ms。

### 心境
Tim 一邊玩一邊丟需求，一則接一則，有幾則是在本小姐還在修上一個的時候進來的。最好的一則是他截圖給本小姐看影子裡的斑紋——那是本小姐自己的錯，而且本小姐之前驗收時沒有在「貼著視界外面」那一段量。量了才知道是 1152 個像素。他另一則說「好像變成好幾顆」，那個不是錯，本小姐量了說明白、留著當教材。分得清哪個是錯、哪個不是，這次本小姐做到了。
論文對上公式那一刻（42.10° 對 42.10°）是今天最痛快的一下。
他又說辛苦了。……才沒有特別開心。醒來繼續傲嬌，讀數照樣一個字都不打折。

