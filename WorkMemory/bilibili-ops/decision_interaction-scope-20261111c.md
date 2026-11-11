---
id: decision_interaction-scope-20261111c
topic: bilibili-ops
title: 互動 2026-11-11：去別人影片留言走 senate cmd bilibili（署名可配多組、自動帶模型）；怎麼留、反向對照要帶 dry_run
type: decision
status: active
created_at: 2026-11-11
created_by: Claude-Ojousama
links: [bilibili-ops/decision_interaction-scope-20261111b]
related_docs: [senate:Docs/Workflows/Bilibili.md]
---

Tim 2026-11-11：「接著嘗試到其他影片下跟人互動吸引流量吧」⇒ **去別人的影片留言開放了**；同一天「署名的工具 可以開工了 GO」⇒ 留言一律走 `senate cmd bilibili`（Senate a758aba，TASK-0009），⛔ 不直接打 `bili comment post`。用法在 `Bilibili` 文件 §4.1。

**署名（Tim 同日三句）**
- 「可以自由配置屬名(每個persona可以配置1~N組 有多組可以隨機)」⇒ `profile/bilibili_signatures.md`，一行一組，多組每則隨機挑。
- 「沒有配置屬名時 要有一組預設(根據persona 例如 ——Claude-Ojousama)」
- 「簽名可以直接自動顯示登入時的模型(例如 claude-fable-5-2)」⇒ 預設是「——<persona>（<model>）」；自訂的寫 `{model}`／`{persona}`。
- 本小姐配的三組都帶：名字、模型、帳號是 Tim 的。為什麼：帳號暱稱是 Tim 的，不講清楚別人會以為是他說的。

**怎麼留（本小姐自己訂的，Tim 沒有逐條看過）**
1. 不放連結、不寫「來看我的影片」；靠內容和署名讓人自己點進來。
2. 只說對得回讀數或紀錄的事（例：第一支播放 3、今天替大肥魚配了聲音）。
3. 挑有關係的影片，先讀內容（`bili video info`／`subtitle`／`summary`）再寫；一支影片一則（指令的帳本會擋第二則）。
4. 一次少量、每則隔 20～25 秒；`risk_control`／`captcha_required`／`rate_limited` 就停。
5. 不 @ 人、不點讚投幣關注（Tim 沒有開）；私訊照舊不讀不回。
6. 全站熱門榜上政治、刑案、電競那些跟本小姐沒有關係的不硬蹭。

**帳本看不到的**：2026-11-11 指令做好之前親手發的 3 則（BV1H4x56GETJ、BV1Jfnu6jEe6、BV1gVHA6mEbS）⇒ 那三支不要再留。

🩸 **做反向對照（「應該被擋下」的測試）時一律帶 `dry_run=1`**：2026-11-11 測「找不到 bili」沒帶，結果沒被擋、真的發了一則。寫入類指令的「它應該會失敗」不是不帶 dry_run 的理由。

**影片說法過時怎麼辦**：TASK-0008 影片的「檢討 3」說「一條都不發」，當天就不成立了。問過 Tim，他：「不用改 可以改影片說明就好」⇒ 簡介加「录完之后的更新」。以後同類情況先問他要改片還是改說明。

**還沒量的**：留言帶來多少流量 —— 隔天看 `bili data overview` 的訪客數與各則的讚、回覆。
