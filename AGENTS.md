# WIRUNROM — personal file / arcade

ตอบผู้ใช้เป็นภาษาไทยเป็นหลัก อัปเดตคู่มือเมื่อเปลี่ยนโครงสร้างสำคัญ และใช้ token ให้พอดีกับงาน

## Current routes and stack

- `/`: a native Next.js App Router page at `app/(arcade)/page.tsx`.
  React 19 + TypeScript + Tailwind CSS 4 + GSAP / `@gsap/react`.
  No HTML rewrite, iframe, injected page markup, or CDN script tags.
- `/resume`: the archived Editorial Fold portfolio at
  `app/(legacy)/resume/page.tsx`. Its original markup and behavior are preserved.
- Separate root layouts isolate CSS/fonts: `app/(arcade)/layout.tsx` loads local
  Archivo / Geist Mono; `app/(legacy)/layout.tsx` retains Syne / JetBrains Mono
  and `app/globals.css`. Do not add a shared `app/layout.tsx` that blends them.

## Arcade architecture

- `components/arcade/sections.tsx`: server-rendered header, wordmark, metadata,
  tickers, statement and footer. Copy/data live in `lib/arcade/content.ts`.
- `components/arcade/arcade-shell.tsx`: client motion boundary using `useGSAP`,
  ScrollTrigger, scoped selectors, and automatic GSAP teardown. The server
  sections are passed as children; never replace them with raw HTML strings.
- `components/arcade/live-readouts.tsx`: clocks and refillable matcha indicator.
- `components/arcade/game-console.tsx`: React game shell and stable per-mount
  random selection. Strict Mode's effect replay must not deal a second game.
- `lib/arcade/game-engine.js`: ref-scoped canvas/3D-keypad driver preserving all
  ten game algorithms. Only this imperative island owns its generated game
  surface children. It must not mutate unrelated page markup.
- `lib/arcade/lifetime.ts`: owns frames, timers and event listeners, cleaned on
  unmount. Observers and game GSAP contexts are also explicitly disposed.
- `lib/arcade/storage.ts`: guarded `wr.*` storage and tested random selection.
  Preserve existing score/unlock keys; no game selector at any screen width.
  Avoid the previous deal when storage works; cipher joins only after unlock.

## Design and responsive rules

- Supplied visual reference: `wirunrom-arcade.zip`; tokens recorded in DESIGN.md.
  Paper `#e7e5de`, secondary paper `#dcd9d0`, ink `#0c0c0e`, mute `#6d6a63`,
  signal blue `#2b55ff`. Fonts remain local in `public/arcade/fonts/` and are
  loaded with `next/font/local`.
- Use Tailwind utilities in JSX for page layout, spacing, typography and
  responsive composition. `app/(arcade)/arcade.css` holds tokens and necessary
  3D keypad/material/state rules. Do not rebuild the page as standalone HTML.
- Preserve sticky clock/nav, deck, WIRUNROM wordmark/negative pointer window,
  scroll tickers, manifesto, footer name, Konami and matcha easter eggs.
- Stage height is `clamp(220px,38svh,420px)` with a `minmax(0,1fr)` track.
  Pixel canvas is absolute; `pxSize()` measures the independent stage, never
  the reverse. A guarded ResizeObserver updates actual size changes.
- Bound 3D deck width by available width and viewport height. Ship It's stage
  uses automatic height so its shop cannot overlap WIRUNROM. Keep the wordmark
  in normal flow. Terminal input is 16px on mobile to avoid focus zoom.
- Compact UI (≤760px): hide hero diagnostics and crosshair; keep title/score
  together, a short guide and native `how to play` disclosure. Full help remains
  available for all ten games. Suppress idle start prompts, but keep live timers
  and results visible through the shared `setReadout()` path. Exclude summary
  keyboard events from game input. Matcha lives in the footer on every size.
- Respect reduced motion. GSAP is bundled from npm; useGSAP/context owns page
  animations and every timer/listener/frame/observer must have cleanup.

## Verify

- `npm run dev` → http://localhost:3000
- `npm run typecheck`, `npm run build`, `node --test tests/arcade.test.mjs`.
- Check `/` and `/resume`, hydrated game input, GSAP/scroll, random refresh,
  unlock/storage, local fonts, and absence of hydration/console errors.
- Force every game, including cipher, through a temporary React test page that
  passes GameConsole's `gameIndex` prop. Test 320/390/825/1440px and landscape
  844×390, plus desktop → mobile resize. Assert active-game bounds, canvas
  dimensions, and wordmark/shop overlap. Remove temporary routes before build.

# Archived portfolio (`/resume`)

Single-page **interactive editorial portfolio** for Wirunrom "Heart"
Wankasemsan. It uses one visual system—Editorial Fold / Paper + Signal—preserved at `/resume`.

Stack: **Next.js 16 (App Router, Turbopack) · React 19 · TypeScript**. See
`AGENTS.md` — this Next.js version has breaking changes; check
`node_modules/next/dist/docs/` before using unfamiliar APIs.

## Run & verify

- `npm run dev` → http://localhost:3000 (`.Codex/launch.json` is set up for the
  preview tool).
- `npx tsc --noEmit` to typecheck, `npx next build` for a full check.

## Architecture

- `app/(legacy)/resume/page.tsx` — **server** component; composes the board only.
- `components/bento/` — one file per piece, split along the **client/server line**:
  - Static markup → `cells.tsx` (server): Hero / Featured / Finjar / Education /
    Experience / Work / Capabilities / Contact.
  - Interactive islands (`"use client"`):
    `modal-provider`, `read-more-button`, `resume-link`,
    `bento-board` (entrance reveal).
  - `bento-board` and `modal-provider` are client wrappers that take the
    server-rendered cells as `children` — that's why `page.tsx` stays a server
    component.
  - The case-study modal is shared via a tiny context (`useCaseStudy`), so a
    button inside a server cell can open it without lifting state to the page.
- `lib/bento-content.ts` — all copy/data (experience, projects, stack, case
  studies). **Edit content here, not in the cell markup.**

## Styling

- All styles live in `app/globals.css` (design tokens + bento layout). The page
  does **not** use Tailwind/shadcn — those scaffold files are unused.
- **Palette = Paper + Signal.** Charcoal and warm ivory carry content; fixed
  signal orange belongs to WebGPU energy, active links, and interaction—not
  large background fills. The public UI is locked to this one dark material
  system; there is no theme or palette control.
- Keep the single-page layout/material overrides in the `EDITORIAL FOLD — PAPER
  + SIGNAL` block at the end of `globals.css`. The desktop grid collapses to one
  column on mobile.

## Gotcha — fonts

`next/font` (Syne + JetBrains Mono, in `app/(legacy)/layout.tsx`) injects `--font-syne` /
`--font-jbmono` on **`<body>`**. The composed stacks
(`--font-display` / `--font-body` / `--font-mono`) **must** be declared inside
`body.bento`, **not `:root`** — `:root` is `<html>`, above `<body>`, so it can't
see those vars and `font-family` silently falls back to serif (Times).

## Design Lab WebGPU effect

- `HeroCell` stays server-rendered and embeds `hero-signal-canvas.tsx` as a
  client island. Keep the accessible `WIRUNROM` wordmark as DOM text; the canvas
  is decorative and `aria-hidden`.
- The shader lives in `components/bento/hero-signal.wgsl` and procedurally draws
  the folded WIRUNROM treatment. Turbopack loads WGSL
  through the rule in `next.config.ts`; validate shader changes separately with
  `npx vgpu check ... --require-validation` because `next build` does not compile
  WGSL against a device.
- `fold-signal-canvas.tsx` is mounted in Featured, Finjar, Experience, Projects,
  Stack, and Contact. The shared shader renders six content-specific narratives:
  order throughput, forecast horizons, career timelines, project branches,
  system layers, and converging contact routes.
- `system-map-background-canvas.tsx` renders the Living System Map: seven quiet
  architecture routes whose signal packets reroute toward the hovered or
  keyboard-focused cell. All canvases use `vgpu-runtime.ts` so one
  device backs the page, pre-warm pipelines, cap DPR, adapt FPS by input type
  (native-refresh hero/background and 60fps cells on desktop; 30–45fps on touch
  devices regardless of viewport width), pause offscreen or hidden, and render static frames for
  reduced motion. Every canvas is
  decorative and the DOM remains the accessible/no-WebGPU experience.


<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
