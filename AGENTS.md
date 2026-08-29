# WIRUNROM — portfolio

Single-page **interactive editorial portfolio** for Wirunrom "Heart"
Wankasemsan. It uses one visual system—Editorial Fold / Paper + Signal—with no
routing or alternate concept modes.

Stack: **Next.js 16 (App Router, Turbopack) · React 19 · TypeScript**. See
`AGENTS.md` — this Next.js version has breaking changes; check
`node_modules/next/dist/docs/` before using unfamiliar APIs.

## Run & verify

- `npm run dev` → http://localhost:3000 (`.Codex/launch.json` is set up for the
  preview tool).
- `npx tsc --noEmit` to typecheck, `npx next build` for a full check.

## Architecture

- `app/page.tsx` — **server** component; composes the board only.
- `components/bento/` — one file per piece, split along the **client/server line**:
  - Static markup → `cells.tsx` (server): Hero / Featured / Now / Experience /
    Work / Capabilities / Contact.
  - Interactive islands (`"use client"`): `clock-cell`, `roaming-cat`,
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

`next/font` (Syne + JetBrains Mono, in `app/layout.tsx`) injects `--font-syne` /
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

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
