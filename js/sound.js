(function () {
  "use strict";

  var FX = window.FX;
  var store = FX.store;

  var unlocked = false;
  var ctx = null, master, sfxBus, musicBus, musicDuck, delay, delayFb, noiseBuf;
  var sfxOn = store.get("arkini.snd") !== "0";
  var musOn = store.get("arkini.mus") !== "0";
  var sfxVol = num(store.get("arkini.sfxvol"), 8);
  var musVol = num(store.get("arkini.musvol"), 5);

  function num(v, d) { v = parseInt(v, 10); return isNaN(v) ? d : Math.max(0, Math.min(10, v)); }

  function ac() {
    if (!ctx) {
      var A = window.AudioContext || window.webkitAudioContext;
      if (!A) return null;
      ctx = new A();
      master = ctx.createGain(); master.gain.value = 0.9;
      var warm = ctx.createBiquadFilter(); warm.type = "lowpass"; warm.frequency.value = 9000;
      master.connect(warm); warm.connect(ctx.destination);

      sfxBus = ctx.createGain(); sfxBus.connect(master);
      musicBus = ctx.createGain(); musicBus.connect(master);
      musicDuck = ctx.createGain(); musicDuck.connect(musicBus);

      delay = ctx.createDelay(1.5); delay.delayTime.value = 0.36;
      delayFb = ctx.createGain(); delayFb.gain.value = 0.38;
      var dlp = ctx.createBiquadFilter(); dlp.type = "lowpass"; dlp.frequency.value = 2200;
      delay.connect(dlp); dlp.connect(delayFb); delayFb.connect(delay); dlp.connect(musicDuck);

      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      var d = noiseBuf.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

      applyVolumes();
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function applyVolumes() {
    if (!ctx) return;
    var t = ctx.currentTime;
    sfxBus.gain.setTargetAtTime(sfxOn ? Math.pow(sfxVol / 10, 1.6) * 1.2 : 0, t, 0.02);
    musicBus.gain.setTargetAtTime(musOn ? Math.pow(musVol / 10, 1.6) * 0.9 : 0, t, 0.15);
  }

  function unlock() {
    unlocked = true;
    if (!sfxOn && !musOn) return;
    ac();
    var p = ctx && ctx.state !== "running" ? ctx.resume() : Promise.resolve();
    if (musOn && Music.queued && !Music.running) Music.play(Music.queued);
    Promise.resolve(p).then(function () {
      if (ctx && ctx.state === "running") {
        UNLOCK_EVENTS.forEach(function (ev) { window.removeEventListener(ev, unlock, true); });
      }
    });
  }
  var UNLOCK_EVENTS = ["pointerdown", "touchend", "click", "keydown"];
  UNLOCK_EVENTS.forEach(function (ev) { window.addEventListener(ev, unlock, true); });

  document.addEventListener("visibilitychange", function () {
    if (!ctx) return;
    if (document.hidden) ctx.suspend(); else if (sfxOn || musOn) ctx.resume();
  });

  function env(g, t, a, peak, d) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }

  function tone(dest, freq, t, dur, type, vol, opts) {
    opts = opts || {};
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || "square";
    o.frequency.setValueAtTime(freq, t);
    if (opts.to) o.frequency.exponentialRampToValueAtTime(opts.to, t + dur);
    if (opts.detune) o.detune.value = opts.detune;
    env(g, t, opts.attack || 0.004, vol, dur);
    var out = g;
    if (opts.lp) { var f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = opts.lp; g.connect(f); out = f; }
    o.connect(g); out.connect(dest);
    if (opts.send) out.connect(opts.send);
    o.start(t); o.stop(t + (opts.attack || 0.004) + dur + 0.05);
  }

  function noise(dest, t, dur, vol, opts) {
    opts = opts || {};
    var s = ctx.createBufferSource(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    s.buffer = noiseBuf;
    s.loop = dur > 0.9;
    f.type = opts.type || "bandpass";
    f.frequency.setValueAtTime(opts.freq || 2000, t);
    if (opts.to) f.frequency.exponentialRampToValueAtTime(opts.to, t + dur);
    f.Q.value = opts.q || 0.8;
    env(g, t, opts.attack || 0.002, vol, dur);
    s.connect(f); f.connect(g); g.connect(dest);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  }

  function sfx(fn) {
    return function () {
      if (!sfxOn || !ac()) return;
      var args = Array.prototype.slice.call(arguments);
      try { fn.apply(null, [ctx.currentTime].concat(args)); } catch (e) {}
    };
  }

  var lastHover = 0;
  FX.sound = {
    isOn: function () { return sfxOn; },
    set: function (v) { sfxOn = !!v; store.set("arkini.snd", sfxOn ? "1" : "0"); if (sfxOn) ac(); applyVolumes(); },
    volume: function (v) {
      if (v == null) return sfxVol;
      sfxVol = num(v, sfxVol); store.set("arkini.sfxvol", sfxVol); applyVolumes();
    },

    move: sfx(function (t) { tone(sfxBus, 1200, t, 0.035, "square", 0.05); }),
    hover: sfx(function (t, pitch) {
      var now = performance.now();
      if (now - lastHover < 45) return;
      lastHover = now;
      tone(sfxBus, pitch || 1650, t, 0.025, "triangle", 0.05);
    }),
    select: sfx(function (t) {
      tone(sfxBus, 660, t, 0.05, "square", 0.06);
      tone(sfxBus, 990, t + 0.05, 0.09, "square", 0.06);
    }),
    back: sfx(function (t) {
      tone(sfxBus, 520, t, 0.05, "square", 0.06);
      tone(sfxBus, 330, t + 0.05, 0.1, "square", 0.06);
    }),
    error: sfx(function (t) {
      tone(sfxBus, 98, t, 0.22, "sawtooth", 0.07, { lp: 900 });
      tone(sfxBus, 92, t, 0.22, "sawtooth", 0.05, { lp: 900 });
    }),
    cut: sfx(function (t) { noise(sfxBus, t, 0.09, 0.08, { freq: 3500, q: 0.4 }); }),
    staticBurst: sfx(function (t, dur) { noise(sfxBus, t, dur || 0.7, 0.07, { freq: 2600, to: 900, q: 0.3 }); }),
    spin: sfx(function (t) {
      tone(sfxBus, 70, t, 0.8, "sawtooth", 0.05, { to: 420, lp: 1400, attack: 0.05 });
      noise(sfxBus, t, 0.8, 0.03, { freq: 400, to: 3000, q: 2 });
      tone(sfxBus, 1320, t + 0.72, 0.12, "triangle", 0.05);
    }),
    open: sfx(function (t) {
      tone(sfxBus, 330, t, 0.12, "triangle", 0.06, { to: 880 });
      noise(sfxBus, t, 0.12, 0.025, { freq: 1200, to: 5000 });
    }),
    close: sfx(function (t) {
      tone(sfxBus, 880, t, 0.12, "triangle", 0.06, { to: 300 });
    }),
    tick: sfx(function (t, step) {
      tone(sfxBus, 600 * Math.pow(1.06, step || 0), t, 0.03, "square", 0.04);
    }),
    count: sfx(function (t, n) {
      tone(sfxBus, n === 0 ? 110 : 440, t, n === 0 ? 0.35 : 0.08, n === 0 ? "sawtooth" : "square", 0.06, { lp: 2500 });
    }),
    success: sfx(function (t) {
      [523.3, 659.3, 784, 1046.5].forEach(function (f, i) { tone(sfxBus, f, t + i * 0.07, 0.14, "square", 0.05); });
      tone(sfxBus, 1568, t + 0.3, 0.4, "triangle", 0.04);
    }),
    power: sfx(function (t, on) {
      if (on) {
        noise(sfxBus, t, 0.05, 0.12, { type: "lowpass", freq: 300 });
        tone(sfxBus, 60, t, 0.5, "sine", 0.12, { to: 50 });
        tone(sfxBus, 120, t + 0.02, 0.45, "sawtooth", 0.03, { lp: 500 });
      } else {
        tone(sfxBus, 900, t, 0.25, "sine", 0.06, { to: 40 });
        noise(sfxBus, t, 0.1, 0.06, { freq: 1500 });
      }
    }),
    glitch: sfx(function (t) {
      for (var i = 0; i < 4; i++) {
        tone(sfxBus, 200 + Math.random() * 2400, t + i * 0.025, 0.02, "square", 0.04);
      }
      noise(sfxBus, t, 0.1, 0.04, { freq: 5000, q: 3 });
    }),
    shutter: sfx(function (t) {
      noise(sfxBus, t, 0.03, 0.09, { freq: 4000, q: 1.5 });
      noise(sfxBus, t + 0.06, 0.04, 0.07, { freq: 2500, q: 1.5 });
    }),
    on: sfx(function (t) { tone(sfxBus, 440, t, 0.05, "square", 0.05); tone(sfxBus, 880, t + 0.05, 0.08, "square", 0.05); }),
    off: sfx(function (t) { tone(sfxBus, 880, t, 0.05, "square", 0.05); tone(sfxBus, 440, t + 0.05, 0.08, "square", 0.05); }),
    boot: sfx(function (t) {
      noise(sfxBus, t, 0.05, 0.12, { type: "lowpass", freq: 300 });
      tone(sfxBus, 55, t, 0.6, "sine", 0.1, { to: 45 });
      [[110, 0], [164.8, 0.05], [220, 0.1], [277.2, 0.15], [329.6, 0.2]].forEach(function (n) {
        tone(sfxBus, n[0], t + 0.2 + n[1], 2.2, "triangle", 0.06, { attack: 0.7, detune: (Math.random() - 0.5) * 14 });
      });
      tone(sfxBus, 1318.5, t + 1.1, 1.6, "triangle", 0.015, { attack: 0.6 });
    })
  };

  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  var SONGS = {
    menu: { bpm: 76, root: 50, prog: [[0, "m"], [8, "M"], [3, "M"], [10, "M"]], pad: 1, bass: 1, arp: 1, drums: 0, cutoff: 1100, echo: 0.36 },
    game: { bpm: 96, root: 45, prog: [[0, "m"], [1, "M"], [0, "m"], [-2, "M"]], pad: 1, bass: 2, arp: 2, drums: 1, cutoff: 1500, echo: 0.31 },
    error: { bpm: 60, root: 38, prog: [[0, "m"], [1, "m"], [0, "m"], [1, "m"]], pad: 1, bass: 0, arp: 0, drums: 0, cutoff: 600, echo: 0.5 }
  };
  var CHORD = { m: [0, 3, 7], M: [0, 4, 7] };

  var Music = {
    queued: null, running: false, song: null, step: 0, next: 0, timer: 0, el: null, elSrc: null, key: null,

    play: function (spec) {
      Music.queued = spec;
      if (Music.held) return;
      if (!musOn || !unlocked || !ac()) return;
      var key = typeof spec === "string" && !SONGS[spec] ? "file:" + spec : JSON.stringify(spec);
      if (Music.running && key === Music.key) return;
      Music.key = key;
      var t = ctx.currentTime;
      musicDuck.gain.cancelScheduledValues(t);
      musicDuck.gain.setValueAtTime(musicDuck.gain.value, t);
      musicDuck.gain.linearRampToValueAtTime(0.0001, t + (Music.running ? 0.5 : 0.01));
      clearTimeout(Music.swap);
      Music.swap = setTimeout(function () {
        Music.halt();
        if (typeof spec === "string" && !SONGS[spec]) Music.playFile(spec);
        else Music.playSong(typeof spec === "string" ? SONGS[spec] : Object.assign({}, SONGS.game, spec));
        var t2 = ctx.currentTime;
        musicDuck.gain.cancelScheduledValues(t2);
        musicDuck.gain.setValueAtTime(0.0001, t2);
        musicDuck.gain.linearRampToValueAtTime(1, t2 + 1.2);
      }, Music.running ? 520 : 10);
    },

    playSong: function (song) {
      Music.song = song; Music.step = 0; Music.next = ctx.currentTime + 0.05; Music.running = true;
      delay.delayTime.value = song.echo || 0.36;
      Music.timer = setInterval(Music.schedule, 25);
    },

    playFile: function (url) {
      if (!Music.el) {
        Music.el = new Audio();
        Music.el.loop = true;
        Music.el.crossOrigin = "anonymous";
        try { Music.elSrc = ctx.createMediaElementSource(Music.el); Music.elSrc.connect(musicDuck); } catch (e) {}
      }
      Music.el.src = url;
      Music.el.play().catch(function () {});
      Music.running = true;
    },

    halt: function () {
      clearInterval(Music.timer);
      if (Music.el) Music.el.pause();
      Music.running = false;
    },

    stop: function () { Music.halt(); Music.key = null; },

    schedule: function () {
      var s = Music.song, spb = 60 / s.bpm / 4;
      while (Music.next < ctx.currentTime + 0.12) {
        Music.note(s, Music.step, Music.next, spb);
        Music.next += spb;
        Music.step = (Music.step + 1) % 64;
      }
    },

    note: function (s, step, t, spb) {
      var bar = (step / 16) | 0, i = step % 16;
      var ch = s.prog[bar], root = s.root + ch[0], tri = CHORD[ch[1]];
      var out = musicDuck;

      if (s.pad && i === 0) {
        tri.forEach(function (iv) {
          [-9, 9].forEach(function (dt) {
            tone(out, mtof(root + 12 + iv), t, spb * 16, "sawtooth", 0.018, { attack: spb * 4, detune: dt, lp: s.cutoff });
          });
        });
      }
      if (s.bass) {
        var hits = s.bass === 2 ? [0, 3, 6, 8, 10, 14] : [0, 6, 8];
        if (hits.indexOf(i) > -1) tone(out, mtof(root - 12), t, spb * 2.6, "triangle", 0.11, { lp: 600 });
      }
      if (s.arp && i % 2 === 0) {
        var pat = s.arp === 2 ? [0, 2, 1, 2, 0, 2, 1, 3] : [0, 1, 2, 1, 2, 1, 0, 2];
        var k = pat[(i / 2) | 0], oct = k === 3 ? 12 : 0;
        if (s.arp === 2 || i % 4 === 0) {
          tone(out, mtof(root + 24 + tri[k % 3] + oct), t, spb * 1.4, "square", 0.022, { lp: 2400, send: delay });
        }
      }
      if (s.drums) {
        if (i === 0 || i === 8 || (i === 10 && bar % 2)) tone(out, 120, t, 0.18, "sine", 0.22, { to: 40 });
        if (i === 4 || i === 12) noise(out, t, 0.14, 0.07, { freq: 1800, q: 0.6 });
        if (i % 2 === 1) noise(out, t, 0.03, 0.025, { freq: 8000, type: "highpass" });
      } else if (i === 0 && bar === 0) {
        tone(out, 55, t, 1.2, "sine", 0.08, { to: 45 });
      }
    }
  };

  FX.music = {
    isOn: function () { return musOn; },
    set: function (v) {
      musOn = !!v; store.set("arkini.mus", musOn ? "1" : "0");
      if (musOn) { ac(); applyVolumes(); if (Music.queued) { Music.key = null; Music.play(Music.queued); } }
      else { applyVolumes(); Music.stop(); }
    },
    volume: function (v) {
      if (v == null) return musVol;
      musVol = num(v, musVol); store.set("arkini.musvol", musVol); applyVolumes();
    },
    play: function (spec) { Music.play(spec || "menu"); },
    pause: function () { if (Music.running) { Music.halt(); Music.held = true; } },
    resume: function () { if (Music.held) { Music.held = false; Music.key = null; if (musOn && Music.queued) Music.play(Music.queued); } },
    state: function () { return { running: Music.running, track: Music.key, audio: ctx ? ctx.state : "locked" }; }
  };
})();
