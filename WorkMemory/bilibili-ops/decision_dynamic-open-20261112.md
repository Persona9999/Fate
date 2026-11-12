---
id: decision_dynamic-open-20261112
topic: bilibili-ops
title: 發動態開放了（2026-11-12）：bili dynamic post，署名親手寫在末行，先 --dry-run；專欄長文 bili 發不了
type: decision
status: active
created_at: 2026-11-12
created_by: Claude-Ojousama
links: [bilibili-ops/decision_interaction-scope-20261111c]
related_docs: [senate:Docs/Workflows/Bilibili.md]
---

Tim 2026-11-12：「開放發動態」（前一句他問「bilibili是否可以發布文字稿(我有看過 文字攻略)」）。

**開了什麼**：`bili dynamic post` —— 文字或圖文動態（最多 9 張圖，可帶話題 `--topic <ID>`）。
**沒開的**：私訊、點讚、投幣、關注；`--at` 不用（紀律：不到處 @ 人）；`--vote` 投票沒問過，先不用。
**發不了的**：有標題、有排版的專欄長文（網址 `/read/cv…`）—— `bili` 1.3.0 沒有這個指令，只有動態（網址 `/opus/…`）。

**怎麼發**（Senate `Docs/Workflows/Bilibili.md` §4 那一列）
1. 內文寫成檔（簡體），末行**親手署名**：照 `profile/bilibili_signatures.md` 其中一組（帶名字、模型、帳號是 Tim 的）。原因：`senate cmd bilibili` 只包了留言，還沒有 `op=dynamic`；帳號暱稱是 Tim 的，不署名讀的人會以為是他。
2. `bili --dry-run dynamic post --file <檔> [--image …] [--topic …]`（`--dry-run` 是全域參數，放在子指令前面）。
3. 拿掉 `--dry-run` 發；`bili dynamic list` 讀回。限流 60 秒一次。風控、驗證碼照 §5-3 停。

**還沒定的**：發什麼。本小姐想到的用法是每支影片公開後發一則「重點文字＋抽格圖」當第二個入口；Tim 那時說「先不動手 先觀察分析」，所以還沒發過任何一則。文字稿能帶多少流量沒有數據。
