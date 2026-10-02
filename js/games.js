/* ==========================================================================
   ARKINI SYSTEM — DATA FILE
   This is the only file you need to touch to add a game or change copy.
   Each entry in `games` becomes a memory card block and its own page at
   #/game/<id>. Anything you leave out is simply not shown (no trailer =
   no TRAILER tab, no screenshots = no SCREENS tab, and so on).
   See README.md for the full field list.
   ========================================================================== */

window.ARKINI = {
  site: {
    name: "Arkini Games",
    tagline: "Low-poly games with sharp teeth. Made by one person in Aarhus.",
    location: "Aarhus, Denmark",
    email: "hello@arkinigames.com", // PLACEHOLDER: swap for your real address
    founded: "2024",                // PLACEHOLDER: the year you started
    links: {
      steam: "https://store.steampowered.com/app/5088220/KRAVN/",
      youtube: "https://www.youtube.com/@arkinigames",
      discord: "https://discord.com/invite/bYdaGM7nPh"
    },

    // Email signup. Leave empty for the front-end-only "fake save".
    // Paste a form endpoint (Buttondown, Formspree, Mailchimp...) to make it real.
    signupEndpoint: "",

    // Lines for the news ticker at the bottom of the home screen.
    // Leave empty to show each game's status instead.
    news: [
      "KRAVN: wishlist now on Steam",
      "No ammo. So make it count.",
      "Join the KRAVN Discord",
      "New devlogs on YouTube: @arkinigames",
      "Made in Aarhus, Denmark"
    ],

    // Background music for home + config. "menu" is the built-in synth track.
    // Swap in your own loop later, e.g. "assets/music/menu-theme.ogg".
    music: "menu",

    // Optional: path to a logo image (PNG with transparency, ~200x72).
    // When null, the logo is drawn from the pixel font.
    logoImage: null,

    // System-wide palette. A game's theme overrides this on its own page.
    theme: {
      bg: "#0b0807",      // page background
      panel: "#1c1311",   // panels, slots
      line: "#3a2420",    // borders, dividers
      ink: "#d9c9a8",     // main text
      dim: "#8c7b66",     // secondary text
      primary: "#8a1c12", // big fills, selected slot
      accent: "#c4502a",  // cursor, highlights, links
      ok: "#6f7d68"       // status text
    },

    memoryCard: {
      blocks: 15,          // the real PS1 card had 15
      teaserSlots: 1,      // "COMING SOON" slots straight after your games
      corruptSlots: [7, 12] // block numbers (1-15) that show a corrupted save
    },

    about: [
      "Arkini Games is one person in Aarhus, Denmark, making the kind of games that used to come in a jewel case with a scratched disc and a manual you actually read.",
      "Low poly, loud, a bit wrong on purpose. Everything here is built by hand, mostly after dark.",
      "Press, collabs, bug reports, or you just want to say KRAVN slapped: send an email."
    ]
  },

  games: [
    {
      id: "kravn",                     // used in the URL: #/game/kravn
      title: "KRAVN",
      serial: "SLES-04451",            // fake PAL disc serial, pure flavour
      tagline: "No ammo. So make it count.",
      kind: "Game",                    // optional label: Game, Project, Tool, Jam game...
      status: "coming-soon",           // released | demo | in-development | coming-soon
      statusLabel: "COMING TO STEAM",
      genre: "Fast-paced boomer shooter",
      platforms: ["Windows"],
      blocks: 3,                       // how many memory card blocks it "uses"
      saveDate: "2026-10-01",          // shown as LAST SAVE, use your latest update

      // PS1 save icons were 16x16 and could animate through up to 3 frames.
      icon: [
        "assets/games/kravn/icon-16x16-f1.png",
        "assets/games/kravn/icon-16x16-f2.png",
        "assets/games/kravn/icon-16x16-f3.png"
      ],
      cover: "assets/games/kravn/cover-600x600.jpg",

      // Colours picked from the game itself: rotten stone, torchlight, blood.
      theme: {
        bg: "#0d0a08",
        panel: "#1d1611",
        line: "#3f2d21",
        ink: "#e8d5b0",
        dim: "#9c8669",
        primary: "#9e140c",
        accent: "#e0913e",
        ok: "#8a9a6a"
      },

      intro: "No guns. No ammo. Just a stick you throw, and it always comes back. KRAVN is a fast, gory boomer shooter about a long way down: stone tunnels, a desert lost in fog, a sea of blood, and whatever is waiting in Sector 5.",
      heroImage: "assets/games/kravn/shot-02.jpg", // big background at the top of the page

      trailer: {
        // Official gameplay trailer. Plays right on the page (webm first, mp4 fallback).
        video: ["assets/games/kravn/trailer.webm", "assets/games/kravn/trailer.mp4"],
        poster: "assets/games/kravn/trailer-poster-1280x720.jpg",
        steam: "https://store.steampowered.com/app/5088220/KRAVN/"
      },

      // Official Steam screenshots.
      screenshots: [
        { src: "assets/games/kravn/shot-01.jpg", alt: "A body on a bloody tiled floor with a stick driven through it" },
        { src: "assets/games/kravn/shot-02.jpg", alt: "A floating eye fires blue lasers down a long hall at a line of figures" },
        { src: "assets/games/kravn/shot-03.jpg", alt: "Floating eyes over a sea of blood under a red sky" },
        { src: "assets/games/kravn/shot-04.jpg", alt: "Dark figures walk out of the fog in an open desert, eyes hovering above" },
        { src: "assets/games/kravn/shot-05.jpg", alt: "Rocks and blood fly across a hazy desert" },
        { src: "assets/games/kravn/shot-06.jpg", alt: "A floating eye guards a torchlit stone corridor" },
        { src: "assets/games/kravn/shot-07.jpg", alt: "Figures on ledges in a tall stone shaft, the green stick charged" },
        { src: "assets/games/kravn/shot-08.jpg", alt: "A hallway drowned in red" },
        { src: "assets/games/kravn/shot-09.jpg", alt: "An eye bursts into blood and shards mid-throw" },
        { src: "assets/games/kravn/shot-10.jpg", alt: "Blood sprays across a bright stone corridor" },
        { src: "assets/games/kravn/shot-11.jpg", alt: "A kill explodes in front of the glowing green stick" }
      ],

      // Short and punchy. Title + one line each. Rewrite these in your own words.
      features: [
        { title: "No ammo. Make it count.", text: "You get one stick. Charge it, throw it, catch it on the way back. Miss and you are empty-handed." },
        { title: "It always comes back", text: "Hit them on the way out and again on the way home. DOUBLE HIT. Line them up for a DOUBLE KILL." },
        { title: "Charge it up", text: "Hold the throw until the stick glows and let it rip through everything in the room." },
        { title: "Things that watch", text: "Floating eyes burn you with lasers from across the room while things crawl and walk out of the fog." },
        { title: "The descent", text: "Six sectors down: stone tunnels, a desert lost in fog, a sea of blood under a red sky. Sector 5 is compromised." },
        { title: "Run it again", text: "Every sector counts your kills, deaths and time, then dares you to beat it. Lore pieces hide in the levels." }
      ],

      links: {
        demo: "https://store.steampowered.com/app/5088220/KRAVN/",                 // main button: the Steam page
        demoLabel: "WISHLIST ON STEAM",
        steamWidget: "https://store.steampowered.com/widget/5088220/", // Steam's own buy/wishlist box
        devlog: "https://www.youtube.com/@arkinigames",  // devlog / YouTube
        devlogText: "I post devlogs on YouTube. Devlog 21 was a big one: the entire game redesigned.",
        discord: "https://discord.com/invite/bYdaGM7nPh"
      },

      // Descent mode: scrolling the page = falling down a shaft. Each section is a
      // sector with its own walls: surface, stone, fog, blood, corrupt, alarm, bottom.
      descent: {
        depth: 6666,
        sectors: { hero: "surface", trailer: "fog", screens: "blood", features: "stone", demo: "alarm", devlog: "corrupt", signup: "bottom", bottom: "bottom" }
      },

      // Background music on this game's page. Built-in synth settings
      // ({ bpm, root (MIDI note), drums }) or a file: "assets/music/kravn.ogg"
      music: { bpm: 100, root: 45, drums: 1 },

      signup: {
        pitch: "Get one email when KRAVN launches on Steam. No spam. I don't have time for spam."
      }
    }

    // ---- ADD THE NEXT GAME HERE -------------------------------------------
    // , {
    //   id: "next-game",
    //   title: "NEXT GAME",
    //   status: "coming-soon",
    //   ...copy the fields above...
    // }
  ]
};
