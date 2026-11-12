# 工作記憶索引 — bilibili-ops

> 機械生成（work_memory.py index）— 手改會被覆寫。事實源 = 各 fragment 檔。

## decision
- **decision_interaction-scope-20261111c** — 互動 2026-11-11：去別人影片留言走 senate cmd bilibili（署名可配多組、自動帶模型）；怎麼留、反向對照要帶 dry_run  ↔ bilibili-ops/decision_interaction-scope-20261111b
- **decision_ops-direction** — 運營方向：主角是角色、檢討會系列、中文語音、哪些梗不碰
- **decision_publish-public-by-default-20261112** — 投稿預設公開：成片先給 Tim 看，他說可以就直接公開投（B 站、YouTube）；不再先投僅自己可見  ↔ bilibili-ops/decision_ops-direction, bilibili-ops/decision_task7-is-ops-board
- **decision_stamp-class-series-20261112** — 第三條影片線『蓋章課』：Gemini 講、大肥魚問、本小姐蓋章（實錘／假說／腦洞）—— 形式與系列名是本小姐訂的，Tim 還沒明說  ↔ bilibili-ops/decision_ops-direction
- **decision_task7-is-ops-board** — TASK-0007 是長期開著的運營總單：計畫寫在它的描述裡，影片與工具開子單掛上去
- **decision_voices-20261112** — 現行配音（2026-11-12 Tim 定）：本小姐＝edge-tts Vivienne、Gemini＝本機 Qwen3-TTS 的 Sohee、大肥魚不動；正本在 TASK-0013 的 VOICE_SETUP.md；Qwen 要送簡體字、念完要用 Whisper 聽寫檢查  ↔ bilibili-ops/knowhow_voice-auditions-20261112, bilibili-ops/knowhow_bilingual-three-voices-20261112
- **decision_interaction-scope-20261111** — 互動範圍 2026-11-11：可以去別人的影片留言（親手署名、不放連結、一次少量） ~~[superseded]~~  ↔ bilibili-ops/decision_ops-direction, bilibili-ops/decision_interaction-scope-20261111b
- **decision_interaction-scope-20261111b** — 互動範圍 2026-11-11：可以去別人的影片留言（親手署名、不放連結、一次少量）；影片說法過時 ⇒ Tim 選改簡介 ~~[superseded]~~  ↔ bilibili-ops/decision_interaction-scope-20261111, bilibili-ops/decision_interaction-scope-20261111c

## knowhow
- **knowhow_baseline-20261111** — 數據基準 2026-11-11：帳號、稿件、參考對象的讀數（附哪一支指令）
- **knowhow_bilingual-three-voices-20261112** — 雙語影片（簡體＋繁中）與三個聲音：?lang= 產線、第三個聲音用台灣腔、蓋章時間表、判定要分『查到的』與『未另查』  ↔ bilibili-ops/pitfall_chinese-voice-edge-tts-731
- **knowhow_claude-scan-20261111** — Claude 相關影片掃描（2026-11-11）：各關鍵字量級、同類帳號、新梗、第三輪留言 5 則
- **knowhow_memes** — Claude大小姐／大肥魚的梗：來源 BV 號、可以用的、不用的  ↔ bilibili-ops/decision_ops-direction
- **knowhow_tts-options-20261112** — 配音的選項（2026-11-12）：同類帳號用 GPT-SoVITS／Qwen3-TTS；edge-tts 只有語速音高音量；Qwen3-TTS 本機的條件（6 GB 顯卡只放得下 0.6B、套件釘死 transformers 版本要獨立環境）  ↔ bilibili-ops/pitfall_chinese-voice-edge-tts-731, bilibili-ops/knowhow_bilingual-three-voices-20261112
- **knowhow_voice-auditions-20261112** — 配音試聽四輪（2026-11-12）：本小姐定 G5（Vivienne）；Qwen3-TTS 0.6B 本機實跑的條件與坑（float16 會炸）；VOICEVOX 用片假名＋改音高說中文的做法  ↔ bilibili-ops/knowhow_tts-options-20261112

## pitfall
- **pitfall_chinese-voice-edge-tts-731** — 中文語音：edge-tts 7.3.1 能用（7.2.8 回 403）、混音增益、大肥魚的社群聲音模型要 Tim 自己裝  ↔ bilibili-ops/pitfall_chinese-voice
- **pitfall_chinese-voice** — 中文語音：edge-tts 7.2.8 回 403、大肥魚的社群聲音模型要 Tim 自己裝 ~~[superseded]~~  ↔ video-publishing/pitfall_wrapup-0006-202611100724, bilibili-ops/pitfall_chinese-voice-edge-tts-731

## pointer
- **pointer_art-assets-20261112** — 可用美術素材（2026-11-12 起）：共用素材庫在 TASK-0007/assets、Gemini 擬人兩張（Tim 原創）、大肥魚造型是 CC BY-NC-SA  ↔ bilibili-ops/pointer_art-assets
- **pointer_art-assets** — 可用美術素材：原檔位置、repo 裡的那一份、用途、署名（大肥魚造型是 CC BY-NC-SA） ~~[superseded]~~  ↔ bilibili-ops/pointer_art-assets-20261112
