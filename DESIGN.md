---
name: WIRUNROM Signal File
description: Paper, ink, signal blue, and a tactile ten-cartridge arcade.
colors:
  paper: "#e7e5de"
  paper-2: "#dcd9d0"
  ink: "#0c0c0e"
  mute: "#6d6a63"
  signal: "#2b55ff"
  on-signal: "#fff"
  inverse-mute: "#8f8c84"
typography:
  display:
    fontFamily: '"Archivo", "Helvetica Neue", Arial, sans-serif'
    fontWeight: 900
    lineHeight: 0.76
    letterSpacing: "-.035em"
    fontVariation: '"wdth" 112, "wght" 900'
  headline:
    fontFamily: '"Archivo", "Helvetica Neue", Arial, sans-serif'
    fontSize: "clamp(34px, 6.2vw, 96px)"
    lineHeight: 0.92
    letterSpacing: "-.02em"
    fontVariation: '"wdth" 62, "wght" 700'
  title:
    fontFamily: '"Archivo", "Helvetica Neue", Arial, sans-serif'
    fontSize: "clamp(18px, 2.2vw, 30px)"
    lineHeight: 1.02
    letterSpacing: "-.01em"
    fontVariation: '"wdth" 62, "wght" 500'
  body:
    fontFamily: '"Geist Mono", ui-monospace, Menlo, monospace'
    fontSize: "12px"
    lineHeight: 1.35
  label:
    fontFamily: '"Geist Mono", ui-monospace, Menlo, monospace'
    fontSize: "11px"
    letterSpacing: ".02em"
rounded:
  key: "6px"
spacing:
  tight: "2px"
  small: "8px"
  deck: "10px"
  grid: "12px"
  gutter: "16px"
  gutter-wide: "28px"
components:
  key:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.key}"
  key-lit:
    backgroundColor: "{colors.signal}"
    textColor: "{colors.on-signal}"
    rounded: "{rounded.key}"
  terminal:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    padding: "14px 16px"
    width: "min(100%, 640px)"
  terminal-submit:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    padding: "4px 10px"
---

# Design System: WIRUNROM Signal File

## Overview

**Creative North Star: "Signal File"**

The shipped arcade describes itself as a raw, dense signal file: warm paper, ink type, mono readouts, one electric accent, and a monumental name. The game deck gives this otherwise ruled editorial document a physical, playable center.

Visual authority is the supplied `wirunrom-arcade.zip`. The shipped `/` is now a server-rendered Next.js/React page in `app/(arcade)/page.tsx`, with Tailwind 4 utilities in `components/arcade/sections.tsx` and state/material CSS in `app/(arcade)/arcade.css`. GSAP and ScrollTrigger are installed dependencies, scoped through `useGSAP`; there is no HTML rewrite or CDN script. The archived React portfolio at `/resume` retains its separate Editorial Fold / Paper + Signal system in `app/globals.css`; these tokens do not govern it.

**Key Characteristics:**

- Paper fields and ink rules.
- Variable Archivo display against Geist Mono readouts.
- Physical game keys, fitted wordmarks, and inverted regions.

## Colors

### Primary

- **Signal blue:** game activation, cursor/crosshair, focus outlines, selected game states, and inline emphasis.

### Neutral

- **Paper:** page ground and key faces.
- **Secondary paper:** hovered cartridges and recessed or inactive key faces.
- **Ink:** text, rules, physical key sides, selected cartridges, loader, and footer.
- **Muted ink:** secondary readouts and locked cartridges.
- **On-signal:** text on illuminated blue keys.
- **Inverse muted ink:** secondary text on dark material.

**The Signal Rule.** Keep the supplied blue as the arcade's shared interaction accent; retain ink/paper inversions for selected cartridges and dark sections.

The existing negative-mode easter egg reverses paper and ink, with its own secondary surfaces. It is an implemented state, not an additional theme selector.

## Typography

Archivo and Geist Mono are bundled with `next/font/local` from `public/arcade/fonts/`. Their fallback stacks are recorded above. The wordmark uses runtime width fitting, not its temporary CSS initialization size. Footer fitting uses a wider Archivo axis (125), line height (.74), and tracking (-.045em).

The hierarchy is deliberately nonuniform: fitted display name; fluid manifesto headline; fluid two-line introductory title; compact mono body and lowercase labels. Large ticker text uses Archivo width 62, weight 800, and `clamp(34px, 6.4vw, 92px)`. Game numbers scale in container-width units and reduce with digit count.

**The Fitted Name Rule.** Preserve the runtime measurement of the hero, negative duplicate, and footer names rather than substituting a fixed heading size.

## Layout

Full-width fields use safe-area-aware side gutters: the gutter token grows to gutter-wide at a minimum viewport width of 960px. Twelve columns with the grid gap organize hero metadata and manifesto; four columns organize the sticky bar and footer. The hero has a viewport-based minimum height. The game stage has a bounded height of `clamp(220px, 38svh, 420px)` and a shrinking `minmax(0, 1fr)` track. Pixel canvases are absolutely positioned; their backing dimensions are measured from that stage and refreshed by a guarded ResizeObserver. The canvas must never determine its parent size. The 3D deck is capped by both available width and `clamp(200px, 36svh, 400px)`. Ship It uses an automatic-height stage for its upgrade panel. The WIRUNROM section stays in normal document flow below the game, with no overlap. Terminal fields use 16px type on mobile to avoid iOS focus zoom.

At 760px and below, the bar and footer become two columns, hero details simplify, and manifesto and lower hero content stack. Every screen size shows one randomly dealt game per page load, with no cartridge strip or game selector. The deck is capped at 1100px, terminal at 640px, and ship-it side panel at 360px; the side panel stacks on small screens. These are artifact patterns, not a general dashboard grid.

## Elevation & Depth

Most content is flat, separated by ink rules. The game deck uses preserved 3D geometry: perspective (1400px), an initial rotation (52 degrees on X and -8 degrees on Z), layered ink sides, raised key faces, and state-dependent Z translation. Its ambient shadow is a blurred radial gradient, not an offset box shadow. Fine grain overlays the page at opacity (.05).

Key transitions use transform (.14s, `cubic-bezier(.22,1,.36,1)`) and background (.2s). The React motion boundary respects `prefers-reduced-motion`; `useGSAP` reverts timelines and ScrollTriggers on unmount. The game instance separately disposes its frames, timers, listeners, observers and GSAP context. Page animations use the installed GSAP package.

## Shapes

Straight edges and thin rules define navigation, terminal, game canvas, and page sections. Rounded corners belong to physical key faces and sides, using the key radius. Key faces have an ink border (1.5px); most other rules and container borders use 1px. The negative name window is clipped inside the duplicate wordmark.

## Components

### Random game console

The HUD and game stage are the only console regions. Each page load chooses a random unlocked game and avoids the previous deal when storage is available. Winning or entering Konami adds the secret cipher to future deals. No game-selection controls appear at any breakpoint.

### Compact game HUD

At 760px and below, hero diagnostics are hidden and the header brand is shortened. Game title and score share the first row. A short instruction sits beside a native `how to play` disclosure with a 44px summary target; the full game-specific instructions expand inline. Idle start prompts are hidden while live timers, scores and results remain readable. The crosshair and custom cursor are active only for fine pointers above 760px, including after resize. Matcha is a footer interaction on every screen size. WIRUNROM remains in normal flow.

### Game keys

Square physical buttons with layered sides and rounded faces. Active/lit/success states may turn blue with white type; recessed states use secondary paper. Focus moves to an outline on the face. Preserve game-specific raised, depressed, flagged, and selected states.

### Terminal and field

A paper-and-ink bordered container with a log and ruled form row. The answer field is transparent and lowercase with a blue caret; its submit button inverts ink/paper. The field uses the shared visible focus outline and grows to 16px text on mobile.

### Navigation

Sticky paper bar with compact lowercase mono links; hover inverts ink/paper. Clock and status readouts hide at the small breakpoint. Footer links invert in the opposite direction against the ink field.

### Tickers and wordmark

Ruled overflow-clipped text strips alternate display type and mono readouts, including an inverted strip. Keep the oversized hero wordmark, pointer-controlled negative window, and fitted footer as supplied.

## Do's and Don'ts

### Do:

- **Do** preserve the supplied arcade's design, copy, ten games, and easter eggs.
- **Do** retain local fonts, touch controls, reduced-motion behavior, and visible keyboard focus.
- **Do** keep the arcade and archived portfolio styles separate.

### Don't:

- **Don't** import the archived portfolio stylesheet into the arcade route group.
- **Don't** replace the supplied design with new cards, palettes, or display fonts.
- **Don't** propagate tiny key annotations as general body or form text.

The supplied 9px key annotations and decorative metadata remain artifact-specific. Form fields retain the shared keyboard focus outline; the standalone prototype’s missing focus affordance is not carried forward as a design rule.

## Project desk — supplied ZIP direction

Source: wirunrom-desk.zip. Native React CSS-3D primitives reproduce its 1200×700
plane, raised laptop/phone/monitor, cylindrical lamp/mug, books, two project folders, a keyboard/mouse and a contact sticky note. No iframe or standalone HTML. Camera transform order, home viewpoints,
fit and right-panel/mobile-bottom-sheet offsets follow the supplied reference.
Current project copy and sample flags stay authoritative; screen UIs are
schematic. Selection flies the camera and dims other objects; Escape/back closes,
arrow keys or panel controls browse works. A text index remains keyboard usable.

The lamp toggles light/dark arcade tokens and persists wr.light. First
visit defaults to Light. Dark paper #0f0f11, secondary #19191c, ink #e7e5de,
muted #8f8c84 and signal #4d6fff; screens glow, lamp glow disappears. Existing
local fonts remain. Canvas games reread theme colors on arcade-theme-change.
Reduced motion removes camera travel and CSS transitions. Styles are scoped
in desk.css; no legacy stylesheet imports or whole-document injected markup.

Detail panels currently show project information only, without screenshots.
Camera travel and pointer tilt use separate GSAP targets. Tilt is suspended
during camera flights and over controls; repeated selection/close requests
do not restart travel. Scene centering occurs only on initial entry, keeping
rapid previous/next navigation and exit stable.

The desk appears once on viewport entry via a separate preserve-3d wrapper
(800ms Z lift with a separate 650ms flat paper veil). Camera transforms and pointer tilt
remain independent. Keyboard focus completes reveal; reduced motion skips it.
Idle lamp-tip text is omitted.

Entrance rendering: keep opacity at 1 throughout the 3D tree. A separate flat
paper veil fades away while a preserve-3d wrapper rises 40px in desk space.
Opacity on a preserve-3d ancestor forces flattening and creates a depth pop
at completion. Pointer tilt waits for entrance; fit is measured only on resize.

The statement-to-desk handoff uses a short mono link aligned to the statement
column: “some of those things live on this desk.” A blue arrow grows into a
vertical guide on scroll. Reduced statement bottom spacing and removed desk
top margins keep the handoff compact. The original statement typography stays.

- Device screens use the revised `wirunrom-desk-fix-mock.zip` mockups: Finjar web/mobile balance, transactions and forecast; POS Heart sale toolbar, bill, categories and products. Native decorative JSX renders sample data at 2× inside clipped glass, using existing local fonts and light/dark tokens. Desk camera, dossier and lamp behavior remain independent.

- Lamp lighting applies to the whole arcade palette, including body, header, statement and footer. Default is Light unless a saved choice exists. GSAP interpolates root colors and lamp power for 1100ms off / 1350ms on; desk light contracts/fades as screens gain glow. Never fade the preserve-3d scene itself. Reduced motion changes immediately.
