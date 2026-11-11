---
id: decision_interaction-scope-20261111b
topic: bilibili-ops
title: 互動範圍 2026-11-11：可以去別人的影片留言（親手署名、不放連結、一次少量）；影片說法過時 ⇒ Tim 選改簡介
type: decision
status: superseded
created_at: 2026-11-11
created_by: Claude-Ojousama
links: [bilibili-ops/decision_interaction-scope-20261111, bilibili-ops/decision_interaction-scope-20261111c]
related_docs: [senate:Docs/Workflows/Bilibili.md]
---

Tim 2026-11-11：「接著嘗試到其他影片下跟人互動吸引流量吧」⇒ **去別人的影片留言開放了**。這一筆取代 `decision_ops-direction` 第 11 條「互動範圍沒有變」那一句，以及 `Bilibili` 文件 §4 表裡「去别人的影片留言 ⛔」那一格。

**怎麼做（本小姐自己訂的，Tim 沒有逐條看過）**
1. **每一則末行親手署名**：`——Claude-Ojousama（AI persona，借 Tim 的账号发言）`。
   為什麼：Tim 11-10 定的是「留言自動帶上當前persona」，那支指令還沒做；帳號暱稱是 Tim 的，不署名別人會以為是 Tim 說的。指令做好之後改由指令補。
2. **不放連結、不寫「來看我的影片」**。靠內容和署名讓人自己點進來；貼連結的留言會被當成引流折疊，也違反「不洗留言」。
3. **只說真的**：留言裡的數字、經歷都要對得回讀數（例：第一支播放 3）。
4. **挑有關係的影片**（Claude大小姐、大肥魚、AI 運營帳號這幾類；之後加風帆戰艦、體素遊戲），先 `bili video info` 看過內容再寫，一支影片只留一則。
5. **一次少量**：11-11 試了 3 則，每則隔 20 秒。流程：寫檔 → `bili --dry-run comment post <BV> --file` → 真的發 → `bili comment check <BV> <rpid>` 讀回 visible／folded／hidden。
6. 遇到 `risk_control`／`captcha_required`／`rate_limited` 照 `Bilibili` 文件 §5-3 停。
7. 不 @ 人、不點讚投幣關注（那些 Tim 沒有開）；私訊照舊不讀不回。
8. 回自己稿件底下的留言：照同一個署名做法可以回（Tim 11-10 本來就說可以先回自己影片的留言，卡的只是署名）。

**還沒量的**：留言帶來多少流量 —— 隔天看 `bili data overview` 的訪客數與各則留言的讚、回覆（`bili comment replies`）。

**跟 TASK-0008 那支影片的衝突（已處理）**：影片的「檢討 3」說「署名的工具沒做好之前，一條都不發」；11-11 起已經在發了（親手署名）。
Tim 2026-11-11：「不用改 可以改影片說明就好」⇒ 影片不重錄，簡介加了一段「录完之后的更新」說明那句話現在不成立（`bili upload edit` 讀回確認）。
⇒ 以後影片裡的說法跟現況對不上時，先問 Tim 要改片還是改說明；他這次選的是改說明。
