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
- `components/arcade/project-notes.tsx` mounts the ZIP-derived work section.
  `components/arcade/project-desk.tsx` implements the 1200×700 CSS-3D desk from
  `wirunrom-desk.zip` as typed React Box/Panel/Cylinder primitives. The camera
  tweens a ref via scoped GSAP; pointer tilt has its own tween target and cannot
  overwrite a camera flight. Ignore repeated opens/closes and unchanged resize
  notifications; only first entry centers the scene. Navigation reads the
  synchronous selection ref. Resize observers and tweens clean up on unmount.
  Desk entrance moves a preserve-3d wrapper in Z (800ms), while a separate
  flat paper veil fades out (650ms). Never animate opacity/filter on a
  preserve-3d ancestor: it flattens the scene until opacity reaches 1. Pointer
  tilt waits for entrance; camera fit is cached by ResizeObserver. Focus finishes it;
  reduced motion skips it. No idle tip text is displayed. Selecting a work flies the camera to it and opens an inline right detail
  panel (bottom sheet ≤820px), with Escape, arrow-key navigation and focus
  restoration. Desk title bar and idle breadcrumb are omitted. The project
  index is visually hidden except during keyboard focus; scene lettering
  and screens are decorative schematics.
  Current copy/notes/optional live links stay in `lib/arcade/projects.ts`;
  detail panels intentionally contain no real images until a new image treatment
  is supplied. Media data can remain stored but must not render in this panel.
  Finjar is laptop + phone, POS Heart a monitor; barqrcode is the barcode-marked
  library folder, followed by Online Ordering (company work, description only)
  with sample files 05/06 hidden. `PROJECT_NOTES` filters `hidden` entries
  before rendering, counting or navigation; retain their source data for later. Project metadata may provide
  a status/category; preserve accurate library labels and accessible link names.
  `app/(arcade)/desk.css` scopes the supplied visual rules to `.reference-desk`.
  The lamp toggles `html.arcade-dark`, persist `wr.light`,
  and default to Light on first visit. The theme covers the arcade
  only; unmount removes its root class. `arcade-theme-change` refreshes canvas
  palette reads in the game engine. Keep the legacy /resume styles isolated.
  Superseded workbench/modal components and their CSS have been removed; use
  only the current CSS-3D desk and inline dossier.
- `components/arcade/live-readouts.tsx`: clocks and refillable matcha indicator.
- `components/arcade/game-console.tsx`: React game shell and stable per-mount
  random selection. Strict Mode's effect replay must not deal a second game.
- `lib/arcade/game-engine.ts`: ref-scoped canvas/3D-keypad driver preserving all
  ten game algorithms under strict TypeScript. `lib/arcade/game-types.ts`
  defines the discriminated deck/pixel/terminal contracts, coordinates,
  matrices, pieces, upgrades and saved clicker state. Each game initializes
  typed per-mount state; the typed registry checks every game implementation.
  Event adapters narrow DOM targets before use; required element/context
  lookups fail explicitly. Keep algorithms and storage keys stable. No `any`,
  `@ts-ignore`, `@ts-nocheck` or blanket type assertions to bypass checking.
  Only this imperative island owns its generated game
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

- `npm run dev` → http://localhost:3000 (`.claude/launch.json` is set up for the
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

  Device screen previews live in `components/arcade/project-screen-mocks.tsx`,
  adapted from `wirunrom-desk-fix-mock.zip` as decorative native JSX with sample
  data. Keep their 2× layout scoped to `.reference-desk`; do not inject HTML.

- barqrcode folder QR and Code 128 are real PNGs generated by the npm library.
  Run `npm run generate:project-codes` to regenerate and round-trip decode both.
  The QR and primary open link target npm; keep black/white quiet zones intact.
  Generation stays outside the client bundle; assets live in `public/projects/`.

- Lamp changes interpolate root palette tokens and `--lamp-power` (1100ms off /
  1350ms on), fading the warm desk light and revealing screen glow. Repeated
  toggles interrupt from current colors; reduced motion switches immediately.
  Dispose the lighting tween/root inline tokens on unmount; do not fade a 3D ancestor.

- The dossier footer has two rows: all external links above, then prev/next/close. Link metadata
  includes a `kind` (web/github/npm) mapped to Tabler icons plus short visible
  labels. Render every link there; do not place secondary resources in the body.

- The front-right spaces formerly used by sample 05/06 now hold a decorative
  keyboard and layered 3D mouse from `wirunrom-desk-keyboard-mouse.zip`. They
  have no project controls and do not affect counts/navigation. Preserve mouse
  depth and existing lamp theme behavior; samples remain hidden in the data.

- The enlarged POS monitor/base/neck and clickable sticky note follow
  `wirunrom-desk-screen-note.zip`. `DESK_NOTE` in `lib/arcade/projects.ts`
  owns the pinned message and short desk text; it is owner-authored content,
  not a visitor submission form. Selection -1 opens its own camera/dossier
  without adding to project counts. Prev/next leave the note for last/first
  project; Escape/backdrop restore focus as for projects.

- Unselected desk works are dimmed through local material colors (55% ink),
  not group opacity/filter. Their 3D groups stay opaque and preserve depth so
  upright monitors remain visible. Opacity is allowed only on flat printed
  images/tickets/notes without 3D descendants.

- Compact portrait desks use a short idle scene (340–500px); only opening a
  work expands it to 600–960px with a 65% bottom sheet and no extra side inset. Landscape ≤820px uses a
  right-side sheet and matching camera offset. The body scrolls independently
  with overscroll containment; changing work/note resets its scroll position.

- Compact first-open scrolls smoothly to the expanded scene (instant for reduced
  motion). ResizeObserver retargets an in-flight camera from its current pose
  through an Effect Event; never snap to the end when the sheet changes height.

- `DESK_NOTE` now serves as the “say hello” contact note, linking to existing
  GitHub, mail and LinkedIn destinations from the archived contact section.
  Contact icons share the footer link system; mailto uses the default context.

- Portrait mobile dossiers are viewport-fixed drawers outside the perspective/overflow scene. Preserve page-gutter side insets and a safe bottom inset. Keep content and expanded scene alive through the downward exit; the camera returns immediately alongside the sheet, compensating for the upcoming idle fit before the scene height collapses. Reopening cancels the pending close; reduced motion closes immediately.
