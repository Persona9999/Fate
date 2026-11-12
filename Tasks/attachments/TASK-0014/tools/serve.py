"""開發用的本機伺服器：只送 site/ 底下的檔案，而且叫瀏覽器不要快取（改了 js 重新整理就看得到）。

    python tools/serve.py [埠號，預設 8714]

平常用不到 —— index.html 直接點兩下就能開。這支是給「用工具自動操作瀏覽器來測」的時候用的。
"""
import functools
import http.server
import os
import sys

SITE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "site")


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt, *args):
        pass


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8714
    handler = functools.partial(Handler, directory=SITE)
    with http.server.ThreadingHTTPServer(("127.0.0.1", port), handler) as srv:
        print("http://localhost:%d/index.html" % port, flush=True)
        srv.serve_forever()
