# 用 VOICEVOX 引擎把 lines.json 的日語台詞念成 wav，量每句長度，排出 site/timeline.json（動畫照它排時間軸）。
# 引擎由本腳本自己起（127.0.0.1、指定埠）、用完自己關。
# 用法：python -I tts.py <run.exe> <lines.json> <site 資料夾>
import json, os, subprocess, sys, time, urllib.parse, urllib.request, wave

sys.stdout.reconfigure(encoding="utf-8")
RUN, LINES, SITE = sys.argv[1], sys.argv[2], os.path.abspath(sys.argv[3])
PORT = 50121
BASE = f"http://127.0.0.1:{PORT}"
TITLE_END, FIRST_AT, GAP, OUTRO_PAD, OUTRO_LEN = 3.5, 4.0, 0.7, 1.0, 3.0


def call(path, data=None, timeout=120):
    req = urllib.request.Request(BASE + path, data=data, method="POST" if data is not None else "GET",
                                 headers={"Content-Type": "application/json"} if data is not None else {})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


cfg = json.load(open(LINES, encoding="utf-8"))
proc = subprocess.Popen([RUN, "--host", "127.0.0.1", "--port", str(PORT)], cwd=os.path.dirname(RUN),
                        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    t0 = time.time()
    while True:
        try:
            ver = call("/version", timeout=5).decode()
            break
        except Exception:
            if time.time() - t0 > 240 or proc.poll() is not None:
                raise SystemExit(f"引擎沒起來（{time.time() - t0:.0f}s，exit={proc.poll()}）")
            time.sleep(1)
    print(f"engine {ver} ready in {time.time() - t0:.1f}s")
    speakers = json.loads(call("/speakers"))
    styles = {}
    for sp in speakers:
        if sp["name"] == cfg["speaker_name"]:
            styles = {st["name"]: st["id"] for st in sp["styles"]}
    if not styles:
        raise SystemExit(f"找不到角色 {cfg['speaker_name']}；有：{[s['name'] for s in speakers]}")
    print("styles:", styles)
    os.makedirs(os.path.join(SITE, "voice"), exist_ok=True)
    out, at = [], FIRST_AT
    for i, ln in enumerate(cfg["lines"]):
        sid = styles[ln["style"]]
        q = json.loads(call("/audio_query?" + urllib.parse.urlencode({"text": ln["ja_tts"], "speaker": sid}), data=b""))
        q["speedScale"] = cfg.get("speed", 1.0)
        q["prePhonemeLength"], q["postPhonemeLength"] = 0.05, 0.1
        wav = call(f"/synthesis?speaker={sid}", data=json.dumps(q).encode("utf-8"), timeout=300)
        path = os.path.join(SITE, "voice", f"line_{i + 1}.wav")
        open(path, "wb").write(wav)
        with wave.open(path) as w:
            dur = w.getnframes() / w.getframerate()
        out.append({"at": round(at, 3), "dur": round(dur, 3), "zh": ln["zh"], "ja": ln["ja"], "shy": bool(ln.get("shy")),
                    "wav": f"voice/line_{i + 1}.wav", "style": ln["style"]})
        print(f"line {i + 1}: {ln['style']} {dur:.2f}s at {at:.2f}")
        at += dur + GAP
    outro = out[-1]["at"] + out[-1]["dur"] + OUTRO_PAD
    tl = {"title_end": TITLE_END, "outro": round(outro, 3), "duration": round(outro + OUTRO_LEN, 3),
          "voice": f"VOICEVOX:{cfg['speaker_name']}", "lines": out}
    json.dump(tl, open(os.path.join(SITE, "timeline.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"timeline: outro {tl['outro']}s, duration {tl['duration']}s")
finally:
    proc.terminate()
    try:
        proc.wait(timeout=15)
    except subprocess.TimeoutExpired:
        proc.kill()
