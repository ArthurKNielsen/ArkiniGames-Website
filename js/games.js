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
      youtube: "https://www.youtube.com/@arkinigames"
    },

    // Email signup. Leave empty for the front-end-only "fake save".
    // Paste a form endpoint (Buttondown, Formspree, Mailchimp...) to make it real.
    signupEndpoint: "",

    // Lines for the news ticker at the bottom of the home screen.
    // Leave empty to show each game's status instead.
    news: [
      "KRAVN: wishlist now on Steam",
      "Sector 1: The Long Fall",
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
      tagline: "One stick. Six sectors. A lot of blood.",
      kind: "Game",                    // optional label: Game, Project, Tool, Jam game...
      status: "coming-soon",           // released | demo | in-development | coming-soon
      statusLabel: "COMING TO STEAM",
      genre: "Boomer shooter",
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

      intro: "You fall. You land. All you have is a stick. KRAVN is a fast, gory first-person shooter where your only weapon is the one you throw, and it always comes back.",

      trailer: {
        // A local video file plays right on the page. You can also use
        // youtube: "<any YouTube URL>" instead. steam: adds a "watch on Steam" link.
        video: ["assets/games/kravn/trailer-gameplay.webm", "assets/games/kravn/trailer-gameplay.mp4"],
        poster: "assets/games/kravn/trailer-poster-1280x720.jpg",
        steam: "https://store.steampowered.com/app/5088220/KRAVN/"
      },

      screenshots: [
        { src: "assets/games/kravn/shot-01-1280x720.jpg", alt: "A crawler lunges as the stick comes back around: BOOMERANG" },
        { src: "assets/games/kravn/shot-02-1280x720.jpg", alt: "Floating eyes and a crawler in a blood-soaked corridor: RICOCHET" },
        { src: "assets/games/kravn/shot-03-1280x720.jpg", alt: "Charging a throw at a crawler at the end of a dark tunnel" },
        { src: "assets/games/kravn/shot-04-1280x720.jpg", alt: "Two eyes burst in one throw: DOUBLE KILL" },
        { src: "assets/games/kravn/shot-05-1280x720.jpg", alt: "A crawler torn apart mid-room: DOUBLE HIT" },
        { src: "assets/games/kravn/shot-06-1280x720.jpg", alt: "Crawlers coming down a torchlit stone corridor" },
        { src: "assets/games/kravn/shot-07-1280x720.jpg", alt: "A pale stone hall with a hole in the floor" },
        { src: "assets/games/kravn/shot-08-1280x720.jpg", alt: "Sector cleared: kills, deaths and time" }
      ],

      // Short and punchy. Title + one line each. Rewrite these in your own words.
      features: [
        { title: "One stick. That's it.", text: "Charge it, throw it, catch it on the way back. It's all you get and it's enough." },
        { title: "It always comes back", text: "Hit them on the way out and again on the way home. DOUBLE HIT. Line them up for a DOUBLE KILL." },
        { title: "Things that crawl", text: "Long-limbed crawlers rush you in packs. Floating eyes burn you from across the room." },
        { title: "Six sectors down", text: "Fall through six sectors of rotten stone and torchlight, starting with The Long Fall." },
        { title: "Run it again", text: "Every sector counts your kills, deaths and time. Then it dares you to beat it." },
        { title: "Lore pieces", text: "Scraps of what happened down here are hidden in the levels. Go find them." }
      ],

      links: {
        demo: "https://store.steampowered.com/app/5088220/KRAVN/",                 // main button: the Steam page
        demoLabel: "WISHLIST ON STEAM",
        steamWidget: "https://store.steampowered.com/widget/5088220/", // Steam's own buy/wishlist box
        devlog: "https://www.youtube.com/@arkinigames",  // devlog / YouTube
        devlogText: "I post devlogs on YouTube. Devlog 21 was a big one: the entire game redesigned."
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
