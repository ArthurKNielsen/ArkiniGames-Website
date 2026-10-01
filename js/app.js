/* ==========================================================================
   ARKINI SYSTEM — APP
   Hash router + screens: memory card (home), game disc pages, system config.
   Routes:  #/                      memory card manager
            #/game/<id>             a game page
            #/game/<id>/<section>   a game page scrolled to a section
            #/about                 system config (about / contact / settings)
   ========================================================================== */

(function () {
  "use strict";

  var DATA = window.ARKINI;
  var SITE = DATA.site;
  var GAMES = DATA.games;
  var FX = window.FX;

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  var screen = $("#screen");
  var nav = $("#mainnav");
  var cleanups = [];
  var current = { name: null, id: null };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function pad2(n) { return (n < 10 ? "0" : "") + n; }
  function hostOf(url) { try { return new URL(url).host.replace(/^www\./, ""); } catch (e) { return url; } }
  function frames(icon) { return Array.isArray(icon) ? icon : icon ? [icon] : []; }
  function gameById(id) { return GAMES.filter(function (g) { return g.id === id; })[0]; }
  function onCleanup(fn) { cleanups.push(fn); }

  /* ---- MAIN NAV (top bar): HOME, every game, ABOUT ---------------------- */
  nav.innerHTML = '<a href="#/" data-nav="home">HOME</a>' +
    GAMES.map(function (g) {
      return '<a href="#/game/' + esc(g.id) + '" data-nav="game:' + esc(g.id) + '">' + esc(g.title) + "</a>";
    }).join("") +
    '<a href="#/about" data-nav="about">ABOUT</a>';

  function markNav(key) {
    $$("a", nav).forEach(function (a) {
      if (a.dataset.nav === key) {
        a.setAttribute("aria-current", "page");
        nav.scrollLeft = a.offsetLeft - 24;
      } else {
        a.removeAttribute("aria-current");
      }
    });
  }

  /* ---- THEME ------------------------------------------------------------ */
  var VARS = ["bg", "panel", "line", "ink", "dim", "primary", "accent", "ok"];
  function applyTheme(theme) {
    var t = Object.assign({}, SITE.theme, theme || {});
    var root = document.documentElement.style;
    VARS.forEach(function (k) { root.setProperty("--" + k, t[k]); });
    var meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", t.bg);
    return t;
  }

  /* ---- ANIMATED SAVE ICONS (up to 3 frames, like the real thing) -------- */
  function iconImg(game, cls) {
    var f = frames(game.icon);
    if (!f.length) return '<span class="' + cls + ' icon--blank" aria-hidden="true">' + esc(String(game.title).charAt(0)) + "</span>";
    return '<img class="' + cls + '" src="' + esc(f[0]) + '" data-frames="' + esc(f.join("|")) +
      '" alt="" width="16" height="16" decoding="async">';
  }
  setInterval(function () {
    if (FX.reduced()) return;
    $$("img[data-frames]").forEach(function (img) {
      var f = img.dataset.frames.split("|");
      if (f.length < 2) return;
      var i = ((+img.dataset.f || 0) + 1) % f.length;
      img.dataset.f = i;
      img.src = f[i];
    });
  }, 320);

  /* ---- MEMORY CARD (home) ----------------------------------------------- */
  function buildSlots() {
    var cfg = SITE.memoryCard || {};
    var total = cfg.blocks || 15;
    var slots = [];
    GAMES.forEach(function (g) {
      var n = Math.max(1, g.blocks || 1);
      for (var i = 0; i < n && slots.length < total; i++) slots.push({ type: i ? "link" : "game", game: g });
    });
    var used = slots.length;
    for (var t = 0; t < (cfg.teaserSlots || 0) && slots.length < total; t++) slots.push({ type: "teaser" });
    while (slots.length < total) slots.push({ type: "empty" });
    (cfg.corruptSlots || []).forEach(function (n) {
      if (slots[n - 1] && slots[n - 1].type === "empty") slots[n - 1] = { type: "corrupt", code: (0x30 + n * 7).toString(16).toUpperCase() };
    });
    return { slots: slots, free: total - used - (cfg.teaserSlots || 0), total: total };
  }

  function slotHTML(s, i) {
    var n = pad2(i + 1);
    var base = 'class="slot slot--' + s.type + '" data-i="' + i + '" tabindex="-1"';
    if (s.type === "game" || s.type === "link") {
      var label = s.game.title + (s.type === "link" ? " (linked block)" : "") + ", " + (s.game.statusLabel || s.game.status);
      return '<li role="none"><a role="gridcell" ' + base + ' href="#/game/' + esc(s.game.id) + '" aria-label="Block ' + n + ": " + esc(label) + '">' +
        '<span class="slot__n">' + n + "</span>" +
        (s.type === "game" ? iconImg(s.game, "slot__icon") + '<span class="slot__t" aria-hidden="true">' + esc(s.game.title) + "</span>" : '<span class="slot__link" aria-hidden="true"></span>') +
        "</a></li>";
    }
    var names = { teaser: "coming soon", corrupt: "corrupted data", empty: "free block" };
    return '<li role="none"><button role="gridcell" type="button" ' + base + ' aria-label="Block ' + n + ": " + names[s.type] + '">' +
      '<span class="slot__n">' + n + "</span>" +
      (s.type === "teaser" ? '<span class="slot__glyph" aria-hidden="true">?</span>' : "") +
      (s.type === "corrupt" ? '<span class="slot__glyph" aria-hidden="true">#</span>' : "") +
      "</button></li>";
  }

  function infoHTML(s) {
    if (s.type === "game" || s.type === "link") {
      var g = s.game;
      return '<div class="info__icon">' + iconImg(g, "info__img") + "</div>" +
        '<p class="info__k">' + esc(g.serial || "DISC") + "</p>" +
        '<h2 class="info__title">' + esc(g.title) + "</h2>" +
        '<p class="info__tag">' + esc(g.tagline) + "</p>" +
        '<dl class="info__rows">' +
        "<dt>STATUS</dt><dd class=\"is-ok\">" + esc(g.statusLabel || g.status) + "</dd>" +
        (g.genre ? "<dt>GENRE</dt><dd>" + esc(g.genre) + "</dd>" : "") +
        "<dt>BLOCKS</dt><dd>" + esc(g.blocks || 1) + "</dd>" +
        (g.saveDate ? "<dt>LAST SAVE</dt><dd>" + esc(g.saveDate.replace(/-/g, ".")) + "</dd>" : "") +
        "</dl>" +
        '<a class="btn btn--primary info__go" href="#/game/' + esc(g.id) + '"><i class="pad pad--x"></i>LOAD ' + esc(g.title) + "</a>";
    }
    if (s.type === "teaser") {
      return '<p class="info__k">BLOCK RESERVED</p>' +
        '<h2 class="info__title" data-scramble="COMING SOON">COMING SOON</h2>' +
        '<p class="info__tag">Something is being written to this block. Do not switch off the power.</p>' +
        '<dl class="info__rows"><dt>STATUS</dt><dd>WRITING...</dd><dt>BLOCKS</dt><dd>??</dd></dl>';
    }
    if (s.type === "corrupt") {
      return '<p class="info__k is-bad">ERROR 0x' + esc(s.code) + "</p>" +
        '<h2 class="info__title" data-scramble="CORRUPTED">CORRUPTED</h2>' +
        '<p class="info__tag">This save could not be read. It was probably a better game anyway.</p>' +
        '<dl class="info__rows"><dt>FORMAT?</dt><dd>NO</dd></dl>';
    }
    return '<p class="info__k">FREE BLOCK</p><h2 class="info__title">NO DATA</h2>' +
      '<p class="info__tag">Empty. Room for the next one.</p>';
  }

  function renderHome() {
    var card = buildSlots();
    var cols = 3;
    screen.innerHTML =
      '<section class="home">' +
        '<div class="home__id">' +
          '<h1 class="sr-only">' + esc(SITE.name) + "</h1>" +
          '<canvas class="home__logo" width="220" height="80" role="img" aria-label="' + esc(SITE.name) + ' logo"></canvas>' +
          '<p class="home__tag">' + esc(SITE.tagline) + "</p>" +
          '<h2 class="home__h">DISCS</h2>' +
          '<ul class="discs">' + GAMES.map(function (g) {
            return '<li><a class="disc" href="#/game/' + esc(g.id) + '">' +
              iconImg(g, "disc__icon") +
              '<span class="disc__t">' + esc(g.title) + "</span>" +
              '<span class="disc__s">' + esc([g.kind, g.statusLabel || g.status].filter(Boolean).join(" · ")) + "</span>" +
              '<span class="disc__go" aria-hidden="true">LOAD &gt;</span>' +
              "</a></li>";
          }).join("") + "</ul>" +
          '<h2 class="home__h">ELSEWHERE</h2>' +
          '<ul class="home__links">' +
            '<li><a href="' + esc(SITE.links.itch) + '" rel="noopener" target="_blank"><b>ITCH.IO</b><span>' + esc(hostOf(SITE.links.itch)) + "</span></a></li>" +
            '<li><a href="' + esc(SITE.links.youtube) + '" rel="noopener" target="_blank"><b>YOUTUBE</b><span>@' + esc(SITE.links.youtube.split("@")[1] || "") + "</span></a></li>" +
            '<li><a href="#/about"><b>CONTACT</b><span>about + email</span></a></li>' +
          "</ul>" +
        "</div>" +
        '<div class="card">' +
          '<div class="card__head"><h2>MEMORY CARD 1</h2><span>' + card.free + "/" + card.total + " FREE</span></div>" +
          '<ol class="card__grid" role="grid" aria-label="Memory card. Use arrow keys to move, Enter to load." style="--cols:' + cols + '">' +
            card.slots.map(slotHTML).join("") +
          "</ol>" +
        "</div>" +
        '<aside class="info" aria-live="polite"></aside>' +
        '<p class="home__card2" aria-hidden="true">MEMORY CARD 2 <span>NOT INSERTED</span></p>' +
      "</section>";

    var slotsEl = $$(".slot", screen);
    var info = $(".info", screen);
    var sel = -1, stopScramble = function () {};

    function select(i, focus) {
      if (i === sel) { if (focus) slotsEl[i].focus(); return; }
      if (sel >= 0) { slotsEl[sel].classList.remove("is-sel"); slotsEl[sel].tabIndex = -1; }
      sel = i;
      var el = slotsEl[i];
      el.classList.add("is-sel"); el.tabIndex = 0;
      if (focus) el.focus();
      stopScramble();
      info.innerHTML = infoHTML(card.slots[i]);
      info.dataset.type = card.slots[i].type;
      var sc = $("[data-scramble]", info);
      stopScramble = sc ? FX.scramble(sc, sc.dataset.scramble) : function () {};
    }
    onCleanup(function () { stopScramble(); });

    slotsEl.forEach(function (el, i) {
      el.addEventListener("mouseenter", function () { if (sel !== i) { FX.sound.move(); select(i); } });
      el.addEventListener("focus", function () { select(i); });
      el.addEventListener("click", function (e) {
        var s = card.slots[i];
        if (s.type === "game" || s.type === "link") { FX.sound.select(); return; } // link navigates
        e.preventDefault();
        if (s.type === "empty") FX.sound.move(); else FX.sound.error();
        select(i, true);
        el.classList.remove("is-shake"); void el.offsetWidth; el.classList.add("is-shake");
      });
    });

    $(".card__grid", screen).addEventListener("keydown", function (e) {
      var cur = sel < 0 ? 0 : sel, next = cur, last = slotsEl.length - 1;
      var colsNow = parseInt(getComputedStyle(e.currentTarget).getPropertyValue("--cols-now"), 10) || cols;
      switch (e.key) {
        case "ArrowRight": next = Math.min(last, cur + 1); break;
        case "ArrowLeft": next = Math.max(0, cur - 1); break;
        case "ArrowDown": next = Math.min(last, cur + colsNow); break;
        case "ArrowUp": next = Math.max(0, cur - colsNow); break;
        case "Home": next = 0; break;
        case "End": next = last; break;
        case " ": e.preventDefault(); slotsEl[cur].click(); return;
        default: return;
      }
      e.preventDefault();
      if (next !== cur) FX.sound.move();
      select(next, true);
    });

    // Start on the most recently visited game, else block 1.
    var start = 0;
    if (current.lastGame) card.slots.some(function (s, i) { if (s.game && s.game.id === current.lastGame && s.type === "game") { start = i; return true; } });
    select(start);

    var canvas = $(".home__logo", screen);
    FX.logoTexture(SITE, SITE.theme).then(function (tex) {
      if (!canvas.isConnected) return;
      var q = FX.quad(canvas, tex, { mode: "sway", fill: 0.92 }).start();
      onCleanup(q.stop);
    });

    return { title: SITE.name + " — memory card", crumb: "MEMORY CARD 1", focus: slotsEl[start] };
  }

  /* ---- GAME PAGE -------------------------------------------------------- */
  function youtubeId(src) {
    if (!src) return null;
    var m = String(src).match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})(?![\w-])/) || String(src).match(/^([\w-]{11})$/);
    return m ? m[1] : null;
  }

  function sectionsFor(g) {
    var s = [];
    if (g.trailer) s.push(["trailer", "TRAILER"]);
    if (g.screenshots && g.screenshots.length) s.push(["screens", "SCREENS"]);
    if (g.features && g.features.length) s.push(["features", "FEATURES"]);
    if (g.links && g.links.demo) s.push(["demo", "DEMO"]);
    if (g.links && g.links.devlog) s.push(["devlog", "DEVLOG"]);
    if (g.signup) s.push(["signup", "SIGN UP"]);
    return s;
  }

  function secHead(n, label) {
    return '<h2 class="sec__h"><span class="sec__n">' + pad2(n) + "</span>" + esc(label) + "</h2>";
  }

  function renderGame(g, sectionId) {
    var secs = sectionsFor(g);
    var links = g.links || {};
    var html = [];
    var n = 0;

    secs.forEach(function (s) {
      n++;
      var id = s[0], body = "";
      if (id === "trailer") {
        body = '<div class="trailer">' +
          '<button class="trailer__facade" type="button" aria-label="Play the ' + esc(g.title) + ' trailer">' +
            (g.trailer.poster ? '<img src="' + esc(g.trailer.poster) + '" alt="" loading="lazy" width="1280" height="720">' : "") +
            '<span class="trailer__play"><i class="pad pad--x"></i>PLAY TRAILER</span>' +
          "</button></div>";
      } else if (id === "screens") {
        body = '<ul class="gallery">' + g.screenshots.map(function (sh, i) {
          return '<li><button class="gallery__btn" type="button" data-i="' + i + '" aria-label="Open screenshot ' + (i + 1) + ": " + esc(sh.alt) + '">' +
            '<img src="' + esc(sh.src) + '" alt="' + esc(sh.alt) + '" loading="lazy" decoding="async" width="1280" height="720">' +
            '<span class="gallery__n" aria-hidden="true">' + pad2(i + 1) + "</span></button></li>";
        }).join("") + "</ul>";
      } else if (id === "features") {
        body = '<ol class="feats">' + g.features.map(function (f, i) {
          return '<li><span class="feats__n" aria-hidden="true">' + pad2(i + 1) + "</span><h3>" + esc(f.title) + "</h3><p>" + esc(f.text) + "</p></li>";
        }).join("") + "</ol>";
      } else if (id === "demo") {
        body = '<div class="demo">' +
          '<p class="demo__k">INSERT DISC</p>' +
          '<a class="btn btn--big btn--primary" href="' + esc(links.demo) + '" target="_blank" rel="noopener"><i class="pad pad--x"></i>' + esc(links.demoLabel || "PLAY THE DEMO") + "</a>" +
          '<p class="demo__meta">FREE · ' + esc((g.platforms || []).join(" / ").toUpperCase()) + " · " + esc(hostOf(links.demo).toUpperCase()) + "</p>" +
          "</div>";
      } else if (id === "devlog") {
        body = '<div class="devlog"><p>' + esc(links.devlogText || "Follow development on YouTube.") + "</p>" +
          '<a class="btn" href="' + esc(links.devlog) + '" target="_blank" rel="noopener">WATCH THE DEVLOG <span aria-hidden="true">&gt;&gt;</span></a></div>';
      } else if (id === "signup") {
        var fid = "email-" + esc(g.id);
        body = '<form class="save" action="' + esc(SITE.signupEndpoint || "") + '" method="post">' +
          '<p class="save__pitch">' + esc(g.signup.pitch || "Get an email when there's news.") + "</p>" +
          '<label class="save__label" for="' + fid + '">EMAIL ADDRESS</label>' +
          '<div class="save__row">' +
            '<input class="save__in" id="' + fid + '" name="email" type="email" required autocomplete="email" inputmode="email" placeholder="you@somewhere.dk" spellcheck="false">' +
            '<input type="hidden" name="game" value="' + esc(g.id) + '">' +
            '<button class="btn btn--primary" type="submit">SAVE</button>' +
          "</div>" +
          '<div class="save__bar" hidden aria-hidden="true">' + new Array(16).join("<i></i>") + "</div>" +
          '<p class="save__status" role="status"></p>' +
          "</form>";
      }
      html.push('<section class="sec" id="sec-' + id + '" data-sec="' + id + '" aria-labelledby="h-' + id + '">' +
        secHead(n, s[1]).replace('<h2 class="sec__h"', '<h2 class="sec__h" id="h-' + id + '"') + body + "</section>");
    });

    screen.innerHTML =
      '<article class="game">' +
        '<nav class="game__menu" aria-label="' + esc(g.title) + ' sections">' +
          '<a class="game__back" href="#/"><i class="pad pad--tri"></i>MEMORY CARD</a>' +
          "<ol>" + secs.map(function (s) {
            return '<li><a href="#/game/' + esc(g.id) + "/" + s[0] + '" data-go="' + s[0] + '">' + s[1] + "</a></li>";
          }).join("") + "</ol>" +
        "</nav>" +
        '<div class="game__body">' +
          '<header class="game__head">' +
            '<div class="game__text">' +
              '<p class="game__serial">' + esc([g.serial, "PAL", "DISC 1/1"].filter(Boolean).join(" · ")) + "</p>" +
              '<h1 class="game__title" tabindex="-1" style="--chars:' + Math.max(4, String(g.title).length) + '">' + esc(g.title) + "</h1>" +
              '<p class="game__tag">' + esc(g.tagline) + "</p>" +
              (g.intro ? '<p class="game__intro">' + esc(g.intro) + "</p>" : "") +
              '<div class="game__cta">' +
                (links.demo ? '<a class="btn btn--primary" href="' + esc(links.demo) + '" target="_blank" rel="noopener"><i class="pad pad--x"></i>' + esc(links.demoLabel || "PLAY THE DEMO") + "</a>" : "") +
                (g.trailer ? '<a class="btn" href="#/game/' + esc(g.id) + '/trailer" data-go="trailer">TRAILER</a>' : "") +
              "</div>" +
            "</div>" +
            (g.cover ? '<figure class="case"><span class="case__spine" aria-hidden="true">' + esc(g.title) + " · ARKINI</span>" +
              '<img src="' + esc(g.cover) + '" alt="' + esc(g.title) + ' cover art" width="600" height="600"></figure>' : "") +
            '<dl class="game__file">' +
              "<dt>STATUS</dt><dd class=\"is-ok\">" + esc(g.statusLabel || g.status) + "</dd>" +
              (g.genre ? "<dt>GENRE</dt><dd>" + esc(g.genre) + "</dd>" : "") +
              (g.platforms ? "<dt>PLATFORM</dt><dd>" + esc(g.platforms.join(", ")) + "</dd>" : "") +
              "<dt>PLAYERS</dt><dd>1</dd>" +
            "</dl>" +
          "</header>" +
          html.join("") +
          discNav(g) +
        "</div>" +
      "</article>";

    wireGame(g);
    if (sectionId) requestAnimationFrame(function () { goSection(sectionId, false); });
    return { title: g.title + " — " + SITE.name, crumb: "MEMORY CARD 1 / " + g.title, focus: $(".game__title", screen), keepScroll: !!sectionId };
  }

  // End-of-page navigation: back to the card, plus previous/next disc.
  function discNav(g) {
    var i = GAMES.indexOf(g), n = GAMES.length;
    var out = '<a class="btn" href="#/"><i class="pad pad--tri"></i>MEMORY CARD</a>';
    if (n > 1) {
      var prev = GAMES[(i - 1 + n) % n], next = GAMES[(i + 1) % n];
      if (prev !== next) out += '<a class="btn" href="#/game/' + esc(prev.id) + '">&lt; ' + esc(prev.title) + "</a>";
      out += '<a class="btn btn--primary" href="#/game/' + esc(next.id) + '">NEXT DISC: ' + esc(next.title) + " &gt;</a>";
    }
    return '<nav class="game__foot" aria-label="More discs">' + out + "</nav>";
  }

  function goSection(id, smooth) {
    var el = $("#sec-" + id, screen);
    if (!el) return;
    el.scrollIntoView({ behavior: smooth && !FX.reduced() ? "smooth" : "auto", block: "start" });
    var h = $(".sec__h", el);
    if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); }
  }

  function wireGame(g) {
    // Section menu: scroll without re-rendering, keep the URL shareable.
    $$("[data-go]", screen).forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        FX.sound.move();
        history.replaceState(null, "", "#/game/" + g.id + "/" + a.dataset.go);
        goSection(a.dataset.go, true);
      });
    });

    // Scroll-spy for the menu cursor.
    var menuLinks = $$(".game__menu [data-go]", screen);
    if ("IntersectionObserver" in window && menuLinks.length) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          menuLinks.forEach(function (a) {
            var on = a.dataset.go === en.target.dataset.sec;
            a.classList.toggle("is-on", on);
            if (on) { a.setAttribute("aria-current", "true"); if (a.scrollIntoView && innerWidth < 900) a.scrollIntoView({ block: "nearest", inline: "nearest" }); }
            else a.removeAttribute("aria-current");
          });
        });
      }, { rootMargin: "-30% 0px -60% 0px" });
      $$(".sec", screen).forEach(function (s) { io.observe(s); });
      onCleanup(function () { io.disconnect(); });
    }

    // Trailer facade: no YouTube iframe until asked for.
    var facade = $(".trailer__facade", screen);
    if (facade) facade.addEventListener("click", function () {
      var id = youtubeId(g.trailer.youtube);
      var box = facade.parentNode;
      if (!id) {
        FX.sound.error();
        box.innerHTML = '<div class="trailer__nosig" role="status"><b>NO SIGNAL</b><span>Trailer not connected yet. Check back soon.</span></div>';
        return;
      }
      FX.sound.select();
      box.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0" title="' + esc(g.title) + ' trailer" ' +
        'allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen loading="lazy"></iframe>';
    });

    // Gallery thumbnails get the PS1 15-bit treatment (if enabled).
    var psx = g.psxThumbs != null ? g.psxThumbs : SITE.psxThumbs !== false;
    $$(".gallery__btn", screen).forEach(function (btn) {
      var img = $("img", btn);
      if (psx) {
        var run = function () {
          if (img.dataset.psx) return;
          img.dataset.psx = "1";
          var url = FX.psxify(img, 320, 32);
          if (url) { img.src = url; img.classList.add("is-psx"); }
        };
        if (img.complete && img.naturalWidth) run(); else img.addEventListener("load", run, { once: true });
      }
      btn.addEventListener("click", function () { FX.sound.select(); Lightbox.open(g, +btn.dataset.i); });
    });

    // Email signup.
    var form = $(".save", screen);
    if (form) form.addEventListener("submit", function (e) {
      var input = $(".save__in", form), status = $(".save__status", form), bar = $(".save__bar", form);
      if (!input.checkValidity()) {
        e.preventDefault();
        FX.sound.error();
        status.textContent = "ERROR: THAT DOESN'T LOOK LIKE AN EMAIL.";
        status.className = "save__status is-bad";
        input.focus();
        return;
      }
      if (SITE.signupEndpoint) return; // real endpoint: let the browser post it
      e.preventDefault();
      FX.sound.select();
      $$("input, button", form).forEach(function (el) { el.disabled = true; });
      status.className = "save__status";
      status.textContent = "SAVING... DO NOT REMOVE THE MEMORY CARD.";
      bar.hidden = false;
      var cells = $$("i", bar), k = 0;
      var tick = setInterval(function () {
        if (k < cells.length) { cells[k++].className = "on"; return; }
        clearInterval(tick);
        FX.sound.select();
        status.className = "save__status is-ok";
        status.textContent = "SAVE COMPLETE. YOU'LL HEAR FROM ME WHEN THERE'S NEWS.";
      }, FX.reduced() ? 0 : 70);
      onCleanup(function () { clearInterval(tick); });
    });
  }

  /* ---- ABOUT / SYSTEM CONFIG -------------------------------------------- */
  function toggleRow(key, label, on) {
    return '<li><span>' + label + '</span><button class="opt" type="button" data-opt="' + key + '" aria-pressed="' + on + '">' +
      '<span aria-hidden="true">&lt;</span> <b>' + (on ? "ON" : "OFF") + '</b> <span aria-hidden="true">&gt;</span></button></li>';
  }

  function renderAbout() {
    var crtOn = !document.documentElement.classList.contains("crt-off");
    screen.innerHTML =
      '<section class="config">' +
        '<h1 class="config__h" tabindex="-1">SYSTEM CONFIGURATION</h1>' +
        '<dl class="config__table">' +
          "<dt>OPERATOR</dt><dd>1 HUMAN</dd>" +
          "<dt>LOCATION</dt><dd>" + esc(SITE.location) + "</dd>" +
          (SITE.founded ? "<dt>EST.</dt><dd>" + esc(SITE.founded) + "</dd>" : "") +
          "<dt>DISCS</dt><dd>" + GAMES.length + "</dd>" +
          '<dt>CONTACT</dt><dd><a href="mailto:' + esc(SITE.email) + '">' + esc(SITE.email) + "</a></dd>" +
          '<dt>ITCH.IO</dt><dd><a href="' + esc(SITE.links.itch) + '" target="_blank" rel="noopener">' + esc(hostOf(SITE.links.itch)) + "</a></dd>" +
          '<dt>YOUTUBE</dt><dd><a href="' + esc(SITE.links.youtube) + '" target="_blank" rel="noopener">@' + esc(SITE.links.youtube.split("@")[1] || "") + "</a></dd>" +
        "</dl>" +
        '<div class="config__about">' + (SITE.about || []).map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("") + "</div>" +
        '<div class="config__set">' +
          '<h2 class="sec__h"><span class="sec__n">--</span>SETTINGS</h2>' +
          '<ul class="opts">' +
            toggleRow("snd", "SOUND", FX.sound.isOn()) +
            toggleRow("crt", "CRT FILTER", crtOn) +
            '<li><span>BOOT SEQUENCE</span><button class="opt" type="button" data-opt="boot"><b>REPLAY</b></button></li>' +
          "</ul>" +
        "</div>" +
        '<a class="btn config__back" href="#/"><i class="pad pad--tri"></i>EXIT</a>' +
      "</section>";

    $$("[data-opt]", screen).forEach(function (b) {
      b.addEventListener("click", function () {
        var k = b.dataset.opt;
        if (k === "boot") {
          try { sessionStorage.removeItem("arkini.booted"); } catch (e) {}
          location.hash = "#/";
          location.reload();
          return;
        }
        var on = b.getAttribute("aria-pressed") !== "true";
        if (k === "snd") setSound(on);
        if (k === "crt") {
          document.documentElement.classList.toggle("crt-off", !on);
          FX.store.set("arkini.crt", on ? "1" : "0");
        }
        b.setAttribute("aria-pressed", on);
        $("b", b).textContent = on ? "ON" : "OFF";
        FX.sound.move();
      });
    });
    return { title: "System config — " + SITE.name, crumb: "SYSTEM CONFIG", focus: $(".config__h", screen) };
  }

  /* ---- 404 -------------------------------------------------------------- */
  function renderMissing() {
    FX.sound.error();
    screen.innerHTML =
      '<section class="missing">' +
        '<p class="missing__k">ERROR 0xD15C</p>' +
        '<h1 class="missing__h" tabindex="-1">DISC READ ERROR</h1>' +
        "<p>Nothing at this address. The disc might be scratched, or it never existed.</p>" +
        '<a class="btn btn--primary" href="#/"><i class="pad pad--tri"></i>RETURN TO MEMORY CARD</a>' +
      "</section>";
    return { title: "Disc read error — " + SITE.name, crumb: "ERROR", focus: $(".missing__h", screen) };
  }

  /* ---- LIGHTBOX --------------------------------------------------------- */
  var Lightbox = (function () {
    var dlg = $("#lightbox"), img = $(".lightbox__img", dlg), cap = $(".lightbox__cap", dlg);
    var list = [], i = 0, x0 = null;
    function show(k) {
      i = (k + list.length) % list.length;
      img.src = list[i].src;
      img.alt = list[i].alt || "";
      cap.textContent = "SCREEN " + pad2(i + 1) + " / " + pad2(list.length) + (list[i].alt ? "  —  " + list[i].alt : "");
    }
    function step(d) { FX.sound.move(); show(i + d); }
    $(".lightbox__prev", dlg).addEventListener("click", function () { step(-1); });
    $(".lightbox__next", dlg).addEventListener("click", function () { step(1); });
    $(".lightbox__close", dlg).addEventListener("click", function () { dlg.close(); });
    dlg.addEventListener("close", function () { FX.sound.back(); });
    dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
    });
    dlg.addEventListener("pointerdown", function (e) { x0 = e.clientX; });
    dlg.addEventListener("pointerup", function (e) {
      if (x0 == null) return;
      var dx = e.clientX - x0; x0 = null;
      if (Math.abs(dx) > 45) step(dx < 0 ? 1 : -1);
    });
    return {
      open: function (g, k) {
        list = g.screenshots; show(k);
        if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
      }
    };
  })();

  /* ---- LOADER (spinning cover, between screens) ------------------------- */
  var loaderEl = $("#loader");
  var loaderQuad = null;
  function loadDisc(g) {
    if (FX.reduced()) return Promise.resolve();
    return new Promise(function (resolve) {
      var canvas = $(".loader__disc", loaderEl);
      var img = new Image();
      var started = false;
      function go() {
        if (started) return; started = true;
        var tex = img.naturalWidth ? img : solidTex();
        loaderQuad = FX.quad(canvas, tex, { mode: "spin", fill: 0.8 }).start();
        loaderEl.classList.add("is-on");
        setTimeout(function () {
          loaderEl.classList.remove("is-on");
          if (loaderQuad) loaderQuad.stop();
          resolve();
        }, 850);
      }
      img.onload = go; img.onerror = go;
      img.src = g.cover || "";
      setTimeout(go, 250); // never wait long on a slow cover
    });
  }
  function solidTex() {
    var c = document.createElement("canvas"); c.width = c.height = 16;
    var x = c.getContext("2d");
    x.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--primary") || "#8a1c12";
    x.fillRect(0, 0, 16, 16);
    return c;
  }

  /* ---- ROUTER ----------------------------------------------------------- */
  function parse() {
    var parts = (location.hash || "#/").replace(/^#\/?/, "").split("/").filter(Boolean);
    if (!parts.length) return { name: "home" };
    if (parts[0] === "about" || parts[0] === "config") return { name: "about" };
    if (parts[0] === "game" && parts[1]) return { name: "game", id: decodeURIComponent(parts[1]), section: parts[2] };
    return { name: "missing" };
  }

  var busy = false;
  function route() {
    if (busy) return;
    var raw = parse(), r = raw;
    var game = r.name === "game" ? gameById(r.id) : null;
    if (r.name === "game" && !game) r = { name: "missing" };

    // Same game, different section: just scroll.
    if (r.name === "game" && current.name === "game" && current.id === r.id) {
      if (r.section) goSection(r.section, true);
      return;
    }

    var pre = r.name === "game" && current.name !== null ? loadDisc(game) : Promise.resolve();
    if (r.name === "game") applyTheme(game.theme);
    busy = true;
    pre.then(function () {
      busy = false;
      cleanups.forEach(function (fn) { try { fn(); } catch (e) {} });
      cleanups = [];
      document.documentElement.classList.add("cut");
      setTimeout(function () { document.documentElement.classList.remove("cut"); }, 90);

      if (r.name !== "game") applyTheme(null);
      var res = r.name === "home" ? renderHome()
        : r.name === "game" ? renderGame(game, r.section)
        : r.name === "about" ? renderAbout()
        : renderMissing();

      current.name = r.name;
      current.id = r.id || null;
      if (game) current.lastGame = game.id;
      document.title = res.title;
      markNav(r.name === "game" ? "game:" + r.id : r.name);
      document.body.dataset.screen = r.name;
      if (!res.keepScroll) window.scrollTo(0, 0);
      if (res.focus) res.focus.focus({ preventScroll: true });
      // If the hash changed while we were loading, catch up.
      var now = parse();
      if (now.name !== raw.name || now.id !== raw.id) route();
    });
  }

  /* ---- GLOBAL CONTROLS -------------------------------------------------- */
  var sndBtn = $("#snd");
  function setSound(on) {
    FX.sound.set(on);
    sndBtn.setAttribute("aria-pressed", on);
    $("b", sndBtn).textContent = on ? "ON" : "OFF";
    if (on) FX.sound.select();
    var opt = $('[data-opt="snd"]', screen);
    if (opt) { opt.setAttribute("aria-pressed", on); $("b", opt).textContent = on ? "ON" : "OFF"; }
  }
  setSound(FX.sound.isOn());
  sndBtn.addEventListener("click", function () { setSound(!FX.sound.isOn()); });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape" || $("#lightbox").open) return;
    if (/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) return;
    if (current.name && current.name !== "home") { FX.sound.back(); location.hash = "#/"; }
  });

  // Little click on every link/button, if sound is on.
  document.addEventListener("click", function (e) {
    var a = e.target.closest("a[href^='#/']");
    if (a && !a.dataset.go && !a.classList.contains("slot")) {
      if (a.getAttribute("href") === "#/") FX.sound.back(); else FX.sound.select();
    }
  });

  window.addEventListener("hashchange", route);

  /* ---- POWER ON --------------------------------------------------------- */
  var bootEl = $("#boot");
  if (document.documentElement.classList.contains("no-boot")) {
    bootEl.hidden = true;
    route();
  } else {
    FX.boot(bootEl, DATA).then(route);
  }
})();
