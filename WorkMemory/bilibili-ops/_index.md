# 工作記憶索引 — bilibili-ops

> 機械生成（work_memory.py index）— 手改會被覆寫。事實源 = 各 fragment 檔。

## decision
- **decision_interaction-scope-20261111c** — 互動 2026-11-11：去別人影片留言走 senate cmd bilibili（署名可配多組、自動帶模型）；怎麼留、反向對照要帶 dry_run  ↔ bilibili-ops/decision_interaction-scope-20261111b
- **decision_ops-direction** — 運營方向：主角是角色、檢討會系列、中文語音、哪些梗不碰
- **decision_task7-is-ops-board** — TASK-0007 是長期開著的運營總單：計畫寫在它的描述裡，影片與工具開子單掛上去
- **decision_interaction-scope-20261111** — 互動範圍 2026-11-11：可以去別人的影片留言（親手署名、不放連結、一次少量） ~~[superseded]~~  ↔ bilibili-ops/decision_ops-direction, bilibili-ops/decision_interaction-scope-20261111b
- **decision_interaction-scope-20261111b** — 互動範圍 2026-11-11：可以去別人的影片留言（親手署名、不放連結、一次少量）；影片說法過時 ⇒ Tim 選改簡介 ~~[superseded]~~  ↔ bilibili-ops/decision_interaction-scope-20261111, bilibili-ops/decision_interaction-scope-20261111c

## knowhow
- **knowhow_baseline-20261111** — 數據基準 2026-11-11：帳號、稿件、參考對象的讀數（附哪一支指令）
- **knowhow_claude-scan-20261111** — Claude 相關影片掃描（2026-11-11）：各關鍵字量級、同類帳號、新梗、第三輪留言 5 則
- **knowhow_memes** — Claude大小姐／大肥魚的梗：來源 BV 號、可以用的、不用的  ↔ bilibili-ops/decision_ops-direction

## pitfall
- **pitfall_chinese-voice-edge-tts-731** — 中文語音：edge-tts 7.3.1 能用（7.2.8 回 403）、混音增益、大肥魚的社群聲音模型要 Tim 自己裝  ↔ bilibili-ops/pitfall_chinese-voice
- **pitfall_chinese-voice** — 中文語音：edge-tts 7.2.8 回 403、大肥魚的社群聲音模型要 Tim 自己裝 ~~[superseded]~~  ↔ video-publishing/pitfall_wrapup-0006-202611100724, bilibili-ops/pitfall_chinese-voice-edge-tts-731

## pointer
- **pointer_art-assets** — 可用美術素材：原檔位置、repo 裡的那一份、用途、署名（大肥魚造型是 CC BY-NC-SA）
