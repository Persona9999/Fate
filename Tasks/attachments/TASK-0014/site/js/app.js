/* 黑洞模擬 —— 介面主程式：場景、控制面板、讀數、畫面迴圈
 * 物理在 physics.js，畫面在 shader.js／renderer.js；這裡只把它們接起來。
 */
(function () {
  'use strict';
  var BH = window.BH, P = BH.Physics, Renderer = BH.Renderer, Bodies = BH.Bodies;
  var DEG = Math.PI / 180;
  function $(id) { return document.getElementById(id); }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

  // ── 狀態 ────────────────────────────────────────────
  var S = {
    holes: [P.makeHole({ rs: 1 })],     // 預留：多黑洞就是這個陣列多放幾個
    rsSaved: 1,
    paused: false, speed: 2, autoSlow: true,
    disk: { on: true, rout: 12, brightness: 2.0, thick: 0.08 },
    shift: true, grid: true, stars: true, beacon: true, exposure: 1.0,
    mapOn: true,
    autoQ: true, scale: 0.75, maxSteps: 300,
    grow: false, noHole: false, ghost: true,
    launcher: { kind: 'ball', shape: 'cube', r0: 10, phi0: 0.5, incl: 0.4, speed: 0, alpha: 0, mass: 0.01, pulses: 5, color: 'green' },
    fall: { v: 0, alpha: 0 },
    unit: 'sgra', scene: 'bend'
  };
  var UNITS = {
    none: { name: '不換算', msun: 0 },
    sun10: { name: '恆星級：10 倍太陽質量', msun: 10 },
    imbh: { name: '中等質量：3 萬倍太陽質量', msun: 3e4 },
    sgra: { name: '人馬座 A*：約 430 萬倍', msun: 4.3e6 },
    m87: { name: 'M87*：約 65 億倍', msun: 6.5e9 }
  };

  var canvas = $('view'), renderer, cam, bodies, map;
  try { renderer = new Renderer(canvas); }
  catch (e) { fatal(e.message + '\n\n需要支援 WebGL2 的瀏覽器（Chrome、Edge、Firefox 的近幾年版本）。'); return; }
  cam = new BH.Camera();
  bodies = new Bodies(renderer, Renderer.TRAJ_N, Renderer.MAX_ROWS);
  map = new BH.Map2D($('map'));

  function fatal(msg) { var f = $('fatal'); f.style.display = 'flex'; f.textContent = msg; }

  var rs0 = function () { return S.holes[0].rs; };

  // ── 單位 ────────────────────────────────────────────
  function fmtLen(x) {       // x：長度（模擬單位）
    var u = UNITS[S.unit];
    if (!u.msun) return '';
    var km = x * 2.953 * u.msun;
    if (km >= 1.496e8 * 0.1) return '（' + (km / 1.496e8).toPrecision(3) + ' 天文單位）';
    if (km >= 1e6) return '（' + (km / 1e4).toPrecision(3) + ' 萬公里）';
    return '（' + km.toPrecision(3) + ' 公里）';
  }
  function fmtTime(x) {      // x：時間（模擬單位 rs/c）
    var u = UNITS[S.unit];
    if (!u.msun) return '';
    var s = Math.abs(x) * 2.953 * u.msun / 299792.458, t;
    if (s < 1e-3) t = (s * 1e6).toPrecision(3) + ' 微秒';
    else if (s < 1) t = (s * 1e3).toPrecision(3) + ' 毫秒';
    else if (s < 120) t = s.toPrecision(3) + ' 秒';
    else if (s < 7200) t = (s / 60).toPrecision(3) + ' 分鐘';
    else if (s < 172800) t = (s / 3600).toPrecision(3) + ' 小時';
    else t = (s / 86400).toPrecision(3) + ' 天';
    return '（' + t + '）';
  }

  /* 潮汐力：身高 2 公尺的人，頭跟腳的加速度差（徑向拉伸），單位 g。
   *   Δa = 2GM L / r³ = c² rs L / r³    （自由落下的人量到的也是這個值）
   * 黑洞越大，視界上的潮汐力越小（∝ 1/M²）：恆星級的在視界外很遠就把人扯碎，超大質量的可以平安穿過視界。
   * 沒選換算的質量 ⇒ 沒有公尺可以算 ⇒ null。 */
  function tidalG(r) {
    var u = UNITS[S.unit];
    if (!u.msun || !(rs0() > 0)) return null;
    var m = 2953.25 * u.msun;                 // 模擬單位 1 = 幾公尺（第 0 個洞原本的 rs）
    return 8.98755e16 * (rs0() * m) * 2 / Math.pow(r * m, 3) / 9.80665;
  }
  function fmtG(g) {
    var t = g >= 1e5 ? (g / 1e4).toPrecision(3) + ' 萬 g' : (g >= 0.01 ? g.toPrecision(3) + ' g' : g.toExponential(1) + ' g');
    return t + (g < 0.5 ? '（沒感覺）' : (g < 10 ? '（感覺得到被拉長）' : '（人撐不住）'));
  }

  // ── 控制面板 ────────────────────────────────────────
  var refreshers = [], previewDirty = true;
  function refreshAll() { for (var i = 0; i < refreshers.length; i++) refreshers[i](); previewDirty = true; }
  function section(title, open) {
    var d = document.createElement('details'); d.open = open !== false;
    var s = document.createElement('summary'); s.textContent = title;
    d.appendChild(s); $('sections').appendChild(d);
    return d;
  }
  function range(parent, o) {
    var row = document.createElement('label'); row.className = 'ctl';
    var lab = document.createElement('span'); lab.className = 'lab'; lab.textContent = o.label;
    var inp = document.createElement('input'); inp.type = 'range'; inp.min = o.min; inp.max = o.max; inp.step = o.step;
    var out = document.createElement('output');
    row.appendChild(lab); row.appendChild(inp); row.appendChild(out); parent.appendChild(row);
    refreshers.push(function () {
      var v = o.get();
      inp.value = o.to ? o.to(v) : v;
      out.textContent = o.fmt(v);
      row.style.display = (o.show && !o.show()) ? 'none' : '';
    });
    inp.addEventListener('input', function () { var v = parseFloat(inp.value); o.set(o.from ? o.from(v) : v); refreshAll(); });
    return row;
  }
  function check(parent, o) {
    var row = document.createElement('label'); row.className = 'chk';
    var inp = document.createElement('input'); inp.type = 'checkbox';
    var sp = document.createElement('span'); sp.textContent = o.label;
    row.appendChild(inp); row.appendChild(sp); parent.appendChild(row);
    refreshers.push(function () { inp.checked = !!o.get(); row.style.display = (o.show && !o.show()) ? 'none' : ''; });
    inp.addEventListener('change', function () { o.set(inp.checked); refreshAll(); });
    return row;
  }
  function btnRow(parent) { var d = document.createElement('div'); d.className = 'btnrow'; parent.appendChild(d); return d; }
  function button(parent, label, fn, cls) {
    var b = document.createElement('button'); b.textContent = label; if (cls) b.className = cls;
    b.addEventListener('click', function () { fn(); refreshAll(); });
    parent.appendChild(b);
    return b;
  }
  function note(parent, getHtml) {
    var p = document.createElement('div'); p.className = 'note'; parent.appendChild(p);
    refreshers.push(function () { var h = getHtml(); p.innerHTML = h; p.style.display = h ? '' : 'none'; });
    return p;
  }
  var deg = function (v) { return (v / DEG).toFixed(0) + '°'; };

  // 讓光剛好擦過光子球的發射角：sin α = k b_c √(1 − rs/r0) / r0
  function grazeAlpha(r0, k) {
    var rs = rs0() || 1;
    return Math.asin(clamp(k * P.B_CRIT * rs * Math.sqrt(Math.max(0, 1 - rs / r0)) / r0, -1, 1));
  }

  function buildPanel() {
    var L = S.launcher, s, r;
    // 最上面一排常用開關（「顯示」裡也有同樣的勾選）
    var quick = $('quick');
    [['參考格線（G）', 'grid'], ['星空', 'stars']].forEach(function (q) {
      var qb = button(quick, q[0], function () { S[q[1]] = !S[q[1]]; });
      refreshers.push(function () { qb.className = S[q[1]] ? 'on' : ''; });
    });
    var qd = button(quick, '吸積盤', function () { S.disk.on = !S.disk.on; });
    refreshers.push(function () { qd.className = S.disk.on ? 'on' : ''; });      // ⚠ S.launcher 這個物件不能整個換掉（按鈕抓的是它），要改用 Object.assign

    s = section('時間');
    r = btnRow(s);
    var pauseBtn = button(r, '', function () { S.paused = !S.paused; });
    refreshers.push(function () { pauseBtn.textContent = S.paused ? '▶ 繼續' : '⏸ 暫停'; pauseBtn.className = S.paused ? 'on' : ''; });
    range(s, { label: '快慢', min: -1.3, max: 1.3, step: 0.05, get: function () { return S.speed; }, set: function (v) { S.speed = v; },
      to: function (v) { return Math.log10(v); }, from: function (v) { return Math.pow(10, v); },
      fmt: function (v) { return '每秒 ' + (v < 1 ? v.toFixed(2) : v.toFixed(1)); } });
    note(s, function () { return '時間單位是 rs/c（光走過一個史瓦西半徑的時間），算的是觀察者自己的時間。'; });

    s = section('觀察者');
    range(s, { label: '距離 r', min: Math.log(1.05), max: Math.log(80), step: 0.01, show: function () { return cam.mode === 'static'; },
      get: function () { return cam.r; }, set: function (v) { cam.r = Math.max(v, cam.minRadius(S.holes)); },
      to: Math.log, from: Math.exp, fmt: function (v) { return (v / (rs0() || 1)).toFixed(2) + ' rs'; } });
    range(s, { label: '仰角', min: -89, max: 89, step: 1, show: function () { return cam.mode === 'static'; },
      get: function () { return 90 - cam.theta / DEG; }, set: function (v) { cam.theta = (90 - v) * DEG; },
      fmt: function (v) { return v.toFixed(0) + '°'; } });
    range(s, { label: '視角', min: 20, max: 150, step: 1, get: function () { return cam.fov; }, set: function (v) { cam.fov = v; },
      fmt: function (v) { return v.toFixed(0) + '°'; } });
    r = btnRow(s);
    button(r, '看黑洞', function () { cam.yaw = 0; cam.pitch = 0; });
    button(r, '看側面', function () { cam.yaw = Math.PI / 2; cam.pitch = 0; });
    button(r, '看外面', function () { cam.yaw = Math.PI; cam.pitch = 0; });
    range(s, { label: '落下初速', min: 0, max: 0.95, step: 0.01, show: function () { return cam.mode === 'static'; },
      get: function () { return S.fall.v; }, set: function (v) { S.fall.v = v; }, fmt: function (v) { return v.toFixed(2) + ' c'; } });
    range(s, { label: '初速方向', min: 0, max: 180, step: 1, show: function () { return cam.mode === 'static' && S.fall.v > 0; },
      get: function () { return S.fall.alpha / DEG; }, set: function (v) { S.fall.alpha = v * DEG; },
      fmt: function (v) { return v === 0 ? '朝黑洞' : (v === 90 ? '切向' : v.toFixed(0) + '°'); } });
    r = btnRow(s);
    var b1 = button(r, '從靜止', function () { S.fall.v = 0; S.fall.alpha = 0; });
    var b2 = button(r, '像雨滴（從無限遠掉下來的速度）', function () { S.fall.v = Math.min(0.95, P.vEsc(cam.r, rs0())); S.fall.alpha = 0; });
    refreshers.push(function () { b1.style.display = b2.style.display = cam.mode === 'static' ? '' : 'none'; });
    var fallBtn = button(s, '', function () { if (cam.mode === 'static') startFall(); else backToHover(); }, 'big');
    refreshers.push(function () { fallBtn.textContent = cam.mode === 'static' ? '從這裡掉下去' : '回到懸停'; });
    check(s, { label: '快到奇異點時自動放慢', get: function () { return S.autoSlow; }, set: function (v) { S.autoSlow = v; } });

    s = section('拋射器');
    r = btnRow(s);
    var kb = button(r, '物體', function () { L.kind = 'ball'; }), kl = button(r, '光束', function () { L.kind = 'light'; });
    refreshers.push(function () { kb.className = S.launcher.kind === 'ball' ? 'on' : ''; kl.className = S.launcher.kind === 'light' ? 'on' : ''; });
    range(s, { label: '發射點 r', min: 1.2, max: 30, step: 0.1, get: function () { return S.launcher.r0; }, set: function (v) { S.launcher.r0 = v; }, fmt: function (v) { return (v / (rs0() || 1)).toFixed(1) + ' rs'; } });
    range(s, { label: '方位角', min: -180, max: 180, step: 1, get: function () { return S.launcher.phi0 / DEG; }, set: function (v) { S.launcher.phi0 = v * DEG; }, fmt: function (v) { return v.toFixed(0) + '°'; } });
    range(s, { label: '軌道傾角', min: 0, max: 90, step: 1, get: function () { return S.launcher.incl / DEG; }, set: function (v) { S.launcher.incl = v * DEG; }, fmt: function (v) { return v.toFixed(0) + '°'; } });
    range(s, { label: '速度', min: 0, max: 0.99, step: 0.005, show: function () { return S.launcher.kind === 'ball'; },
      get: function () { return S.launcher.speed; }, set: function (v) { S.launcher.speed = v; }, fmt: function (v) { return v.toFixed(3) + ' c'; } });
    range(s, { label: '方向', min: -180, max: 180, step: 0.5, get: function () { return S.launcher.alpha / DEG; }, set: function (v) { S.launcher.alpha = v * DEG; },
      fmt: function (v) { return v === 0 ? '朝黑洞' : (Math.abs(v) === 90 ? '切向' : (Math.abs(v) === 180 ? '朝外' : v.toFixed(1) + '°')); } });
    range(s, { label: '質量', min: -3, max: -0.7, step: 0.02, show: function () { return S.launcher.kind === 'ball'; },
      get: function () { return S.launcher.mass; }, set: function (v) { S.launcher.mass = v; },
      to: function (v) { return Math.log10(v); }, from: function (v) { return Math.pow(10, v); },
      fmt: function (v) { return '黑洞的 ' + (v * 100).toPrecision(2) + '%'; } });
    range(s, { label: '連發', min: 1, max: 8, step: 1, show: function () { return S.launcher.kind === 'light'; },
      get: function () { return S.launcher.pulses; }, set: function (v) { S.launcher.pulses = v; }, fmt: function (v) { return v + ' 顆'; } });
    var srow = document.createElement('label'); srow.className = 'ctl';
    srow.innerHTML = '<span class="lab">形狀</span>';
    var ssel = document.createElement('select');
    [['cube', '發光的立方體'], ['ball', '發光的球']].forEach(function (c) { var o = document.createElement('option'); o.value = c[0]; o.textContent = c[1]; ssel.appendChild(o); });
    ssel.addEventListener('change', function () { S.launcher.shape = ssel.value; });
    srow.appendChild(ssel); s.appendChild(srow);
    refreshers.push(function () { ssel.value = S.launcher.shape || 'cube'; srow.style.display = S.launcher.kind === 'ball' ? '' : 'none'; });
    var crow = document.createElement('label'); crow.className = 'ctl';
    crow.innerHTML = '<span class="lab">顏色</span>';
    var sel = document.createElement('select');
    [['green', '綠'], ['red', '紅'], ['blue', '藍'], ['white', '白']].forEach(function (c) { var o = document.createElement('option'); o.value = c[0]; o.textContent = c[1]; sel.appendChild(o); });
    sel.addEventListener('change', function () { S.launcher.color = sel.value; });
    crow.appendChild(sel); s.appendChild(crow);
    refreshers.push(function () { sel.value = S.launcher.color; crow.style.display = S.launcher.kind === 'light' ? '' : 'none'; });
    r = btnRow(s);
    button(r, '靜止釋放', function () { L.kind = 'ball'; L.speed = 0; L.alpha = 0; });
    button(r, '圓軌道', function () { L.kind = 'ball'; if (L.r0 < 2) L.r0 = 4; L.speed = Math.min(0.99, P.vCirc(L.r0, rs0()) || 0); L.alpha = 90 * DEG; });
    button(r, '慢一點（會掉進去）', function () { L.kind = 'ball'; if (L.r0 < 2) L.r0 = 6; L.speed = 0.6 * (P.vCirc(L.r0, rs0()) || 0); L.alpha = 90 * DEG; });
    r = btnRow(s);
    button(r, '光：直射', function () { L.kind = 'light'; L.alpha = 0; });
    button(r, '光：擦過光子球', function () { L.kind = 'light'; if (L.r0 < 4) L.r0 = 12; L.alpha = grazeAlpha(L.r0, 1.03); });
    button(r, '光：差一點被抓', function () { L.kind = 'light'; if (L.r0 < 4) L.r0 = 12; L.alpha = grazeAlpha(L.r0, 1.0015); });
    note(s, function () {
      var rs = rs0(), r0 = S.launcher.r0, t = '';
      if (rs > 0 && S.launcher.kind === 'ball') {
        var vc = P.vCirc(r0, rs);
        t += '這個位置：' + (vc ? '圓軌道速度 <b>' + vc.toFixed(3) + ' c</b>' + (r0 < 3 * rs ? '（不穩定）' : '') : '沒有圓軌道（在光子球以內）') +
          '、逃逸速度 <b>' + P.vEsc(r0, rs).toFixed(3) + ' c</b>。<br>';
      }
      if (preview) {
        var f = preview.fate;
        t += '預測：' + (f === 'singularity' ? '<b>會掉進去</b>（最近 ' + (preview.rMin / (rs || 1)).toFixed(2) + ' rs' + (preview.crossTau !== null && S.launcher.kind === 'ball' ? '，它自己的時間 ' + preview.crossTau.toFixed(1) + ' 後過視界' : '') + '）'
          : (f === 'escape' ? '<b>會飛走</b>（最近到 ' + (preview.rMin / (rs || 1)).toFixed(2) + ' rs）' : '<b>留下來繞</b>（最近到 ' + (preview.rMin / (rs || 1)).toFixed(2) + ' rs）'));
      }
      return t;
    });
    button(s, '發射（L）', function () { fire(S.launcher); }, 'big');
    r = btnRow(s);
    button(r, '全部清掉', function () { bodies.clear(); });
    check(s, { label: '物體一閃一閃（照它自己的時間，每 2 rs/c 閃一次）', get: function () { return S.beacon; }, set: function (v) { S.beacon = v; } });
    check(s, { label: '畫出重影（光繞過黑洞另一側才到的像）', get: function () { return S.ghost; }, set: function (v) { S.ghost = v; } });
    check(s, { label: '黑洞吃了物體會變重（近似）', get: function () { return S.grow; }, set: function (v) { S.grow = v; } });
    note(s, function () { return '同一個物體會看到兩個以上的像：一個是直接看到的，另一個是光從黑洞另一側繞過來的（比較小、在影子的另一邊）。這是重力透鏡，不是畫錯；吸積盤背面被彎到上面來也是同一回事。<br>路徑跟質量無關（等效原理）；質量只決定畫出來多大，以及黑洞吃掉之後長多少。'; });

    s = section('顯示', false);
    check(s, { label: '吸積盤', get: function () { return S.disk.on; }, set: function (v) { S.disk.on = v; } });
    range(s, { label: '盤外半徑', min: 4, max: 30, step: 0.5, show: function () { return S.disk.on; }, get: function () { return S.disk.rout; }, set: function (v) { S.disk.rout = v; }, fmt: function (v) { return (v / (rs0() || 1)).toFixed(1) + ' rs'; } });
    range(s, { label: '盤厚度', min: 0, max: 0.25, step: 0.01, show: function () { return S.disk.on; }, get: function () { return S.disk.thick; }, set: function (v) { S.disk.thick = v; },
      fmt: function (v) { return v === 0 ? '薄盤' : '半徑的 ' + Math.round(v * 100) + '%'; } });
    range(s, { label: '盤亮度', min: 0.2, max: 4, step: 0.1, show: function () { return S.disk.on; }, get: function () { return S.disk.brightness; }, set: function (v) { S.disk.brightness = v; }, fmt: function (v) { return v.toFixed(1); } });
    check(s, { label: '背景的參考格線（每 15°）', get: function () { return S.grid; }, set: function (v) { S.grid = v; } });
    check(s, { label: '星空', get: function () { return S.stars; }, set: function (v) { S.stars = v; } });
    check(s, { label: '都卜勒與重力紅移著色', get: function () { return S.shift; }, set: function (v) { S.shift = v; } });
    range(s, { label: '曝光', min: 0.2, max: 4, step: 0.1, get: function () { return S.exposure; }, set: function (v) { S.exposure = v; }, fmt: function (v) { return v.toFixed(1); } });
    check(s, { label: '俯視圖', get: function () { return S.mapOn; }, set: function (v) { S.mapOn = v; $('mapwrap').style.display = v ? '' : 'none'; } });
    check(s, { label: '自動調整解析度', get: function () { return S.autoQ; }, set: function (v) { S.autoQ = v; } });
    range(s, { label: '解析度', min: 0.25, max: 1, step: 0.05, get: function () { return S.scale; }, set: function (v) { S.scale = v; S.autoQ = false; }, fmt: function (v) { return Math.round(v * 100) + '%'; } });
    range(s, { label: '步數上限', min: 100, max: 700, step: 20, get: function () { return S.maxSteps; }, set: function (v) { S.maxSteps = v; }, fmt: function (v) { return v.toFixed(0); } });
    check(s, { label: '把黑洞拿掉（對照：光走直線）', get: function () { return S.noHole; }, set: setNoHole });
    var urow = document.createElement('label'); urow.className = 'ctl';
    urow.innerHTML = '<span class="lab">換算成</span>';
    var usel = document.createElement('select'); usel.style.gridColumn = '2 / 4';
    Object.keys(UNITS).forEach(function (k) { var o = document.createElement('option'); o.value = k; o.textContent = UNITS[k].name; usel.appendChild(o); });
    usel.addEventListener('change', function () { S.unit = usel.value; });
    urow.appendChild(usel); s.appendChild(urow);
    refreshers.push(function () { usel.value = S.unit; });
  }

  // ── 動作 ────────────────────────────────────────────
  var preview = null, lastFrame = null;

  function fire(spec) {
    var cf = lastFrame || cam.frame(S.holes);
    var n = bodies.spawn(S.holes, spec, cam.t, cf.pos, cf.insideHorizon);
    if (!n) toast('發射點在視界裡面，射不出來');
    return n;
  }

  function startFall() {
    if (!cam.startFall(S.holes, S.fall.v, S.fall.alpha)) { toast('這個位置沒辦法放手'); return; }
    hideOverlay();
    var f = cam.plan.fate;
    toast(f === 'singularity' ? '放手了：照自己的時間，' + (cam.plan.TAU[cam.plan.n - 1] - cam.tau).toFixed(1) + ' rs/c 之後到奇異點'
      : '放手了：這條軌道不會掉進去');
  }
  function backToHover() { cam.hover(S.holes, 12); cam.yaw = 0; cam.pitch = 0; hideOverlay(); }

  function setNoHole(on) {
    if (on === S.noHole) return;
    S.noHole = on;
    if (on) { S.rsSaved = S.holes[0].rs; S.holes[0].rs = 0; } else S.holes[0].rs = S.rsSaved;
    metricChanged();
    toast(on ? '黑洞拿掉了：光走直線、東西不會掉下去' : '黑洞放回來了');
  }
  function growHole(frac) {
    S.holes[0].rs *= (1 + frac);
    metricChanged();
    toast('黑洞吃進一個物體：質量變成原本的 ' + (S.holes[0].rs / 1).toFixed(3) + ' 倍');
  }
  // 度規換了：還在飛的東西、落下中的攝影機、俯視圖的示範光束都要重算
  function metricChanged() {
    if (cam.mode === 'end') cam.hover(S.holes, 12);
    bodies.replan(S.holes, cam.t);
    cam.renormalize(S.holes);
    map.buildBeams(S.holes);
    previewDirty = true;
  }

  var CAPTIONS = {
    bend: '<b>光線彎曲。</b>中間的黑色圓不是黑洞本身，是它的「影子」：往那個範圍裡瞄的光都回不來，半徑大約 2.6 rs。' +
      '吸積盤在黑洞後面的那一半被彎上來，所以看起來像一道拱；影子邊緣那圈細亮線是繞了黑洞半圈以上才到你眼睛的光。' +
      '右下角的俯視圖畫的是一排平行光各自被彎成什麼樣子：紅的被抓住，藍的逃走。',
    drop: '<b>把東西丟進去。</b>你站在遠處看：物體越靠近視界就越慢、越紅、越暗，自轉與閃光都越來越慢 —— 你永遠看不到它穿過去。' +
      '可是照它自己的時間，它很快就過去了。俯視圖上空心圈是它在座標上現在的位置，實心的是你此刻看到的位置，兩個會越離越遠。' +
      '一個物體會看到不只一個像（另一個在影子的另一側，是光繞過黑洞才到的）。左邊的拋射器可以換速度、方向、質量、形狀，也可以打光束。',
    fall: '<b>自己掉進去。</b>按「從這裡掉下去」。通過視界的那一刻身邊沒有任何記號，外面的天空也不會突然消失；黑色的範圍一路變大，' +
      '過視界時它的角半徑大約 44°，到奇異點前接近 90°（半邊天），但不會把你整個包住。拖曳可以轉頭：正後方的星空越來越紅、越來越暗，' +
      '跟墜落方向垂直的那一圈越來越藍、越來越亮。能不能活著穿過視界看黑洞多大 —— 右上角的「潮汐力」會告訴你（「顯示」裡可以換黑洞的質量）。'
  };

  function setScene(name) {
    S.scene = name;
    bodies.clear();
    hideOverlay();
    if (cam.mode !== 'static') cam.hover(S.holes, 16);
    cam.yaw = 0; cam.pitch = 0; cam.trail = [];
    var rs = rs0() || 1;
    if (name === 'bend') {
      cam.r = 16; cam.theta = 76 * DEG; cam.phi = 0.6; cam.fov = 60;
      S.disk.on = true; map.showBeams = true; S.speed = 2;
      Object.assign(S.launcher, { kind: 'light', r0: 14, phi0: 2.5, incl: 0.3, speed: 0, alpha: 0, mass: 0.01, pulses: 6, color: 'green' });
      S.launcher.alpha = grazeAlpha(14, 1.03);
    } else if (name === 'drop') {
      cam.r = 22; cam.theta = 62 * DEG; cam.phi = 0.6; cam.fov = 60;
      S.disk.on = false; map.showBeams = false; S.beacon = true; S.speed = 2.5;
      fire({ kind: 'ball', shape: 'cube', r0: 9, phi0: 0.6 + 1.5, incl: 0.3, speed: 0, alpha: 0, mass: 0.01 });
      fire({ kind: 'ball', shape: 'cube', r0: 8, phi0: 0.6 - 1.2, incl: 0.2, speed: 0.62 * P.vCirc(8, rs), alpha: 90 * DEG, mass: 0.03 });
      fire({ kind: 'ball', shape: 'cube', r0: 6, phi0: 0.6 + 0.4, incl: 0.5, speed: P.vCirc(6, rs), alpha: 90 * DEG, mass: 0.004 });
      Object.assign(S.launcher, { kind: 'ball', shape: 'cube', r0: 10, phi0: 0.6 - 1.5, incl: 0.3, speed: 0, alpha: 0, mass: 0.01, pulses: 5, color: 'green' });
    } else {
      cam.r = 12; cam.theta = 74 * DEG; cam.phi = 0.6; cam.fov = 100;
      S.disk.on = true; map.showBeams = false; S.speed = 1.5;
      S.fall = { v: 0, alpha: 0 };
    }
    $('caption').innerHTML = CAPTIONS[name];
    var bs = document.querySelectorAll('[data-scene]');
    for (var i = 0; i < bs.length; i++) bs[i].className = bs[i].getAttribute('data-scene') === name ? 'on' : '';
    $('mapBeams').className = map.showBeams ? 'on' : '';
    refreshAll();
  }

  var toastTimer = 0;
  function toast(msg) { var t = $('toast'); t.textContent = msg; t.className = 'box show'; clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.className = 'box'; }, 3800); }
  function showOverlay(title, html) { $('ovTitle').textContent = title; $('ovText').innerHTML = html; $('overlay').className = 'show'; }
  function hideOverlay() { $('overlay').className = ''; }

  // ── 一格畫面 ────────────────────────────────────────
  function buildFrame(cf, w, h) {
    var rs = rs0(), rc = Math.hypot(cf.pos[0], cf.pos[1], cf.pos[2]);
    var dt = cam.t % Renderer.DISK_T; if (dt < 0) dt += Renderer.DISK_T;
    var rin = 3 * (rs > 0 ? rs : 1);
    return {
      width: w, height: h, tanFov: Math.tan(cam.fov * DEG / 2), camPos: cf.pos, P: cf.P,
      camInside: cf.nearHorizon, energyTest: S.holes.length === 1,
      holes: S.holes, far: Math.max(60, rc * 1.08 + 6), maxSteps: S.maxSteps, stepScale: 1,
      disk: { on: S.disk.on, rin: rin, rout: Math.max(S.disk.rout, rin * 1.2), brightness: S.disk.brightness, thick: S.disk.thick },
      diskTime: dt, flags: [S.shift ? 1 : 0, S.grid ? 1 : 0, S.stars ? 1 : 0, S.beacon ? 1 : 0],
      exposure: S.exposure, beaconPeriod: 2.0, ghost: S.ghost, debug: false, bodies: bodies.uniforms(cam.t, cf.nearHorizon || cf.ratio < 3)
    };
  }

  function updatePreview() {
    previewDirty = false;
    preview = Bodies.plan(S.holes, S.launcher, 0);
  }

  function updateHud(cf) {
    var rs = rs0(), unitR = rs > 0 ? rs : 1, h = '';
    var mode = cam.mode === 'static' ? '懸停（用火箭撐著）' : (cam.mode === 'end' ? '到奇異點了' : (cf.insideHorizon ? '<b style="color:#ffb454">自由落下 —— 已經在視界裡面</b>' : '自由落下'));
    h += '<div><span class="k">狀態</span>' + mode + '</div>';
    h += '<div><span class="k">距離 r</span>' + (cf.r / unitR).toFixed(cf.r < 2 ? 3 : 2) + ' rs ' + fmtLen(cf.r) + '</div>';
    h += '<div><span class="k">自己的時間 τ</span>' + cam.tau.toFixed(1) + ' ' + fmtTime(cam.tau) + '</div>';
    h += '<div><span class="k">座標時間 t</span>' + cam.t.toFixed(1) + '</div>';
    h += '<div><span class="k">時間流速</span>' + (cam.mode === 'static' ? '你過 1，遠處過 ' + (1 / cf.rate).toFixed(3) : 'dτ/dt = ' + cf.rate.toFixed(3)) + '</div>';
    if (cam.mode !== 'static') {
      h += '<div><span class="k">速度</span>' + (cf.v === null ? '視界內沒有「靜止的人」可以比' : cf.v.toFixed(4) + ' c（相對懸停的人）') + '</div>';
      if (cam.plan && cam.plan.fate === 'singularity') {
        var rem = cam.plan.TAU[cam.plan.n - 1] - cam.tau;
        h += '<div><span class="k">到奇異點還有</span>' + Math.max(0, rem).toFixed(rem < 3 ? 3 : 1) + ' ' + fmtTime(rem) + '</div>';
      } else if (cam.plan) h += '<div><span class="k">這條軌道</span>不會掉進去</div>';
      if (cam.crossTau !== null) h += '<div><span class="k">過視界時</span>τ = ' + cam.crossTau.toFixed(2) + '</div>';
    }
    var tg = tidalG(cf.r);
    if (tg !== null) h += '<div><span class="k">潮汐力</span>' + fmtG(tg) + '</div>';
    if (rs > 0 && Math.abs(rs - 1) > 1e-6) h += '<div><span class="k">黑洞質量</span>原本的 ' + rs.toFixed(3) + ' 倍</div>';
    // 拋進去的東西（一發光束只列第一顆）
    var rows = '';
    for (var i = 0; i < bodies.list.length; i++) {
      var b = bodies.list[i];
      if (b.pulse !== 0) continue;
      var col = 'rgb(' + Math.round(b.color[0] * 255) + ',' + Math.round(b.color[1] * 255) + ',' + Math.round(b.color[2] * 255) + ')';
      var seenR = b.seen ? Math.hypot(b.seen.x - S.holes[0].pos[0], b.seen.y - S.holes[0].pos[1], b.seen.z - S.holes[0].pos[2]) / unitR : null;
      var stt;
      if (!b.seen) stt = '光還沒到你這裡';
      else if (b.tr.crossT !== null && cam.t >= b.tr.crossT) stt = cf.insideHorizon ? '已經進視界' : '其實已經進視界了，你看到的是它停在視界前';
      else if (b.tr.fate === 'escape') stt = '會飛走';
      else if (b.tr.fate === 'singularity') stt = '正在掉';
      else stt = '繞行中';
      rows += '<div class="body"><span class="dot" style="background:' + col + '"></span>' + (b.kind === 'light' ? '光束' : '物體') +
        '　' + (seenR === null ? '—' : '看到在 r = ' + seenR.toFixed(seenR < 2 ? 3 : 1) + ' rs') +
        (b.kind === 'ball' && b.seen ? '　它的鐘 ' + (b.seen.tau).toFixed(1) : '') + '<div class="small">' + stt + '</div></div>';
    }
    if (rows) h += '<div class="bodies">' + rows + '</div>';
    h += '<div class="small">' + Math.round(1000 / fpsAvg) + ' fps　' + canvas.width + '×' + canvas.height + '　解析度 ' + Math.round(S.scale * 100) + '%　主程式 ' + jsMs.toFixed(1) + ' ms（俯視圖 ' + mapMs.toFixed(1) + '）' +
      (renderer.lastCompileMs > 400 ? '　著色器編譯 ' + Math.round(renderer.lastCompileMs) + ' ms' : '') + '</div>';
    $('hud').innerHTML = h;
  }

  var last = performance.now(), fpsAvg = 16.7, hudT = 0, frameNo = 0, errShown = false;
  var jsMs = 0, mapMs = 0, lastDrop = -1e9, dropCheck = null, autoHold = 0;      // 每一格主程式花的時間（毫秒，平滑過）；其中俯視圖花的
  function tick(now) {
    requestAnimationFrame(tick);
    var dtWall = Math.min(0.1, (now - last) / 1000); last = now;
    fpsAvg = fpsAvg * 0.93 + dtWall * 1000 * 0.07;
    frameNo++;
    var tJs = performance.now();
    try {
      if (!S.paused) {
        var sp = S.speed;
        if (S.autoSlow && cam.mode === 'fall' && cam.plan && cam.plan.fate === 'singularity') {
          var rem = cam.plan.TAU[cam.plan.n - 1] - cam.tau;
          sp = Math.min(sp, Math.max(0.04, rem / 5));
        }
        var ev = cam.advance(S.holes, dtWall * sp);
        for (var i = 0; i < ev.length; i++) {
          if (ev[i] === 'cross') {
            var tgc = tidalG(rs0());
            toast('剛剛通過視界 —— 身邊沒有任何記號' + (tgc === null ? '' : (tgc < 10 ? '；潮汐力 ' + fmtG(tgc) + '，人還好好的' : '；不過潮汐力 ' + fmtG(tgc) + '，人早就被扯碎了')) + '。拖曳可以轉頭看外面');
          }
          if (ev[i] === 'far') toast('飛得太遠了，先停在這裡');
          if (ev[i] === 'end') {
            showOverlay('到這裡為止', '你到了 r = 0.02 rs，模擬停在這裡。不管黑洞多大，到奇異點前大約 0.1 秒潮汐力都會大到把人扯碎；再往裡面，這組方程式本身也不適用了。<br>' +
              '從放手到這裡，你自己的時間過了 <b>' + (cam.tau - cam.fallTau0).toFixed(2) + ' rs/c</b> ' + fmtTime(cam.tau - cam.fallTau0) +
              (cam.crossTau !== null ? '；其中通過視界之後只有 <b>' + (cam.tau - cam.crossTau).toFixed(3) + ' rs/c</b> ' + fmtTime(cam.tau - cam.crossTau) : '') + '。');
          }
          refreshAll();
        }
      }
      var cf = cam.frame(S.holes);
      lastFrame = cf;
      var absorbed = bodies.update(S.holes, cam.t, cf.pos, cf.insideHorizon);
      if (S.grow && !S.noHole && absorbed.length) {
        var add = 0;
        for (var k = 0; k < absorbed.length; k++) add += absorbed[k].mass * absorbed[k].e;
        growHole(add);
        cf = lastFrame = cam.frame(S.holes);
      }
      if (previewDirty) { updatePreview(); for (var q = 0; q < refreshers.length; q++) refreshers[q](); }
      var w = Math.max(160, Math.round(canvas.clientWidth * S.scale)), h = Math.max(90, Math.round(canvas.clientHeight * S.scale));
      renderer.resize(w, h);
      renderer.draw(buildFrame(cf, w, h));
      if (S.mapOn && (frameNo & 1)) {              // 俯視圖隔一格畫一次就夠了
        var tMap = performance.now();
        var aim = Bodies.aim(S.holes, S.launcher);
        map.draw({ holes: S.holes, tCam: cam.t, disk: { on: S.disk.on, rin: 3 * (rs0() || 1), rout: S.disk.rout },
          cam: { pos: cf.pos, fwd: cf.fwd, mode: cam.mode, plan: cam.plan, trail: cam.trail, fov: cam.fov },
          bodies: bodies.list, preview: preview, aim: aim, kind: S.launcher.kind });
        mapMs = mapMs * 0.9 + (performance.now() - tMap) * 0.1;
      }
      if (now - hudT > 120) { hudT = now; updateHud(cf); }
      /* 自動調解析度：跟不上螢幕更新率（一格超過 21 毫秒）就降一級；很順、而且上次降完過了一陣子，才試著升回去。
       * 降了之後過 60 格回頭看：沒有變快 ⇒ 慢的原因不是畫面太大（例如分頁在背景、螢幕本來就 30 Hz）⇒ 把解析度還回去，30 秒內不再動。 */
      if (S.autoQ && frameNo % 30 === 0 && frameNo > autoHold) {
        if (dropCheck && frameNo - lastDrop >= 60) {
          if (fpsAvg > dropCheck.ms * 0.9) { S.scale = dropCheck.scale; autoHold = frameNo + 1800; refreshQuality(); }
          dropCheck = null;
        } else if (!dropCheck && fpsAvg > 21 && S.scale > 0.35) {
          dropCheck = { ms: fpsAvg, scale: S.scale };
          S.scale = Math.max(0.35, S.scale * 0.85); lastDrop = frameNo; refreshQuality();
        } else if (!dropCheck && fpsAvg < 17.4 && S.scale < 1 && frameNo - lastDrop > 600) { S.scale = Math.min(1, S.scale * 1.06); refreshQuality(); }
      }
      jsMs = jsMs * 0.9 + (performance.now() - tJs) * 0.1;
    } catch (e) {
      if (!errShown) { errShown = true; fatal('執行時出錯：\n' + (e && e.stack ? e.stack : e)); }
      throw e;
    }
  }
  function refreshQuality() { for (var i = 0; i < refreshers.length; i++) refreshers[i](); }

  // ── 滑鼠、鍵盤 ──────────────────────────────────────
  var drag = null;
  canvas.addEventListener('pointerdown', function (e) {
    canvas.setPointerCapture(e.pointerId);
    drag = { x: e.clientX, y: e.clientY, look: e.button === 2 || e.shiftKey || cam.mode !== 'static' };
  });
  canvas.addEventListener('pointermove', function (e) {
    if (!drag) return;
    var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    drag.x = e.clientX; drag.y = e.clientY;
    if (drag.look) {
      var k = cam.fov * DEG / canvas.clientHeight;
      cam.yaw -= dx * k;
      if (cam.yaw > Math.PI) cam.yaw -= 2 * Math.PI; else if (cam.yaw < -Math.PI) cam.yaw += 2 * Math.PI;
      cam.pitch = clamp(cam.pitch + dy * k, -1.55, 1.55);
    } else {
      cam.phi += dx * 0.005;
      cam.theta = clamp(cam.theta - dy * 0.005, 0.03, Math.PI - 0.03);
      refreshQuality();
    }
  });
  canvas.addEventListener('pointerup', function () { drag = null; });
  canvas.addEventListener('pointercancel', function () { drag = null; });
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  canvas.addEventListener('dblclick', function () { cam.yaw = 0; cam.pitch = 0; });
  canvas.addEventListener('wheel', function (e) {
    e.preventDefault();
    if (cam.mode === 'static') cam.r = clamp(cam.r * Math.exp(e.deltaY * 0.001), cam.minRadius(S.holes), 200);
    else cam.fov = clamp(cam.fov * Math.exp(e.deltaY * 0.0008), 20, 150);
    refreshQuality();
  }, { passive: false });
  window.addEventListener('keydown', function (e) {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT')) { if (e.code !== 'Space') return; }
    if (e.code === 'Space') { S.paused = !S.paused; e.preventDefault(); }
    else if (e.key === '1') setScene('bend');
    else if (e.key === '2') setScene('drop');
    else if (e.key === '3') setScene('fall');
    else if (e.key === 'g' || e.key === 'G') S.grid = !S.grid;
    else if (e.key === 'l' || e.key === 'L') fire(S.launcher);
    else if (e.key === 'f' || e.key === 'F') { if (cam.mode === 'static') startFall(); }
    else if (e.key === 'h' || e.key === 'H') { if (cam.mode !== 'static') backToHover(); }
    else return;
    refreshAll();
  });

  var sb = document.querySelectorAll('[data-scene]');
  for (var si = 0; si < sb.length; si++) (function (b) { b.addEventListener('click', function () { setScene(b.getAttribute('data-scene')); }); })(sb[si]);
  $('panelToggle').addEventListener('click', function () { $('panel').classList.toggle('closed'); });
  $('mapSize').addEventListener('click', function () { $('mapwrap').classList.toggle('big'); });
  $('mapBeams').addEventListener('click', function () { map.showBeams = !map.showBeams; $('mapBeams').className = map.showBeams ? 'on' : ''; });
  $('ovAgain').addEventListener('click', function () { setScene('fall'); startFall(); refreshAll(); });
  $('ovBack').addEventListener('click', function () { backToHover(); refreshAll(); });
  map.onAim = function (p) { for (var k in p) S.launcher[k] = p[k]; if (p.speed != null && S.launcher.kind === 'light') S.launcher.speed = 0; refreshAll(); };
  map.onFire = function () { fire(S.launcher); refreshAll(); };

  // ── 用顯示卡算的自我測試（?selftest=1）──────────────
  function gpuTests() {
    var rows = [], size = 512, T = BH.SelfTest, H = [P.makeHole({ rs: 1 })];
    // numericOnly = true ⇒ 關掉「用守恆量判斷」那條捷徑，影子的邊界完全由數值積分決定（驗的是積分器本身）
    function shot(c, fovDeg, holes, numericOnly) {
      var cf = c.frame(holes), rc = Math.hypot(cf.pos[0], cf.pos[1], cf.pos[2]);
      var px = renderer.renderToPixels({
        tanFov: Math.tan(fovDeg * DEG / 2), camPos: cf.pos, P: cf.P, camInside: cf.nearHorizon, energyTest: !numericOnly,
        holes: holes, far: Math.max(60, rc * 1.08 + 6), maxSteps: 700, stepScale: 0.5,
        disk: { on: false, rin: 3, rout: 12, brightness: 1 }, diskTime: 0, flags: [0, 0, 0, 0], exposure: 1, beaconPeriod: 2, debug: true, bodies: []
      }, size);
      var black = 0, red = 0;
      for (var i = 0; i < size * size; i++) { if (px[i * 4] < 128) black++; else if (px[i * 4 + 1] < 128) red++; }
      return { black: black, red: red, radiusPx: Math.sqrt(black / Math.PI) };
    }
    function wantPx(psi, fovDeg) { return Math.tan(psi) / Math.tan(fovDeg * DEG / 2) * size / 2; }
    function staticCam(r) { var c = new BH.Camera(); c.r = r; c.theta = 1.2; c.phi = 0.4; return c; }
    function rainCam(rTarget) {
      var s = P.launch(H, [10 * Math.sin(1.2) * Math.cos(0.4), 10 * Math.cos(1.2), 10 * Math.sin(1.2) * Math.sin(0.4)], [-Math.sin(1.2) * Math.cos(0.4), -Math.cos(1.2), -Math.sin(1.2) * Math.sin(0.4)], P.vEsc(10, 1), 'ball');
      var tr = P.trace(H, s, { rEnd: 0.01, frac: 0.003, maxSteps: 400000 }), i;
      for (i = 1; i < tr.n; i++) if (Math.hypot(tr.X[i], tr.Y[i], tr.Z[i]) <= rTarget) break;
      var r0 = Math.hypot(tr.X[i - 1], tr.Y[i - 1], tr.Z[i - 1]), r1 = Math.hypot(tr.X[i], tr.Y[i], tr.Z[i]);
      var st = P.sampleAt(tr, tr.T[i - 1] + (rTarget - r0) / (r1 - r0) * (tr.T[i] - tr.T[i - 1]));
      var c = new BH.Camera(); c.mode = 'fall';
      c.s = new Float64Array([st.x, st.y, st.z, st.t, st.px, st.py, st.pz, st.pt]);
      return c;
    }
    /* 影子的角半徑（從「正對黑洞」的方向量），照 Schneider & Perlick, Gen. Rel. Grav. 50, 58 (2018) 抄的：
     *   式 (32) 懸停的觀察者（Synge 1966）：sin α = (√27 m / r) √(1 − 2m/r)，r < 3m 時取 α > 90° 那一支
     *   式 (33) 徑向自由落下的觀察者，eps = E/m（從無限遠靜止落下 = 1，從 r_i 靜止落下 = √(1 − 2m/r_i)）：
     *     sin α = (√27 m / r)( eps ∓ √(eps² − 1 + 2m/r) √(1 − (27m²/r²)(1 − 2m/r)) ) / ( 1 + (27m²/r²)(eps² − 1 + 2m/r) )
     *     r > 3m 取上面的號、r < 3m 取下面的號；落下的觀察者 α 一律 < 90°。
     * 這裡 m = rs/2 = 0.5。 */
    function psiStatic(r) { var sn = Math.sqrt(27) * 0.5 / r * Math.sqrt(1 - 1 / r); return r >= 1.5 ? Math.asin(sn) : Math.PI - Math.asin(sn); }
    function psiFalling(r, eps) {
      var m = 0.5, k = 27 * m * m / (r * r), w = eps * eps - 1 + 2 * m / r;
      var root = Math.sqrt(Math.max(0, w)) * Math.sqrt(Math.max(0, 1 - k * (1 - 2 * m / r)));
      return Math.asin(Math.min(1, Math.sqrt(27) * m / r * (eps + (r > 3 * m ? -1 : 1) * root) / (1 + k * w)));
    }
    // 從 12 rs 靜止放手、掉到半徑 rTarget 的觀察者（場景 ③ 的預設）
    function dropCam(rTarget) {
      var c0 = staticCam(12), sd = c0.seeds(H);
      var s = P.launch(H, sd.x, [-sd.rhat[0], -sd.rhat[1], -sd.rhat[2]], 0, 'ball');
      var tr = P.trace(H, s, { rEnd: 0.01, frac: 0.003, maxSteps: 400000 }), i;
      for (i = 1; i < tr.n; i++) if (Math.hypot(tr.X[i], tr.Y[i], tr.Z[i]) <= rTarget) break;
      var r0 = Math.hypot(tr.X[i - 1], tr.Y[i - 1], tr.Z[i - 1]), r1 = Math.hypot(tr.X[i], tr.Y[i], tr.Z[i]);
      var st = P.sampleAt(tr, tr.T[i - 1] + (rTarget - r0) / (r1 - r0) * (tr.T[i] - tr.T[i - 1]));
      var c = new BH.Camera(); c.mode = 'fall';
      c.s = new Float64Array([st.x, st.y, st.z, st.t, st.px, st.py, st.pz, st.pt]);
      return c;
    }
    var a, psi, epsDrop = Math.sqrt(1 - 1 / 12), cc;
    a = shot(staticCam(30), 20, H, true); psi = psiStatic(30);
    rows.push(T.row('顯示卡（只用數值積分）：懸停在 30 rs 看到的影子半徑（像素，512 見方、視角 20°）', a.radiusPx, wantPx(psi, 20), 6e-3, 'rel', '論文式 (32)：角半徑 ' + (psi / DEG).toFixed(3) + '°；步數用完的像素 ' + a.red));
    a = shot(staticCam(2), 150, H, true); psi = psiStatic(2);
    rows.push(T.row('顯示卡（只用數值積分）：懸停在 2 rs 看到的影子半徑（像素，視角 150°）', a.radiusPx, wantPx(psi, 150), 1e-2, 'rel', '論文式 (32)：角半徑 ' + (psi / DEG).toFixed(2) + '°；步數用完的像素 ' + a.red));
    cc = staticCam(1.2); cc.yaw = Math.PI; a = shot(cc, 150, H, true); psi = Math.PI - psiStatic(1.2);
    rows.push(T.row('顯示卡（只用數值積分）：懸停在 1.2 rs 回頭看，天空縮成的那個圓的半徑（像素，視角 150°）', Math.sqrt((size * size - a.black - a.red) / Math.PI), wantPx(psi, 150), 1e-2, 'rel',
      '論文式 (32)：影子 ' + (180 - psi / DEG).toFixed(1) + '°，剩下的天空半徑 ' + (psi / DEG).toFixed(1) + '° —— 懸停的人才會看到天空縮成一小塊；步數用完的像素 ' + a.red));
    a = shot(rainCam(1.0), 120, H); psi = psiFalling(1.0, 1);
    rows.push(T.row('顯示卡：雨滴觀察者通過視界那一刻的影子半徑（像素，視角 120°）', a.radiusPx, wantPx(psi, 120), 1e-2, 'rel', '論文式 (33)/(34)：角半徑 ' + (psi / DEG).toFixed(2) + '°（還不到半邊天）；步數用完的像素 ' + a.red));
    a = shot(rainCam(0.5), 140, H); psi = psiFalling(0.5, 1);
    rows.push(T.row('顯示卡：雨滴觀察者在視界內 0.5 rs 的影子半徑（像素，視角 140°）', a.radiusPx, wantPx(psi, 140), 1e-2, 'rel', '論文式 (33)：角半徑 ' + (psi / DEG).toFixed(2) + '°；步數用完的像素 ' + a.red));
    a = shot(dropCam(3), 100, H, true); psi = psiFalling(3, epsDrop);
    rows.push(T.row('顯示卡（只用數值積分）：從 12 rs 靜止放手，掉到 3 rs 時的影子半徑（像素，視角 100°）', a.radiusPx, wantPx(psi, 100), 1e-2, 'rel', '論文式 (33)，eps = ' + epsDrop.toFixed(4) + '：角半徑 ' + (psi / DEG).toFixed(2) + '°；步數用完的像素 ' + a.red));
    a = shot(dropCam(1.0), 120, H); psi = psiFalling(1.0, epsDrop);
    rows.push(T.row('顯示卡：從 12 rs 靜止放手，通過視界那一刻的影子半徑（像素，視角 120°）', a.radiusPx, wantPx(psi, 120), 1e-2, 'rel', '論文式 (33)：角半徑 ' + (psi / DEG).toFixed(2) + '°；步數用完的像素 ' + a.red));
    a = shot(dropCam(0.1), 170, H); psi = psiFalling(0.1, epsDrop);
    rows.push(T.row('顯示卡：從 12 rs 靜止放手，掉到視界內 0.1 rs 時的影子半徑（像素，視角 170°）', a.radiusPx, wantPx(psi, 170), 1e-2, 'rel', '論文式 (33)：角半徑 ' + (psi / DEG).toFixed(2) + '°（往 90° 靠近，但到不了）；步數用完的像素 ' + a.red));
    // 貼著視界外面往下掉：影子裡不該有任何光線被當成天空（Tim 2026-11-12 抓到的斑紋）
    function leak(numericOnly) {
      var c = dropCam(1.02), cf = c.frame(H), fov = 140, lim, n = 0, x, y, dx, dy;
      var px = renderer.renderToPixels({
        tanFov: Math.tan(fov * DEG / 2), camPos: cf.pos, P: cf.P, camInside: cf.nearHorizon, energyTest: !numericOnly,
        holes: H, far: 60, maxSteps: 300, stepScale: 1,
        disk: { on: false, rin: 3, rout: 12, brightness: 1 }, diskTime: 0, flags: [0, 0, 0, 0], exposure: 1, beaconPeriod: 2, debug: true, bodies: []
      }, size);
      lim = 0.93 * wantPx(psiFalling(1.02, epsDrop), fov);
      for (y = 0; y < size; y++) for (x = 0; x < size; x++) {
        dx = x - size / 2 + 0.5; dy = y - size / 2 + 0.5;
        if (dx * dx + dy * dy < lim * lim && px[(y * size + x) * 4] > 128 && px[(y * size + x) * 4 + 1] > 128) n++;
      }
      return n;
    }
    rows.push(T.row('顯示卡：貼著視界外（1.02 rs）往下掉，影子裡被當成天空的像素數', leak(false), 0, 0, 'abs',
      '同一格如果只用數值積分是 ' + leak(true) + ' 個 —— 那就是影子裡的白色斑紋；多洞／自旋還沒有這條捷徑可用'));
    a = shot(staticCam(30), 20, [P.makeHole({ rs: 0 })]);
    rows.push(T.row('顯示卡・反向對照：把黑洞拿掉之後的黑色像素數', a.black, 0, 0, 'abs', '同一個鏡頭有黑洞時是 ' + shot(staticCam(30), 20, H).black + ' 個'));
    return rows;
  }

  function runSelfTest() {
    var el = $('selftest'), pre = $('selftestText');
    el.className = 'box show';
    var rows = BH.SelfTest.run().concat(gpuTests());
    var res = BH.SelfTest.format(rows);
    pre.textContent = '黑洞模擬 —— 自我測試\n\n' + res.text;
    window.__selftest = { bad: res.bad, total: res.total, text: res.text };
    document.title = '自我測試：' + res.total + ' 項，沒過 ' + res.bad;
  }

  // ── 開始 ────────────────────────────────────────────
  buildPanel();
  map.buildBeams(S.holes);
  var q = new URLSearchParams(location.search);
  setScene(q.get('scene') || 'bend');
  window.BHApp = { S: S, cam: cam, bodies: bodies, map: map, renderer: renderer, setScene: setScene, fire: fire, startFall: startFall, hover: backToHover, selftest: runSelfTest, refresh: refreshAll };
  if (q.get('selftest')) { try { runSelfTest(); } catch (e) { $('selftest').className = 'box show'; $('selftestText').textContent = '自我測試執行失敗：\n' + (e.stack || e); } }
  requestAnimationFrame(tick);
})();
