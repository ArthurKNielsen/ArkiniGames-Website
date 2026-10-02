window.ARKINI = {
  site: {
    name: "Arkini Games",
    tagline: "Low-poly games with sharp teeth. Made by one person in Aarhus.",
    location: "Aarhus, Denmark",
    email: "hello@arkinigames.com",
    founded: "2024",
    links: {
      steam: "https://store.steampowered.com/app/5088220/KRAVN/",
      youtube: "https://www.youtube.com/@arkinigames",
      discord: "https://discord.com/invite/bYdaGM7nPh"
    },

    signupEndpoint: "",

    news: [
      "KRAVN: wishlist now on Steam",
      "No ammo. So make it count.",
      "Join the KRAVN Discord",
      "New devlogs on YouTube: @arkinigames",
      "Made in Aarhus, Denmark"
    ],

    music: "menu",

    logoImage: null,

    theme: {
      bg: "#0b0807",
      panel: "#1c1311",
      line: "#3a2420",
      ink: "#d9c9a8",
      dim: "#8c7b66",
      primary: "#8a1c12",
      accent: "#c4502a",
      ok: "#6f7d68"
    },

    memoryCard: {
      blocks: 15,
      teaserSlots: 1,
      corruptSlots: [7, 12]
    },

    about: [
      "Arkini Games is one person in Aarhus, Denmark, making the kind of games that used to come in a jewel case with a scratched disc and a manual you actually read.",
      "Low poly, loud, a bit wrong on purpose. Everything here is built by hand, mostly after dark.",
      "Press, collabs, bug reports, or you just want to say KRAVN slapped: send an email."
    ]
  },

  games: [
    {
      id: "kravn",
      title: "KRAVN",
      serial: "SLES-04451",
      tagline: "No ammo. So make it count.",
      kind: "Game",
      status: "coming-soon",
      statusLabel: "COMING TO STEAM",
      genre: "Fast-paced boomer shooter",
      platforms: ["Windows"],
      blocks: 3,
      saveDate: "2026-10-01",

      icon: [
        "assets/games/kravn/icon-16x16-f1.png",
        "assets/games/kravn/icon-16x16-f2.png",
        "assets/games/kravn/icon-16x16-f3.png"
      ],
      cover: "assets/games/kravn/cover-600x600.jpg",

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
      heroImage: "assets/games/kravn/shot-02.jpg",

      trailer: {
        video: ["assets/games/kravn/trailer.webm", "assets/games/kravn/trailer.mp4"],
        poster: "assets/games/kravn/trailer-poster-1280x720.jpg",
        steam: "https://store.steampowered.com/app/5088220/KRAVN/"
      },

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

      features: [
        { title: "No ammo. Make it count.", text: "You get one stick. Charge it, throw it, catch it on the way back. Miss and you are empty-handed." },
        { title: "It always comes back", text: "Hit them on the way out and again on the way home. DOUBLE HIT. Line them up for a DOUBLE KILL." },
        { title: "Charge it up", text: "Hold the throw until the stick glows and let it rip through everything in the room." },
        { title: "Things that watch", text: "Floating eyes burn you with lasers from across the room while things crawl and walk out of the fog." },
        { title: "The descent", text: "Six sectors down: stone tunnels, a desert lost in fog, a sea of blood under a red sky. Sector 5 is compromised." },
        { title: "Run it again", text: "Every sector counts your kills, deaths and time, then dares you to beat it. Lore pieces hide in the levels." }
      ],

      links: {
        demo: "https://store.steampowered.com/app/5088220/KRAVN/",
        demoLabel: "WISHLIST ON STEAM",
        steamWidget: "https://store.steampowered.com/widget/5088220/",
        devlog: "https://www.youtube.com/@arkinigames",
        devlogText: "I post devlogs on YouTube. Devlog 21 was a big one: the entire game redesigned.",
        discord: "https://discord.com/invite/bYdaGM7nPh"
      },

      descent: {
        depth: 6666,
        sectors: { hero: "surface", trailer: "fog", screens: "blood", features: "stone", demo: "alarm", devlog: "corrupt", signup: "bottom", bottom: "bottom" }
      },

      music: { bpm: 100, root: 45, drums: 1 },

      signup: {
        pitch: "Get one email when KRAVN launches on Steam. No spam. I don't have time for spam."
      }
    }

  ]
};
