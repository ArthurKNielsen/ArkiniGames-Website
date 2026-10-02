(function () {
  "use strict";
  var FX = window.FX;

  var PRESETS = {
    surface: { a:[118,112,104], b:[94,90,84],   m:[44,42,40],  f:[10,9,9] },
    stone:   { a:[112,84,60],   b:[88,64,46],   m:[38,28,22],  f:[14,9,7] },
    fog:     { a:[176,154,114], b:[150,130,96], m:[104,88,64], f:[200,182,140] },
    blood:   { a:[132,30,20],   b:[100,20,14],  m:[48,8,6],    f:[160,32,20] },
    corrupt: { a:[30,96,70],    b:[20,70,90],   m:[8,20,18],   f:[6,24,18], glitch: true },
    alarm:   { a:[64,22,18],    b:[46,15,12],   m:[18,5,4],    f:[4,1,1], alarm: true },
    bottom:  { a:[76,64,54],    b:[60,50,44],   m:[30,24,20],  f:[40,10,8] }
  };
  var DIM = 0.42, SAT = 0.6;
  var BAY = [0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
  function lerp(a, b, t) { return [a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t]; }
  function hash(x, y) { var h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }

  FX.descent = function (opts) {
    var reduce = FX.reduced();
    var cv = document.createElement("canvas");
    cv.className = "descent-shaft"; cv.setAttribute("aria-hidden", "true");
    document.body.appendChild(cv);
    document.documentElement.classList.add("descent-on");
    var cx = cv.getContext("2d"), LW, LH, img, buf;
    function size() {
      LW = innerWidth < 700 ? 240 : 400;
      LH = Math.max(90, Math.round(LW * innerHeight / innerWidth));
      cv.width = LW; cv.height = LH; img = cx.createImageData(LW, LH); buf = img.data;
    }
    size(); addEventListener("resize", size);

    var parts = [];
    for (var i = 0; i < 9; i++) parts.push({
      type: i % 7 === 0 ? "stick" : (i % 3 === 0 ? "eye" : "drop"),
      x: Math.random(), y: Math.random() * 3, p: 0.4 + Math.random() * 0.9, r: Math.random() * 6.28, s: Math.random() < .6 ? 1 : 1.5
    });
    var mouse = { x: .5, y: .5 };
    function onMove(e) { mouse.x = e.clientX / innerWidth; mouse.y = e.clientY / innerHeight; }
    addEventListener("pointermove", onMove);

    var actx = null;
    function startAudio() {
      if (actx || !FX.sound.isOn()) return;
      var A = window.AudioContext || window.webkitAudioContext; if (A) actx = new A();
    }
    function unlock() { startAudio(); if (actx && actx.state === "suspended") actx.resume(); }
    ["pointerdown", "keydown", "touchend"].forEach(function (ev) { addEventListener(ev, unlock, { passive: true }); });
    unlock();
    var scrolled = 0, lastClick = 0;
    function clicks(dy) {
      scrolled += Math.abs(dy);
      var now = performance.now();
      if (scrolled >= 140 && now - lastClick > 70) { scrolled = 0; lastClick = now; FX.sound.tick(Math.random() * 3); }
    }
    function thud() {
      if (!actx || !FX.sound.isOn()) return;
      var t = actx.currentTime, o = actx.createOscillator(), g = actx.createGain();
      o.type = "sine"; o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(30, t + 0.6);
      g.gain.setValueAtTime(0.8, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
      o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + 0.75);
    }

    var sec = opts.sectors, travel = 0, lastY = scrollY, vel = 0, cur = -1, hitBottom = false, raf = 0, t0 = performance.now(), last = 0;
    function frame(now) {
      raf = requestAnimationFrame(frame);
      if (now - last < 33) return; last = now;
      var t = (now - t0) / 1000;
      var dy = scrollY - lastY; lastY = scrollY;
      vel = vel * 0.8 + Math.abs(dy) * 0.2;
      if (dy) clicks(dy);
      travel += (dy / innerHeight) * 1.4 + (reduce ? 0 : 0.0025);
      var mid = scrollY + innerHeight * 0.5, i = 0;
      for (var k = 0; k < sec.length; k++) if (sec[k].el.getBoundingClientRect().top + scrollY <= mid) i = k;
      var r0 = sec[i].el.getBoundingClientRect(), f = 0;
      if (i < sec.length - 1) { var nt = sec[i + 1].el.getBoundingClientRect().top + scrollY, tt = r0.top + scrollY; f = Math.min(1, Math.max(0, (mid - tt) / Math.max(1, nt - tt) - 0.6) / 0.4); }
      var A = PRESETS[sec[i].look] || PRESETS.stone, B = PRESETS[(sec[Math.min(sec.length - 1, i + 1)].look)] || A;
      var pa = lerp(A.a, B.a, f), pb = lerp(A.b, B.b, f), pm = lerp(A.m, B.m, f), pf = lerp(A.f, B.f, f);
      var alarm = A.alarm ? 0.85 + 0.15 * Math.abs(Math.sin(t * 2)) : 1;
      var glitch = A.glitch && Math.random() < 0.06;
      var cxm = LW / 2 + Math.sin(t * 0.7) * 4, cym = LH / 2 + Math.cos(t * 0.5) * 3, asp = LH / LW;
      for (var y = 0, p = 0; y < LH; y++) {
        var gy = glitch && hash(y, (t * 30) | 0) < 0.08 ? ((hash(y, 1) * 20) | 0) - 10 : 0;
        for (var x = 0; x < LW; x++, p += 4) {
          var dx = (x + gy - cxm) / LW, dyy = (y - cym) / LH * asp;
          var ax = Math.abs(dx), ay = Math.abs(dyy), r = Math.max(ax, ay) + 1e-4;
          var z = 0.12 / r, u = z + travel, v = ax > ay ? dyy / ax : dx / ay;
          var row = Math.floor(u * 3), frU = u * 3 - row, colv = v * 3 + (row & 1) * 0.5, col = Math.floor(colv), frV = colv - col;
          var c = (frU < 0.09 || frV < 0.07) ? pm : (hash(row, col) < 0.5 ? pa : pb);
          var shade = (ax > ay ? 1 : 0.82) * (row % 9 === 0 ? 1.25 : 1) * alarm * (0.85 + 0.3 * hash(row * 7, col * 3));
          var fog = Math.min(1, Math.pow(z / 3.2, 0.9)), o = (BAY[(y & 3) * 4 + (x & 3)] / 16 - 0.5) * 14;
          var R = c[0] * shade * (1 - fog) + pf[0] * fog, G = c[1] * shade * (1 - fog) + pf[1] * fog, Bl = c[2] * shade * (1 - fog) + pf[2] * fog;
          var L = (R * 0.3 + G * 0.59 + Bl * 0.11) * (1 - SAT), vig = 1 - Math.min(0.6, r * 0.9);
          buf[p] = (R * SAT + L) * DIM * vig + o * 0.5;
          buf[p + 1] = (G * SAT + L) * DIM * vig + o * 0.5;
          buf[p + 2] = (Bl * SAT + L) * DIM * vig + o * 0.5;
          buf[p + 3] = 255;
        }
      }
      for (var q = 0; q < buf.length; q += 4) { buf[q] &= 0xF8; buf[q + 1] &= 0xF8; buf[q + 2] &= 0xF8; }
      cx.putImageData(img, 0, 0);
      for (var n = 0; n < parts.length; n++) {
        var o2 = parts[n], sy = ((o2.y - travel * o2.p * 0.35) % 3 + 3) % 3;
        var py = (sy / 3) * (LH + 40) - 20, px = o2.x * LW, s = o2.s * (LW < 200 ? 1 : 1.25);
        cx.globalAlpha = 0.55;
        if (o2.type === "eye") eye(px, py, 3.5 * s);
        else if (o2.type === "stick") stick(px, py, 14 * s, o2.r + t * (0.6 + o2.p) + travel * 0.5);
        else { cx.fillStyle = "rgb(96,12,9)"; cx.fillRect(Math.round(px), Math.round(py), s, s * (vel > 8 ? 4 : 2)); }
      }
      cx.globalAlpha = 1;
      var max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      if (opts.depth) opts.depth(Math.round(Math.min(1, scrollY / max) * (opts.maxDepth || 6666)), sec[i].name);
      if (i !== cur) {
        cur = i; if (opts.onSector) opts.onSector(i, sec[i]);
        if (i === sec.length - 1 && !hitBottom) {
          hitBottom = true; thud();
          if (!reduce) { document.body.classList.add("descent-shake"); setTimeout(function () { document.body.classList.remove("descent-shake"); }, 500); }
        }
        if (i < sec.length - 2) hitBottom = false;
      }
    }
    function disc(x, y, r, col) {
      cx.fillStyle = col;
      for (var yy = -r; yy <= r; yy++) { var w = Math.round(Math.sqrt(r * r - yy * yy + r * 0.6)); cx.fillRect(x - w, y + yy, w * 2 + 1, 1); }
    }
    function eye(x, y, R) {
      x = Math.round(x); y = Math.round(y); R = Math.max(3, Math.round(R));
      disc(x + 1, y + 1, R + 1, "rgb(12,6,5)"); disc(x, y, R, "rgb(218,206,190)");
      cx.fillStyle = "rgb(168,40,30)"; cx.fillRect(x - R + 1, y, Math.max(1, R >> 1), 1); cx.fillRect(x + (R >> 1), y - 1, Math.max(1, R >> 1), 1);
      var ex = mouse.x * LW - x, ey = mouse.y * LH - y, d = Math.hypot(ex, ey) || 1, m = R * 0.42;
      var ix = Math.round(x + ex / d * m), iy = Math.round(y + ey / d * m), ir = Math.max(2, Math.round(R * 0.55));
      disc(ix, iy, ir, "rgb(116,54,26)"); disc(ix, iy, Math.max(1, ir >> 1), "rgb(4,2,2)");
      cx.fillStyle = "rgb(250,245,235)"; cx.fillRect(ix - (ir >> 1), iy - (ir >> 1), 1, 1);
    }
    function stick(x, y, L, a) {
      var dx = Math.cos(a) * L / 2, dy = Math.sin(a) * L / 2;
      cx.strokeStyle = "rgb(30,16,10)"; cx.lineWidth = 3; cx.beginPath(); cx.moveTo(x - dx, y - dy); cx.lineTo(x + dx, y + dy); cx.stroke();
      cx.strokeStyle = "rgb(120,74,40)"; cx.lineWidth = 1.6; cx.beginPath(); cx.moveTo(x - dx, y - dy); cx.lineTo(x + dx, y + dy); cx.stroke();
    }
    raf = requestAnimationFrame(frame);

    return function stop() {
      cancelAnimationFrame(raf);
      removeEventListener("resize", size); removeEventListener("pointermove", onMove);
      ["pointerdown", "keydown", "touchend"].forEach(function (ev) { removeEventListener(ev, unlock); });
      if (actx) actx.close();
      cv.remove(); document.documentElement.classList.remove("descent-on");
    };
  };
})();
