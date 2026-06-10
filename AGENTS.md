# WIRUNROM — portfolio

Single-page **bento portfolio** for Wirunrom "Heart" Wankasemsan, recreating a
Codex Design handoff (the "Spatial Typography" system). One screen, no routing.

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
  - Interactive islands (`"use client"`): `theme-controls`, `clock-cell`,
    `roaming-cat`, `modal-provider`, `read-more-button`, `resume-link`,
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
- **Theme = OKLCH hue engine.** Everything derives from `--base-h` (set on
  `<body>`). Each cell offsets it with `--h-off`. Shuffle rotates `--base-h`;
  `data-theme="paper"` on `<body>` flips to light. `theme-controls.tsx` owns this
  state and writes it to `<body>` (persisted to localStorage); CSS does the rest.
- Brutalist: sharp corners (0 radius), hairline borders, no photographic imagery.

## Gotcha — fonts

`next/font` (Syne + JetBrains Mono, in `app/layout.tsx`) injects `--font-syne` /
`--font-jbmono` on **`<body>`**. The composed stacks
(`--font-display` / `--font-body` / `--font-mono`) **must** be declared inside
`body.bento`, **not `:root`** — `:root` is `<html>`, above `<body>`, so it can't
see those vars and `font-family` silently falls back to serif (Times).
