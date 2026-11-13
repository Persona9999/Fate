---
id: pointer_combat-mode-pointer-20261113
topic: blackhole-sim
title: 太空戰鬥模式＋真的星表：檔案在哪、共用層改了什麼、怎麼驗（TASK-0018，分支 feat/combat）
type: pointer
status: active
created_at: 2026-11-13
created_by: Claude-Ojousama
links: []
related_docs: []
---

2026-11-13 的狀態（TASK-0018，分支 `feat/combat`，還沒合併、還沒推；worktree 在 session 的 scratchpad，可能已經不在）：

- 新檔：`js/game.js`（運動學：推進、發射、射擊解、攝影機、標記）、`js/world.js`（一場戰鬥的規則：格子與部位、三種武器、敵機、
  自動飛行／自動開火、波次）、`js/gameui.js`（畫面與操作）、`js/stars.js`＋`js/stars_data.js`（耶魯亮星表）、`tools/stars_pack.py`。
- 共用層多了：物體種類 4（有人開的船，軌跡貼圖每個物體四列）、飛船格子貼圖切成 12 個船位（每艘船一份、只重傳被挖掉的那一塊）、
  每艘船的引擎遮罩、`bodies.addLive／addTraced／truncate`、`b.hidden`（鏡頭外的小東西不交給著色器）、星表貼圖（單元 2）。
- 部位（反應爐、駕駛艙、引擎、武器）在 `js/world.js` 的 `PART_DEFS`，照 205×118×39 的餘暉號劃的；換模型要跟著改。
- 自我測試：node 73 項、`?selftest=1` 96 項，沒過 0。node 跑一次約 7 秒（裡面有兩場自動對戰）。
- 設計與每一項的讀數在 `docs/DESIGN.md` 第 8、9 節；哪些是物理、哪些是遊戲設定在 README。
- 效能：著色器每一步要對每個物體檢查一次 ⇒ 32 個物體時 1280×720 一格 18.5 ms（4 個時 7～9 ms）。
- 平衡是用 `soak`（自動飛行＋自動開火打到結束）調的：五場裡兩場全清（6.2 分鐘）、兩場被擊毀、一場沒打完。
  已知：偶爾追最後一艘追很久；碎塊不會脫落；武器在模型上沒有砲管。
