# TASK-0010 附件 —— B 站影片「大小姐的航海課 #1：三角貿易」

Tim 2026-11-11：「接著 嘗試以三角貿易 大航海時代為題材 做一個有趣又能學習知識的影片吧(可以網路上找現實的圖片素材(歷史圖片 或其他授權可以使用的那種))」。

做法：本小姐上課、大肥魚當學生。主軸「三角形是風畫出來的」；三條邊各載什麼；中間航程照實講；最後講「三角」是簡化過的說法與後來的廢除。
運營的總單是 TASK-0007（這張是它的子單）；方針在工作記憶 `bilibili-ops`；產線工具的說明在 `senate cmd doc --arg op=show --arg name=YouTube_Video_Tools`。

## 現況（2026-11-11）

- ✅ 腳本 21 句（`tools/lines.json`）、動畫 `site/intro.html`（12 個場景）、中文語音（edge-tts 7.3.1）。
- ✅ 僅自己可見投稿：**BV1oHWj6vEA2** → Tim 看過 → 公開版 **BV1LsWj6eEvH**（投稿當下審核中）。
- ⚠ agent 聽不到聲音 ⇒ 讀音、語氣、嚴肅那一段的配樂（低音長音）合不合適，都要 Tim 聽過才算。

## 史實與數字：每一條查的是哪裡

查法：`python -I` 抓英文維基條目的純文字、找含關鍵字的句子（腳本在暫存區，沒收進來）。維基不是第一手來源，下面寫的是「本小姐實際讀到的那一句在哪個條目」。

| 影片裡的說法 | 讀到的依據 |
|---|---|
| 約 1250 萬人被押上船、約 1070 萬人活著上岸 | 條目 Atlantic slave trade：引 Anderson et al.（2013）「an estimated 12.5 million captives … the 10.7 million who survived the voyage」 |
| 約 180 萬人死在海上 | 同一條目：「at least 1.8 million did not survive the journey」（1250 − 1070 ＝ 180 也對得上） |
| 16 世紀初到 1860 年代；已知最後一艘販奴船 1867 年抵達古巴 | 同一條目：「The last slave ship known to reach the island made its voyage in 1867」（那一段講的是古巴） |
| 布魯克斯號：1788 年的法律准它裝 454 人；立法以前裝過 609 人 | 圖上的說明文字（「allowed to carry 454 Slaves」「had at one time carried as many as 609」）；條目 Brooks (1781 ship) 也寫 454、609 |
| 往南靠信風、回程靠灣流與西風帶 | 條目 Triangular trade：「reaching the belt of so-called trade winds」「follow the Gulf Stream … using the westerlies」；條目 Volta do mar |
| 運人最多的是葡萄牙／巴西的船，很多直接往返巴西與非洲 | 條目 Atlantic slave trade：「the southern wheel linked West-Central Africa (mainly Angola) directly to Brazil … the Portuguese, who … carried on the slave trade with the largest volume」 |
| 1789 艾奎亞諾出版自傳 | 條目 Olaudah Equiano |
| 1791–1804 海地革命 | 條目 Haitian Revolution（1791-08-21 起義、1804-01-01 獨立） |
| 1807 英國立法禁止奴隸貿易 | 條目 Slave Trade Act 1807 |
| 坎蒂諾世界地圖 1502、葡萄牙；圖上有埃爾米納城堡 | 條目 Cantino planisphere；圖上的字「Castello damina」本小姐放大看過 |
| 埃爾米納城堡（今迦納） | 條目 Elmina Castle（1482 葡萄牙人建、1637 荷蘭人奪下 ⇒ 約 1665 的那張圖掛的是荷蘭旗） |
| 貨物：布、槍、鐵器、酒 | 條目 Triangular trade：「copper, cloth, trinkets, slave beads, guns and ammunition」；條目 Kingdom of Orungu：「for European textiles, firearms, alcohol and iron goods」（一個沿岸王國的例子，四樣都在同一句） |
| 當錢用的貝殼 | 條目 Atlantic slave trade：「imported cowrie shells used as currency were already widely circulated in West Africa」 |
| 糖、菸草、棉花 | 條目 Triangular trade：「tobacco, sugar, cotton, rum, rice, lumber」 |
| 15 世紀起是大航海時代 | 條目 Age of Discovery：「c. 1418 – c. 1620 … from approximately the 15th to the 17th century」 |
| 北大西洋環流順時針；四段分別是什麼 | 條目 Ocean gyre：「in the northern hemisphere they rotate clockwise」；條目 North Atlantic Gyre：西邊灣流往北、北邊北大西洋洋流、東邊加那利洋流往南、南邊北赤道洋流 |

**推測／示意**：地圖上的環流與三條邊是手畫的示意線（照經緯度擺、刻意畫在海上），不是任何一艘船的航跡。

## 圖片：來源與授權

`tools/fetch_images.py` 從 Wikimedia Commons 下載（只收授權是 Public domain／CC0 的，不是就停），紀錄寫在 `site/img/credits.json`（來源頁、作者、年代、授權、SHA-256）。

| 檔 | Commons 上的檔名 | 作者／年代 | 授權 | 用在哪 |
|---|---|---|---|---|
| `cantino.jpg` | Cantino planisphere (1502).jpg | 佚名（葡萄牙），1502 | 公有領域 | 開場背景、大航海時代 |
| `earth.jpg` | Blue Marble Next Generation + topography + bathymetry.jpg | Reto Stöckli，NASA Earth Observatory，2004 | 公有領域 | 地圖底圖（裁出大西洋、重新上色） |
| `brookes.jpg` | Slaveshipposter.jpg | Plymouth Chapter of the Society for Effecting the Abolition of the Slave Trade，Commons 標 1788-12 | 公有領域 | 中間航程 |
| `antigua.jpg` | Slaves working on a plantation - Ten Views in the Island of Antigua (1823), plate III - BL.jpg | William Clark，1823 | CC0 | 第三條邊 |
| `equiano.jpg` | Olaudah Equiano - The interesting Narrative … frontispiece - BL.jpg | W. Denton 繪、D. Orme 刻，1789 | CC0 | 後來 |
| `elmina.jpg` | ElMina AtlasBlaeuvanderHem.jpg | Johannes Vingboons，1665–1668 之間 | 公有領域 | 第一條邊 |
| `ship.jpg` | A British Slave Ship, by William Jackson, c. 1780, Royal Museums Greenwich.jpg | William Jackson，約 1780 | 公有領域 | 第一條邊 |

- ⚠ `ship.jpg`：Commons 上同一幅畫另有一個檔名寫「A slave ship (?)」，是不是販奴船館方打了問號 ⇒ 畫面上寫「据信为贩奴船」。
- ⚠ `brookes.jpg` 的年份：圖本身的標題是「…under the Regulated Slave Trade Act of 1788」，這一版確切哪一年印的本小姐沒查到 ⇒ 畫面上寫「约 1788 年」。
- 本小姐與大肥魚的圖從 TASK-0008 的附件複製過來（來源與署名見 TASK-0007 留言 #1）。

## 這次的讀數

| 項目 | 讀數 |
|---|---|
| 配音 | 21 句，最長 12.13 秒、最短 1.09 秒（「死在海上。」）；時間軸總長 164.036 秒 |
| 錄影 | `OK in 167.9s`，9837 格，沒有 `error:`／`fatal:` |
| 成片 | `site/out/sailing_01.mp4`：164.11 秒、1280x720、30fps、H.264＋AAC 雙聲道、57.2 MB |
| 音量 | 開場（只有 BGM）平均 -38.6 dB；台詞段平均 -18.4～-20.6 dB；整支峰值 -1.5 dB |
| 成片 SHA-256 | `fcfa59b3d04eed6f17bf52d0c66c6616878d2c72969991a78bee64505167e2e6` |
| 抽格 | 44 格（片頭、每句中段與句尾、片尾）。先用不錄影的抽格模式（`?shots=1`，5 秒）看了兩輪改版面，再正式錄；最後這一版的 44 格都看過（拼成 8 張總覽圖看），另外從 mp4 抽 5 格對過 |

抽格找到並改掉的：
1. 衛星底圖的海幾乎是黑的 ⇒ 逐像素重新上色（海是暗的藍綠、陸地偏舊紙色）。
2. 環流那一場的標籤互相壓到、壓到三角形的邊 ⇒ 四個標籤都放進圈裡，中間的大標籤在下一句開始時退掉。
3. 南大西洋那一場「安哥拉」壓到箭頭 ⇒ 標籤往外移。
4. 貨物的標籤壓到「歐洲」那個點 ⇒ 改成兩排、往下放。
5. 害羞的愛心壓到台詞／名牌 ⇒ 移到名牌右邊。
6. 人數那一場紅線穿過紅字 ⇒ 那一場不畫航線。
7. 台詞「走的是一／条直线」斷在詞中間 ⇒ 那一句手動分成三行。

## 嚴肅的那一段（第 8～13 句）怎麼處理

- 不放會彈出來的標籤、不放吐槽；大肥魚只問一句「少掉的那 180 萬人呢？」，語速與音高調回接近平常（`rate +0%`、`pitch +8Hz`）。
- 本小姐那幾句語速放慢（-4%，「死在海上。」-8%），句子之間留長（最長 1.8 秒）。
- 配樂在那一段不彈琶音，換成很小聲的低音長音；對話框的頭像不晃。

## 重跑

在這個資料夾裡（Git Bash），`<ffmpeg.exe>`、`<chrome.exe>` 用這台量到的路徑：

```bash
python -X utf8 -I tools/fetch_images.py site/img                      # 下載圖片（已經在了就不用）
python -X utf8 tools/tts.py "<ffmpeg.exe>" tools/lines.json site     # 念台詞、排時間軸
python -I tools/rec.py site "<chrome.exe>" 120 "?shots=1"             # 只抽格、不錄影（幾秒鐘）
python -I tools/sheet.py "<ffmpeg.exe>" site/out                      # 把抽格拼成總覽圖
python -I tools/rec.py site "<chrome.exe>" 300                        # 正式錄影
python -I tools/mix.py "<ffmpeg.exe>" site "$(pwd -W)/site/out/sailing_01.mp4"
```

- 改了台詞的字（`zh`）而念的字（`tts`）沒變：`tools/lines.json` 與 `site/timeline.json` 兩邊都要改，不用重念。

## 發布

- 交付單 `slip_bilibili.json`、簡介 `desc_bili.txt`（1299 字）。分區 1010 知識。
- 預演：10 個標籤都沒被拒；前後稿件數都是「已發布 32、審核中 0」。
- 投稿：`--private --line qn`，`timeout 280` 內傳完。**BV1oHWj6vEA2**。讀回：`审核中`、`private=true`、`含AI生成内容`、分區「知识」；稿件數「32／審核中 1」（投稿後第一次讀還是 0，隔 20 秒再讀才變）。
- 2026-11-11 公開：Tim 看過後說「可以公開」⇒ 同一支成片重新投一次、不帶 `--private`。**BV1LsWj6eEvH**。
  預演前後稿件數都是「已發布 33、審核中 0」；投稿後「33／審核中 1」；讀回：`审核中`、`private=false`、`含AI生成内容`、分區「知识」。
  🩸 第一次送出被 `bili` 自己的限流擋下（`rate_limited`：兩次投稿至少隔 300 秒，那時還差 8 秒）；沒有送進去（讀回稿件數沒變），等過了才再投。
  ⇒ 僅自己可見版投完之後，公開版至少隔 5 分鐘再投；每小時最多 5 次。
  幾分鐘後再讀：`开放浏览`、`private=false`、沒有退回原因 ⇒ 審核過了。
  `BV1oHWj6vEA2`（僅自己可見的那一版，審核過了）留著沒動。
