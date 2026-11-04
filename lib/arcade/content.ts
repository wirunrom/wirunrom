export const NAME = "WIRUNROM"
export const TICKERS = {
  stack: [
    "c#",
    "typescript",
    "go",
    "rust",
    ".net",
    "next.js",
    "react",
    "postgres",
    "redis",
    "azure",
    "aws",
    "claude",
    "codex",
  ],
  process: ["build", "ship", "break", "fix", "deploy", "sleep", "repeat"],
  notes: [
    "backend at heart",
    "frontend for fun",
    "offline-first",
    "multi-tenant",
    "multi-cloud",
    "query plans",
    "stored procedures",
    "matcha, not coffee",
    "two wheels",
    "chiang mai · gmt+7",
  ],
} as const
export const STATEMENT = [
  "i build software for a living",
  "orders, payments, databases — the things that need to work",
  "this space is for curiosity",
  "ten small games, built for the fun of figuring things out",
]

export const BOOT_MESSAGES = [
  "handshake",
  "decoding name",
  "measuring light",
  "condensing 62",
  "expanding 125",
  "ignoring advice",
  "almost",
]

// Compact-screen instructions; full game-specific help remains in the disclosure.
export const QUICK_HELP = {
  lights: ["tap to turn the lights off", "click to turn the lights off"],
  g2048: ["swipe to merge tiles", "arrow keys to merge tiles"],
  mines: ["tap to open · hold to flag", "click to open · right-click to flag"],
  whack: ["tap the mole · avoid blue", "hit the mole · avoid blue"],
  breakout: ["drag to move · tap to launch", "move paddle · click to launch"],
  runner: ["tap to jump", "space to jump · ↓ to duck"],
  tetris: ["tap to move · swipe down to drop", "← → move · ↑ rotate"],
  snake: ["swipe to turn", "arrow keys to move"],
  clicker: ["tap to ship code", "click to ship code"],
  ciph: ["decode the message", "decode the message"],
} as const
