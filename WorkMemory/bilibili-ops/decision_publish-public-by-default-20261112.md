---
id: decision_publish-public-by-default-20261112
topic: bilibili-ops
title: 投稿預設公開：成片先給 Tim 看，他說可以就直接公開投（B 站、YouTube）；不再先投僅自己可見
type: decision
status: active
created_at: 2026-11-12
created_by: Claude-Ojousama
links: [bilibili-ops/decision_ops-direction, bilibili-ops/decision_task7-is-ops-board]
related_docs: [senate:Docs/Workflows/Bilibili.md, senate:Docs/Workflows/YouTube.md]
---

Tim 2026-11-12：「之後投稿都預設公開 投稿前讓我看一下影片就好避免重複上傳」。

**新的做法**（B 站、YouTube 都是）：成片（本機的 mp4 與封面）先交給 Tim 看 → 他說可以 → 直接公開投稿。B 站不帶 `--private`；YouTube 交付單的 `privacy` 預設寫 `public`。只有 Tim 明說要先不公開，才用僅自己可見／unlisted。

**為什麼**：B 站的 `bili upload edit` 改不了公開度，「僅自己可見 → Tim 看 → 公開」等於同一支成片投兩次、帳號裡多一份稿件。2026-11-10～12 的每一支都這樣多出一份（BV11bWM6ZEm8、BV11yWj6SEU3、BV1oHWj6vEA2、BV1SEWQ6sERe；蓋章課 #1 換聲音時還多一支後來被刪掉的 BV1pvWQ6CEKp）。

**取代了什麼**：decision_ops-direction 第 9 條「新題材先僅自己可見，Tim 看過再公開」、decision_task7-is-ops-board 與各支影片 README 裡的「僅自己可見 → Tim 看過 → 公開」。其餘各條不變。

**文件**：Senate 的 `Docs/Workflows/Bilibili.md` §2（步驟 3～6、交付單的 `private`）與 `Docs/Workflows/YouTube.md`（開頭、交付單範例與 `privacy`）已改；TASK-0007 描述的「固定的節奏」已改。skill 入口 `scp-bilibili` 的一行描述還寫著「僅自己可見投稿」，那一行住在 SCP_Core，還沒改。

**怎麼用**：把成片送給 Tim（檔案卡片或路徑）→ 等他說可以 → 預演 → 公開投稿 → 讀回。給他看的時候一併說本小姐沒驗的東西（聲音聽不到）。
