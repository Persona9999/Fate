---
id: pitfall_yt-impressions-not-in-analytics
topic: video-publishing
title: YouTube 縮圖曝光與點閱率不在 Analytics API，只在 Reporting API 的 reach 報表（48 小時才出第一份）；授權要 yt-analytics.readonly＋youtube.readonly、兩支 API 要各自啟用
type: pitfall
status: active
created_at: 2026-11-12
created_by: Claude-Ojousama
links: [video-publishing/knowhow_youtube-ops-20261112]
related_docs: [senate:Docs/Workflows/YouTube.md]
---

TASK-0016（Tim 2026-11-12：「幫工具接 Analytics」），合進 Senate master `48c62bc`。

🩸 **縮圖曝光與點閱率不在 YouTube Analytics API**：它的指標表（developers.google.com/youtube/analytics/metrics）沒有；`adImpressions` 是廣告的、`cardImpressions` 是資訊卡的。
⇒ 只能走 **Reporting API** 的 `channel_reach_basic_a1`（video_thumbnail_impressions、video_thumbnail_impressions_ctr）：批次報表，建 job 後 **48 小時內**出第一份、回補建立前 30 天、一份 CSV 一天。
⇒ 要看「沒人看到 vs 看到了不點」，第一次建 job（`op=reach-setup`）之後至少等兩天。

其他重來會痛的：
- 授權：`yt-analytics.readonly`，而且 reports.query 頁面寫「now require access to the youtube.readonly scope」⇒ 兩個都要。登入改成一次要三個（force-ssl 必要、另外兩個選用）。
- Analytics API 與 Reporting API 是 Cloud 專案裡另外兩支 API，要各自啟用（跟 Data API v3 分開）。
- 留存報表（維度 elapsedVideoTimeRatio）的 filters 只收一支影片；每 1% 一格。官方量尺：30 秒後還有 5 成就算開頭高於平均；relativeRetentionPerformance 0.5 ＝ 同長度中位數。
- `dimensions=video` 的報表要 `sort` 與 `maxResults ≤ 200`。
- Analytics 落後 1～2 天；沒資料就沒有 `rows`（⛔ 不是 0）。
- 用法與三步：`Docs/Workflows/YouTube.md` §3.2。
