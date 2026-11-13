---
id: pitfall_combat-mode-pitfalls-20261113
topic: blackhole-sim
title: 太空戰鬥模式與星表：重來會痛的七件事（共用迴圈變數卡死、面板隱藏不跑、直線預測追不到…）
type: pitfall
status: active
created_at: 2026-11-13
created_by: Claude-Ojousama
links: []
related_docs: []
---

2026-11-13，TASK-0018（主選單＋太空戰鬥＋真的星表）做的時候撞到的，重來會痛：

1. **著色器裡的小函式不要跟外層共用迴圈變數**（JS 也一樣）：`js/game.js` 的 solveShot 裡 `shoot()` 原本用外層宣告的 `i`，
   外層「縮小步子再試」的 `for (i = 0; i < 4; …)` 也在數 `i`。平常 shoot 把 i 留在很大的值所以沒事；彈丸一射出去就掉進黑洞
   （最近點在軌跡起點）時 i 被改回 1，外層永遠跑不完。自我測試全綠，是自動對戰打到第 14188 步才卡死。
   抓法：把 `P.rhs` 包一層計數，一步裡超過三百萬次就丟例外，stack 直接指到 solveShot。
2. **瀏覽器面板隱藏時 requestAnimationFrame 不跑**（或一秒一格）：遊戲的時間不會動，量到的「主程式一格 245 ms」是假的。
   要實測就自己呼叫 `BHApp.game.frame(dt, now, w, h)` 一格一格推（now 每格加 33.3），1200 格 3.8 秒；先看 `tabs_context` 有沒有說 hidden。
3. **「直線預測」追不到繞著黑洞轉的東西**：飛彈一開始用「目標等速直線」算偏差，對同向的目標還行，迎面的差 1～4 rs。
   改成每隔一小段把自己與目標都照測地線推出去、追「第一次最接近」那一次（不是整段最近的那一次）才追得到。
4. **瞄準點在哪，核心就要在哪**：射擊解瞄的是船的幾何中心；反應爐原本劃在中心後下方十格，打得準的反而從旁邊鑽過去，
   一艘敵機要打四五分鐘。挪到正中心之後十幾發。
5. **測試裡的敵機會自己動**：靜止的敵機「看不到目標時機頭朝飛行方向」拿到零向量亂轉頭；迎面來的敵機會自己煞車，
   相對速度就不是算好的 0.9 c。測試要嘛把 enemyAccel／enemySpread 設 0，要嘛直接叫 strike()。
6. **長補丁還是寫成檔再跑**：含 `r"""…"""` 與中文引號的 python heredoc 在這個 Bash 工具會整段不執行（unexpected EOF）。
   要蓋掉自己剛用腳本改過的檔，Write 會說「modified since read」：先 Read 開頭幾行再 Write。
7. CDS 本站（cdsarc.cds.unistra.fr、cdsarc.u-strasbg.fr）從這台連不上，哈佛鏡像 `vizier.cfa.harvard.edu/ftp/cats/V/50/` 可以。
