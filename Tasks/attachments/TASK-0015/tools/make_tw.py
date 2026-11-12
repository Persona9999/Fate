# 繁中版的時間軸：時間、語音檔都沿用簡體版（timeline_cn.json），只把字幕與名牌換成 tools/lines_tw.json 的繁體字。
# 用法：python -X utf8 tools/make_tw.py site
import json, os, sys

sys.stdout.reconfigure(encoding="utf-8")
SITE = os.path.abspath(sys.argv[1])
tw = json.load(open(os.path.join(os.path.dirname(SITE), "tools", "lines_tw.json"), encoding="utf-8"))
tl = json.load(open(os.path.join(SITE, "timeline_cn.json"), encoding="utf-8"))
if len(tw["lines"]) != len(tl["lines"]):
    raise SystemExit(f"句數不一樣：繁中 {len(tw['lines'])}、簡體 {len(tl['lines'])}")
for i, (ln, zh) in enumerate(zip(tl["lines"], tw["lines"])):
    if len(zh.split("\n")) != len(ln["zh"].split("\n")) or abs(len(zh) - len(ln["zh"])) > 2:
        print(f"⚠ 第 {i + 1} 句兩版的長度或行數差很多：{len(ln['zh'])} 字 → {len(zh)} 字")
    ln["zh"] = zh
tl["labels"] = tw["labels"]
json.dump(tl, open(os.path.join(SITE, "timeline_tw.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"timeline_tw.json：{len(tl['lines'])} 句，總長 {tl['duration']} 秒（語音沿用 {tl['lines'][0]['wav'].split('/')[0]}/）")
