/* 黑洞模擬 —— 觀察者（攝影機）
 *
 * 三種狀態：
 *   'static'  懸停：用火箭撐在固定的位置（只能在視界外）。位置用球座標 r、theta（從 +y 軸量）、phi。
 *   'fall'    自由落下：沿著有質量粒子的測地線走，狀態向量 s 用固有時積分；可以一路進視界。
 *   'end'     到了奇異點附近（r < 0.02 rs），停在那裡。
 *
 * 畫面的時間基準是攝影機自己的固有時 tau；座標時間 t 跟著算（懸停時 dt = dτ / √(1 − rs/r)）。
 * frame() 回傳的 P 是攝影機局部標架降指標後的四個共變向量，著色器用它把「像素方向」換成光的動量。
 * 標架是每一格用 Gram–Schmidt 從「朝黑洞的方向」重新做的，不是平行移動的 ——
 *   徑向落下時兩者一樣；帶著角動量落下時，畫面等於一直把頭轉向黑洞。
 */
(function (root) {
  'use strict';
  var BH = root.BH = root.BH || {};
  var P = BH.Physics;

  var NEAR_BAND = 1.012;   // r < 這個 × rs 就當成「在視界裡或貼著視界」（著色器的判斷方式不同）

  function Camera() {
    this.mode = 'static';
    this.r = 16; this.theta = 1.4; this.phi = 0.5;
    this.yaw = 0; this.pitch = 0; this.fov = 60;
    this.tau = 0; this.t = 0;
    this.s = new Float64Array(8);
    this.plan = null;          // 落下時預先算好的整條軌跡（畫俯視圖、算還剩多久）
    this.crossTau = null;      // 通過視界那一刻的固有時
    this.fallTau0 = 0;
    this.trail = [];
    this._trailTau = -1e9;
  }
  Camera.NEAR_BAND = NEAR_BAND;

  Camera.prototype.minRadius = function (holes) { return Math.max(1.03 * holes[0].rs, 0.3); };

  Camera.prototype.position = function (holes) {
    if (this.mode === 'static') {
      var c = holes[0].pos, st = Math.sin(this.theta);
      return [c[0] + this.r * st * Math.cos(this.phi), c[1] + this.r * Math.cos(this.theta), c[2] + this.r * st * Math.sin(this.phi)];
    }
    return [this.s[0], this.s[1], this.s[2]];
  };

  // 座標空間裡的「前、上、右」（還沒對度規正交化）
  Camera.prototype.seeds = function (holes) {
    var x = this.position(holes), c = holes[0].pos;
    var rx = x[0] - c[0], ry = x[1] - c[1], rz = x[2] - c[2];
    var r = Math.sqrt(rx * rx + ry * ry + rz * rz) || 1e-9;
    var f0 = [-rx / r, -ry / r, -rz / r];
    var Y = Math.abs(f0[1]) > 0.999 ? [0, 0, 1] : [0, 1, 0];
    var r0 = P.cross(f0, Y), rn = Math.hypot(r0[0], r0[1], r0[2]);
    r0 = [r0[0] / rn, r0[1] / rn, r0[2] / rn];
    var u0 = P.cross(r0, f0);
    var cy = Math.cos(this.yaw), sy = Math.sin(this.yaw), cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
    var fwd = [], right = [];
    for (var i = 0; i < 3; i++) {
      fwd.push(cp * (cy * f0[i] + sy * r0[i]) + sp * u0[i]);
      right.push(cy * r0[i] - sy * f0[i]);
    }
    return { x: x, r: r, rhat: [rx / r, ry / r, rz / r], fwd: fwd, right: right, up: P.cross(right, fwd) };
  };

  Camera.prototype.frame = function (holes) {
    var sd = this.seeds(holes);
    var g = P.metricCov(holes, sd.x);
    var uStatic = P.staticU(g), u;
    if (this.mode === 'static') u = uStatic || [0, 0, 0, 1];
    else {
      var d = new Float64Array(8);
      P.rhs(holes, this.s, d);
      u = [d[0], d[1], d[2], d[3]];
    }
    var fr = P.frame(g, u, sd.fwd, sd.up);
    var near = P.nearest(holes, sd.x);
    var v = null;
    if (uStatic) { var gam = -P.dot(g, u, uStatic); v = Math.sqrt(Math.max(0, 1 - 1 / (gam * gam))); }
    return {
      pos: sd.x, fwd: sd.fwd,
      P: [P.lower(g, fr.e0), P.lower(g, fr.e1), P.lower(g, fr.e2), P.lower(g, fr.e3)],
      r: sd.r, ratio: near.k < 0 ? Infinity : near.ratio,
      insideHorizon: near.k >= 0 && near.ratio < 1,
      nearHorizon: near.k >= 0 && near.ratio < NEAR_BAND,
      v: v, rate: 1 / u[3], u: u
    };
  };

  // 往前走 dTau 的固有時；回傳這一步發生的事：'cross'（通過視界）、'end'（到奇異點）、'far'（飛遠了，改回懸停）
  Camera.prototype.advance = function (holes, dTau) {
    var events = [];
    if (dTau <= 0) return events;
    if (this.mode === 'static') {
      var g = P.metricCov(holes, this.position(holes)), u = P.staticU(g);
      this.tau += dTau;
      this.t += dTau * (u ? u[3] : 1);
      return events;
    }
    if (this.mode !== 'fall') return events;
    var d = new Float64Array(8), remaining = dTau, guard = 0;
    while (remaining > 1e-12 && guard++ < 20000) {
      P.rhs(holes, this.s, d);
      var h = Math.min(remaining, P.stepSize(holes, this.s, d, 0.01));
      P.rk4(holes, this.s, h);
      remaining -= h; this.tau += h;
      var near = P.nearest(holes, this.s);
      if (near.k >= 0 && near.ratio < 1 && this.crossTau === null) { this.crossTau = this.tau; events.push('cross'); }
      if (near.k >= 0 && near.ratio < 0.02) { this.mode = 'end'; events.push('end'); break; }
    }
    this.t = this.s[3];
    if (this.tau - this._trailTau > 0.2) {
      this._trailTau = this.tau;
      this.trail.push(this.s[0], this.s[1], this.s[2]);
      if (this.trail.length > 3000) this.trail.splice(0, 3);
    }
    var c = holes[0].pos;
    if (this.mode === 'fall' && Math.hypot(this.s[0] - c[0], this.s[1] - c[1], this.s[2] - c[2]) > 240) { this.hover(holes); events.push('far'); }
    return events;
  };

  /* 從現在懸停的位置放手。v 是相對當地靜止觀察者的初速（0 = 從靜止落下），
   * alpha 是方向（當地量到的角度）：0 = 正對黑洞，π/2 = 切向（順著吸積盤轉的方向），π = 背對黑洞。 */
  Camera.prototype.startFall = function (holes, v, alpha) {
    if (this.mode !== 'static') return false;
    var sd = this.seeds(holes);
    var tang = P.cross([0, 1, 0], sd.rhat), tn = Math.hypot(tang[0], tang[1], tang[2]);
    if (tn < 1e-6) { tang = [1, 0, 0]; tn = 1; }
    var s = P.launchLocal(holes, sd.x, [-sd.rhat[0], -sd.rhat[1], -sd.rhat[2]], [tang[0] / tn, tang[1] / tn, tang[2] / tn], alpha, v, 'ball');
    if (!s) return false;
    s[3] = this.t;
    this.s = s;
    this.mode = 'fall';
    this.fallTau0 = this.tau;
    this.crossTau = null;
    this.trail = [];
    this._trailTau = -1e9;
    this.replan(holes);
    return true;
  };

  Camera.prototype.replan = function (holes) {
    if (this.mode !== 'fall') { this.plan = null; return; }
    this.plan = P.trace(holes, this.s, { tSpan: 4000, rMax: 245, frac: 0.02, maxSteps: 60000, tau0: this.tau });
  };

  // 度規換了（例如黑洞變重）之後，把落下中的動量接到新的度規上
  Camera.prototype.renormalize = function (holes) {
    if (this.mode === 'fall') { P.normalizeMomentum(holes, this.s, -1); this.replan(holes); }
    else if (this.mode === 'static' && this.r < this.minRadius(holes)) this.r = this.minRadius(holes);
  };

  // 回到懸停：留在現在的方位；如果已經在視界附近或裡面，退回 rDefault
  Camera.prototype.hover = function (holes, rDefault) {
    var x = this.position(holes), c = holes[0].pos;
    var dx = x[0] - c[0], dy = x[1] - c[1], dz = x[2] - c[2];
    var r = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (r > 1e-9) { this.theta = Math.acos(Math.max(-1, Math.min(1, dy / r))); this.phi = Math.atan2(dz, dx); }
    if (this.mode === 'end' || r < 1.5 * holes[0].rs) r = rDefault || 12;
    this.r = Math.min(Math.max(r, this.minRadius(holes)), 200);
    this.mode = 'static';
    this.plan = null;
    this.crossTau = null;
  };

  BH.Camera = Camera;
})(typeof window !== 'undefined' ? window : globalThis);
