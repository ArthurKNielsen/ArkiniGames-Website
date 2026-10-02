(function () {
  "use strict";

  var FX = {};
  var motionQuery = matchMedia("(prefers-reduced-motion: reduce)");
  FX.reduced = function () { return motionQuery.matches; };

  FX.store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  function texTri(c, img, p0, p1, p2, u0, u1, u2) {
    var den = (u0[0] - u2[0]) * (u1[1] - u2[1]) - (u1[0] - u2[0]) * (u0[1] - u2[1]);
    if (!den) return;
    var a = ((p0[0] - p2[0]) * (u1[1] - u2[1]) - (p1[0] - p2[0]) * (u0[1] - u2[1])) / den;
    var cc = ((p1[0] - p2[0]) * (u0[0] - u2[0]) - (p0[0] - p2[0]) * (u1[0] - u2[0])) / den;
    var b = ((p0[1] - p2[1]) * (u1[1] - u2[1]) - (p1[1] - p2[1]) * (u0[1] - u2[1])) / den;
    var d = ((p1[1] - p2[1]) * (u0[0] - u2[0]) - (p0[1] - p2[1]) * (u1[0] - u2[0])) / den;
    var e = p2[0] - a * u2[0] - cc * u2[1];
    var f = p2[1] - b * u2[0] - d * u2[1];
    c.save();
    c.beginPath();
    c.moveTo(p0[0], p0[1]); c.lineTo(p1[0], p1[1]); c.lineTo(p2[0], p2[1]);
    c.closePath();
    c.clip();
    c.transform(a, b, cc, d, e, f);
    c.drawImage(img, 0, 0);
    c.restore();
  }

  function project(cw, ch, qw, qh, yaw, pitch, roll, oy) {
    var cy = Math.cos(yaw), sy = Math.sin(yaw);
    var cp = Math.cos(pitch), sp = Math.sin(pitch);
    var cr = Math.cos(roll), sr = Math.sin(roll);
    var dist = 260, fov = 260;
    return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(function (k) {
      var x = k[0] * qw / 2, y = k[1] * qh / 2, z = 0, t;
      t = x * cr - y * sr; y = x * sr + y * cr; x = t;
      t = x * cy + z * sy; z = -x * sy + z * cy; x = t;
      t = y * cp - z * sp; z = y * sp + z * cp; y = t;
      var s = fov / (z + dist);
      return [Math.round(cw / 2 + x * s), Math.round(ch * (oy || 0.5) + y * s)];
    });
  }

  function drawQuad(c, tex, pts) {
    var w = tex.width, h = tex.height;
    texTri(c, tex, pts[0], pts[1], pts[2], [0, 0], [w, 0], [w, h]);
    texTri(c, tex, pts[0], pts[2], pts[3], [0, 0], [w, h], [0, h]);
  }

  FX.floor = function (c, t, cw, ch, col) {
    var hz = Math.round(ch * 0.58), vx = cw / 2, i, y, z;
    c.fillStyle = col.far;
    c.fillRect(0, hz, cw, ch - hz);
    c.fillStyle = col.line;
    for (i = -14; i <= 14; i++) {
      var bx = vx + i * cw * 0.16;
      for (y = hz; y < ch; y += 1) {
        var k = (y - hz) / (ch - hz);
        c.fillRect(Math.round(vx + (bx - vx) * k), y, 1, 1);
      }
    }
    var off = (t * 0.6) % 1;
    for (i = 0; i < 12; i++) {
      z = 1 + (i - off) * 0.9;
      if (z <= 0.2) continue;
      y = Math.round(hz + (ch - hz) * (0.9 / z));
      if (y > hz && y < ch) c.fillRect(0, y, cw, 1);
    }
    c.fillStyle = col.hz;
    c.fillRect(0, hz, cw, 1);
  };

  FX.quad = function (canvas, tex, opts) {
    opts = opts || {};
    var c = canvas.getContext("2d");
    var raf = 0, last = 0, t0 = 0, running = false;
    var fill = opts.fill || 0.86;

    function frame(t) {
      var cw = canvas.width, ch = canvas.height;
      var aspect = tex.height / tex.width;
      var qw = cw * fill, qh = qw * aspect;
      if (qh > ch * fill) { qh = ch * fill; qw = qh / aspect; }
      var yaw, pitch, roll;
      if (opts.mode === "spin") {
        yaw = t * 3.2; pitch = 0.12; roll = Math.sin(t * 2) * 0.05;
      } else if (opts.mode === "show") {
        yaw = Math.sin(t * 0.55) * 0.7;
        pitch = -0.06 + Math.sin(t * 0.9) * 0.05;
        roll = Math.sin(t * 0.4) * 0.03;
      } else {
        yaw = Math.sin(t * 0.8) * 0.42;
        pitch = Math.sin(t * 0.53) * 0.2;
        roll = Math.sin(t * 0.37) * 0.05;
      }
      c.imageSmoothingEnabled = false;
      c.clearRect(0, 0, cw, ch);
      if (opts.before) opts.before(c, t, cw, ch);
      drawQuad(c, tex, project(cw, ch, qw, qh, yaw, pitch, roll, opts.oy));
    }

    function loop(now) {
      if (!running) return;
      raf = requestAnimationFrame(loop);
      if (now - last < 50) return;
      last = now;
      frame((now - t0) / 1000);
    }

    return {
      start: function () {
        if (FX.reduced()) { frame(opts.mode === "spin" ? 0.3 : 0.9); return this; }
        if (running) return this;
        running = true; t0 = performance.now(); raf = requestAnimationFrame(loop);
        return this;
      },
      stop: function () { running = false; cancelAnimationFrame(raf); },
      setTexture: function (t) { tex = t; if (!running) frame(0.9); }
    };
  };

  FX.logoTexture = function (site, theme) {
    if (site.logoImage) {
      return new Promise(function (res) {
        var img = new Image();
        img.onload = function () { res(img); };
        img.onerror = function () { res(textLogo(theme)); };
        img.src = site.logoImage;
      });
    }
    var ready = document.fonts && document.fonts.load
      ? document.fonts.load("700 32px Silkscreen").catch(function () {})
      : Promise.resolve();
    return ready.then(function () { return textLogo(theme); });
  };

  function textLogo(theme) {
    var t = document.createElement("canvas");
    var c = t.getContext("2d");
    c.font = "700 32px Silkscreen, monospace";
    var w = Math.ceil(c.measureText("ARKINI").width) + 6;
    t.width = w; t.height = 46;
    c = t.getContext("2d");
    c.font = "700 32px Silkscreen, monospace";
    c.textBaseline = "top";
    c.fillStyle = theme.primary; c.fillText("ARKINI", 3, 3);
    c.fillStyle = theme.ink; c.fillText("ARKINI", 1, 1);
    c.fillStyle = theme.primary; c.fillRect(1, 35, w - 2, 10);
    c.font = "400 8px Silkscreen, monospace";
    c.fillStyle = theme.ink; c.textAlign = "right"; c.fillText("GAMES", w - 3, 36);
    c.textAlign = "left"; c.fillText("AARHUS", 3, 36);
    return t;
  }

  FX.boot = function (root, data) {
    return new Promise(function (resolve) {
      var lines = root.querySelector(".boot__lines");
      var canvas = root.querySelector(".boot__logo");
      var done = false, timers = [], logo = null;

      function finish() {
        if (done) return;
        done = true;
        timers.forEach(clearTimeout);
        ["keydown", "pointerdown"].forEach(function (ev) { window.removeEventListener(ev, skip, true); });
        try { sessionStorage.setItem("arkini.booted", "1"); } catch (e) {}
        root.classList.add("boot--out");
        setTimeout(function () {
          if (logo) logo.stop();
          root.hidden = true;
          document.documentElement.classList.add("no-boot");
          resolve();
        }, 260);
      }
      function skip(e) {
        if (e.type === "keydown" && (e.key === "Tab" || e.metaKey || e.ctrlKey)) return;
        e.preventDefault();
        FX.sound.select();
        finish();
      }
      function at(ms, fn) { timers.push(setTimeout(fn, ms)); }
      function line(text, cls) {
        var p = document.createElement("p");
        p.textContent = text;
        if (cls) p.className = cls;
        lines.appendChild(p);
      }

      ["keydown", "pointerdown"].forEach(function (ev) { window.addEventListener(ev, skip, true); });

      FX.logoTexture(data.site, data.site.theme).then(function (tex) {
        if (done) return;
        logo = FX.quad(canvas, tex, { mode: "sway", fill: 0.9 }).start();
      });
      FX.sound.boot();

      var year = new Date().getFullYear();
      var saves = data.games.length;
      var script = [
        [500, "ARKINI SYSTEM  BIOS VER 0.97"],
        [650, "(C) " + year + " ARKINI GAMES  AARHUS DK"],
        [800, "LICENSED BY NOBODY", "dim"],
        [1300, "MEMORY CARD 1 ......... " + saves + (saves === 1 ? " SAVE" : " SAVES") + " FOUND", "ok"],
        [1700, "MEMORY CARD 2 ......... DATA CORRUPTED", "bad"],
        [2300, "LOADING MEMORY CARD MANAGER_"]
      ];
      script.forEach(function (s) { at(s[0], function () { line(s[1], s[2]); }); });
      at(1700, FX.sound.error);
      at(3400, finish);
    });
  };

  var BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  FX.psxify = function (img, targetW, levels) {
    try {
      var w = targetW || 320, h = Math.round(img.naturalHeight * w / img.naturalWidth);
      var cv = document.createElement("canvas");
      cv.width = w; cv.height = h;
      var c = cv.getContext("2d");
      c.imageSmoothingEnabled = true;
      c.drawImage(img, 0, 0, w, h);
      var d = c.getImageData(0, 0, w, h), px = d.data;
      var step = 255 / ((levels || 32) - 1);
      for (var y = 0; y < h; y++) {
        for (var x = 0; x < w; x++) {
          var i = (y * w + x) * 4;
          var o = (BAYER[(y & 3) * 4 + (x & 3)] / 16 - 0.5) * step;
          px[i] = Math.round((px[i] + o) / step) * step;
          px[i + 1] = Math.round((px[i + 1] + o) / step) * step;
          px[i + 2] = Math.round((px[i + 2] + o) / step) * step;
        }
      }
      c.putImageData(d, 0, 0);
      return cv.toDataURL("image/png");
    } catch (e) {
      return null;
    }
  };

  var GLYPHS = "#%&@$?!/\\<>=+*01";
  FX.scramble = function (el, text, rate) {
    if (FX.reduced()) { el.textContent = text; return function () {}; }
    var id = setInterval(function () {
      var out = "";
      for (var i = 0; i < text.length; i++) {
        var ch = text[i];
        out += ch !== " " && Math.random() < (rate || 0.25) ? GLYPHS[(Math.random() * GLYPHS.length) | 0] : ch;
      }
      el.textContent = out;
    }, 140);
    return function () { clearInterval(id); };
  };

  window.FX = FX;
})();
