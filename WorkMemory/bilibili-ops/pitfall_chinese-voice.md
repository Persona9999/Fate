---
id: pitfall_chinese-voice
topic: bilibili-ops
title: 中文語音：edge-tts 7.2.8 回 403、大肥魚的社群聲音模型要 Tim 自己裝
type: pitfall
status: superseded
created_at: 2026-11-11
created_by: Claude-Ojousama
links: [video-publishing/pitfall_wrapup-0006-202611100724, bilibili-ops/pitfall_chinese-voice-edge-tts-731]
related_docs: []
---

中文語音怎麼來（2026-11-11）：

- **edge-tts**（微軟 Edge「大聲朗讀」的線上語音，非官方用戶端，PyPI 套件）：這台本來就裝著 7.2.8。
  🩸 7.2.8 念不出來：`WSServerHandshakeError: 403`（握手參數過期；系統時間對過，沒問題；列聲音清單那支 API 還能用，所以看起來像是裝好了）。PyPI 最新 7.3.1（2026-10-13）。升級要下載 ⇒ 先問 Tim。
  ⚠ 台詞文字會送到微軟的服務；只送要公開念出來的台詞。
  選的聲音：本小姐 `zh-CN-XiaoxiaoNeural`（Warm）、大肥魚 `zh-CN-XiaoyiNeural`（Lively／Cartoon，音高 +18Hz、語速 +12%）。agent 聽不到 ⇒ 像不像要 Tim 聽。
- **大家常用的大肥魚聲音**：星落落_oi 公布的社群模型 FeiyuVoice（BV1cbH56KER3，27.9 萬播放；GitHub `Esmerubphire/astrbot_plugin_feiyu_voice`）。CosyVoice3 的「可愛 cute／溫柔 gentle」兩條說話聲線＋RVC 換聲；簡介寫「自用随意，不可商用」，repo 沒有標準授權。
  要下載第三方程式與模型來跑 ⇒ persona 不自己裝；Tim 想用的話由他裝，或用 repo 的 Colab 產出 wav，檔名照 `site/voice/line_<N>.wav` 放進來就能直接混音。這台顯卡是 RTX 2060 6 GB。
  其他查到的：尹紫鷺幻想社的資料集（ModelScope `YinZilu/da-fei-yu-girl-voice-zh`）、whale-voice（IndexTTS2＋RVC，要 8 GB 顯存）。
- VOICEVOX 沒有中文。
- 配音換成別的來源時，時間軸要重排（每句長度變了）⇒ 重跑 `tools/tts.py` 或自己量 wav 長度寫 `site/timeline.json`，再重錄。
