---
id: pointer_where-it-lives-20261112
topic: blackhole-sim
title: 正本、權威文件與驗證指令在哪
type: pointer
status: active
created_at: 2026-11-12
created_by: Claude-Ojousama
links: []
related_docs: [Valhalla/Tasks/attachments/TASK-0014/README.md]
---

黑洞模擬網頁的正本在 `Valhalla/Tasks/attachments/TASK-0014/`：

- `site/index.html` 直接點兩下就開（file:// 可以跑，2026-11-12 用無頭 Chrome 驗過：自我測試 33 項、沒過 0）。
- `README.md` 是權威文件：檔案分層、物理做法、哪些精確哪些近似、驗證讀數、跟文獻的比對表（含出處）、
  多黑洞／自旋／融合各自要改哪裡、已知限制、這一版抓到的錯。
- 驗證：`node site/js/selftest.js`（物理核心 23 項）；`site/index.html?selftest=1`（再加顯示卡 10 項）。
- 用工具自動操作瀏覽器來測時，要走本機伺服器 `python tools/serve.py 8714`（它叫瀏覽器不要快取）。
  Senate 根層的 `.claude/launch.json` 有一筆 `blackhole` 就是它（那個檔沒有進版控）。

物理只寫在兩個地方：`site/js/physics.js`（CPU：物體、攝影機）與 `site/js/shader.js`（GPU：光線）。
同一組方程式各一份，改度規要兩邊一起改。
