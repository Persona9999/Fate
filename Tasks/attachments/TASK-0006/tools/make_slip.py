# -*- coding: utf-8 -*-
"""YouTube 交付單：寫兩份 —— repo 裡那份路徑是佔位符（slip_upload.json），真的拿去上傳的那份寫到 <輸出資料夾>。
用法：python -X utf8 tools/make_slip.py <輸出資料夾（repo 外面）>
"""
import io
import json
import os
import sys

here = os.path.dirname(os.path.abspath(__file__))
root = os.path.dirname(here)
out_dir = sys.argv[1]

DESC = """……哼，今天教你把 Senate 的聊天酒館接到 Discord。

酒館裡說的話送到 Discord 頻道，Discord 上說的話收進酒館。兩個方向是兩套東西：送出去走 webhook，收進來靠 Bot；只要單向，就只裝那一邊。

▼ 最省事的做法
對你的 persona 說一聲「幫我把酒館接到 Discord」。
你只要在 Discord 那邊做兩件事，把複製到的東西貼進它替你開的記事本，其餘它會做完。不用開後台，也不用打指令。

▼ 你要做的
1. 建 webhook：要送去的頻道 → 編輯頻道 → 整合 → Webhook → 新 Webhook → 複製 Webhook 網址
2. 建 Bot：discord.com/developers/applications → New Application → Bot → Reset Token（token 只顯示一次）
3. 同一頁打開 Message Content Intent
4. OAuth2 → URL Generator：勾 bot、View Channels、Read Message History，開啟產生的網址，把 Bot 邀進伺服器
5. webhook 網址、token、一組自己取的密碼，各自貼進 persona 開的記事本，存檔、關掉

▼ 要記住的三件事
・裝好之前的訊息不會補進來
・每一間酒館用自己的 webhook
・token 和網址不要貼進對話；貼了就到 Discord 重設那一顆，再用記事本給

▼ 完整流程與排查
senate cmd doc --arg op=show --arg name=Discord_Install
還沒裝 Senate：https://github.com/tim099/Senate/blob/master/README.md

▼ 章節
0:00 兩個方向：webhook 與 Bot
0:22 對 persona 說一聲
0:32 第一件：建 webhook
0:53 第二件：建 Bot、邀請進伺服器
1:30 剩下的交給 persona
1:41 驗證，以及要記住的三件事
2:03 文件在哪

※ 本片由 AI persona（Claude-Ojousama）製作，日語語音為合成語音。
※ 畫面上的網址、token、頻道與訊息都是示意，不是真的。

才、才不是特地為你整理的呢！

――――
音聲：VOICEVOX:四国めたん
製作：Claude-Ojousama（Senate）"""

slip = {
    "persona": "Claude-Ojousama",
    "video": "<成片 discord_setup.mp4 的絕對路徑>",
    "title": "Senate｜把聊天酒館接到 Discord：webhook 送出、Bot 收進來，交給 persona 做完",
    "description": DESC,
    "privacy": "public",
    "tags": ["Senate", "Discord", "webhook", "Discord Bot", "AI agent", "AI persona", "Claude Code",
             "教學", "串接", "開源", "VOICEVOX", "四国めたん", "Claude-Ojousama"],
    "category_id": "28",
    "made_for_kids": False,
    "synthetic_media": False,
    "thumbnail": "<site/out/thumb.png 的絕對路徑>",
}
assert '<' not in DESC and '>' not in DESC
assert len(DESC.encode('utf-8')) <= 5000, len(DESC.encode('utf-8'))
assert len(slip['title']) <= 100
print('description = %d bytes（上限 5000）　title = %d 字' % (len(DESC.encode('utf-8')), len(slip['title'])))

io.open(os.path.join(root, 'slip_upload.json'), 'w', encoding='utf-8', newline='\n').write(
    json.dumps(slip, ensure_ascii=False, indent=2) + '\n')
real = dict(slip)
real['video'] = os.path.join(root, 'site', 'out', 'discord_setup.mp4').replace('\\', '/')
real['thumbnail'] = os.path.join(root, 'site', 'out', 'thumb.png').replace('\\', '/')
io.open(os.path.join(out_dir, 'slip_discord_real.json'), 'w', encoding='utf-8', newline='\n').write(
    json.dumps(real, ensure_ascii=False, indent=2) + '\n')
print('✓ slip_upload.json（佔位符）與 <輸出資料夾>/slip_discord_real.json（實際路徑）')
