/* 黑洞模擬 —— 拋進去的東西：物體（有質量）與光束（一串光子）
 *
 * 每一個東西在發射時就把整條測地線算好（physics.trace），重新取樣成一列貼圖交給著色器；
 * 著色器用「光經過那裡的時刻」去查它的位置，所以畫面上自帶光行時間差。
 *
 * 拋射器設定 spec：
 *   kind    'ball' | 'light'
 *   r0, phi0, incl   發射點：赤道面上半徑 r0、方位角 phi0；incl 是軌道面相對赤道面的傾角
 *   speed   相對當地靜止觀察者的速度（0 ≤ v < 1，只有物體用；光一律是 1）
 *   alpha   方向（當地懸停的人量到的角度）：0 = 正對黑洞，π/2 = 切向（順著吸積盤轉的方向），負的 = 逆著轉
 *   mass    物體的質量，單位是「黑洞現在的質量」（只有物體用）
 *   shape   'cube'（預設：自發光的立方體，照自己的固有時慢慢自轉）| 'ball'（球）；只有物體用
 *   pulses  光束一次打幾顆（只有光用）；color 光束顏色
 *
 * 質量會影響什麼：測地線（路徑）不看質量 —— 這是等效原理，也是本檔把物體當「測試粒子」的前提。
 * 質量只影響 (1) 畫出來的大小，(2) 開了「吃了會變重」時黑洞長多少（rs 增加 mass × E/m × rs）。
 * 質量大到跟黑洞可以比的時候，測試粒子近似本身就不成立，這裡沒有處理。
 */
(function (root) {
  'use strict';
  var BH = root.BH = root.BH || {};
  var P = BH.Physics;

  var LOOKBACK = 150;       // 光線往回追，超過這麼久以前的物體位置就不查了（只影響卡在視界上的殘影）
  var PULSE_GAP = 0.9;      // 光束裡相鄰兩顆光子的間隔（rs/c）
  var PALETTE = [[1, .85, .35], [.45, .9, 1], [1, .55, .75], [.6, 1, .55], [.85, .7, 1], [1, .62, .3]];
  var LIGHT_COLORS = { green: [.3, 1, .45], red: [1, .28, .22], blue: [.38, .62, 1], white: [1, 1, 1] };

  function Bodies(renderer, trajN, maxRows) {
    this.renderer = renderer;      // 可以是 null（node 測試）
    this.trajN = trajN || 1024;
    this.maxBodies = maxRows || 16;
    this.list = [];
    this.freeRows = [];
    for (var i = 0; i < this.maxBodies; i++) this.freeRows.push(i);
    this.nextGroup = 1;
    this.colorIdx = 0;
  }
  Bodies.LIGHT_COLORS = LIGHT_COLORS;

  // 拋射器設定 → 發射位置與方向（座標空間）
  Bodies.aim = function (holes, spec) {
    var c = holes[0].pos, cp = Math.cos(spec.phi0), sp = Math.sin(spec.phi0), ci = Math.cos(spec.incl), si = Math.sin(spec.incl);
    var ea = [cp, 0, sp];                    // 徑向（向外）
    var eb = [ci * sp, si, -ci * cp];        // 切向：incl = 0 時就是吸積盤轉的方向
    // alpha 是當地懸停觀察者量到的角度；畫在圖上的座標方向，徑向分量要乘 √(1 − rs/r)（只給畫圖用）
    var ca = Math.cos(spec.alpha), sa = Math.sin(spec.alpha);
    var k = Math.sqrt(Math.max(0, 1 - holes[0].rs / spec.r0));
    return {
      x: [c[0] + spec.r0 * cp, c[1], c[2] + spec.r0 * sp],
      dir: [-ca * k * ea[0] + sa * eb[0], sa * eb[1], -ca * k * ea[2] + sa * eb[2]],
      ea: ea, eb: eb
    };
  };

  // 算整條軌跡（發射時刻 t0）。發射點在視界內 ⇒ null
  Bodies.plan = function (holes, spec, t0) {
    var a = Bodies.aim(holes, spec);
    var light = spec.kind === 'light';
    var s = P.launchLocal(holes, a.x, [-a.ea[0], -a.ea[1], -a.ea[2]], a.eb, spec.alpha, light ? 1 : spec.speed, spec.kind);
    if (!s) return null;
    s[3] = t0 || 0;
    var tr = P.trace(holes, s, light ? { tSpan: 320, rMax: 70, frac: 0.012, maxSteps: 40000 }
                                     : { tSpan: 600, rMax: 90, frac: 0.012, maxSteps: 60000 });
    tr.e = -s[7];
    return tr;
  };

  /* 光從 (px,py,pz) 走到攝影機大約要多久（座標時間）。
   * 平直空間的距離 ＋ 徑向向外的光在視界附近多花的時間 2rs ln((r_cam − rs)/(r − rs))。
   * 後面那一項對徑向的光是精確的，其他方向是近似；它在 r → rs 時發散，這就是「凍結」。
   * 只看第 0 個洞。攝影機在視界內時只用距離（示意）。 */
  function delay(holes, px, py, pz, cam, camInside) {
    var dist = Math.hypot(px - cam[0], py - cam[1], pz - cam[2]);
    var h = holes[0];
    if (!(h.rs > 0)) return dist;
    var rb = Math.hypot(px - h.pos[0], py - h.pos[1], pz - h.pos[2]);
    var rc = Math.hypot(cam[0] - h.pos[0], cam[1] - h.pos[1], cam[2] - h.pos[2]);
    if (camInside || rc <= h.rs) return dist;
    if (rb <= h.rs * (1 + 1e-9)) return Infinity;
    return dist + Math.max(0, 2 * h.rs * Math.log((rc - h.rs) / (rb - h.rs)));
  }
  Bodies.delay = delay;

  function shiftTraj(tr, dt) {
    var o = {};
    for (var k in tr) o[k] = tr[k];
    o.T = tr.T.map(function (t) { return t + dt; });
    if (tr.crossT !== null) o.crossT = tr.crossT + dt;
    return o;
  }

  Bodies.prototype.upload = function (b) {
    var rs = P.resample(b.tr, this.trajN);
    b.t0 = rs.t0; b.t1 = rs.t1;
    if (this.renderer) this.renderer.setTrajRow(b.row, rs.pos, rs.vel);
  };

  Bodies.prototype.remove = function (i) {
    var b = this.list[i];
    this.freeRows.push(b.row);
    this.list.splice(i, 1);
  };

  Bodies.prototype.clear = function () { while (this.list.length) this.remove(0); };

  /* 發射。發射的「那一刻」定在過去，讓它的光現在剛好到攝影機 ⇒ 按下去馬上看得到。
   * 回傳新增了幾個。 */
  Bodies.prototype.spawn = function (holes, spec, tCam, camPos, camInside) {
    var a = Bodies.aim(holes, spec);
    var t0 = tCam - delay(holes, a.x[0], a.x[1], a.x[2], camPos, camInside);
    if (!isFinite(t0)) t0 = tCam;
    var tr = Bodies.plan(holes, spec, t0);
    if (!tr || tr.n < 2) return 0;
    var light = spec.kind === 'light';
    var n = light ? Math.max(1, Math.min(8, spec.pulses | 0)) : 1;
    var color = light ? (LIGHT_COLORS[spec.color] || LIGHT_COLORS.green) : PALETTE[this.colorIdx++ % PALETTE.length];
    var group = this.nextGroup++;
    var cube = !light && spec.shape !== 'ball';
    // 物體的大小跟著質量走（只是畫出來的大小；路徑跟質量無關）。立方體的 radius 是半邊長。
    var radius = light ? 0.15 : Math.max(0.14, Math.min(0.6, 0.26 * Math.pow(spec.mass / 0.01, 1 / 3))) * (cube ? 0.8 : 1);
    for (var k = 0; k < n; k++) {
      while (this.list.length >= this.maxBodies) this.remove(0);
      var b = {
        group: group, pulse: k, kind: spec.kind, shape: light ? 'dot' : (cube ? 'cube' : 'ball'), color: color, radius: radius,
        mass: light ? 0 : spec.mass, e: tr.e, absorbed: false,
        tr: k === 0 ? tr : shiftTraj(tr, k * PULSE_GAP),
        row: this.freeRows.shift(), spec: JSON.parse(JSON.stringify(spec)),
        seen: null, now: null
      };
      this.upload(b);
      this.list.push(b);
    }
    return n;
  };

  // 攝影機此刻看到的是這個東西在哪個時刻的樣子；光還沒到 ⇒ null
  Bodies.prototype.seenTime = function (b, holes, tCam, cam, camInside) {
    var tr = b.tr, lo = tr.T[0], hi = Math.min(tr.T[tr.n - 1], tCam);
    function F(te) { var p = P.sampleAt(tr, te); return te + delay(holes, p.x, p.y, p.z, cam, camInside) - tCam; }
    if (F(lo) > 0) return null;
    if (F(hi) <= 0) return hi;
    for (var i = 0; i < 44; i++) { var mid = 0.5 * (lo + hi); if (F(mid) <= 0) lo = mid; else hi = mid; }
    return lo;
  };

  // 還在繞的軌道快用完時往後接一段（丟掉太久以前的部分，讓貼圖的解析度留給現在）
  Bodies.prototype.extend = function (b, holes, tCam) {
    var tr = b.tr, n = tr.n, i0 = 0;
    while (i0 < n - 2 && tr.T[i0 + 1] < tCam - (LOOKBACK + 60)) i0++;
    var s = new Float64Array([tr.X[n - 1], tr.Y[n - 1], tr.Z[n - 1], tr.T[n - 1], tr.PX[n - 1], tr.PY[n - 1], tr.PZ[n - 1], tr.PT[n - 1]]);
    var more = P.trace(holes, s, { tSpan: 600, rMax: 90, frac: 0.012, maxSteps: 60000, tau0: tr.TAU[n - 1] });
    b.tr = join(tr, i0, n, more);
    this.upload(b);
  };

  function join(a, i0, i1, b) {
    var o = { fate: b.fate, rMin: Math.min(a.rMin, b.rMin), e: a.e, crossHole: a.crossHole };
    var keys = ['T', 'X', 'Y', 'Z', 'UX', 'UY', 'UZ', 'UT', 'PX', 'PY', 'PZ', 'PT', 'TAU'];
    for (var k = 0; k < keys.length; k++) o[keys[k]] = a[keys[k]].slice(i0, i1).concat(b[keys[k]].slice(1));
    o.n = o.T.length;
    if (a.crossT !== null && a.crossT <= a.T[i1 - 1]) { o.crossT = a.crossT; o.crossTau = a.crossTau; }
    else { o.crossT = b.crossT; o.crossTau = b.crossTau; o.crossHole = b.crossHole; }
    return o;
  }

  /* 度規在 tNow 換了（黑洞變重、拿掉黑洞）：還在飛的東西從 tNow 的位置與動量重新算後半段。
   * 過去的部分留著（那些光已經在路上了）。 */
  Bodies.prototype.replan = function (holes, tNow) {
    for (var i = 0; i < this.list.length; i++) {
      var b = this.list[i], tr = b.tr;
      if (tNow <= tr.T[0] || tNow >= tr.T[tr.n - 1]) continue;
      var st = P.sampleAt(tr, tNow);
      var s = new Float64Array([st.x, st.y, st.z, tNow, st.px, st.py, st.pz, st.pt]);
      P.normalizeMomentum(holes, s, b.kind === 'light' ? 0 : -1);
      var light = b.kind === 'light';
      var more = P.trace(holes, s, light ? { tSpan: 320, rMax: 70, frac: 0.012, maxSteps: 40000, tau0: st.tau }
                                         : { tSpan: 600, rMax: 90, frac: 0.012, maxSteps: 60000, tau0: st.tau });
      // 接點：舊軌跡留到 tNow 之前，新軌跡的第一點就是 tNow
      var keep = { fate: tr.fate, rMin: tr.rMin, e: tr.e, crossHole: tr.crossHole, crossT: tr.crossT, crossTau: tr.crossTau };
      var keys = ['T', 'X', 'Y', 'Z', 'UX', 'UY', 'UZ', 'UT', 'PX', 'PY', 'PZ', 'PT', 'TAU'];
      for (var k = 0; k < keys.length; k++) keep[keys[k]] = tr[keys[k]].slice(0, st.index + 1).concat([more[keys[k]][0]]);
      keep.n = keep.T.length;
      b.tr = join(keep, 0, keep.n, more);
      b.e = -s[7];
      this.upload(b);
    }
  };

  /* 每一格更新：收掉過期的、接長還在繞的、算「看到的位置」。
   * 回傳這一格剛穿過視界的物體（給「吃了會變重」用）。 */
  Bodies.prototype.update = function (holes, tCam, cam, camInside) {
    var absorbed = [];
    for (var i = this.list.length - 1; i >= 0; i--) {
      var b = this.list[i], tr = b.tr;
      if (!b.absorbed && tr.crossT !== null && tCam >= tr.crossT) { b.absorbed = true; if (b.kind === 'ball') absorbed.push(b); }
      if (tr.fate === 'timeout' && tCam > b.t1 - 120) { this.extend(b, holes, tCam); tr = b.tr; }
      var linger = tr.fate === 'singularity' ? 90 : 20;
      if (tCam > b.t1 + linger) { this.remove(i); continue; }
      var te = this.seenTime(b, holes, tCam, cam, camInside);
      b.seenT = te;
      b.seen = te === null ? null : P.sampleAt(tr, te);
      b.now = (tCam >= b.t0 && tCam <= b.t1) ? P.sampleAt(tr, tCam) : null;
    }
    return absorbed;
  };

  /* 交給著色器的清單：每個東西四個 vec4。
   * 一個東西只可能在「攝影機此刻看到它的那個時刻」前後被光線碰到（直接看到的像在 seenT；
   * 繞過黑洞才到的像更早一點），所以只把那一段時間與那一段路徑的包圍球交出去，著色器靠它們跳過不相干的光線。
   * wide = 攝影機在黑洞附近或視界內：seenT 的估計比較粗，時段放寬。 */
  Bodies.prototype.uniforms = function (tCam, wide) {
    var out = [];
    for (var i = 0; i < this.list.length; i++) {
      var b = this.list[i], tr = b.tr;
      var mid = (b.seenT == null) ? b.t0 : b.seenT;
      var lo = Math.max(b.t0, tCam - LOOKBACK, mid - (wide ? 45 : 22)), hi = Math.min(b.t1, tCam, mid + (wide ? 18 : 10));
      if (hi < lo) continue;
      var i0 = P.sampleAt(tr, lo).index, i1 = Math.min(tr.n - 1, P.sampleAt(tr, hi).index + 1);
      var stride = Math.max(1, Math.floor((i1 - i0) / 48));
      var mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
      for (var j = i0; ; j += stride) {
        if (j > i1) j = i1;
        mn[0] = Math.min(mn[0], tr.X[j]); mx[0] = Math.max(mx[0], tr.X[j]);
        mn[1] = Math.min(mn[1], tr.Y[j]); mx[1] = Math.max(mx[1], tr.Y[j]);
        mn[2] = Math.min(mn[2], tr.Z[j]); mx[2] = Math.max(mx[2], tr.Z[j]);
        if (j === i1) break;
      }
      var rad = 0.5 * Math.hypot(mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]) + b.radius * (b.shape === 'cube' ? 1.75 : 1) + (stride > 1 ? 0.8 : 0.3);
      out.push({
        A: [b.t0 - tCam, (this.trajN - 1) / (b.t1 - b.t0), b.row, b.radius],
        D: [lo - tCam, hi - tCam, 0, 0],
        B: [b.color[0], b.color[1], b.color[2], b.kind === 'light' ? 1 : (b.shape === 'cube' ? 2 : 0)],
        C: [0.5 * (mn[0] + mx[0]), 0.5 * (mn[1] + mx[1]), 0.5 * (mn[2] + mx[2]), rad]
      });
    }
    return out;
  };

  BH.Bodies = Bodies;
  if (typeof module !== 'undefined' && module.exports) module.exports = Bodies;
})(typeof window !== 'undefined' ? window : globalThis);
