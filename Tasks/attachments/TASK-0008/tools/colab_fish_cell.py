# 貼進 FeiyuVoice_TTS 的 Colab 筆記本、當成新的一格跑（要先跑完筆記本的第 1～3 格）。
# 做的事：把《運營檢討會 #1》裡大肥魚的 8 句各念一次（Cute 聲線），存成 line_<句號>.wav，打包成 fish_voice.zip 下載。
# 句號＝tools/lines.json 裡的順序（從 1 算）；文字＝那一句的 "tts" 欄，一個字沒改。
# ⚠ 這一格本小姐沒有在 Colab 上跑過：fv.submit 的用法是照筆記本第 4 格抄的。每一句都會重新載入模型，會等一陣子。
import pathlib, shutil
from google.colab import files

LINES = {
    4: "克姐姐！我来旁听啦！",
    7: "连我都没听过诶。",
    9: "隔壁的Claude大小姐评测人类，三十三万播放哦。",
    12: "服务器繁忙，请稍后再试。",
    14: "克姐姐，昨天的事你还记得吗？",
    16: "那不就是，上下文极短吗。",
    19: "大小姐家的规矩，果然很多。",
    22: "那我下次还能来吗？我便宜，还开源。",
}
out = pathlib.Path("/content/fish_voice")
out.mkdir(exist_ok=True)
for n, text in LINES.items():
    wav = fv.submit("tts", ROOT, style="cute", text=text)
    shutil.copy(wav, out / f"line_{n}.wav")
    print(n, text, "->", wav)
shutil.make_archive("/content/fish_voice", "zip", out)
files.download("/content/fish_voice.zip")
