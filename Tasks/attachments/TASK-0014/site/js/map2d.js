/* 黑洞模擬 —— 俯視圖（從 +y 往下看赤道面；x 向右、z 向下；不在赤道面上的東西是投影）
 *
 * 畫的是「座標上的位置」，不是看到的樣子：
 *   示範光束：一排平行光從左邊射進來，各自被彎成什麼路徑（紅＝被抓住，藍＝逃走）
 *   物體／光束：整條預定路徑、實心點＝攝影機此刻看到它在哪、空心圈＝它在座標上現在在哪
 *   攝影機：位置、視線方向、落下時的預定路徑
 * 在圖上按住拖曳＝彈弓：按下的地方是發射點，拖的方向是發射方向，拖多長是速度，放開就發射。
 */
(function (root) {
  'use strict';
  var BH = root.BH = root.BH || {};
  var P = BH.Physics;

  function Map2D(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.range = 16;            // 畫面半寬（rs）
    this.showBeams = true;
    this.beams = [];
    this.onAim = null;          // (partialSpec) 拖曳時回報
    this.onFire = null;         // 放開時回報
    this.drag = null;
    var self = this;
    canvas.addEventListener('pointerdown', function (e) { self.down(e); });
    canvas.addEventListener('pointermove', function (e) { self.move(e); });
    canvas.addEventListener('pointerup', function (e) { self.up(e); });
    canvas.addEventListener('pointercancel', function () { self.drag = null; });
    canvas.addEventListener('wheel', function (e) {
      e.preventDefault();
      self.range = Math.min(80, Math.max(4, self.range * (e.deltaY > 0 ? 1.15 : 1 / 1.15)));
    }, { passive: false });
  }

  Map2D.prototype.resize = function () {
    var c = this.canvas, dpr = Math.min(2, root.devicePixelRatio || 1);
    var w = Math.round(c.clientWidth * dpr), h = Math.round(c.clientHeight * dpr);
    if (w > 0 && h > 0 && (c.width !== w || c.height !== h)) { c.width = w; c.height = h; }
  };

  Map2D.prototype.toWorld = function (e) {
    var rect = this.canvas.getBoundingClientRect();
    var k = rect.width / (2 * this.range);
    return { x: (e.clientX - rect.left - rect.width / 2) / k, z: (e.clientY - rect.top - rect.height / 2) / k, k: k };
  };

  Map2D.prototype.down = function (e) {
    var w = this.toWorld(e), rs = this.rs || 1;
    var r = Math.hypot(w.x, w.z);
    if (r < 1.15 * rs) return;
    this.canvas.setPointerCapture(e.pointerId);
    this.drag = { x: w.x, z: w.z, px: e.clientX, py: e.clientY, len: 0 };
    if (this.onAim) this.onAim({ r0: r, phi0: Math.atan2(w.z, w.x) });
  };
  Map2D.prototype.move = function (e) {
    if (!this.drag) return;
    var dx = e.clientX - this.drag.px, dz = e.clientY - this.drag.py, len = Math.hypot(dx, dz);
    this.drag.len = len; this.drag.dx = dx; this.drag.dz = dz;
    if (len < 6) return;
    var phi0 = Math.atan2(this.drag.z, this.drag.x), cp = Math.cos(phi0), sp = Math.sin(phi0);
    var ux = dx / len, uz = dz / len;
    var radialIn = -(ux * cp + uz * sp), tang = ux * sp - uz * cp;
    // 圖上畫的是座標方向；拋射器要的是當地量到的角度（徑向分量在當地比較長）
    var k = Math.sqrt(Math.max(1e-6, 1 - (this.rs || 0) / Math.hypot(this.drag.x, this.drag.z)));
    if (this.onAim) this.onAim({ alpha: Math.atan2(tang * k, radialIn), speed: Math.min(0.95, len / 130) });
  };
  Map2D.prototype.up = function () {
    var d = this.drag;
    this.drag = null;
    if (d && d.len >= 6 && this.onFire) this.onFire();
  };

  // 示範用的平行光束：從左邊 x = −30 往 +x 射，撞擊參數各不相同
  Map2D.prototype.buildBeams = function (holes) {
    var bs = [], k, list = [];
    for (k = -12; k <= 12; k++) list.push(k * 0.7);
    list.push(2.55, -2.55, 2.65, -2.65);
    for (k = 0; k < list.length; k++) {
      var s = P.launch(holes, [-30, 0, list[k]], [1, 0, 0], 1, 'light');
      if (!s) continue;
      var tr = P.trace(holes, s, { rMax: 36, frac: 0.015, maxSteps: 20000, tSpan: 260 });
      bs.push({ X: tr.X, Z: tr.Z, T: tr.T, n: tr.n, captured: tr.fate === 'singularity' });
    }
    this.beams = bs;
  };

  function at(arrT, arrA, n, t) {
    var lo = 0, hi = n - 1;
    if (t <= arrT[0] || t >= arrT[hi]) return null;
    while (hi - lo > 1) { var m = (lo + hi) >> 1; if (arrT[m] <= t) lo = m; else hi = m; }
    var w = (t - arrT[lo]) / (arrT[hi] - arrT[lo]);
    return arrA[lo] + (arrA[hi] - arrA[lo]) * w;
  }

  /* st = { holes, tCam, disk:{on,rin,rout}, cam:{pos, fwd, mode, plan, trail, fov}, bodies:[...],
   *        preview: 軌跡或 null, aim: {x, dir} 或 null, kind, unitLabel } */
  Map2D.prototype.draw = function (st) {
    this.resize();
    var c = this.canvas, ctx = this.ctx, W = c.width, H = c.height;
    if (!W || !H) return;
    var k = W / (2 * this.range), cx = W / 2, cy = H / 2, dpr = W / c.clientWidth;
    var rs = st.holes[0].rs, hx = st.holes[0].pos[0], hz = st.holes[0].pos[2];
    this.rs = rs;
    function X(x) { return cx + x * k; }
    function Y(z) { return cy + z * k; }
    function circle(x, z, r) { ctx.beginPath(); ctx.arc(X(x), Y(z), Math.max(0, r * k), 0, 6.2832); }
    var i, j, b;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(7,9,15,0.92)';
    ctx.fillRect(0, 0, W, H);
    ctx.lineWidth = 1 * dpr;
    ctx.font = (10 * dpr) + 'px sans-serif';

    // 距離圈
    var ring = this.range > 40 ? 20 : (this.range > 18 ? 10 : 5);
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.fillStyle = 'rgba(255,255,255,0.30)';
    for (var rr = ring; rr < this.range * 1.5; rr += ring) {
      circle(hx, hz, rr); ctx.stroke();
      ctx.fillText(rr + ' rs', X(hx) + rr * k * 0.7071 + 3 * dpr, Y(hz) - rr * k * 0.7071 - 2 * dpr);
    }

    // 吸積盤
    if (st.disk.on) {
      ctx.beginPath();
      ctx.arc(X(hx), Y(hz), st.disk.rout * k, 0, 6.2832);
      ctx.arc(X(hx), Y(hz), st.disk.rin * k, 0, 6.2832, true);
      ctx.fillStyle = 'rgba(255,150,60,0.10)';
      ctx.fill();
    }

    // 示範光束
    if (this.showBeams) {
      for (i = 0; i < this.beams.length; i++) {
        b = this.beams[i];
        ctx.beginPath();
        ctx.moveTo(X(b.X[0]), Y(b.Z[0]));
        for (j = 1; j < b.n; j++) ctx.lineTo(X(b.X[j]), Y(b.Z[j]));
        ctx.strokeStyle = b.captured ? 'rgba(255,110,90,0.50)' : 'rgba(150,200,255,0.42)';
        ctx.stroke();
        var span = b.T[b.n - 1] - b.T[0], period = 7;
        ctx.fillStyle = 'rgba(255,255,220,0.9)';
        for (var q = 0; q * period < span; q++) {
          var tp = b.T[0] + (((st.tCam % period) + period) % period) + q * period;
          var px = at(b.T, b.X, b.n, tp), pz = at(b.T, b.Z, b.n, tp);
          if (px === null) continue;
          ctx.beginPath(); ctx.arc(X(px), Y(pz), 1.6 * dpr, 0, 6.2832); ctx.fill();
        }
      }
    }

    // 特徵半徑
    if (rs > 0) {
      ctx.setLineDash([4 * dpr, 4 * dpr]);
      ctx.strokeStyle = 'rgba(255,255,255,0.22)';
      circle(hx, hz, 3 * rs); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,220,110,0.55)';
      circle(hx, hz, 1.5 * rs); ctx.stroke();
      ctx.setLineDash([]);
      circle(hx, hz, rs);
      ctx.fillStyle = '#000'; ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.stroke();
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillText('（黑洞已拿掉）', X(hx) - 34 * dpr, Y(hz) + 4 * dpr);
    }

    // 拋進去的東西
    for (i = 0; i < st.bodies.length; i++) {
      b = st.bodies[i];
      var tr = b.tr, col = 'rgb(' + Math.round(b.color[0] * 255) + ',' + Math.round(b.color[1] * 255) + ',' + Math.round(b.color[2] * 255) + ')';
      if (b.pulse === 0) {
        var stp = Math.max(1, Math.floor(tr.n / 600));
        ctx.beginPath();
        ctx.moveTo(X(tr.X[0]), Y(tr.Z[0]));
        for (j = stp; j < tr.n; j += stp) ctx.lineTo(X(tr.X[j]), Y(tr.Z[j]));
        ctx.lineTo(X(tr.X[tr.n - 1]), Y(tr.Z[tr.n - 1]));
        ctx.globalAlpha = 0.38; ctx.strokeStyle = col; ctx.stroke(); ctx.globalAlpha = 1;
      }
      var rad = (b.kind === 'light' ? 2.2 : 3.4) * dpr;
      if (b.now) {
        ctx.beginPath(); ctx.arc(X(b.now.x), Y(b.now.z), rad + 1.5 * dpr, 0, 6.2832);
        ctx.strokeStyle = col; ctx.globalAlpha = 0.75; ctx.stroke(); ctx.globalAlpha = 1;
      }
      if (b.seen) {
        ctx.fillStyle = col;
        if (b.shape === 'cube') ctx.fillRect(X(b.seen.x) - rad, Y(b.seen.z) - rad, 2 * rad, 2 * rad);
        else { ctx.beginPath(); ctx.arc(X(b.seen.x), Y(b.seen.z), rad, 0, 6.2832); ctx.fill(); }
      }
    }

    // 拋射器：預覽路徑、發射點與方向
    if (st.preview) {
      var pv = st.preview, sp = Math.max(1, Math.floor(pv.n / 500));
      ctx.setLineDash([3 * dpr, 4 * dpr]);
      ctx.beginPath();
      ctx.moveTo(X(pv.X[0]), Y(pv.Z[0]));
      for (j = sp; j < pv.n; j += sp) ctx.lineTo(X(pv.X[j]), Y(pv.Z[j]));
      ctx.lineTo(X(pv.X[pv.n - 1]), Y(pv.Z[pv.n - 1]));
      ctx.strokeStyle = st.kind === 'light' ? 'rgba(120,255,150,0.75)' : 'rgba(255,225,120,0.75)';
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (st.aim) {
      var ax = X(st.aim.x[0]), az = Y(st.aim.x[2]);
      var dl = Math.hypot(st.aim.dir[0], st.aim.dir[2]) || 1;
      ctx.strokeStyle = '#fff'; ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(ax, az, 3 * dpr, 0, 6.2832); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ax, az);
      ctx.lineTo(ax + st.aim.dir[0] / dl * 16 * dpr, az + st.aim.dir[2] / dl * 16 * dpr); ctx.stroke();
    }

    // 攝影機
    var cam = st.cam;
    if (cam.plan) {
      var pl = cam.plan, ps = Math.max(1, Math.floor(pl.n / 500));
      ctx.setLineDash([2 * dpr, 4 * dpr]);
      ctx.beginPath(); ctx.moveTo(X(pl.X[0]), Y(pl.Z[0]));
      for (j = ps; j < pl.n; j += ps) ctx.lineTo(X(pl.X[j]), Y(pl.Z[j]));
      ctx.lineTo(X(pl.X[pl.n - 1]), Y(pl.Z[pl.n - 1]));
      ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.stroke();
      ctx.setLineDash([]);
    }
    if (cam.trail && cam.trail.length >= 6) {
      ctx.beginPath(); ctx.moveTo(X(cam.trail[0]), Y(cam.trail[2]));
      for (j = 3; j < cam.trail.length; j += 3) ctx.lineTo(X(cam.trail[j]), Y(cam.trail[j + 2]));
      ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.stroke();
    }
    var mx = X(cam.pos[0]), mz = Y(cam.pos[2]);
    var fl = Math.hypot(cam.fwd[0], cam.fwd[2]);
    if (fl > 0.05) {
      var ang = Math.atan2(cam.fwd[2], cam.fwd[0]), half = cam.fov * Math.PI / 360, len = 26 * dpr;
      ctx.beginPath(); ctx.moveTo(mx, mz);
      ctx.arc(mx, mz, len, ang - half, ang + half); ctx.closePath();
      ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fill();
    }
    ctx.beginPath(); ctx.arc(mx, mz, 4 * dpr, 0, 6.2832);
    ctx.fillStyle = cam.mode === 'static' ? '#fff' : '#ffd24a'; ctx.fill();
    ctx.strokeStyle = '#000'; ctx.stroke();

    // 拖曳中的彈弓線
    if (this.drag && this.drag.len >= 6) {
      var sx = X(this.drag.x), sz = Y(this.drag.z);
      ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 2 * dpr;
      ctx.beginPath(); ctx.moveTo(sx, sz); ctx.lineTo(sx + this.drag.dx * dpr, sz + this.drag.dz * dpr); ctx.stroke();
      ctx.lineWidth = 1 * dpr;
    }

    // 圖例
    ctx.fillStyle = 'rgba(255,255,255,0.78)';
    ctx.font = (11 * dpr) + 'px sans-serif';
    ctx.fillText('俯視圖（赤道面投影）', 8 * dpr, 15 * dpr);
    ctx.fillStyle = 'rgba(255,255,255,0.50)';
    ctx.font = (10 * dpr) + 'px sans-serif';
    ctx.fillText('● 你此刻看到的位置　○ 座標上現在的位置', 8 * dpr, H - 21 * dpr);
    ctx.fillText('虛線圈：光子球 1.5 rs、最內穩定軌道 3 rs　在圖上拖曳＝發射', 8 * dpr, H - 8 * dpr);
  };

  BH.Map2D = Map2D;
})(typeof window !== 'undefined' ? window : globalThis);
