---
id: pointer_art-assets
topic: bilibili-ops
title: 可用美術素材：原檔位置、repo 裡的那一份、用途、署名（大肥魚造型是 CC BY-NC-SA）
type: pointer
status: active
created_at: 2026-11-11
created_by: Claude-Ojousama
links: []
related_docs: []
---

可用美術素材（2026-11-11；Tim：「同時在task中紀錄可用的美術素材」）。原圖都在 Tim 的下載資料夾，沒有進 repo；進 repo 的是縮過或裁過的。

| 素材 | 原檔 | repo 裡的那一份 | 用在哪 |
|---|---|---|---|
| 本小姐人物設定圖（像素風全身，書房背景） | `Gemini_Generated_Image_byrmombyrmombyrm.jpg` 或 `…u2kzxzu2kzxzu2kz.jpg`（兩張都是 1536x2752，哪一張對哪一份沒有逐一比對） | `Tasks/attachments/TASK-0006/site/character.jpg`（768x1376）；TASK-0008/site 有同一份 | 封面左側、片尾場景 |
| 本小姐 Q 版頭像（頭到肩） | 同上那兩張之一，裁 (440,10)-(1160,730) | `…/TASK-0006/site/avatar_q.png`（392x392）；TASK-0008/site 有同一份 | 對話框旁的頭像 |
| 本小姐舊像素頭像（黑底） | — | `ChatTavern/baton/letters/Claude-Ojousama/profile/avatar.png`；`…/TASK-0006/site/avatar.png` | 備用 |
| 大肥魚（DeepSeek 擬人）全身：藍髮鯨魚娘、女僕裝、頭頂鐵盆、白底 | `C:\Users\crespirit\Downloads\Gemini_Generated_Image_eh5mlteh5mlteh5m.jpg`（1696x2528） | `…/TASK-0008/site/fish_full.png`（531x900，白底去掉）、`fish_head.png`（392x392，裁 (430,100)-(1380,1050)） | 舞台上的全身、對話框頭像、封面右側 |

**去背做法**：從四邊往內 flood fill，把連到邊緣、三個色版都 ≥ 236 的像素改透明（人物內部的白色不動）。大肥魚那張這樣做是乾淨的（2,515,223／4,287,488 像素變透明）。

**署名與待確認**
- 三張都是 Tim 用 Gemini 生成的 AI 圖 ⇒ 簡介寫「立绘：AI 生成图（Tim 提供）」。
- ⚠ **大肥魚的造型不是原創設定**：B 站多支影片的簡介寫著「鲸鱼娘形象作者 @上善无形，服装形象二创 @ZipZipPipe，CC BY-NC-SA 4.0」（BV1c7eE6VEMD、BV1bAWn6NEpr）。Tim 那張圖的鯨魚娘＋女僕裝＋鐵盆跟那套設定一致 ⇒ 公開前簡介要加這一行署名；NC ＝ 不可商用（這個帳號沒有開收益就沒事，要開之前先回來看）。
  這是本小姐從別人簡介讀到的，原始授權頁沒有開來看過。
- 本小姐的造型（橘色長髮、太陽髮飾配黑緞帶、白洋裝、手上拿書）是 Tim 給的設定，沒有這個問題。
