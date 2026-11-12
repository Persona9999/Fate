"""用本機的 Whisper 把念好的台詞聽寫回文字，跟台詞對照，找漏字、多字、念錯。
agent 聽不到聲音 ⇒ 這是「有沒有念對」的替代檢查（語氣、好不好聽還是要人聽）。
聽寫有同音字、簡繁不一，所以比的是「去掉標點之後有幾成的字對得上」，低於門檻的列出來讓人逐句看。
模型用這台已經快取的（~/.cache/whisper/medium.pt），不下載。系統 Python 跑。
用法：python -X utf8 tools/asr_check.py qwen site            # 檢查 site/voice_qwen/（照 _report.json）
      python -X utf8 tools/asr_check.py timeline site cn     # 檢查某一版時間軸的每一句（對照 tools/lines_<lang>.json 的 tts）
"""
import difflib, json, os, re, sys

sys.stdout.reconfigure(encoding="utf-8")
import whisper

MODE, SITE = sys.argv[1], os.path.abspath(sys.argv[2])
# 聽寫出來可能是簡體也可能是繁體 ⇒ 兩邊都先換成同一套字再比（只列台詞裡用到、兩邊寫法不同的字）
T2S = dict(zip("這個們來時間會實點對問學裡幾說數後隨著還長現場錄帶質東壓彎進吧動靜樣擠夠狀閃電寫標籤夢維電從幾屬捲亂脈碼畫麼編膽設後題魚識為腦態撐縮塌獎爾諾貝斯這句駁講讓蓋負責監誰準妳種證說總結賭沒",
               "这个们来时间会实点对问学里几说数后随着还长现场录带质东压弯进吧动静样挤够状闪电写标签梦维电从几属卷乱脉码画么编胆设后题鱼识为脑态撑缩塌奖尔诺贝斯这句驳讲让盖负责监谁准你种证说总结赌没"))
norm = lambda s: "".join(T2S.get(ch, ch) for ch in re.sub(r"[^一-鿿A-Za-z0-9]", "", s))

if MODE == "qwen":
    rep = json.load(open(os.path.join(SITE, "voice_qwen", "_report.json"), encoding="utf-8"))
    items = [(r["used"][0], os.path.join(SITE, "voice_qwen", r["key"] + ".wav"), r["text"]) for r in rep]
else:
    lang = sys.argv[3]
    cfg = json.load(open(os.path.join(os.path.dirname(SITE), "tools", f"lines_{lang}.json"), encoding="utf-8"))
    items = [(f"{lang}#{i + 1} {ln['who']}", os.path.join(SITE, f"voice_{lang}", f"line_{i + 1}.wav"), ln["tts"]) for i, ln in enumerate(cfg["lines"])]

try:
    model = whisper.load_model("medium", device="cuda")
except Exception as e:                                         # 顯存不夠就退到 CPU
    print("cuda 載入失敗，改用 CPU：", type(e).__name__); model = whisper.load_model("medium", device="cpu")
out, bad = [], 0
for name, wav, text in items:
    r = model.transcribe(wav, language="zh", initial_prompt="以下是普通话的句子。", temperature=0, condition_on_previous_text=False)
    heard = r["text"].strip(); a, b = norm(text), norm(heard)
    ratio = difflib.SequenceMatcher(None, a, b).ratio()
    flag = "" if ratio >= 0.86 and abs(len(a) - len(b)) <= max(2, len(a) * 0.12) else "  ⚠"
    bad += bool(flag)
    out.append({"name": name, "ratio": round(ratio, 2), "len_text": len(a), "len_heard": len(b), "text": text, "heard": heard, "flag": bool(flag)})
    print(f"{name:20} {ratio:.2f} 字數 {len(a)}→{len(b)}{flag}\n    台詞：{text}\n    聽寫：{heard}")
json.dump(out, open(os.path.join(SITE, f"asr_{MODE}{'_' + sys.argv[3] if MODE != 'qwen' else ''}.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"共 {len(out)} 句，要人看的 {bad} 句")
