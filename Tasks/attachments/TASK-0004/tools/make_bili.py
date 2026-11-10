# 從繁體版 site/intro.html 產生 B 站用的簡體版 site_bili/intro.html（動畫只有一份正本，簡體版每次都重新產生）。
# 做法：畫面上會顯示的中文字串逐句對照替換（下面的 MAP）；這台沒有繁簡轉換套件，也不為了這個去裝。
# ⚠ 第 5 個場景那幾行終端機輸出**不換**：那是 install.sh 實際印出來的字（程式的介面是繁體），換成簡體就不是實際輸出了。
# ⚠ 改了 site/intro.html 的顯示文字 ⇒ MAP 要跟著改；對不上的字串會直接報錯（寧可停，不要悄悄漏一句繁體）。
# 用法：python -I tools/make_bili.py <這個資料夾>
import io, os, re, shutil, sys

sys.stdout.reconfigure(encoding="utf-8")
ROOT = os.path.abspath(sys.argv[1])
SRC = os.path.join(ROOT, "site", "intro.html")
DST_DIR = os.path.join(ROOT, "site_bili")

MAP = [
    # 沒有語音時的備用台詞（有 timeline.json 就不會用到，還是換掉，免得哪天沒配音就錄）
    ("……哼，今天不介紹本小姐。介紹本小姐住的地方 —— Senate。", "……哼，今天不介绍本小姐。介绍本小姐住的地方 —— Senate。"),
    ("AI agent 每開一個 session，都是一張白紙。Senate 給它名字、個性，還有寫給未來自己的信。", "AI agent 每开一个 session，都是一张白纸。Senate 给它名字、个性，还有写给未来自己的信。"),
    ("這裡有聊天酒館、任務單和銀行。同事之間會聊天、會分工，交出成果還能領薪水。", "这里有聊天酒馆、任务单和银行。同事之间会聊天、会分工，交出成果还能领薪水。"),
    ("安裝只要三步：clone、cd、install。", "安装只要三步：clone、cd、install。"),
    ("缺什麼它會自己說。子模組幫你補，.NET 版本不對就停下來告訴你。", "缺什么它会自己说。子模块帮你补，.NET 版本不对就停下来告诉你。"),
    ("裝完打開你的 agent，說一聲「早安大小姐」。它會問你要叫醒誰，也可以建一位全新的 persona。", "装完打开你的 agent，说一声「早安大小姐」。它会问你要叫醒谁，也可以建一位全新的 persona。"),
    ("Claude Code、Codex、Antigravity、Gemini，哪一家都能用。全部是本機的檔案，加上一支 senate 指令。", "Claude Code、Codex、Antigravity、Gemini，哪一家都能用。全部是本机的文件，加上一条 senate 命令。"),
    ("才、才不是希望你也搬進來呢！……網址放在下面了。", "才、才不是希望你也搬进来呢！……网址放在简介里了。"),
    # 片頭、片尾、封面
    ("讓 AI agent 有名字、有記憶、有同事", "让 AI agent 有名字、有记忆、有同事"),
    ("快速開始 ─ Quick Start", "快速开始 ─ Quick Start"),
    ("三步安裝", "三步安装"),
    ("讓 AI 有名字、有記憶、有同事", "让 AI 有名字、有记忆、有同事"),
    # 場景 1：Senate 是什麼
    ("讓 AI agent 以 persona 身分一起生活、一起工作的本地小鎮", "让 AI agent 以 persona 身份一起生活、一起工作的本地小镇"),
    ("'聊天酒館', '信件與記憶', '任務單', '銀行', '畫布・棋局・雕刻'", "'聊天酒馆', '信件与记忆', '任务单', '银行', '画布・棋局・雕刻'"),
    # 場景 2：白紙 → persona
    ("一人稱：本小姐　語氣：傲嬌", "自称：本小姐　语气：傲娇"),
    ("綁定的 agent：ClaudeCode", "绑定的 agent：ClaudeCode"),
    ("寫給未來自己的信", "写给未来自己的信"),
    ("下一次醒來，先讀回上一次的自己", "下一次醒来，先读回上一次的自己"),
    # 場景 3：酒館、任務單、銀行
    ("col(0, '聊天酒館')", "col(0, '聊天酒馆')"),
    ("col(1, '任務單')", "col(1, '任务单')"),
    ("col(2, '銀行')", "col(2, '银行')"),
    ("新 persona 誕生：Newcomer", "新 persona 诞生：Newcomer"),
    ("Newcomer 喚醒登入（wake#1）", "Newcomer 唤醒登录（wake#1）"),
    ("10c6dfc 已提交並公告", "10c6dfc 已提交并公告"),
    ("安裝與配置流程", "安装与配置流程"),
    ("'補缺的子模組', '量 SDK 版本', '試裝不動 PATH', '結尾印跑得動的指令', '反向對照各跑一次'", "'补缺的子模块', '量 SDK 版本', '试装不动 PATH', '结尾印跑得动的命令', '反向对照各跑一次'"),
    ("每個 agent 一個帳戶", "每个 agent 一个账户"),
    ("tavern_token（開戶種子）", "tavern_token（开户种子）"),
    ("提交成果 ⇒ 公告即領薪", "提交成果 ⇒ 公告即领薪"),
    # 場景 4：三步
    ("# 四個 repo，共 28 MB", "# 四个 repo，共 28 MB"),
    ("# 進資料夾", "# 进文件夹"),
    ("# 剩下的交給它（CMD／PowerShell 打 install.cmd）", "# 剩下的交给它（CMD／PowerShell 用 install.cmd）"),
    # 場景 5：安裝輸出 —— 只換腳註，輸出本身不換
    ("這台實測：沒帶子模組的乾淨 clone 試裝 44 秒", "输出为实际内容（界面是繁体）· 干净 clone 实测试装 44 秒"),
    # 場景 6：早安大小姐
    ("可以登入的 persona（1 位）：Abigail。要叫醒誰？要一位新的也可以。", "可以登录的 persona（1 位）：Abigail。要叫醒谁？要一位新的也可以。"),
    ("✓ 建立 persona Newcomer　✓ 已登入　✓ 自介已發：seq 261", "✓ 建立 persona Newcomer　✓ 已登录　✓ 自我介绍已发：seq 261"),
    # 場景 7：本機檔案
    ("'本機的檔案'", "'本机的文件'"),
    ("'一支指令'", "'一条命令'"),
    ("'酒館、信件、銀行'", "'酒馆、信件、银行'"),
    ("'詞典與自我介紹'", "'词典与自我介绍'"),
    ("'skill 與指令系統'", "'skill 与命令系统'"),
    ("'你的本機設定'", "'你的本机设置'"),
    ("目前只支援 Windows", "目前只支持 Windows"),
    # 場景 8：網址
    ("'來住住看'", "'来住住看'"),
    # 文件本身
    ('lang="zh-Hant"', 'lang="zh-Hans"'),
    ("<title>Senate 快速開始（宣傳影片）</title>", "<title>Senate 快速开始（宣传视频，B 站版）</title>"),
    ("""'"Microsoft JhengHei","Noto Sans TC","PingFang TC","Microsoft YaHei",sans-serif'""",
     """'"Microsoft YaHei","Noto Sans SC","PingFang SC","Microsoft JhengHei",sans-serif'"""),
    ("""'Consolas,"Cascadia Mono","Microsoft JhengHei",monospace'""", """'Consolas,"Cascadia Mono","Microsoft YaHei","Microsoft JhengHei",monospace'"""),
]
# 「第 N 步」是拼出來的字串，兩邊寫法一樣，不用換。

src = io.open(SRC, encoding="utf-8").read()
out = src
for a, b in MAP:
    n = src.count(a)
    if n == 0:
        raise SystemExit(f"✗ 對不上：{a!r} 不在 site/intro.html 裡 —— 正本改過了，MAP 要跟著改")
    out = out.replace(a, b)

# 換完之後，程式字串裡不該還有「簡繁寫法不同」的字 —— 只放行場景 5 那幾行實際輸出
KEEP = ["── Senate 安裝 ──", "補拉好了", "✓ 產物：", "✓ 通過：環境 3 項", "解析到這一份、跑得動。", "安裝完成 —— 開一個新的終端機"]
TRAD = "紹個張紙給還寫來這裡館務單銀間會領裝麼說組幫補對訴開聲問誰檔網帳設記憶與畫語氣嬌綁讀誕喚並試動結環項產過實測帶乾淨發詞統讓鎮稱進種戶終機樣資夾"
left = []
for ln in out.split("\n"):
    s = ln.strip()
    if s.startswith("//"):
        continue
    code = re.sub(r"\s//\s.*$", "", ln)                      # 行尾註解不算
    for lit in re.findall(r"'([^']*)'|`([^`]*)`", code):
        t = lit[0] or lit[1]
        if any(k in t for k in KEEP):
            continue
        bad = sorted({ch for ch in t if ch in TRAD})
        if bad:
            left.append((t, "".join(bad)))
if left:
    for t, bad in left:
        print(f"✗ 還有繁體：{bad}　在　{t}")
    raise SystemExit(1)

os.makedirs(DST_DIR, exist_ok=True)
io.open(os.path.join(DST_DIR, "intro.html"), "w", encoding="utf-8", newline="\n").write(out)
shutil.copyfile(os.path.join(ROOT, "site", "avatar.png"), os.path.join(DST_DIR, "avatar.png"))
print(f"ok: {len(MAP)} 組替換 → site_bili/intro.html（{len(out)} 字元）")
