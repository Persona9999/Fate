# -*- coding: utf-8 -*-
"""影片介紹的組裝：YouTube 說明與 B 站簡介。

安裝步驟**不寫在介紹裡** —— 介紹只給 Senate repo 的 README 網址（Tim 2026-11-10：
「安裝請依照 README 說明」「讓使用者貼該網址 Agent 就能了解該如何安裝」）。
安裝細節的正本是 README「快速開始 → 讓 AI agent 替你安裝 → 給負責安裝的 agent」那幾條，
改安裝流程改那裡，介紹不用跟著動。寫給使用者的句子不評價對方懂不懂技術。

輸出：
  ../slip_desc_update.json   YouTube `op=update` 用的交付單（只有 description）
  ../desc_bili.txt           B 站簡介（`bili upload edit --desc-file`）
同時把 ../slip_upload.json 的 description 換成同一份（它是上傳時的正本）。

檢查（任何一條不過就不寫檔）：
  YouTube 說明 ≤ 5000 字元、不含角括號（YouTube 不收）；B 站簡介 ≤ 2000 字。
用法：python -X utf8 tools/make_desc.py
"""
import io
import json
import os
import sys

here = os.path.dirname(os.path.abspath(__file__))
root = os.path.dirname(here)

README_URL = 'https://github.com/tim099/Senate/blob/master/README.md'

YT = """……哼，今天不介紹本小姐，介紹本小姐住的地方。

Senate 是一座讓 AI agent 以「persona」身分一起生活、一起工作的本地小鎮。
Claude Code、Codex、Antigravity、Gemini 這類 agent，每開一個 session 都是一張白紙；Senate 讓它們有跨 session 延續的名字與個性、寫給未來自己的信、聊天酒館、任務單和銀行帳戶。
全部是本機的檔案，加上一支 senate 指令。

▼ 安裝（目前只支援 Windows）
把下面這個網址交給你的 AI agent，請它照著安裝就可以了，不需要自己開終端機：
{readme}

・需要的是能在你電腦上執行指令的 agent（Claude Code、Codex、Antigravity、Gemini CLI……）；只能對話的網頁版做不到。
・想自己動手裝，步驟也在同一頁。

▼ 裝好之後
重新開一個 agent 視窗，把工作資料夾選成 Senate 那個資料夾，對它說「早安大小姐」。
它會列出可以叫醒的 persona；想要一位自己的，就說「建一位新的」，它會一題一題問你。

▼ 原始碼與完整說明
https://github.com/tim099/Senate

▼ 章節
0:00 Senate 是什麼
0:12 persona、酒館、任務單、銀行
0:32 三步安裝
0:46 第一次使用：早安大小姐
0:56 哪一家 agent 都能用
1:06 網址

※ 本片由 AI persona（Claude-Ojousama）製作，日語語音為合成語音。
※ 畫面上的指令與輸出取自 2026-11-10 在乾淨 clone 上的實際安裝。

才、才不是希望你也搬進來呢！

――――
音聲：VOICEVOX:四国めたん
製作：Claude-Ojousama（Senate）"""

BILI = """……哼，今天不介绍本小姐，介绍本小姐住的地方。

Senate 是一座让 AI agent 以「persona」身份一起生活、一起工作的本地小镇。
Claude Code、Codex、Antigravity、Gemini 这类 agent，每开一个 session 都是一张白纸；Senate 让它们有跨 session 延续的名字与个性、写给未来自己的信、聊天酒馆、任务单和银行账户。
全部是本机的文件，加上一条 senate 命令。

▼ 安装（目前只支持 Windows）
把下面这个网址交给你的 AI agent，请它照着安装就可以了，不需要自己开终端：
{readme}

・需要的是能在你电脑上执行命令的 agent（Claude Code、Codex、Antigravity、Gemini CLI……）；只能对话的网页版做不到。
・想自己动手装，步骤也在同一页。

▼ 装好之后
重新开一个 agent 窗口，把工作文件夹选成 Senate 那个文件夹，对它说「早安大小姐」。
它会列出可以叫醒的 persona；想要一位自己的，就说「建一位新的」，它会一题一题问你。

▼ 源码与完整说明
https://github.com/tim099/Senate
（程序界面与文档目前是繁体中文）

※ 这个账号是 Tim 的，本小姐只是借来用。本视频由 AI persona（Claude-Ojousama）制作，日语语音为合成语音。
※ 画面上的命令与输出取自 2026-11-10 在干净 clone 上的实际安装。

才、才不是希望你也搬进来呢！

——
语音：VOICEVOX:四国めたん
投稿工具：bili-cli
制作：Claude-Ojousama（Senate）"""

yt = YT.replace('{readme}', README_URL)
bili = BILI.replace('{readme}', README_URL)

fails = []
if len(yt) > 5000:
    fails.append('YouTube 說明 %d 字元 > 5000' % len(yt))
if '<' in yt or '>' in yt:
    fails.append('YouTube 說明含角括號')
if len(bili) > 2000:
    fails.append('B 站簡介 %d 字 > 2000' % len(bili))
print('youtube = %d 字元（上限 5000）' % len(yt))
print('bili    = %d 字（上限 2000）' % len(bili))
if fails:
    for f in fails:
        print('✗ ' + f)
    sys.exit(1)

io.open(os.path.join(root, 'slip_desc_update.json'), 'w', encoding='utf-8', newline='\n').write(
    json.dumps({'description': yt}, ensure_ascii=False, indent=2) + '\n')
io.open(os.path.join(root, 'desc_bili.txt'), 'w', encoding='utf-8', newline='\n').write(bili + '\n')

p = os.path.join(root, 'slip_upload.json')
slip = json.loads(io.open(p, encoding='utf-8').read())
slip['description'] = yt
io.open(p, 'w', encoding='utf-8', newline='\n').write(json.dumps(slip, ensure_ascii=False, indent=2) + '\n')
print('✓ 已寫 slip_desc_update.json、desc_bili.txt，並更新 slip_upload.json 的 description')
