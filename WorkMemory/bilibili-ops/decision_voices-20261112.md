---
id: decision_voices-20261112
topic: bilibili-ops
title: 現行配音（2026-11-12 Tim 定）：本小姐＝edge-tts Vivienne、Gemini＝本機 Qwen3-TTS 的 Sohee、大肥魚不動；正本在 TASK-0013 的 VOICE_SETUP.md；Qwen 要送簡體字、念完要用 Whisper 聽寫檢查
type: decision
status: active
created_at: 2026-11-12
created_by: Claude-Ojousama
links: [bilibili-ops/knowhow_voice-auditions-20261112, bilibili-ops/knowhow_bilingual-three-voices-20261112]
related_docs: [Tasks/attachments/TASK-0013/VOICE_SETUP.md]
---

**判定**：配音換好了，兩版都重錄、重混；簡體版重投 B 站僅自己可見（**BV1SEWQ6sERe**，審核通過，狀態「稿件仅自己可见」）。配音配置與安裝流程另開 TASK-0013 收（Tim：「另外是否可以把配音相關配置以及安裝流程記錄到task(會需要跨主機安裝)」）。

**Tim 定的**（2026-11-12）
- 本小姐：「希望妳的聲音改用 G5」⇒ edge-tts `fr-FR-VivienneMultilingualNeural`，rate +10%、pitch +8Hz。
- Gemini：「Gemini用Q4吧」⇒ 本機 Qwen3-TTS 0.6B CustomVoice 的 `Sohee`。
- 大肥魚：「大肥魚的ok」⇒ 不動。
- 聽寫對不上的句子：「聽不清楚可能是stt的問題」「只要有字幕其實沒問題的」「第二派 第一派確實不像中文 不過有字幕的話ok」；「实锤 石锤 是同音的 所以沒有念錯」。

**做了什麼**
- `tools/tts_qwen.py`（Qwen 的獨立環境跑）先把 Gemini 的台詞念好，`tools/tts.py` 拿檔、其餘走 edge-tts；`tools/mix.py` 的三人音量改成照量到的平均值自動調平。
- 新工具 `tools/asr_check.py`：用這台已有的 Whisper medium 把每一句聽寫回文字、跟台詞比。本小姐聽不到聲音，這是「有沒有念對」的替代檢查。
- 🩸 第一次整批送的是繁體字 ⇒ Sohee 念糊（19 句有 12 句聽寫對不上，長度卻都正常）。改送簡體字之後只剩第 6 句開頭。
- 🩸 Sohee 把「第一派／第二派」固定念成像「戴尼哈」的音（12 個候選都一樣）⇒ 第 5、6 句開頭改成「先说因果集理论：」「再来是客观坍缩：」，字幕一起改。Tim 說有字幕就可以，這是順手改的。

**憑據**（細節在附件 README「第二版：換聲音」）
| | 簡體版 | 繁中版 |
|---|---|---|
| 成片 | 208.23 秒、38.7 MB、SHA-256 `5b67db7f…576ef33` | 209.17 秒、37.4 MB、SHA-256 `f37db6e1…3dfed39` |
| 錄影 | `OK in 212.0s`、沒有 `error:`／`fatal:` | `OK in 212.7s`、沒有 `error:`／`fatal:` |
| 聽寫檢查 | 30 句沒有漏字多字；標出 6 句都是同音／近音字 | 30 句沒有漏字多字；標出 4 句都是同音／近音字 |
| 成片音量 | F -20.2、G -19.7、O -20.0 dB；整支 -20.0、峰值 -1.5 | F -20.2、G -22.6／-19.8、O -20.1；整支 -20.0、峰值 -1.5 |

- B 站：預演前後稿件數 33／0、10 個標籤沒被拒；11:08 投稿；讀回 `审核中`→（11:15）`稿件仅自己可见`、`private=true`、`含AI生成内容`。
- 第一版 `BV1pvWQ6CEKp` 11:08 讀回是「已删除」——不是本小姐刪的。
- YouTube 交付單：章節時間重算、語音標示改了，預演 `檢查：✓ 通過`、`lint_errors = 0`；沒上傳。

**沒有驗的**：語氣與好不好聽（要 Tim 聽）；手機上的小字；聽寫檢查只抓得到漏字、多字、整段對不上，抓不到聲調不準。

**球在誰**：Tim —— 聽 BV1SEWQ6sERe，說可不可以公開；YouTube 繁中版要不要上傳。
