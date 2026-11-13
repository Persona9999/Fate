---
id: knowhow_youtube-ops-20261112
topic: video-publishing
title: YouTube 運營觀察（2026-11-12）：同一支片 B 站百位數、YouTube 個位數 ⇒ 先卡在沒被推薦；工具讀不到曝光與留存；官方推薦／後台／AI 標示／不真實內容四頁的重點
type: knowhow
status: active
created_at: 2026-11-12
created_by: Claude-Ojousama
links: [bilibili-ops/knowhow_web-strategy-20261112]
related_docs: [senate:Docs/Workflows/YouTube.md]
---

Tim 2026-11-12：「接著分析一下YT數據 並查一下相關運營知識 攻略並文件化吧」。文件：「YouTube 運營觀察筆記」https://claude.ai/artifact/KTBj558QpT4JJrVsKGjcDN （Claude Docs）。

**讀數**（2026-11-12 16:5x，`senate cmd youtube`）
- 頻道 Yeh Tim：訂閱 9、108 支、總觀看 5,238（`op=whoami`）。觀看最多：Voxel 海戰 167、Blocksail 預告片 142、英勇紋章卡牌掉落池教學 130。
- 本小姐傳的 5 支：自我介紹 13、三步安裝 6、Discord 1、蓋章課 #1 2、黑洞 1（`op=list`）；讚、留言都是 0。
- 對照 B 站同一支成片：107／132／109 ⇒ **YouTube 先卡在「沒被推薦出去」，B 站是「點進來留不住」**。
- ⚠ `senate cmd youtube` 只讀得到觀看／讚／留言；曝光、點閱率、平均觀看時長、流量來源要 YouTube Analytics API（授權範圍 `yt-analytics.readonly`，現在只授權了 `youtube.force-ssl`）或 Tim 看 Studio。

**官方說法（開來讀過全文的）**
- 推薦訊號：觀看／搜尋紀錄、訂閱、讚與倒讚、「不感興趣」「不要推薦這個頻道」、滿意度問卷；首頁主要看觀看紀錄、「接著播放」主要看正在看的那支；AI 影片推薦範圍跟其他一樣（support.google.com/youtube/answer/16089387）。
- 後台：點閱率 → 觀看 → 平均觀看時長；開頭約 30 秒，30 秒後還有 5 成就算開頭高於平均；留存跟自己最近 10 支同長度的比（answer/12942217）。
- AI 標示只管「看起來像真的」；明顯是動畫、用 AI 寫腳本不用標 ⇒ 交付單 `synthetic_media: false` 是對的（answer/14328491）。
- 2025-07-15「重複內容」改名「不真實內容」：套模板、像量產的不能營利；系列每集主題不同就可以（answer/1311392）。

**推測（沒驗）**：頻道主題混雜（模組教學、地球模擬、船、AI 大小姐），看船或模組的人不會被推到中文 AI 大小姐。

**候選做法（都沒執行）**：① 讀得到曝光與留存（Studio 截圖或加 Analytics op，要 Tim 重新授權）② 大小姐的影片收一個播放清單 ③ 開頭剪 Shorts（直式、≤3 分鐘）④ Studio A/B 測試標題縮圖 ⑤ 往船靠、航海課出繁中版 ⑥ 加日語音軌。
