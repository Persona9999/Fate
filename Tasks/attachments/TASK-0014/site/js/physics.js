/* 黑洞模擬 —— 物理核心（瀏覽器與 node 共用；不碰畫面）
 *
 * 單位：G = c = 1。長度單位是「第 0 個黑洞的史瓦西半徑 rs」⇒ 質量 M = rs/2，時間單位是 rs/c。
 *
 * 座標：Kerr–Schild 形式（直角座標 x, y, z ＋ 向內 Eddington–Finkelstein 時間 t）
 *     g_{μν} = η_{μν} + f l_μ l_ν        l_μ = ( n,  1)      f = rs / r      （史瓦西）
 *     g^{μν} = η^{μν} − f l^μ l^ν        l^μ = ( n, −1)      n = (x − 洞的位置) / r
 *   這套座標在視界上是正常的（不像史瓦西座標在 r = rs 會壞），所以物體與攝影機可以一路算進視界裡面。
 *   r 就是史瓦西的面積半徑；t 在遠處跟史瓦西時間只差一個只跟 r 有關的量。
 *
 * 運動方程式：哈密頓量 H = ½ g^{μν} p_μ p_ν
 *     H = ½ (|p|² − p_t²) − ½ Σ_k f_k L_k²          L_k = n_k · p − p_t
 *   有質量的粒子 H = −½（參數是固有時 τ），光 H = 0（參數是仿射參數）。
 *   同一組式子也寫在著色器裡（js/shader.js 的 rhs），兩邊要一起改。
 *
 * 狀態向量 s[8] = [x, y, z, t, p_x, p_y, p_z, p_t]（p 是共變分量）
 * 4 維向量的分量順序一律是 (x, y, z, t)；4×4 矩陣是 row-major 的 16 格陣列。
 *
 * ── 預留（現在沒做）──────────────────────────────────────────────
 *   多黑洞：holes 陣列本來就可以放好幾個，rhs 會把每個洞的 f l l 項加起來。
 *           那是「疊加近似」，不是愛因斯坦方程式的解；兩個洞靠近時不準。沒有驗證過。
 *   自旋  ：Kerr 在 Kerr–Schild 形式下只是換一組 f 與 l（見 holeTerms 的註解），
 *           hole.model = 'kerr' 目前會被 validateHoles 擋下。
 *   融合  ：需要會動的洞（hole.vel）與隨時間變的度規；rhs 目前假設度規不隨時間變（dp_t = 0）。
 */
(function (root) {
  'use strict';
  var P = {};

  P.B_CRIT = 1.5 * Math.sqrt(3);        // 臨界撞擊參數 b_c / rs = 3√3/2
  P.R_PHOTON = 1.5;                     // 光子球 r / rs
  P.R_ISCO = 3.0;                       // 最內穩定圓軌道 r / rs

  P.makeHole = function (o) {
    o = o || {};
    return {
      pos: o.pos ? [o.pos[0], o.pos[1], o.pos[2]] : [0, 0, 0],
      rs: o.rs == null ? 1 : o.rs,
      model: o.model || 'schwarzschild',   // 預留：'kerr'
      spin: o.spin ? o.spin.slice() : [0, 0, 0],   // 預留：自旋軸 × a
      vel: o.vel ? o.vel.slice() : [0, 0, 0]       // 預留：洞自己的速度（雙黑洞、融合）
    };
  };

  P.validateHoles = function (holes) {
    for (var k = 0; k < holes.length; k++) {
      if (holes[k].model !== 'schwarzschild') {
        throw new Error('這個黑洞模型還沒做：' + holes[k].model + '（目前只有 schwarzschild）');
      }
    }
    return true;
  };

  /* 一個洞對 H 的貢獻需要兩樣東西：f 與 l^μ（以及它們對位置的導數）。
   * 史瓦西：f = rs/r，l^μ = (n, −1)。下面 rhs 裡直接展開了這一組。
   * 要加 Kerr 就是在這裡換成
   *     f = rs r³ / (r⁴ + a² z²)，l = ((r x + a y)/(r² + a²), (r y − a x)/(r² + a²), z/r, −1)
   *   （r 由 x² + y² + z² = r² + a²(1 − z²/r²) 解出），導數可以解析寫或用差分。 */

  // ds/dλ：d[0..2] = dx/dλ，d[3] = dt/dλ，d[4..6] = dp_i/dλ，d[7] = dp_t/dλ（靜態度規 ⇒ 0）
  P.rhs = function (holes, s, d) {
    var x = s[0], y = s[1], z = s[2];
    var px = s[4], py = s[5], pz = s[6], pt = s[7];
    var dx = px, dy = py, dz = pz, dt = -pt, fx = 0, fy = 0, fz = 0;
    for (var k = 0; k < holes.length; k++) {
      var h = holes[k];
      if (!(h.rs > 0)) continue;
      var ex = x - h.pos[0], ey = y - h.pos[1], ez = z - h.pos[2];
      var r = Math.sqrt(ex * ex + ey * ey + ez * ez);
      if (r < 1e-12) r = 1e-12;
      var nx = ex / r, ny = ey / r, nz = ez / r;
      var f = h.rs / r;
      var np = nx * px + ny * py + nz * pz;
      var L = np - pt;
      var fL = f * L;
      dx -= fL * nx; dy -= fL * ny; dz -= fL * nz;
      dt += fL;
      var c = fL / r;
      fx += c * (-0.5 * L * nx + px - nx * np);
      fy += c * (-0.5 * L * ny + py - ny * np);
      fz += c * (-0.5 * L * nz + pz - nz * np);
    }
    d[0] = dx; d[1] = dy; d[2] = dz; d[3] = dt;
    d[4] = fx; d[5] = fy; d[6] = fz; d[7] = 0;
  };

  P.hamiltonian = function (holes, s) {
    var px = s[4], py = s[5], pz = s[6], pt = s[7];
    var H = 0.5 * (px * px + py * py + pz * pz - pt * pt);
    for (var k = 0; k < holes.length; k++) {
      var h = holes[k];
      if (!(h.rs > 0)) continue;
      var ex = s[0] - h.pos[0], ey = s[1] - h.pos[1], ez = s[2] - h.pos[2];
      var r = Math.sqrt(ex * ex + ey * ey + ez * ez);
      var L = (ex * px + ey * py + ez * pz) / r - pt;
      H -= 0.5 * (h.rs / r) * L * L;
    }
    return H;
  };

  // 到第 k 個洞中心的距離
  P.dist = function (holes, s, k) {
    var h = holes[k];
    var ex = s[0] - h.pos[0], ey = s[1] - h.pos[1], ez = s[2] - h.pos[2];
    return Math.sqrt(ex * ex + ey * ey + ez * ez);
  };

  // 最近的洞：回傳 {k, r, rs}；沒有洞 ⇒ {k:-1, r:Infinity, rs:0}
  P.nearest = function (holes, s) {
    var best = { k: -1, r: Infinity, rs: 0, ratio: Infinity };
    for (var k = 0; k < holes.length; k++) {
      if (!(holes[k].rs > 0)) continue;
      var r = P.dist(holes, s, k);
      var ratio = r / holes[k].rs;
      if (ratio < best.ratio) best = { k: k, r: r, rs: holes[k].rs, ratio: ratio };
    }
    return best;
  };

  // ── 度規 ────────────────────────────────────────────────────────
  P.metricInv = function (holes, x) {
    var g = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, -1];
    for (var k = 0; k < holes.length; k++) {
      var h = holes[k];
      if (!(h.rs > 0)) continue;
      var ex = x[0] - h.pos[0], ey = x[1] - h.pos[1], ez = x[2] - h.pos[2];
      var r = Math.sqrt(ex * ex + ey * ey + ez * ez);
      if (r < 1e-12) r = 1e-12;
      var l = [ex / r, ey / r, ez / r, -1];
      var f = h.rs / r;
      for (var a = 0; a < 4; a++) for (var b = 0; b < 4; b++) g[a * 4 + b] -= f * l[a] * l[b];
    }
    return g;
  };

  P.invert4 = function (m) {
    var a = [], i, j, k;
    for (i = 0; i < 4; i++) {
      a.push([m[i * 4], m[i * 4 + 1], m[i * 4 + 2], m[i * 4 + 3], i === 0 ? 1 : 0, i === 1 ? 1 : 0, i === 2 ? 1 : 0, i === 3 ? 1 : 0]);
    }
    for (i = 0; i < 4; i++) {
      var piv = i;
      for (j = i + 1; j < 4; j++) if (Math.abs(a[j][i]) > Math.abs(a[piv][i])) piv = j;
      var tmp = a[i]; a[i] = a[piv]; a[piv] = tmp;
      var dv = a[i][i];
      for (k = 0; k < 8; k++) a[i][k] /= dv;
      for (j = 0; j < 4; j++) {
        if (j === i) continue;
        var fct = a[j][i];
        if (fct === 0) continue;
        for (k = 0; k < 8; k++) a[j][k] -= fct * a[i][k];
      }
    }
    var out = new Array(16);
    for (i = 0; i < 4; i++) for (j = 0; j < 4; j++) out[i * 4 + j] = a[i][4 + j];
    return out;
  };

  // 共變度規 g_{μν}：一律由 g^{μν} 數值求逆（單洞時等於 η + f l l；多洞時與 rhs 用的是同一個度規）
  P.metricCov = function (holes, x) { return P.invert4(P.metricInv(holes, x)); };

  P.dot = function (g, a, b) {
    var s = 0;
    for (var i = 0; i < 4; i++) for (var j = 0; j < 4; j++) s += g[i * 4 + j] * a[i] * b[j];
    return s;
  };
  P.lower = function (g, v) {
    var o = [0, 0, 0, 0];
    for (var i = 0; i < 4; i++) for (var j = 0; j < 4; j++) o[i] += g[i * 4 + j] * v[j];
    return o;
  };
  P.raise = P.lower;   // 同一個運算，傳 g^{μν} 進去就是升指標

  // 靜止觀察者（懸停）的 4-速度；視界內沒有靜止觀察者 ⇒ null
  P.staticU = function (g) {
    var gtt = g[15];
    if (!(gtt < 0)) return null;
    return [0, 0, 0, 1 / Math.sqrt(-gtt)];
  };

  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  P.cross = cross;

  /* 觀察者的局部正交標架：e0 = u，e3 = 前、e2 = 上、e1 = 右。
   * seedF、seedU 是座標空間裡的 3 維方向（大概的前與上）；對 g 做 Gram–Schmidt。
   * 先對 u 投影 ⇒ 得到的是「跟著觀察者一起動」的標架，光行差自然就在裡面。 */
  P.frame = function (g, u, seedF, seedU) {
    function orth(v, basis) {
      var o = v.slice();
      for (var i = 0; i < basis.length; i++) {
        var b = basis[i].v, c = P.dot(g, v, b) * basis[i].sign;
        for (var j = 0; j < 4; j++) o[j] -= c * b[j];
      }
      var n2 = P.dot(g, o, o);
      var n = Math.sqrt(Math.abs(n2));
      if (!(n > 1e-12)) n = 1e-12;
      for (var q = 0; q < 4; q++) o[q] /= n;
      return o;
    }
    var bu = { v: u, sign: -1 };            // g(u,u) = −1
    var F = [seedF[0], seedF[1], seedF[2], 0];
    var U = [seedU[0], seedU[1], seedU[2], 0];
    var R3 = cross(seedF, seedU);
    var R = [R3[0], R3[1], R3[2], 0];
    var e3 = orth(F, [bu]);
    var e2 = orth(U, [bu, { v: e3, sign: 1 }]);
    var e1 = orth(R, [bu, { v: e3, sign: 1 }, { v: e2, sign: 1 }]);
    return { e0: u.slice(), e1: e1, e2: e2, e3: e3 };
  };

  // 由「局部看到的速度」組 4-速度：u = γ (u0 + v e)，e 是相對 u0 靜止的單位空間向量
  P.boost = function (u0, e, v) {
    var gam = 1 / Math.sqrt(1 - v * v);
    return [gam * (u0[0] + v * e[0]), gam * (u0[1] + v * e[1]), gam * (u0[2] + v * e[2]), gam * (u0[3] + v * e[3])];
  };

  /* 在位置 x、相對「當地靜止觀察者」以速度 v（0 ≤ v < 1；光給 kind = 'light'）往座標方向 dir 射出，
   * 回傳狀態向量。只能在視界外用（視界內沒有靜止觀察者）。 */
  P.launch = function (holes, x, dir, v, kind) {
    var g = P.metricCov(holes, x);
    var u0 = P.staticU(g);
    if (!u0) return null;
    var up = Math.abs(dir[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    var fr = P.frame(g, u0, dir, up);
    var u;
    if (kind === 'light') u = [u0[0] + fr.e3[0], u0[1] + fr.e3[1], u0[2] + fr.e3[2], u0[3] + fr.e3[3]];
    else u = v > 0 ? P.boost(u0, fr.e3, Math.min(v, 0.999999)) : u0.slice();
    var p = P.lower(g, u);
    return new Float64Array([x[0], x[1], x[2], 0, p[0], p[1], p[2], p[3]]);
  };

  /* 同上，但方向用「當地懸停觀察者量到的角度」給：方向 = cos(alpha) × inward ＋ sin(alpha) × tangent。
   * inward、tangent 是座標空間裡的兩個方向（大概互相垂直就好，這裡會對度規正交化）。
   * ⚠ 這跟「座標上的角度」不一樣：徑向的座標長度在當地要除以 √(1 − rs/r)，
   *   所以座標上 45° 的方向，在當地看比 45° 更貼近徑向。撞擊參數 b = r sin(alpha) / √(1 − rs/r) 用的是當地的角度。 */
  P.launchLocal = function (holes, x, inward, tangent, alpha, v, kind) {
    var g = P.metricCov(holes, x);
    var u0 = P.staticU(g);
    if (!u0) return null;
    var fr = P.frame(g, u0, inward, tangent);      // e3 = 向內的單位向量，e2 = 切向的單位向量
    var ca = Math.cos(alpha), sa = Math.sin(alpha), e = [], u, i;
    for (i = 0; i < 4; i++) e.push(ca * fr.e3[i] + sa * fr.e2[i]);
    if (kind === 'light') u = [u0[0] + e[0], u0[1] + e[1], u0[2] + e[2], u0[3] + e[3]];
    else u = v > 0 ? P.boost(u0, e, Math.min(v, 0.999999)) : u0.slice();
    var p = P.lower(g, u);
    return new Float64Array([x[0], x[1], x[2], 0, p[0], p[1], p[2], p[3]]);
  };

  /* 給定位置與空間動量 p_i，解出朝未來的 p_t 使 g^{μν} p_μ p_ν = κ（有質量 κ = −1，光 κ = 0）。
   * 度規換了（例如黑洞變重）之後，用它把舊的動量接到新的度規上。 */
  P.normalizeMomentum = function (holes, s, kappa) {
    var gi = P.metricInv(holes, s);
    var A = gi[15], B = 0, C = 0;
    for (var i = 0; i < 3; i++) {
      B += gi[12 + i] * s[4 + i];
      for (var j = 0; j < 3; j++) C += gi[i * 4 + j] * s[4 + i] * s[4 + j];
    }
    var disc = B * B - A * (C - kappa);
    if (disc < 0) disc = 0;
    s[7] = (Math.sqrt(disc) - B) / A;
    return s;
  };

  // ── 積分 ────────────────────────────────────────────────────────
  var k1 = new Float64Array(8), k2 = new Float64Array(8), k3 = new Float64Array(8), k4 = new Float64Array(8), tmp = new Float64Array(8);

  P.rk4 = function (holes, s, h) {
    var i;
    P.rhs(holes, s, k1);
    for (i = 0; i < 8; i++) tmp[i] = s[i] + 0.5 * h * k1[i];
    P.rhs(holes, tmp, k2);
    for (i = 0; i < 8; i++) tmp[i] = s[i] + 0.5 * h * k2[i];
    P.rhs(holes, tmp, k3);
    for (i = 0; i < 8; i++) tmp[i] = s[i] + h * k3[i];
    P.rhs(holes, tmp, k4);
    for (i = 0; i < 8; i++) s[i] += h / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
  };

  // 步長：一步在空間裡走的距離 ≈ frac × 到最近的洞的距離
  P.stepSize = function (holes, s, d, frac) {
    var near = P.nearest(holes, s);
    var scale = near.k < 0 ? 5 : near.r;
    var sp = Math.sqrt(d[0] * d[0] + d[1] * d[1] + d[2] * d[2]);
    var speed = Math.max(sp, 0.3 * Math.abs(d[3]), 1e-12);
    return frac * scale / speed;
  };

  /* 把一條測地線從 s0 往前積分，回傳整條軌跡。
   * o.frac     步長係數（預設 0.02）
   * o.tSpan    最多積分多長的座標時間
   * o.rMax     離原點超過這個距離算「逃走」
   * o.rEnd     離某個洞 r < rEnd × rs 算「到奇異點」（預設 0.02）
   * o.maxSteps 步數上限
   * 回傳：T, X, Y, Z（位置）、UX, UY, UZ, UT（dx^μ/dλ）、PX, PY, PZ, PT（動量）、TAU（固有時／仿射參數）
   *       fate：'singularity' | 'escape' | 'timeout' | 'steps'
   *       crossT、crossTau、crossHole：第一次穿過視界的座標時間、固有時、哪一個洞（沒穿過 ⇒ null、-1） */
  P.trace = function (holes, s0, o) {
    o = o || {};
    var frac = o.frac || 0.02, maxSteps = o.maxSteps || 20000;
    var tEnd = o.tSpan != null ? s0[3] + o.tSpan : Infinity;
    var rMax = o.rMax || 200, rEnd = o.rEnd || 0.02;
    var s = Float64Array.from(s0), d = new Float64Array(8);
    var tr = {
      T: [], X: [], Y: [], Z: [], UX: [], UY: [], UZ: [], UT: [], PX: [], PY: [], PZ: [], PT: [], TAU: [],
      fate: 'steps', crossT: null, crossTau: null, crossHole: -1, rMin: Infinity, n: 0
    };
    var tau = o.tau0 || 0, k;
    var inside = [];
    for (k = 0; k < holes.length; k++) inside.push(holes[k].rs > 0 && P.dist(holes, s, k) < holes[k].rs);
    function push() {
      P.rhs(holes, s, d);
      tr.T.push(s[3]); tr.X.push(s[0]); tr.Y.push(s[1]); tr.Z.push(s[2]);
      tr.UX.push(d[0]); tr.UY.push(d[1]); tr.UZ.push(d[2]); tr.UT.push(d[3]);
      tr.PX.push(s[4]); tr.PY.push(s[5]); tr.PZ.push(s[6]); tr.PT.push(s[7]);
      tr.TAU.push(tau);
    }
    push();
    var rPrev = [];
    for (var n = 0; n < maxSteps; n++) {
      var h = P.stepSize(holes, s, d, frac);
      if (d[3] > 0 && s[3] + h * d[3] > tEnd) h = Math.max((tEnd - s[3]) / d[3], 1e-9);
      for (k = 0; k < holes.length; k++) rPrev[k] = P.dist(holes, s, k);
      var tPrev = s[3], tauPrev = tau;
      P.rk4(holes, s, h);
      tau += h;
      var done = null;
      for (k = 0; k < holes.length; k++) {
        if (!(holes[k].rs > 0)) continue;
        var r = P.dist(holes, s, k);
        if (r < tr.rMin) tr.rMin = r;
        if (!inside[k] && r < holes[k].rs) {
          inside[k] = true;
          if (tr.crossT === null) {
            var w = (rPrev[k] - holes[k].rs) / (rPrev[k] - r);
            tr.crossT = tPrev + w * (s[3] - tPrev);
            tr.crossTau = tauPrev + w * (tau - tauPrev);
            tr.crossHole = k;
          }
        }
        if (r < rEnd * holes[k].rs) done = 'singularity';
      }
      push();
      if (done) { tr.fate = done; break; }
      if (s[0] * s[0] + s[1] * s[1] + s[2] * s[2] > rMax * rMax) { tr.fate = 'escape'; break; }
      if (s[3] >= tEnd - 1e-9) { tr.fate = 'timeout'; break; }
      if (!isFinite(s[0] + s[3] + s[4])) { tr.fate = 'steps'; break; }
    }
    tr.n = tr.T.length;
    return tr;
  };

  // 在軌跡上找座標時間 t 的位置（線性內插）。超出範圍 ⇒ 夾在兩端。
  P.sampleAt = function (tr, t) {
    var n = tr.n, lo = 0, hi = n - 1;
    if (t <= tr.T[0]) { lo = 0; hi = Math.min(1, n - 1); }
    else if (t >= tr.T[n - 1]) { lo = Math.max(0, n - 2); hi = n - 1; }
    else { while (hi - lo > 1) { var mid = (lo + hi) >> 1; if (tr.T[mid] <= t) lo = mid; else hi = mid; } }
    var span = tr.T[hi] - tr.T[lo];
    var w = span > 0 ? Math.min(1, Math.max(0, (t - tr.T[lo]) / span)) : 0;
    function L(a) { return a[lo] + (a[hi] - a[lo]) * w; }
    return {
      t: L(tr.T), x: L(tr.X), y: L(tr.Y), z: L(tr.Z), ux: L(tr.UX), uy: L(tr.UY), uz: L(tr.UZ), ut: L(tr.UT),
      px: L(tr.PX), py: L(tr.PY), pz: L(tr.PZ), pt: L(tr.PT), tau: L(tr.TAU), index: lo
    };
  };

  // 把軌跡重新取樣成「座標時間等間隔」的 N 點（給著色器查表用）：pos = (x,y,z,τ)，vel = (ux,uy,uz,ut)
  P.resample = function (tr, N) {
    var t0 = tr.T[0], t1 = tr.T[tr.n - 1];
    var pos = new Float32Array(4 * N), vel = new Float32Array(4 * N);
    var j = 0;
    for (var i = 0; i < N; i++) {
      var t = t0 + (t1 - t0) * i / (N - 1);
      while (j < tr.n - 2 && tr.T[j + 1] < t) j++;
      var j1 = Math.min(j + 1, tr.n - 1);
      var span = tr.T[j1] - tr.T[j];
      var w = span > 0 ? Math.min(1, Math.max(0, (t - tr.T[j]) / span)) : 0;
      pos[4 * i] = tr.X[j] + (tr.X[j1] - tr.X[j]) * w;
      pos[4 * i + 1] = tr.Y[j] + (tr.Y[j1] - tr.Y[j]) * w;
      pos[4 * i + 2] = tr.Z[j] + (tr.Z[j1] - tr.Z[j]) * w;
      pos[4 * i + 3] = tr.TAU[j] + (tr.TAU[j1] - tr.TAU[j]) * w;
      vel[4 * i] = tr.UX[j] + (tr.UX[j1] - tr.UX[j]) * w;
      vel[4 * i + 1] = tr.UY[j] + (tr.UY[j1] - tr.UY[j]) * w;
      vel[4 * i + 2] = tr.UZ[j] + (tr.UZ[j1] - tr.UZ[j]) * w;
      vel[4 * i + 3] = tr.UT[j] + (tr.UT[j1] - tr.UT[j]) * w;
    }
    return { t0: t0, t1: t1, pos: pos, vel: vel };
  };

  // ── 參考值（史瓦西，單洞）───────────────────────────────────────
  // 圓軌道上，當地靜止觀察者量到的速度（r > 1.5 rs 才有圓軌道；r = 1.5 rs 時等於光速）
  P.vCirc = function (r, rs) { return r > 1.5 * rs ? Math.sqrt(rs / (2 * (r - rs))) : NaN; };
  // 當地的逃逸速度（相對靜止觀察者）
  P.vEsc = function (r, rs) { return Math.sqrt(rs / r); };
  // 向外的徑向光從 r1 走到 r2 花的座標時間（r1、r2 都在視界外）：靠近視界時發散 ⇒「凍結」的來源
  P.outgoingDelay = function (r1, r2, rs) { return (r2 - r1) + 2 * rs * Math.log((r2 - rs) / (r1 - rs)); };

  root.BH = root.BH || {};
  root.BH.Physics = P;
  if (typeof module !== 'undefined' && module.exports) module.exports = P;
})(typeof window !== 'undefined' ? window : globalThis);
