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
      itch: "https://arkinigames.itch.io",
      youtube: "https://www.youtube.com/@arkinigames"
    },

    // Email signup. Leave empty for the front-end-only "fake save".
    // Paste a form endpoint (Buttondown, Formspree, Mailchimp...) to make it real.
    signupEndpoint: "",

    // Lines for the news ticker at the bottom of the home screen.
    // Leave empty to show each game's status instead.
    news: [
      "KRAVN demo out now on itch.io",
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
      "Press, collabs, bug reports, or you just want to say the demo slapped: send an email."
    ]
  },

  games: [
    {
      id: "kravn",                     // used in the URL: #/game/kravn
      title: "KRAVN",
      serial: "SLES-04451",            // fake PAL disc serial, pure flavour
      tagline: "A PSX-era boomer shooter. Fast guns, dirty polygons, zero mercy.",
      kind: "Game",                    // optional label: Game, Project, Tool, Jam game...
      status: "demo",                  // released | demo | in-development | coming-soon
      statusLabel: "DEMO OUT NOW",
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
      cover: "assets/games/kravn/cover-600x600.png",

      theme: {
        bg: "#090606",
        panel: "#170d0c",
        line: "#3b1d19",
        ink: "#e3d6bc",
        dim: "#8f7d6b",
        primary: "#9e1b10",
        accent: "#d2482a",
        ok: "#6f7d68"
      },

      intro: "You go down. Things come up. KRAVN is a fast, mean little shooter that looks like a disc you rented in 1998 and never gave back.",

      trailer: {
        // Any YouTube URL or bare video ID works. PLACEHOLDER below.
        youtube: "https://www.youtube.com/watch?v=VIDEO_ID_HERE",
        poster: "assets/games/kravn/trailer-poster-1280x720.png"
      },

      screenshots: [
        { src: "assets/games/kravn/shot-01-1280x720.png", alt: "Placeholder: red brick corridor, two glowing eyes in the dark" },
        { src: "assets/games/kravn/shot-02-1280x720.png", alt: "Placeholder: grey corridor with a muzzle flash" },
        { src: "assets/games/kravn/shot-03-1280x720.png", alt: "Placeholder: blood-red hallway lit from the far end" },
        { src: "assets/games/kravn/shot-04-1280x720.png", alt: "Placeholder: green-walled tunnel with enemies ahead" },
        { src: "assets/games/kravn/shot-05-1280x720.png", alt: "Placeholder: rust corridor leading to a bright doorway" },
        { src: "assets/games/kravn/shot-06-1280x720.png", alt: "Placeholder: dark stone passage, shotgun raised" }
      ],

      // Short and punchy. Title + one line each. Rewrite these in your own words.
      features: [
        { title: "Fast. Actually fast.", text: "Slide, jump, keep moving. Standing still is how you die." },
        { title: "Guns that kick back", text: "Every weapon is loud, heavy and a little bit stupid. As it should be." },
        { title: "Wobbly on purpose", text: "Vertex jitter, warped textures, dithered colour. Real PS1 jank, not a filter slapped on top." },
        { title: "Check the walls", text: "Hand-built levels stuffed with secrets. If a wall looks weird, shoot it." },
        { title: "No live service", text: "No battle pass, no microtransactions, no account. Buy it, play it, done." },
        { title: "Made by one person", text: "Code, art, levels, sound. All of it out of one room in Aarhus." }
      ],

      links: {
        demo: "https://arkinigames.itch.io/kravn",       // "Play the Demo" button
        demoLabel: "PLAY THE DEMO",
        devlog: "https://www.youtube.com/@arkinigames",  // devlog / YouTube
        devlogText: "I post devlogs on YouTube: new guns, broken builds, and how the sausage gets made."
      },

      // Background music on this game's page. Built-in synth settings
      // ({ bpm, root (MIDI note), drums }) or a file: "assets/music/kravn.ogg"
      music: { bpm: 100, root: 45, drums: 1 },

      signup: {
        pitch: "Get one email when the full game drops. No spam. I don't have time for spam."
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
