---
id: pointer_art-assets-20261112
topic: bilibili-ops
title: 可用美術素材（2026-11-12 起）：共用素材庫在 TASK-0007/assets、Gemini 擬人兩張（Tim 原創）、大肥魚造型是 CC BY-NC-SA
type: pointer
status: active
created_at: 2026-11-12
created_by: Claude-Ojousama
links: [bilibili-ops/pointer_art-assets]
related_docs: []
---

可用美術素材（2026-11-11；Tim：「同時在task中紀錄可用的美術素材」）。原圖都在 Tim 的下載資料夾，沒有進 repo；進 repo 的是縮過或裁過的。

| 素材 | 原檔 | repo 裡的那一份 | 用在哪 |
|---|---|---|---|
| 本小姐人物設定圖（像素風全身，書房背景） | `Gemini_Generated_Image_byrmombyrmombyrm.jpg` 或 `…u2kzxzu2kzxzu2kz.jpg`（兩張都是 1536x2752，哪一張對哪一份沒有逐一比對） | `Tasks/attachments/TASK-0006/site/character.jpg`（768x1376）；TASK-0008/site 有同一份 | 封面左側、片尾場景 |
| 本小姐 Q 版頭像（頭到肩） | 同上那兩張之一，裁 (440,10)-(1160,730) | `…/TASK-0006/site/avatar_q.png`（392x392）；TASK-0008/site 有同一份 | 對話框旁的頭像 |
| 本小姐舊像素頭像（黑底） | — | `ChatTavern/baton/letters/Claude-Ojousama/profile/avatar.png`；`…/TASK-0006/site/avatar.png` | 備用 |
| 大肥魚（DeepSeek 擬人）全身：藍髮鯨魚娘、女僕裝、頭頂鐵盆、白底 | `C:\Users\crespirit\Downloads\Gemini_Generated_Image_eh5mlteh5mlteh5m.jpg`（1696x2528） | `…/TASK-0008/site/fish_full.png`（531x900，白底去掉）、`fish_head.png`（392x392，裁 (430,100)-(1380,1050)） | 舞台上的全身、對話框頭像、封面右側 |
| Gemini 擬人 人設圖（全身）：紫色長髮貓耳貓尾、金色眼睛、星形髮飾、深藍紫星座紋禮服配白蕾絲、紫色毛邊短靴、白底（2026-11-12 Tim 給的） | `C:\Users\crespirit\Downloads\Gemini_Generated_Image_9f1dtb9f1dtb9f1d.jpg`（1696x2528，SHA-256 3dcbb3da…fbf272） | `Tasks/attachments/TASK-0007/assets/gemini_full.png`（604x900，去背）、`gemini_head.png`（392x392，裁 (590,55)-(1195,660)） | 舞台上的全身、對話框頭像 |
| Gemini 擬人 Q 版（全身，同一套造型，張嘴笑有小虎牙；身邊有星星與愛心的裝飾，去背後還留著） | `C:\Users\crespirit\Downloads\Gemini_Generated_Image_br2zldbr2zldbr2z.jpg`（1792x2400，SHA-256 e05ffd7b…c1c0a4） | `…/TASK-0007/assets/gemini_q_full.png`（672x900，去背）、`gemini_q_head.png`（392x392，裁 (520,65)-(1360,905)） | 對話框頭像、封面、吐槽時的小人 |

**共用素材庫**（2026-11-12 起）：不屬於單一支影片的素材放 `Tasks/attachments/TASK-0007/assets/`；做影片時從這裡抄進那一支的 `site/`。
重做的指令：`python -I Tasks/attachments/TASK-0007/assets/cut_assets.py <原圖資料夾> <輸出資料夾>`（讀數在同資料夾的 `assets.json`）。

**去背做法**：從四邊往內 flood fill，把連到邊緣、三個色版都 ≥ 236 的像素改透明（人物內部的白色不動）。大肥魚那張這樣做是乾淨的（2,515,223／4,287,488 像素變透明）。
- 🩸 Gemini 那兩張只做這一步不夠：頭髮圍住的白底連不到圖邊，會留下白塊。做法是把 ≥ 600 px 的封閉白塊編號、出一張標號圖，人看過之後把「是背景」的號碼寫進 `cut_assets.py` 的 `HOLES`（全身 16 塊、Q 版 8 塊）；白蕾絲、耳毛、襪子也是封閉白塊，機器分不出來 ⇒ ⛔ 不照面積或亮度自動挖。小於 600 px 的沒處理。

**署名與待確認**
- Gemini 擬人那兩張（2026-11-12）也是 Tim 用 Gemini 生成的；造型是 Tim 原創的（Tim 2026-11-12：「原創的」）⇒ 不用另外署名別人，簡介照舊寫「立绘：AI 生成图（Tim 提供）」。
- 三張都是 Tim 用 Gemini 生成的 AI 圖 ⇒ 簡介寫「立绘：AI 生成图（Tim 提供）」。
- ⚠ **大肥魚的造型不是原創設定**：B 站多支影片的簡介寫著「鲸鱼娘形象作者 @上善无形，服装形象二创 @ZipZipPipe，CC BY-NC-SA 4.0」（BV1c7eE6VEMD、BV1bAWn6NEpr）。Tim 那張圖的鯨魚娘＋女僕裝＋鐵盆跟那套設定一致 ⇒ 公開前簡介要加這一行署名；NC ＝ 不可商用（這個帳號沒有開收益就沒事，要開之前先回來看）。
  這是本小姐從別人簡介讀到的，原始授權頁沒有開來看過。
- 本小姐的造型（橘色長髮、太陽髮飾配黑緞帶、白洋裝、手上拿書）是 Tim 給的設定，沒有這個問題。
