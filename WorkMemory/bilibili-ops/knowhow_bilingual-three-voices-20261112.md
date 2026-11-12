---
id: knowhow_bilingual-three-voices-20261112
topic: bilibili-ops
title: 雙語影片（簡體＋繁中）與三個聲音：?lang= 產線、第三個聲音用台灣腔、蓋章時間表、判定要分『查到的』與『未另查』
type: knowhow
status: active
created_at: 2026-11-12
created_by: Claude-Ojousama
links: [bilibili-ops/pitfall_chinese-voice-edge-tts-731]
related_docs: []
---

2026-11-12，TASK-0012（蓋章課 #1）第一次同時出簡體版（B 站）與繁中版（YouTube）、第一次三個角色。重來會痛的幾格：

**一份動畫、兩個版本**
- `site/intro.html` 吃 `?lang=cn|tw`；畫面上的字一律寫成 `T('简体', '繁體')`，兩邊的用詞分開寫。時間軸、語音、輸出各自一份：`timeline_<lang>.json`、`voice_<lang>/`、`out_<lang>/`（`tools/tts.py`、`rec.py`、`mix.py` 都多一個語言參數；正本在 `Tasks/attachments/TASK-0012/tools/`）。
- 繁中版不是只轉字，台詞另寫一份（`lines_tw.json`）、另念一次：实锤→實證、真随机数→亂數、坍缩→塌縮、彭罗斯→潘洛斯、录像带→錄影帶、代码→程式碼、方程→方程式、毫米→公釐、评论区→留言區、账号→頻道。
- 字型：簡體 Microsoft YaHei、繁中 Microsoft JhengHei（標點置中、字比較細）。這一次兩邊的版面沒有因為字寬不同而破版，但每一版都各自抽格看過（各 62 格）。

**第三個聲音**
- edge-tts 的標準大陸女聲只有 Xiaoxiao（本小姐）、Xiaoyi（大肥魚）兩個 ⇒ 第三個角色（Gemini）用 `zh-TW-HsiaoChenNeural`（台灣腔），`rate +8%`、`pitch +4Hz`。
- 讓每個聲音念它熟的字：台灣腔的那個 `tts` 欄一律寫繁體字，大陸腔的兩個寫簡體字；顯示用的 `zh` 欄照各版本自己的字。
- 會被念錯的多音字先改寫：「原子钟量得到」的「量」可能念成 liàng ⇒ 改成「测得出来」。
- 原始音量（volumedetect 平均）：O -19.7、G -19.1、F -21.9 dB ⇒ 混音增益 O -5.0、G -5.5、F -2.5 dB。成片台詞段平均約 -20 dB、峰值 -1.5 dB。
- ⚠ 本小姐聽不到：讀音與三個聲音分不分得開，要 Tim 聽。

**蓋章的做法**
- 章的時間點集中在一張表 `ST`（第幾句、念到幾成），畫面與「咚」的音效都讀它 ⇒ 改台詞之後只要對這張表。
- 「不錄影只抽格」（`?shots=1`，約 5 秒）跑兩輪、看完 11 張總覽圖再正式錄；兩支連錄＋混音約 8 分鐘，放背景跑。
- 抽格抓到的都是「兩樣東西疊在一起」：轉場時新舊兩行字同時半透明、章蓋到下面的說明、封面的章互相碰到。章是會轉、會放大的東西，位置要留比外框多 20px 的邊。

**判定要有依據**
- 每個「實錘／假說／腦洞」在附件 README 都寫了依據，並分開標「WebSearch 查到的」與「未另查（本小姐原本就知道的）」。這次實際查的三條：Gisin（Nature Physics 16, 114–116, 2020）、「No black holes from light」（PRL 133, 041401, 2024；反駁 arXiv:2505.16202）、Bothwell et al.（Nature 602, 420, 2022）。
- 搜尋摘要自己會互相矛盾（同一篇 Page 的文章，一次說是 PRL 的 Comment、一次說查不到期刊資訊）⇒ 只引兩次都對得上的那一格（arXiv 編號）。
