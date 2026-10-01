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
  function storeName(url) { return /steampowered\.com/.test(url || "") ? "Steam" : /itch\.io/.test(url || "") ? "itch.io" : hostOf(url); }
  function frames(icon) { return Array.isArray(icon) ? icon : icon ? [icon] : []; }
  function gameById(id) { return GAMES.filter(function (g) { return g.id === id; })[0]; }
  function onCleanup(fn) { cleanups.push(fn); }
  function isOnScreen(el) { var r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; }

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

  // Memory card strip: 15 tiny blocks, used ones lit.
  function cellHTML(s) {
    var inner = s.type === "game" ? iconImg(s.game, "mc__icon") :
      s.type === "teaser" ? "?" : s.type === "corrupt" ? "#" : "";
    return '<li class="mc__c mc__c--' + s.type + '">' + inner + "</li>";
  }

  // Disc select reel: every game, then teaser and empty trays.
  function buildReel() {
    var reel = GAMES.map(function (g) { return { type: "game", game: g }; });
    var teasers = (SITE.memoryCard && SITE.memoryCard.teaserSlots) || 0;
    for (var i = 0; i < teasers; i++) reel.push({ type: "teaser" });
    while (reel.length < 4) reel.push({ type: "empty" });
    return reel;
  }

  function tileHTML(t, i) {
    var n = '<span class="tile__n">DISC ' + pad2(i + 1) + "</span>";
    if (t.type === "game") {
      var g = t.game;
      return '<li><a class="tile tile--game" data-i="' + i + '" href="#/game/' + esc(g.id) + '">' +
        '<span class="tile__art">' + (g.cover ? '<img src="' + esc(g.cover) + '" alt="" width="600" height="600" loading="lazy">' : iconImg(g, "tile__icon")) + "</span>" +
        n + '<b class="tile__t">' + esc(g.title) + '</b><span class="tile__s">' + esc(g.statusLabel || g.status) + "</span></a></li>";
    }
    var teaser = t.type === "teaser";
    return '<li><button class="tile tile--' + t.type + '" data-i="' + i + '" type="button" aria-label="Disc ' + (i + 1) + ": " + (teaser ? "coming soon" : "empty tray") + '">' +
      '<span class="tile__art"><span class="tile__q" aria-hidden="true">' + (teaser ? "?" : "") + "</span></span>" +
      n + '<b class="tile__t"' + (teaser ? ' data-scramble="COMING SOON"' : "") + ">" + (teaser ? "COMING SOON" : "NO DISC") + "</b>" +
      '<span class="tile__s">' + (teaser ? "WRITING..." : "EMPTY TRAY") + "</span></button></li>";
  }

  function stageInfoHTML(t) {
    if (t.type === "game") {
      var g = t.game, l = g.links || {};
      return '<p class="stage__serial">' + esc([g.serial, "PAL"].filter(Boolean).join(" · ")) + "</p>" +
        '<h2 class="stage__title" style="--chars:' + Math.max(5, String(g.title).length) + '">' + esc(g.title) + "</h2>" +
        '<p class="stage__tag">' + esc(g.tagline) + "</p>" +
        '<ul class="chips">' +
          '<li class="chip chip--ok">' + esc(g.statusLabel || g.status) + "</li>" +
          (g.genre ? '<li class="chip">' + esc(g.genre) + "</li>" : "") +
          '<li class="chip">' + esc(g.blocks || 1) + " BLOCKS</li>" +
        "</ul>" +
        '<div class="stage__cta">' +
          '<a class="btn btn--primary" href="#/game/' + esc(g.id) + '"><i class="pad pad--x"></i>LOAD ' + esc(g.title) + "</a>" +
          (l.demo ? '<a class="btn" href="' + esc(l.demo) + '" target="_blank" rel="noopener">' + esc(l.demoLabel || "PLAY THE DEMO") + " &gt;&gt;</a>" : "") +
        "</div>";
    }
    if (t.type === "teaser") {
      return '<p class="stage__serial is-bad">BLOCK RESERVED</p>' +
        '<h2 class="stage__title is-dim" data-scramble="COMING SOON" style="--chars:11">COMING SOON</h2>' +
        '<p class="stage__tag">Something is being written to this disc. Do not switch off the power.</p>';
    }
    return '<p class="stage__serial">TRAY OPEN</p><h2 class="stage__title is-dim" style="--chars:7">NO DISC</h2>' +
      '<p class="stage__tag">Empty. Room for the next one.</p>';
  }

  // Static noise texture for trays without a cover.
  function noiseTex(seed) {
    var c = document.createElement("canvas"); c.width = c.height = 24;
    var x = c.getContext("2d"), cs = getComputedStyle(document.documentElement);
    var cols = [cs.getPropertyValue("--panel"), cs.getPropertyValue("--line"), cs.getPropertyValue("--bg"), cs.getPropertyValue("--primary")];
    for (var i = 0; i < 576; i++) {
      seed = (seed * 9301 + 49297) % 233280;
      x.fillStyle = cols[Math.floor(seed / 233280 * (i % 7 ? 3 : 4))];
      x.fillRect(i % 24, (i / 24) | 0, 1, 1);
    }
    return c;
  }

  var texCache = {};
  function texFor(t, cb) {
    if (t.type !== "game" || !t.game.cover) return cb(noiseTex(t.type === "teaser" ? 7 : 3));
    var src = t.game.cover;
    if (texCache[src]) return cb(texCache[src]);
    var img = new Image();
    img.onload = function () { texCache[src] = img; cb(img); };
    img.onerror = function () { cb(noiseTex(5)); };
    img.src = src;
  }

  function renderHome() {
    var card = buildSlots();
    var reel = buildReel();
    var news = (SITE.news && SITE.news.length) ? SITE.news :
      GAMES.map(function (g) { return g.title + ": " + (g.statusLabel || g.status); });
    var crawl = news.map(esc).join(" &nbsp;+++&nbsp; ") + " &nbsp;+++&nbsp; ";
    var yt = SITE.links.youtube.split("@")[1] || "";

    screen.innerHTML =
      '<section class="hub">' +
        '<header class="hub__head">' +
          '<h1 class="sr-only">' + esc(SITE.name) + "</h1>" +
          '<canvas class="hub__logo" width="220" height="80" role="img" aria-label="' + esc(SITE.name) + ' logo"></canvas>' +
          '<p class="hub__tag">' + esc(SITE.tagline) + "</p>" +
          '<dl class="hub__stamp">' +
            (SITE.founded ? "<dt>EST.</dt><dd>" + esc(SITE.founded) + "</dd>" : "") +
            "<dt>BASE</dt><dd>" + esc(SITE.location) + "</dd>" +
            "<dt>STAFF</dt><dd>1 HUMAN</dd>" +
          "</dl>" +
        "</header>" +
        '<div class="stage">' +
          '<div class="stage__view">' +
            '<canvas class="stage__cv" width="240" height="168" aria-hidden="true"></canvas>' +
            '<span class="stage__k">NOW SHOWING</span>' +
          "</div>" +
          '<div class="stage__info" aria-live="polite"></div>' +
        "</div>" +
        '<div class="reel">' +
          '<div class="reel__head"><h2>DISC SELECT</h2><span>POINT TO PREVIEW &middot; CLICK TO LOAD</span></div>' +
          '<ol class="reel__list">' + reel.map(tileHTML).join("") + "</ol>" +
        "</div>" +
        '<div class="hub__foot">' +
          '<div class="mc">' +
            '<span class="mc__k">MEMORY CARD 1</span>' +
            '<ol class="mc__bar" aria-label="Memory card 1: ' + (card.total - card.free) + " of " + card.total + ' blocks used">' + card.slots.map(cellHTML).join("") + "</ol>" +
            '<span class="mc__free">' + card.free + "/" + card.total + " FREE</span>" +
          "</div>" +
          '<ul class="hub__links">' +
            (SITE.links.steam ? '<li><a class="btn" href="' + esc(SITE.links.steam) + '" target="_blank" rel="noopener">STEAM</a></li>' : "") +
            '<li><a class="btn" href="' + esc(SITE.links.youtube) + '" target="_blank" rel="noopener">YOUTUBE @' + esc(yt) + "</a></li>" +
            '<li><a class="btn" href="#/about">CONTACT</a></li>' +
          "</ul>" +
        "</div>" +
        '<div class="ticker"><p class="ticker__run"><span>' + crawl + '</span><span aria-hidden="true">' + crawl + "</span></p></div>" +
      "</section>";

    var tiles = $$(".tile", screen);
    var info = $(".stage__info", screen);
    var cv = $(".stage__cv", screen);
    var sel = -1, stopScramble = function () {}, stage = null, tileScr = [];

    // Scramble the COMING SOON tile titles.
    $$(".tile [data-scramble]", screen).forEach(function (el) { tileScr.push(FX.scramble(el, el.dataset.scramble, 0.15)); });
    onCleanup(function () { tileScr.forEach(function (f) { f(); }); stopScramble(); if (stage) stage.stop(); });

    function colors() {
      var cs = getComputedStyle(document.documentElement);
      return { far: cs.getPropertyValue("--panel"), line: cs.getPropertyValue("--primary"), hz: cs.getPropertyValue("--accent") };
    }
    var floorCols = colors();

    function select(i) {
      if (i === sel) return;
      sel = i;
      tiles.forEach(function (el, k) { el.classList.toggle("is-sel", k === i); });
      stopScramble();
      info.innerHTML = stageInfoHTML(reel[i]);
      info.dataset.type = reel[i].type;
      var sc = $("[data-scramble]", info);
      stopScramble = sc ? FX.scramble(sc, sc.dataset.scramble) : function () {};
      texFor(reel[i], function (tex) {
        if (!cv.isConnected || sel !== i) return;
        if (!stage) {
          stage = FX.quad(cv, tex, {
            mode: "show", fill: 0.56, oy: 0.4,
            before: function (c, t, w, h) { FX.floor(c, t, w, h, floorCols); }
          }).start();
        } else stage.setTexture(tex);
      });
    }

    tiles.forEach(function (el, i) {
      el.addEventListener("mouseenter", function () { if (sel !== i) { FX.sound.move(); select(i); } });
      el.addEventListener("focus", function () { select(i); });
      el.addEventListener("click", function (e) {
        if (reel[i].type === "game") { FX.sound.select(); return; } // the link loads the game
        e.preventDefault();
        if (reel[i].type === "teaser") FX.sound.glitch(); else FX.sound.error();
        select(i);
        el.classList.remove("is-shake"); void el.offsetWidth; el.classList.add("is-shake");
      });
    });
    $(".reel__list", screen).addEventListener("keydown", function (e) {
      var d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      var next = Math.max(0, Math.min(tiles.length - 1, (sel < 0 ? 0 : sel) + d));
      if (next !== sel) FX.sound.move();
      tiles[next].focus();
    });

    var start = 0;
    if (current.lastGame) reel.some(function (t, i) { if (t.game && t.game.id === current.lastGame) { start = i; return true; } });
    select(start);

    var logo = $(".hub__logo", screen);
    FX.logoTexture(SITE, SITE.theme).then(function (tex) {
      if (!logo.isConnected) return;
      var q = FX.quad(logo, tex, { mode: "sway", fill: 0.92 }).start();
      onCleanup(q.stop);
    });

    return { title: SITE.name + " — disc select", focus: tiles[start] };
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
    var shots = g.screenshots || [];
    var bg = g.heroImage || (shots[0] && shots[0].src) || (g.trailer && g.trailer.poster) || "";
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
          "</button></div>" +
          (g.trailer.steam ? '<p class="trailer__more"><a href="' + esc(g.trailer.steam) + '" target="_blank" rel="noopener">Watch the official trailer on Steam &gt;&gt;</a></p>' : "");
      } else if (id === "screens") {
        body = '<div class="viewer">' +
            '<button class="viewer__big" type="button" aria-label="Open screenshot full size">' +
              '<img src="' + esc(shots[0].src) + '" alt="' + esc(shots[0].alt) + '" width="1280" height="720" decoding="async">' +
              '<span class="viewer__n">' + pad2(1) + " / " + pad2(shots.length) + "</span>" +
              '<span class="viewer__zoom">FULL SIZE</span>' +
            "</button>" +
            '<ol class="strip">' + shots.map(function (sh, i) {
              return '<li><button class="strip__btn' + (i ? "" : " is-on") + '" type="button" data-i="' + i + '" aria-label="Show screenshot ' + (i + 1) + '"' + (i ? "" : ' aria-current="true"') + ">" +
                '<img src="' + esc(sh.src) + '" alt="" loading="lazy" decoding="async" width="1280" height="720"></button></li>';
            }).join("") + "</ol>" +
          "</div>";
      } else if (id === "features") {
        body = '<ol class="inv">' + g.features.map(function (f, i) {
          return '<li class="inv__slot"><span class="inv__n" aria-hidden="true">' + pad2(i + 1) + "</span><h3>" + esc(f.title) + "</h3><p>" + esc(f.text) + "</p></li>";
        }).join("") + "</ol>";
      } else if (id === "demo") {
        var noTarget = links.devlog ? "devlog" : (g.signup ? "signup" : "");
        body = '<div class="cont">' +
          '<p class="cont__q">CONTINUE?</p>' +
          '<p class="cont__count" aria-hidden="true">9</p>' +
          '<div class="cont__btns">' +
            '<a class="btn btn--big btn--primary" href="' + esc(links.demo) + '" target="_blank" rel="noopener"><i class="pad pad--x"></i>YES: ' + esc(links.demoLabel || "PLAY THE DEMO") + "</a>" +
            (noTarget ? '<a class="btn" href="#/game/' + esc(g.id) + "/" + noTarget + '" data-go="' + noTarget + '">NO</a>' : "") +
          "</div>" +
          '<p class="cont__meta">' + esc([(g.platforms || []).join(" / "), storeName(links.demo)].filter(Boolean).join(" · ").toUpperCase()) + "</p>" +
          "</div>" +
          (links.steamWidget ? '<iframe class="steam-widget" src="' + esc(links.steamWidget) + '" title="' + esc(g.title) + ' on Steam" loading="lazy" frameborder="0"></iframe>' : "");
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
        '<h2 class="sec__h" id="h-' + id + '"><span class="sec__n">' + pad2(n) + "</span><span>" + esc(s[1]) + "</span></h2>" +
        '<div class="sec__body">' + body + "</div></section>");
    });

    var hud = [["STATUS", g.statusLabel || g.status, "is-ok"], ["GENRE", g.genre], ["PLATFORM", g.platforms && g.platforms.join(", ")],
      ["PLAYERS", "1"], ["BLOCKS", g.blocks || 1], ["LAST SAVE", g.saveDate && g.saveDate.replace(/-/g, ".")]]
      .filter(function (r) { return r[1]; });

    screen.innerHTML =
      '<article class="gm">' +
        '<header class="gm__hero">' +
          (bg ? '<div class="gm__bg" aria-hidden="true"><img src="' + esc(bg) + '" alt="" width="1280" height="720"></div>' : "") +
          '<div class="gm__in">' +
            '<p class="gm__serial">' + esc([g.serial, "PAL", "DISC 1/1"].filter(Boolean).join(" · ")) + "</p>" +
            '<h1 class="gm__title" tabindex="-1" style="--chars:' + Math.max(4, String(g.title).length) + '">' + esc(g.title) + "</h1>" +
            '<p class="gm__tag">' + esc(g.tagline) + "</p>" +
            (g.intro ? '<p class="gm__intro">' + esc(g.intro) + "</p>" : "") +
            '<div class="gm__cta">' +
              (links.demo ? '<a class="press" href="' + esc(links.demo) + '" target="_blank" rel="noopener"><span>PRESS <i class="pad pad--x"></i> TO ' + esc(links.demoLabel || "PLAY THE DEMO") + "</span></a>" : "") +
              (g.trailer ? '<a class="btn" href="#/game/' + esc(g.id) + '/trailer" data-go="trailer">WATCH TRAILER</a>' : "") +
            "</div>" +
          "</div>" +
          (g.cover ? '<figure class="case gm__case"><span class="case__spine" aria-hidden="true">' + esc(g.title) + " · ARKINI</span>" +
            '<img src="' + esc(g.cover) + '" alt="' + esc(g.title) + ' cover art" width="600" height="600"></figure>' : "") +
        "</header>" +
        '<dl class="hud">' + hud.map(function (r) {
          return '<div class="hud__c"><dt>' + r[0] + '</dt><dd class="' + (r[2] || "") + '">' + esc(r[1]) + "</dd></div>";
        }).join("") + "</dl>" +
        (secs.length ? '<nav class="gm__nav" aria-label="' + esc(g.title) + ' sections">' +
          "<ol>" + secs.map(function (s) {
            return '<li><a href="#/game/' + esc(g.id) + "/" + s[0] + '" data-go="' + s[0] + '">' + s[1] + "</a></li>";
          }).join("") + "</ol>" +
          '<div class="prog" aria-hidden="true"><span>PROGRESS</span><ol>' + new Array(16).join("<li></li>") + "</ol></div>" +
        "</nav>" : "") +
        '<div class="gm__body">' + html.join("") + discNav(g) + "</div>" +
      "</article>";

    wireGame(g);
    if (sectionId) requestAnimationFrame(function () { goSection(sectionId, false); });
    return { title: g.title + " — " + SITE.name, focus: $(".gm__title", screen), keepScroll: !!sectionId };
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
    var menuLinks = $$(".gm__nav [data-go]", screen);
    if ("IntersectionObserver" in window && menuLinks.length) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          menuLinks.forEach(function (a) {
            var on = a.dataset.go === en.target.dataset.sec;
            a.classList.toggle("is-on", on);
            if (on) { a.setAttribute("aria-current", "true"); var ol = a.closest("ol"); if (ol) ol.scrollLeft = a.offsetLeft - ol.offsetLeft - 16; }
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
      var box = facade.parentNode;
      if (g.trailer.video) {
        FX.sound.select();
        var srcs = [].concat(g.trailer.video).map(function (u) {
          var type = /\.webm$/i.test(u) ? "video/webm" : /\.mp4$/i.test(u) ? "video/mp4" : "";
          return '<source src="' + esc(u) + '"' + (type ? ' type="' + type + '"' : "") + ">";
        }).join("");
        box.innerHTML = '<video' + (g.trailer.poster ? ' poster="' + esc(g.trailer.poster) + '"' : "") +
          ' controls autoplay playsinline preload="auto">' + srcs + "</video>";
        var vid = $("video", box);
        // The trailer has its own sound: pause the site music while it plays.
        vid.addEventListener("play", function () { FX.music.pause(); });
        vid.addEventListener("pause", function () { FX.music.resume(); });
        vid.addEventListener("ended", function () { FX.music.resume(); });
        onCleanup(function () { vid.pause(); FX.music.resume(); });
        return;
      }
      var id = youtubeId(g.trailer.youtube);
      if (!id) {
        FX.sound.error();
        FX.sound.staticBurst(0.8);
        box.innerHTML = '<div class="trailer__nosig" role="status"><b>NO SIGNAL</b><span>Trailer not connected yet. Check back soon.</span></div>';
        return;
      }
      FX.sound.select();
      box.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0" title="' + esc(g.title) + ' trailer" ' +
        'allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen loading="lazy"></iframe>';
    });

    // Screenshot viewer: strip picks, big image opens the lightbox.
    // Strip thumbnails and the hero backdrop get the PS1 15-bit treatment.
    var psx = g.psxThumbs != null ? g.psxThumbs : SITE.psxThumbs !== false;
    function psxImg(img, w) {
      if (!psx) return;
      var run = function () {
        if (img.dataset.psx) return;
        img.dataset.psx = "1";
        var url = FX.psxify(img, w, 32);
        if (url) img.src = url;
      };
      if (img.complete && img.naturalWidth) run(); else img.addEventListener("load", run, { once: true });
    }
    var heroImg = $(".gm__bg img", screen);
    if (heroImg) psxImg(heroImg, 320);
    var shown = 0, big = $(".viewer__big", screen);
    $$(".strip__btn", screen).forEach(function (btn) {
      psxImg($("img", btn), 160);
      btn.addEventListener("click", function () {
        shown = +btn.dataset.i;
        var sh = g.screenshots[shown], img = $("img", big);
        FX.sound.shutter();
        img.src = sh.src; img.alt = sh.alt;
        $(".viewer__n", big).textContent = pad2(shown + 1) + " / " + pad2(g.screenshots.length);
        $$(".strip__btn", screen).forEach(function (b) {
          var on = b === btn;
          b.classList.toggle("is-on", on);
          if (on) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current");
        });
      });
    });
    if (big) big.addEventListener("click", function () { Lightbox.open(g, shown); });

    // CONTINUE? countdown, 9 to 0, then round again.
    var count = $(".cont__count", screen);
    if (count && !FX.reduced()) {
      var c = 9;
      var cd = setInterval(function () {
        c = c <= 0 ? 9 : c - 1;
        count.textContent = c;
        if (document.visibilityState === "visible" && isOnScreen(count)) FX.sound.count(c);
        count.classList.toggle("is-zero", c === 0);
      }, 900);
      onCleanup(function () { clearInterval(cd); });
    }

    // Level-progress meter in the section bar.
    var cells = $$(".prog li", screen);
    if (cells.length) {
      var body = $(".gm__body", screen), ticking = false, lastLit = -1;
      var upd = function () {
        ticking = false;
        var r = body.getBoundingClientRect();
        var p = Math.max(0, Math.min(1, -r.top / Math.max(1, r.height - innerHeight)));
        var lit = Math.round(p * cells.length);
        if (lit > lastLit && lastLit >= 0) FX.sound.tick(lit);
        lastLit = lit;
        cells.forEach(function (li, k) { li.className = k < lit ? "on" : ""; });
      };
      var onScroll = function () { if (!ticking) { ticking = true; requestAnimationFrame(upd); } };
      window.addEventListener("scroll", onScroll, { passive: true });
      onCleanup(function () { window.removeEventListener("scroll", onScroll); });
      upd();
    }

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
        if (k < cells.length) { FX.sound.tick(k); cells[k++].className = "on"; return; }
        clearInterval(tick);
        FX.sound.success();
        status.className = "save__status is-ok";
        status.textContent = "SAVE COMPLETE. YOU'LL HEAR FROM ME WHEN THERE'S NEWS.";
      }, FX.reduced() ? 0 : 70);
      onCleanup(function () { clearInterval(tick); });
    });
  }

  /* ---- ABOUT / SYSTEM CONFIG -------------------------------------------- */
  function volRow(key, label, v) {
    return '<li><span>' + label + '</span><span class="vol">' +
      '<button class="opt" type="button" data-vol="' + key + '" data-d="-1" aria-label="' + label + ' down">&lt;</button>' +
      '<b class="vol__bar" aria-live="polite" aria-label="' + label + ' ' + v + ' of 10">' + volBar(v) + "</b>" +
      '<button class="opt" type="button" data-vol="' + key + '" data-d="1" aria-label="' + label + ' up">&gt;</button></span></li>';
  }
  function volBar(v) { var o = ""; for (var k = 0; k < 10; k++) o += '<i class="' + (k < v ? "on" : "") + '"></i>'; return o; }

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
          "<dt>SYSTEM</dt><dd>" + esc(((($(".bar__region") || {}).textContent || "").match(/BUILD \d+/) || ["BUILD ?"])[0]) + "</dd>" +
          '<dt>CONTACT</dt><dd><a href="mailto:' + esc(SITE.email) + '">' + esc(SITE.email) + "</a></dd>" +
          (SITE.links.steam ? '<dt>STEAM</dt><dd><a href="' + esc(SITE.links.steam) + '" target="_blank" rel="noopener">KRAVN on Steam</a></dd>' : "") +
          '<dt>YOUTUBE</dt><dd><a href="' + esc(SITE.links.youtube) + '" target="_blank" rel="noopener">@' + esc(SITE.links.youtube.split("@")[1] || "") + "</a></dd>" +
        "</dl>" +
        '<div class="config__about">' + (SITE.about || []).map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("") + "</div>" +
        '<div class="config__set">' +
          '<h2 class="sec__h"><span class="sec__n">--</span>SETTINGS</h2>' +
          '<ul class="opts">' +
            toggleRow("mus", "MUSIC", FX.music.isOn()) +
            volRow("mus", "MUSIC VOL", FX.music.volume()) +
            toggleRow("snd", "SOUND FX", FX.sound.isOn()) +
            volRow("snd", "SFX VOL", FX.sound.volume()) +
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
        if (k === "mus") setMusic(on);
        if (k === "crt") {
          document.documentElement.classList.toggle("crt-off", !on);
          FX.store.set("arkini.crt", on ? "1" : "0");
          FX.sound.power(on);
        }
        b.setAttribute("aria-pressed", on);
        $("b", b).textContent = on ? "ON" : "OFF";
      });
    });
    $$("[data-vol]", screen).forEach(function (b) {
      b.addEventListener("click", function () {
        var api = b.dataset.vol === "mus" ? FX.music : FX.sound;
        var v = Math.max(0, Math.min(10, api.volume() + +b.dataset.d));
        api.volume(v);
        var bar = $(".vol__bar", b.parentNode);
        bar.innerHTML = volBar(v);
        bar.setAttribute("aria-label", bar.getAttribute("aria-label").replace(/\d+ of 10/, v + " of 10"));
        FX.sound.tick(v);
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
    function step(d) { FX.sound.shutter(); show(i + d); }
    $(".lightbox__prev", dlg).addEventListener("click", function () { step(-1); });
    $(".lightbox__next", dlg).addEventListener("click", function () { step(1); });
    $(".lightbox__close", dlg).addEventListener("click", function () { dlg.close(); });
    dlg.addEventListener("close", function () { FX.sound.close(); });
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
        FX.sound.open();
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
        FX.sound.spin();
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
      if (current.name !== null) FX.sound.cut();
      FX.music.play(r.name === "game" ? (game.music || "game") : r.name === "missing" ? "error" : (SITE.music || "menu"));
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
    if (on) FX.sound.on();
    var opt = $('[data-opt="snd"]', screen);
    if (opt) { opt.setAttribute("aria-pressed", on); $("b", opt).textContent = on ? "ON" : "OFF"; }
  }
  setSound(FX.sound.isOn());
  sndBtn.addEventListener("click", function () { setSound(!FX.sound.isOn()); });

  var musBtn = $("#mus");
  function setMusic(on) {
    FX.music.set(on);
    musBtn.setAttribute("aria-pressed", on);
    $("b", musBtn).textContent = on ? "ON" : "OFF";
    if (on) FX.sound.on(); else FX.sound.off();
    var opt = $('[data-opt="mus"]', screen);
    if (opt) { opt.setAttribute("aria-pressed", on); $("b", opt).textContent = on ? "ON" : "OFF"; }
  }
  musBtn.setAttribute("aria-pressed", FX.music.isOn());
  $("b", musBtn).textContent = FX.music.isOn() ? "ON" : "OFF";
  musBtn.addEventListener("click", function () { setMusic(!FX.music.isOn()); });

  // A light tick when the pointer lands on anything clickable.
  var hovered = null;
  document.addEventListener("pointerover", function (e) {
    if (e.pointerType === "touch") return;
    var el = e.target.closest("a, button, input, [role=button], .hit");
    if (el === hovered) return;
    hovered = el;
    if (!el || el.classList.contains("tile")) return;          // tiles have their own sound
    var inBar = el.closest(".bar, .gm__nav");
    FX.sound.hover(inBar ? 1900 : 1650);
  });

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
