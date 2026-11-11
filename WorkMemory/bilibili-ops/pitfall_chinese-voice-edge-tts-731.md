---
id: pitfall_chinese-voice-edge-tts-731
topic: bilibili-ops
title: 中文語音：edge-tts 7.3.1 能用（7.2.8 回 403）、混音增益、大肥魚的社群聲音模型要 Tim 自己裝
type: pitfall
status: active
created_at: 2026-11-11
created_by: Claude-Ojousama
links: [bilibili-ops/pitfall_chinese-voice]
related_docs: []
---

中文語音怎麼來（2026-11-11 查證：升級後實跑 23 句都念出來，成片 BV11yWj6SEU3）：

- **edge-tts 7.3.1**（微軟 Edge「大聲朗讀」的線上語音，非官方用戶端，PyPI 套件）能用。Tim 2026-11-11「可以，升級」。
  🩸 7.2.8 會回 `WSServerHandshakeError: 403`（握手參數過期；系統時間沒問題；列聲音清單那支 API 照樣能用，所以看起來像裝好了）⇒ 再撞到 403 先比 PyPI 的最新版本，升級要下載 ⇒ 先問 Tim。
  ⚠ 台詞文字會送到微軟的服務；只送要公開念出來的台詞。
- 選的聲音：本小姐 `zh-CN-XiaoxiaoNeural`（語速 +6%）、大肥魚 `zh-CN-XiaoyiNeural`（語速 +12%、音高 +18Hz）。agent 聽不到 ⇒ 讀音與像不像要 Tim 聽。
- edge-tts 的 mp3 頭尾有靜音（句尾近一秒）⇒ 轉 wav 時用 `silenceremove` 頭尾各切一次，不然對話的節奏會拖。
- 🩸 混音：`mix.py` 最後的 +8 dB 是照 VOICEVOX 調的；edge-tts 的聲音原本就約 -20 dB，直接加會頂在限幅器上（台詞段平均 -15 dB）。
  ⇒ 每個角色的語音先各自減再混（本小姐 -5 dB、大肥魚 -2.5 dB），量到台詞段 -18～-20 dB、峰值 -2.6 dB、BGM -39 dB。
- 念的字跟畫面上的字分開存（`lines.json` 的 `tts`／`zh`）：頓號換成逗號、破折號與「～」拿掉、「欸」換成「诶」。
- **大家常用的大肥魚聲音**：星落落_oi 公布的社群模型 FeiyuVoice（BV1cbH56KER3，27.9 萬播放；GitHub `Esmerubphire/astrbot_plugin_feiyu_voice`）。CosyVoice3 的「可愛 cute／溫柔 gentle」兩條說話聲線＋RVC 換聲；簡介寫「自用随意，不可商用」，repo 沒有標準授權。
  要下載第三方程式與模型來跑 ⇒ persona 不自己裝；Tim 想用的話由他裝，或用 repo 的 Colab 產出 wav，照 `site/voice/line_<N>.wav` 放進來、量長度重寫 `timeline.json`、重錄。這台顯卡是 RTX 2060 6 GB。
  其他查到的：尹紫鷺幻想社的資料集（ModelScope `YinZilu/da-fei-yu-girl-voice-zh`）、whale-voice（IndexTTS2＋RVC，要 8 GB 顯存）。
- VOICEVOX 沒有中文。
