# 錄 site/intro.html：本機伺服器（只聽 127.0.0.1）＋ 無頭 Chrome（暫時 profile，不碰使用者的 Chrome）。
# 頁面把 intro.webm／thumb.png／frame_*.png POST 到 /upload，最後 POST /done；收到就關掉 Chrome。
# 用法：python -I rec.py <site 資料夾> <chrome.exe> [逾時秒數] [網址後綴，例如 ?shots=1 ＝不錄影、只抽格]
import http.server, os, shutil, subprocess, sys, tempfile, threading, time, urllib.parse

sys.stdout.reconfigure(encoding="utf-8")
ROOT = os.path.abspath(sys.argv[1])
CHROME = sys.argv[2]
TIMEOUT = float(sys.argv[3]) if len(sys.argv) > 3 else 150
OUT = os.path.join(ROOT, "out")
os.makedirs(OUT, exist_ok=True)
done = threading.Event()
logs = []


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=ROOT, **k)

    def log_message(self, *a):
        pass

    def do_POST(self):
        u = urllib.parse.urlparse(self.path)
        q = urllib.parse.parse_qs(u.query)
        body = self.rfile.read(int(self.headers.get("Content-Length", "0")))
        if u.path == "/upload":
            name = os.path.basename(q["name"][0])
            with open(os.path.join(OUT, name), "wb") as f:
                f.write(body)
            logs.append(f"saved {name} {len(body)} bytes")
        elif u.path == "/log":
            logs.append("page: " + body.decode("utf-8", "replace"))
        elif u.path == "/done":
            logs.append("done: " + body.decode("utf-8", "replace"))
            done.set()
        self.send_response(200)
        self.send_header("Content-Length", "0")
        self.end_headers()


srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), Handler)
port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
profile = tempfile.mkdtemp(prefix="yt-intro-chrome-")
args = [CHROME, "--headless=new", f"--user-data-dir={profile}", "--no-first-run", "--no-default-browser-check",
        "--autoplay-policy=no-user-gesture-required", "--window-size=1280,720",
        "--disable-background-timer-throttling", "--disable-renderer-backgrounding",
        "--disable-backgrounding-occluded-windows", f"http://127.0.0.1:{port}/intro.html" + (sys.argv[4] if len(sys.argv) > 4 else "")]
t0 = time.time()
proc = subprocess.Popen(args, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
ok = done.wait(timeout=TIMEOUT)
proc.terminate()
try:
    proc.wait(timeout=10)
except subprocess.TimeoutExpired:
    proc.kill()
srv.shutdown()
time.sleep(1.5)
shutil.rmtree(profile, ignore_errors=True)
for line in logs:
    print(line)
print(("OK" if ok else "TIMEOUT") + f" in {time.time() - t0:.1f}s; out={OUT}")
