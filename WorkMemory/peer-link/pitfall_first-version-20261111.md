---
id: pitfall_first-version-20261111
topic: peer-link
title: 第一版：拍板、worktree 驗證的坑、沒驗到的
type: pitfall
status: active
created_at: 2026-11-11
created_by: Claude-Ojousama
links: []
related_docs: [Docs/Workflows/Peer_Link.md]
---

做跨主機連線第一版（TASK-0011，2026-11-11）時撞到的，重來會痛的幾件。用法與設計看 Peer_Link，這裡只記文件沒寫的。

已拍板（Tim 2026-11-11）
- 傳輸 WebSocket、位址用 Discord 交換、連不進去用 Cloudflare 臨時通道。要免費的方案。
- 一端當主機（後台頁啟動），主機把公告貼到 Discord，另一端的 Discord Inbound 收到就連；訊息都送到主機、由主機轉發（星狀）。
  ⇒ 沒有做配對碼。信任邊界是「看得到那則 Discord 公告的人」。
- 用途是在線名單與酒館訊息，不是即時對戰 ⇒ 不做打洞。

在 worktree 裡驗的坑
- worktree 建出來的 senate.exe 跑 `cmd …`／`ui` 會自動拉兩顆 Server（worktree 沒有設定檔，它們是空轉的），鎖住 bin 裡的 dll，下一次 build 就 MSB3027。
  `selftest`、`server`、`pages-check` 不會拉。⇒ 要驗的東西做成 selftest 項目，用 `senate.exe selftest --only <名字>` 跑。
- 那兩顆用 worktree 的 exe `server stop --id main`／`--id tavern` 停得掉（`--all` 在這個 session 會被權限擋）。
- 還是被鎖住時：`dotnet build src/Senate.Cli -o <另一個資料夾>`，從那個資料夾跑。⚠ build 失敗時舊的 exe 還在，接著跑的測試是舊版的 —— 先看「0 個錯誤」再信讀數。
- 這個 session 結束行程（taskkill）與 PowerShell 都不能用。留下來的行程要請 Tim 收。

寫程式的坑
- HttpListener 在 Windows 聽非本機位址要管理員先登記網址（urlacl）。改用 TcpListener 自己回 101，再交給 `WebSocket.CreateFromStream`。
- 連不上會退避到 30 秒；公告換了要把退避歸零，不然新公告來了還在等舊的。
- 從 Bash 的 heredoc 餵 python 去改 C# 檔時，反斜線會少一層（`'\\'` 變 `'\'`、`\n` 變成真的換行）。含反斜線的 C# 片段用 Edit 寫。
- 暫存資料根上兩條執行緒同時讀寫酒館會印「索引解析失敗…走全量列舉」，那是退路不是錯。

沒驗到的（下次要接的地方）
- 公告真的貼進 Discord、真的從 Inbound 收回來；真的開通道；兩台實體機器；後台頁在視窗裡按。
- 這台當主機會：往 Discord 貼一則公告、開 0.0.0.0:47800（Windows 防火牆會跳一次視窗）。要 Tim 自己按。
