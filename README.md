# Arkini Games — website

**Live site:** https://arthurknielsen.github.io/ArkiniGames-Website/

The official site for Arkini Games, a one-person studio in Aarhus, Denmark.

The site works like a PS1 that boots. First you get a short BIOS screen, then a
demo-disc style menu: the selected game's cover floats over a low-poly stage,
with a disc select reel, a memory card bar and a news ticker below. From there
you open a game's page, laid out like a title screen. It's plain HTML, CSS and vanilla JS with no framework, no
build step and no dependencies.

```
index.html          the shell (status bar, boot screen, loader, lightbox, CRT overlay)
css/style.css       all styles; colours come from CSS variables
js/games.js         ← THE DATA FILE. Studio info + every game. Edit this.
js/fx.js            sound, PS1 affine-warp renderer, boot sequence, dithering
js/app.js           hash router + screens (memory card, game page, config, 404)
assets/fonts/       Silkscreen + VT323 (self-hosted, latin subset, ~34 KB total)
assets/games/<id>/  per-game images
assets/og/          social preview image
```

## Run it locally

Any static server works:

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

You can also open `index.html` directly. Everything works except the dithered
gallery thumbnails: browsers block canvas reads on `file://`, so the
thumbnails fall back to the plain image.

## Add a new game

You only edit **`js/games.js`**.

1. Make a folder for the images, e.g. `assets/games/my-game/`.
2. In `js/games.js`, copy the whole KRAVN object inside `games: [ ... ]`, paste
   it after KRAVN with a comma between them, and change the values.
3. Done. The game gets a link in the top menu, a row in the DISCS list, a
   memory card block (or several, if `blocks > 1`), a page at
   `#/game/my-game`, and NEXT DISC links from the other game pages.

Games show up on the memory card in the order they're listed.

### Fields

| field | what it does |
|---|---|
| `id` | URL slug: `#/game/<id>`. Lowercase, no spaces. |
| `title` | Display name. The page title auto-sizes to fit. |
| `serial` | Fake PAL disc code shown on the page (e.g. `SLES-04451`). Flavour only. |
| `tagline` | One line, shown on the memory card info panel and under the title. |
| `intro` | Optional short paragraph under the tagline. |
| `kind` | Optional label shown in the disc list, e.g. `Game`, `Project`, `Jam game`. Use it for non-game projects. |
| `status` | `released`, `demo`, `in-development` or `coming-soon`. |
| `statusLabel` | What's actually displayed, e.g. `DEMO OUT NOW`. |
| `genre`, `platforms` | Shown in the file info. `platforms` is an array. |
| `blocks` | How many memory card blocks it fills (1–15). Extra blocks render as "linked" blocks, like big PS1 saves. |
| `saveDate` | `YYYY-MM-DD`, shown as LAST SAVE. Use your latest update date. |
| `icon` | 16×16 PNG, or an array of up to 3 frames (they animate). |
| `cover` | Square cover art, shown in the jewel case and spun on the loading screen. |
| `theme` | Colours for this game's page (see below). |
| `trailer` | `{ youtube, poster }`. `youtube` takes any YouTube URL or bare video ID. |
| `screenshots` | Array of `{ src, alt }`. Always write a real `alt`. |
| `features` | Array of `{ title, text }`. Keep them short. |
| `links.demo` / `links.demoLabel` | The big play button. |
| `links.devlog` / `links.devlogText` | Devlog link + one line about it. |
| `signup.pitch` | Line above the email form. |
| `music` | Background music for this game's page: either built-in synth settings like `{ bpm: 100, root: 45, drums: 1 }` or your own looping file, e.g. `"assets/music/kravn.ogg"`. |
| `psxThumbs` | Optional `false` to turn off the dithered thumbnails for this game. |

**Leaving a field out hides that part of the page.** No `trailer` means no
TRAILER section and no menu entry. The same goes for `screenshots`, `features`,
`links.demo`, `links.devlog` and `signup`. That covers a teaser page for a
`coming-soon` game: give it a title, tagline, cover and theme and nothing else.

### Studio-wide settings

Besides `games`, the `site` block in `games.js` holds the tagline, email,
links, the theme, the memory card setup and `news`: the lines that scroll
in the ticker on the home screen.

### Themes

Each game's `theme` re-tints the whole console while you're on its page:

```js
theme: {
  bg: "#090606",      // page background
  panel: "#170d0c",   // panels, slots
  line: "#3b1d19",    // borders
  ink: "#e3d6bc",     // main text
  dim: "#8f7d6b",     // secondary text
  primary: "#9e1b10", // big fills, selected menu item
  accent: "#d2482a",  // cursor, links, highlights
  ok: "#6f7d68"       // status text
}
```

Any key you leave out falls back to the site theme in `site.theme`. Tip: pick
colours with an eyedropper on your actual screenshots. Keep `ink` and `dim`
readable on `bg`.

## Swapping placeholder images

Every placeholder says what it is and its size right on the image. Replace
the file with yours. You can keep the same name, or change the path in
`games.js`:

| file | size | notes |
|---|---|---|
| `assets/games/kravn/shot-01..06-1280x720.png` | 1280×720 | JPG is fine too (and smaller) |
| `assets/games/kravn/trailer-poster-1280x720.png` | 1280×720 | shown before the trailer loads |
| `assets/games/kravn/cover-600x600.png` | 600×600 | square, like a PAL jewel case |
| `assets/games/kravn/icon-16x16-f1..f3.png` | 16×16 | save icon frames, transparent PNG |
| `assets/og/og-image-1200x630.png` | 1200×630 | link preview on Discord/Twitter/etc. |
| `assets/favicon-32x32.png` | 32×32 | browser tab icon |

Keep screenshots under ~150 KB each (JPG quality ~80 at 1280×720 is plenty).
The gallery thumbnails are dithered down to PS1-style 15-bit colour in the
browser, so you don't need to fake that in the files.

## Things to replace before launch

All in `js/games.js` unless noted:

- `site.email`: placeholder `hello@arkinigames.com`.
- `site.founded`: placeholder year.
- `trailer.youtube`: currently `VIDEO_ID_HERE`. Until it's a real video,
  clicking the trailer shows a NO SIGNAL screen.
- `features`: the bullet copy is a first draft. Rewrite it in your words.
- **`index.html`**: the `og:url`, `og:image` and `twitter:image` tags use
  `https://arkinigames.com/`. Change that to wherever the site actually lives.
  Social previews need absolute URLs.

## Email signup

The form only runs in the browser right now. It plays a save animation
and **doesn't store the email anywhere**. To collect real signups, paste a
form endpoint into `site.signupEndpoint`, for example from Buttondown,
Formspree or Mailchimp's embedded form URL. The form then POSTs `email`
(plus a hidden `game` field) to that URL like a normal HTML form.

(Netlify Forms won't detect it, because the form is created by JS. Use
one of the services above.)

## Deploying

**After every update:** in `index.html`, bump the `?v=` number on the
stylesheet and the four scripts (e.g. `?v=6` → `?v=7`). Browsers then grab
the new files right away instead of showing a cached old version.

The site is a folder of static files with relative paths, so it runs anywhere.

- **GitHub Pages:** Settings → Pages → deploy from branch `main`, folder `/`.
  `.nojekyll` is already included.
- **Netlify:** drag the folder into the dashboard, or connect the repo with no
  build command and publish directory `/`.
- **itch.io:** zip the *contents* of the folder (with `index.html` at the zip
  root), upload it as an HTML project and tick "This file will be played in the
  browser".

## Feel & accessibility

- **Boot** plays once per browser session. Any key or tap skips it. Replay
  it from CONFIG → BOOT SEQUENCE.
- **Music** plays in the background: a built-in synth track per screen
  (menu, game, error), cross-faded when you change page. Set `site.music` or a
  game's `music` to an .ogg/.mp3 path to use your own soundtrack instead.
  Toggle it with MUS in the top bar; CONFIG has volume for music and effects.
- **Sound effects** (hover ticks, select, back, static between screens, disc
  spin-up, shutter, save jingle, countdown, CRT power...) are synthesized with
  WebAudio (no audio files) and **on by default**. Browsers only allow audio after the first tap or keypress, so
  the very first boot is silent until the visitor touches something. Toggle
  it with SND in the top bar; the choice is remembered.
- **CRT filter** (scanlines, noise, flicker) can be turned off in CONFIG.
- **`prefers-reduced-motion`** skips the boot and loading screens, and stops
  flicker, jitter, blinking and the logo wobble.
- Keyboard: arrow keys move around the memory card, Enter loads, Esc goes
  back, and arrow keys flip screenshots in the lightbox.
- Routes are shareable: `#/game/kravn/screens` opens KRAVN scrolled to the
  gallery.

One limitation: every page shares the same social preview image. Crawlers
don't run JS, so per-game Open Graph tags would need separate HTML files or a
build step.

## Credits

Fonts: [Silkscreen](https://fonts.google.com/specimen/Silkscreen) by Jason
Kottke and [VT323](https://fonts.google.com/specimen/VT323) by Peter Hull.
Both are under the SIL Open Font License 1.1.
