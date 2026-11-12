/* 黑洞模擬 —— 物理核心的自我測試：每一項都印「量到的／解析值／誤差／容許」，不是只印通過。
 *   node js/selftest.js          在終端機跑
 *   index.html?selftest=1        在瀏覽器跑（另外加上用顯示卡算的幾項，寫在 app.js）
 */
(function (root) {
  'use strict';
  var P = (typeof module !== 'undefined' && module.exports) ? require('./physics.js') : root.BH.Physics;

  function row(name, got, want, tol, how, note) {
    var err = (how === 'abs') ? Math.abs(got - want) : Math.abs(got - want) / Math.abs(want);
    return { name: name, got: got, want: want, err: err, tol: tol, how: how || 'rel', pass: err <= tol, note: note || '' };
  }

  // 在赤道面（y = 0）從 (x0, 0, z0) 往 +x 射一道光，回傳軌跡與它的撞擊參數 b = |L| / E
  function shootLight(holes, x0, z0, rMax) {
    var s = P.launch(holes, [x0, 0, z0], [1, 0, 0], 1, 'light');
    var Ly = s[2] * s[4] - s[0] * s[6];
    var b = Math.abs(Ly) / (-s[7]);
    var tr = P.trace(holes, s, { rMax: rMax, frac: 0.01, maxSteps: 200000 });
    return { tr: tr, b: b };
  }

  // 軌跡上第一次 r 降到 rTarget 時的某個量（線性內插）
  function atRadius(tr, rTarget, arr, rising) {
    for (var i = 1; i < tr.n; i++) {
      var r0 = Math.hypot(tr.X[i - 1], tr.Y[i - 1], tr.Z[i - 1]);
      var r1 = Math.hypot(tr.X[i], tr.Y[i], tr.Z[i]);
      var hit = rising ? (r0 < rTarget && r1 >= rTarget) : (r0 > rTarget && r1 <= rTarget);
      if (hit) { var w = (rTarget - r0) / (r1 - r0); return arr[i - 1] + w * (arr[i] - arr[i - 1]); }
    }
    return NaN;
  }

  function run() {
    var out = [];
    var H1 = [P.makeHole({ rs: 1 })];
    var i, tr, s;

    // 1. 弱場偏折角
    (function () {
      var r = shootLight(H1, -3000, 50, 3200);
      var n = r.tr.n - 1;
      var ang = Math.atan2(-r.tr.UZ[n], r.tr.UX[n]);
      var q = 1 / r.b;
      var want = 2 * q + (15 * Math.PI / 16) * q * q;
      out.push(row('弱場偏折角（b ≈ 50 rs，弧度）', ang, want, 5e-3, 'rel', '解析值 = 2rs/b + (15π/16)(rs/b)²；b = ' + r.b.toFixed(4)));
    })();

    // 2. 臨界撞擊參數：二分找「剛好被抓住」的 b
    (function () {
      var lo = 2.0, hi = 3.2, bLo = 0, bHi = 0;
      for (i = 0; i < 44; i++) {
        var mid = 0.5 * (lo + hi);
        var r = shootLight(H1, -400, mid, 450);
        if (r.tr.fate === 'singularity') { lo = mid; bLo = r.b; } else { hi = mid; bHi = r.b; }
      }
      out.push(row('臨界撞擊參數 b_c / rs', 0.5 * (bLo + bHi), P.B_CRIT, 1e-4, 'rel', '解析值 = 3√3/2'));
    })();

    // 3. 光子球：r = 1.5 rs 切向射出的光繞一圈還在 1.5 rs
    (function () {
      s = P.launch(H1, [1.5, 0, 0], [0, 0, 1], 1, 'light');
      var period = 2 * Math.PI * Math.sqrt(2 * 1.5 * 1.5 * 1.5);
      tr = P.trace(H1, s, { tSpan: period, frac: 0.004, maxSteps: 200000 });
      var dev = 0;
      for (i = 0; i < tr.n; i++) dev = Math.max(dev, Math.abs(Math.hypot(tr.X[i], tr.Y[i], tr.Z[i]) - 1.5));
      out.push(row('光子球：繞一圈後 |r − 1.5 rs| 的最大值', dev, 0, 1e-4, 'abs', '座標週期 ' + period.toFixed(3) + ' rs/c'));
    })();

    // 4. 從靜止徑向落下的固有時（r0 = 10 → 0.02 rs）
    (function () {
      s = P.launch(H1, [10, 0, 0], [-1, 0, 0], 0, 'ball');
      tr = P.trace(H1, s, { rEnd: 0.01, frac: 0.005, maxSteps: 400000 });
      var got = atRadius(tr, 0.02, tr.TAU);
      var eta = Math.acos(2 * 0.02 / 10 - 1);
      var want = 0.5 * 10 * Math.sqrt(10) * (eta + Math.sin(eta));
      out.push(row('靜止落下的固有時 τ（10 → 0.02 rs）', got, want, 1e-4, 'rel', '擺線解；到 r = 0 是 (π/2) r0 √(r0/rs) = ' + (Math.PI / 2 * 10 * Math.sqrt(10)).toFixed(4)));
    })();

    // 5. 圓軌道 r = 6 rs：一個週期後半徑沒變、剛好轉一圈
    (function () {
      var r0 = 6;
      s = P.launch(H1, [r0, 0, 0], [0, 0, 1], P.vCirc(r0, 1), 'ball');
      var period = 2 * Math.PI * Math.sqrt(2 * r0 * r0 * r0);
      tr = P.trace(H1, s, { tSpan: period, frac: 0.005, maxSteps: 400000 });
      var dev = 0;
      for (i = 0; i < tr.n; i++) dev = Math.max(dev, Math.abs(Math.hypot(tr.X[i], tr.Y[i], tr.Z[i]) - r0));
      var n = tr.n - 1;
      var phi = Math.atan2(tr.Z[n], tr.X[n]);
      out.push(row('圓軌道 r = 6 rs：一圈內 |r − 6| 的最大值', dev, 0, 1e-5, 'abs', '速度 v = ' + P.vCirc(r0, 1).toFixed(6) + ' c'));
      out.push(row('圓軌道 r = 6 rs：過一個座標週期後的角度（弧度）', phi, 0, 1e-4, 'abs', '週期 = 2π√(2r³/rs) = ' + period.toFixed(4)));
    })();

    // 6. ISCO 的能量
    (function () {
      s = P.launch(H1, [3, 0, 0], [0, 0, 1], P.vCirc(3, 1), 'ball');
      out.push(row('ISCO（r = 3 rs）圓軌道的能量 E/m', -s[7], Math.sqrt(8 / 9), 1e-9, 'rel', '解析值 = √(8/9)'));
    })();

    // 7. 哈密頓量守恆（一條會掉進去的軌道）
    (function () {
      s = P.launch(H1, [8, 0, 0], [0, 0, 1], 0.2, 'ball');
      tr = P.trace(H1, s, { frac: 0.01, tSpan: 2000, maxSteps: 400000 });
      var st = new Float64Array(8), devOut = 0, devIn = 0;
      for (i = 0; i < tr.n; i++) {
        st[0] = tr.X[i]; st[1] = tr.Y[i]; st[2] = tr.Z[i]; st[3] = tr.T[i];
        st[4] = tr.PX[i]; st[5] = tr.PY[i]; st[6] = tr.PZ[i]; st[7] = tr.PT[i];
        var dH = Math.abs(P.hamiltonian(H1, st) + 0.5);
        if (Math.hypot(tr.X[i], tr.Y[i], tr.Z[i]) > 1) devOut = Math.max(devOut, dH); else devIn = Math.max(devIn, dH);
      }
      out.push(row('H 守恆：|H + ½| 的最大值，視界外（r = 8 切向 0.2c 掉進去）', devOut, 0, 1e-7, 'abs', '結局 ' + tr.fate + '，' + tr.n + ' 步'));
      out.push(row('H 守恆：|H + ½| 的最大值，視界內一路到 0.02 rs', devIn, 0, 1e-3, 'abs', '越靠近奇異點動量越大，誤差跟著放大；步長減半誤差約除以 16（四階）'));
    })();

    // 8. 雨滴（從無限遠靜止落下，E/m = 1）
    (function () {
      s = P.launch(H1, [10, 0, 0], [-1, 0, 0], P.vEsc(10, 1), 'ball');
      tr = P.trace(H1, s, { rEnd: 0.01, frac: 0.005, maxSteps: 400000 });
      out.push(row('雨滴：E/m', -s[7], 1, 1e-9, 'rel', '在 r = 10 rs 以當地逃逸速度向內'));
      var got = atRadius(tr, 0.02, tr.TAU);
      var want = (2 / 3) * (Math.pow(10, 1.5) - Math.pow(0.02, 1.5));
      out.push(row('雨滴的固有時 τ（10 → 0.02 rs）', got, want, 1e-4, 'rel', '解析值 = (2/3)(r0^1.5 − r^1.5)/√rs'));
      var tWant = (2 / 3) * (Math.pow(10, 1.5) - 1) - 2 * (1 - Math.sqrt(10)) + 2 * Math.log(2 / (Math.sqrt(10) + 1));
      out.push(row('雨滴穿過視界的座標時間 t（有限）', tr.crossT, tWant, 1e-4, 'rel', '這套座標在視界上不發散'));
    })();

    // 9. 標架正交：靠近視界的靜止觀察者、視界內的落體
    (function () {
      function frameErr(g, fr) {
        var e = [fr.e0, fr.e1, fr.e2, fr.e3], eta = [-1, 1, 1, 1], dev = 0;
        for (var a = 0; a < 4; a++) for (var b = 0; b < 4; b++) {
          dev = Math.max(dev, Math.abs(P.dot(g, e[a], e[b]) - (a === b ? eta[a] : 0)));
        }
        return dev;
      }
      var x = [1.05 * 0.6, 1.05 * 0.0, 1.05 * 0.8];
      var g = P.metricCov(H1, x);
      var fr = P.frame(g, P.staticU(g), [-0.6, 0.1, -0.8], [0, 1, 0]);
      out.push(row('標架正交誤差：r = 1.05 rs 的靜止觀察者', frameErr(g, fr), 0, 1e-9, 'abs'));
      s = P.launch(H1, [10, 0, 0], [-1, 0, 0], P.vEsc(10, 1), 'ball');
      tr = P.trace(H1, s, { rEnd: 0.01, frac: 0.01 });
      for (i = 0; i < tr.n; i++) if (Math.hypot(tr.X[i], tr.Y[i], tr.Z[i]) < 0.5) break;
      var xi = [tr.X[i], tr.Y[i], tr.Z[i]];
      g = P.metricCov(H1, xi);
      var u = [tr.UX[i], tr.UY[i], tr.UZ[i], tr.UT[i]];
      fr = P.frame(g, u, [-1, 0.2, 0.1], [0, 1, 0]);
      out.push(row('標架正交誤差：視界內 r ≈ 0.5 rs 的落體', frameErr(g, fr), 0, 1e-9, 'abs', 'g(u,u) = ' + P.dot(g, u, u).toFixed(9)));
    })();

    // 10. 向外的光離開視界附近要花多久（「凍結」的來源）
    (function () {
      s = P.launch(H1, [1.01, 0, 0], [1, 0, 0], 1, 'light');
      tr = P.trace(H1, s, { rMax: 12, frac: 0.002, maxSteps: 400000 });
      var got = atRadius(tr, 10, tr.T, true);
      out.push(row('向外的光從 1.01 rs 到 10 rs 的座標時間', got, P.outgoingDelay(1.01, 10, 1), 1e-3, 'rel', '解析值 = Δr + 2rs ln((r2−rs)/(r1−rs))；從 1.0001 rs 出發要 ' + P.outgoingDelay(1.0001, 10, 1).toFixed(2)));
    })();

    // 11. p_t 重新歸一
    (function () {
      s = P.launch(H1, [3, 0, 0], [0, 0, 1], 0.4, 'ball');
      var want = s[7];
      s[7] = 123;
      P.normalizeMomentum(H1, s, -1);
      out.push(row('由空間動量解回 p_t', s[7], want, 1e-9, 'rel'));
    })();

    // 13. 視界內還剩多少時間（跟 NASA 2024、Hamilton 的影片比對用；見 README「跟文獻比對」）
    (function () {
      // 徑向雨滴：通過視界 → 0.02 rs
      s = P.launch(H1, [10, 0, 0], [-1, 0, 0], P.vEsc(10, 1), 'ball');
      tr = P.trace(H1, s, { rEnd: 0.01, frac: 0.005, maxSteps: 400000 });
      out.push(row('視界內剩下的固有時：徑向雨滴（1 → 0.02 rs）', atRadius(tr, 0.02, tr.TAU) - tr.crossTau, (2 / 3) * (1 - Math.pow(0.02, 1.5)), 1e-4, 'rel',
        '解析值 (2/3) rs/c；人馬座 A*（430 萬倍太陽質量，rs/c = 42.35 秒）是 ' + ((2 / 3) * 42.35).toFixed(1) + ' 秒'));
      // 帶角動量的拋物線墜落（E/m = 1，L 略小於臨界值 2 rs c）：找出讓 L = 1.98 的發射角
      var v = P.vEsc(10, 1), lo = 0, hi = Math.PI / 2, L = 0, a = 0;
      for (i = 0; i < 50; i++) {
        a = 0.5 * (lo + hi);
        s = P.launch(H1, [10, 0, 0], [-Math.cos(a), 0, Math.sin(a)], v, 'ball');
        L = Math.abs(s[2] * s[4] - s[0] * s[6]);
        if (L < 1.98) lo = a; else hi = a;
      }
      tr = P.trace(H1, s, { rEnd: 0.01, frac: 0.004, maxSteps: 400000 });
      var E = -s[7], N = 200000, sum = 0;
      function fI(r) { return 1 / Math.sqrt(E * E - (1 - 1 / r) * (1 + L * L / (r * r))); }
      for (i = 0; i <= N; i++) { var rr = 0.02 + (1 - 0.02) * i / N; sum += fI(rr) * (i === 0 || i === N ? 1 : (i % 2 ? 4 : 2)); }
      var want = sum * (1 - 0.02) / N / 3;
      out.push(row('視界內剩下的固有時：帶角動量的拋物線墜落（E/m = 1、L = 1.98 rs c）', atRadius(tr, 0.02, tr.TAU) - tr.crossTau, want, 1e-4, 'rel',
        '解析值是徑向方程式的數值積分。NASA 2024 的影片 12.8 秒（430 萬倍）＝ 0.30 rs/c，Hamilton 16 秒（500 萬倍）＝ 0.33 rs/c，都是繞進去的軌道'));
    })();

    // 14. 雨滴觀察者通過視界時回頭看正後方：天空的光頻率剩一半（解析值 1/(1 + √(rs/r))）
    (function () {
      s = P.launch(H1, [10, 0, 0], [-1, 0, 0], P.vEsc(10, 1), 'ball');
      tr = P.trace(H1, s, { rEnd: 0.01, frac: 0.003, maxSteps: 400000 });
      function shiftBehind(st) {
        var x = [st.x, st.y, st.z], g = P.metricCov(H1, x), u = [st.ux, st.uy, st.uz, st.ut];
        var rr = Math.hypot(st.x, st.y, st.z);
        var fr = P.frame(g, u, [st.x / rr, st.y / rr, st.z / rr], [0, 1, 0]);   // 「前」＝背對黑洞
        var p0 = P.lower(g, fr.e0), p3 = P.lower(g, fr.e3);
        return 1 / (-p0[3] + p3[3]);          // 著色器裡同一條式子：p = −P0 + d·P，g = 1 / p_t
      }
      var st = P.sampleAt(tr, tr.crossT);
      out.push(row('雨滴觀察者在視界回頭看：正後方天空的頻率變成幾倍', shiftBehind(st), 0.5, 1e-4, 'rel', '紅移一半；黑洞不會在這一刻把天空「關掉」'));
      for (i = 1; i < tr.n; i++) if (Math.hypot(tr.X[i], tr.Y[i], tr.Z[i]) <= 0.05) break;
      st = P.sampleAt(tr, tr.T[i]);
      var r05 = Math.hypot(st.x, st.y, st.z);
      out.push(row('雨滴觀察者在 0.05 rs 回頭看：正後方天空的頻率變成幾倍', shiftBehind(st), 1 / (1 + Math.sqrt(1 / r05)), 1e-4, 'rel',
        '越往裡面正後方越紅越暗；同一刻影子邊緣那一圈的頻率是 ' + (P.B_CRIT / r05).toFixed(0) + ' 倍左右（藍移）'));
    })();

    // 12. 反向對照：把黑洞拿掉 ⇒ 光走直線、瞄準中心也不會被抓住
    (function () {
      var H0 = [P.makeHole({ rs: 0 })];
      var r = shootLight(H0, -300, 5, 400);
      var n = r.tr.n - 1;
      out.push(row('反向對照（沒有黑洞）：b = 5 的偏折角', Math.atan2(-r.tr.UZ[n], r.tr.UX[n]), 0, 1e-12, 'abs'));
      r = shootLight(H0, -300, 0.5, 400);
      out.push(row('反向對照（沒有黑洞）：b = 0.5 的光有沒有被抓住（0 = 沒有）', r.tr.fate === 'singularity' ? 1 : 0, 0, 0, 'abs', '結局 ' + r.tr.fate));
      r = shootLight(H1, -300, 0.5, 400);
      out.push(row('對照組（有黑洞）：b = 0.5 的光有沒有被抓住（1 = 有）', r.tr.fate === 'singularity' ? 1 : 0, 1, 0, 'abs', '結局 ' + r.tr.fate));
    })();

    return out;
  }

  function format(rows) {
    var lines = [], bad = 0;
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      if (!r.pass) bad++;
      lines.push((r.pass ? '  ' : '✗ ') + r.name);
      lines.push('      量到 ' + fmt(r.got) + '   解析值 ' + fmt(r.want) + '   ' + (r.how === 'abs' ? '絕對' : '相對') + '誤差 ' + r.err.toExponential(2) + '（容許 ' + r.tol.toExponential(1) + '）' + (r.note ? '\n      ' + r.note : ''));
    }
    lines.push('');
    lines.push('項目 ' + rows.length + '，沒過 ' + bad);
    return { text: lines.join('\n'), bad: bad, total: rows.length };
  }
  function fmt(v) { return (Math.abs(v) >= 1e-3 && Math.abs(v) < 1e6) || v === 0 ? (+v.toPrecision(9)).toString() : v.toExponential(4); }

  var api = { run: run, format: format, row: row };
  root.BH = root.BH || {};
  root.BH.SelfTest = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
    if (require.main === module) {
      var res = format(run());
      console.log(res.text);
      process.exit(res.bad ? 1 : 0);
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);
