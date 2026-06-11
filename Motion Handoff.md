# WIRUNROM Bento — Motion Handoff

Drop-in spec for the 6 motion layers chosen from the study. No animation library —
pure CSS + IntersectionObserver + pointer events. Built for Next.js but framework-agnostic.

**Layers shipped:** Entrance · Cursor spotlight + tilt · Ambient drift · Inner cascade · Cursor parallax · Mono decode
**Dropped:** Type settle, Hover lift, Live pulse

---

## Shared tokens

```css
:root{
  --e: cubic-bezier(0.16, 1, 0.3, 1);   /* the easing used everywhere */
}
/* each panel exposes its own accent so spotlight/drift pick it up */
.panel{ --accent: #E0851E; }            /* set per-panel: orange / cyan / purple… */
```

Give every panel `position: relative; overflow: hidden; isolation: isolate; will-change: transform;`
and drop one `<span class="blob"></span>` as its first child (used by drift + parallax).

```css
.panel .blob{
  position:absolute; width:60%; height:60%; left:-10%; top:-10%; z-index:-1; pointer-events:none;
  background:radial-gradient(circle, color-mix(in oklab, var(--accent) 26%, transparent), transparent 70%);
  filter:blur(40px);
}
```

---

## 1 · Entrance (staggered reveal) — one-shot on enter viewport

```css
.panel{ opacity:0; transform:translateY(22px) scale(.985); filter:blur(3px); }
.panel.in{
  opacity:1; transform:none; filter:none;
  transition:opacity .85s var(--e), transform .85s var(--e), filter .85s var(--e);
}
```

```js
const panels = [...document.querySelectorAll('.panel')];
const io = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (!en.isIntersecting) return;
    const i = panels.indexOf(en.target);
    setTimeout(() => en.target.classList.add('in'), 90 + i * 95); // stagger
    io.unobserve(en.target);
  });
}, { threshold: 0.15 });
panels.forEach(p => io.observe(p));
```

---

## 2 · Cursor spotlight + micro-tilt — continuous, per panel

```css
.panel::after{                 /* the glow */
  content:""; position:absolute; inset:0; z-index:-1; pointer-events:none;
  opacity:0; transition:opacity .45s var(--e);
  background:radial-gradient(460px circle at var(--mx,50%) var(--my,50%),
            color-mix(in oklab, var(--accent) 16%, transparent), transparent 60%);
}
.panel:hover::after{ opacity:1; }
.panel{ transition:transform .5s var(--e); } /* tilt easing on leave */
```

```js
panels.forEach((cell) => {
  cell.addEventListener('pointermove', (e) => {
    const r = cell.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top)  / r.height;
    cell.style.setProperty('--mx', x * 100 + '%');
    cell.style.setProperty('--my', y * 100 + '%');
    cell.style.transform =
      `perspective(900px) rotateX(${(0.5 - y) * 2.4}deg) rotateY(${(x - 0.5) * 2.4}deg)`;
  });
  cell.addEventListener('pointerleave', () => { cell.style.transform = ''; });
});
```

> Keep tilt at **±2.4° max**. More than ~3° reads as a toy.

---

## 3 · Ambient drift — continuous, decorative

```css
.panel .blob{ animation:drift var(--dur, 18s) ease-in-out infinite; }
@keyframes drift{
  0%   { transform:translate(0,0)      scale(1);    }
  33%  { transform:translate(40%,30%)  scale(1.15); }
  66%  { transform:translate(15%,55%)  scale(.95);  }
  100% { transform:translate(0,0)      scale(1);    }
}
```

Set a different `--dur` per panel (16s / 18s / 19s / 20s / 21s / 22s) so they never sync up.
Keep blur high + opacity low — strong drift is nauseating. Hero/featured only is plenty if you want it minimal.

---

## 4 · Inner cascade — one-shot, fires after the panel reveals

Tag the direct content blocks inside each panel with `.st` and a `--i` index.

```css
.panel .st{ opacity:0; transform:translateY(12px); }
.panel.in .st{
  opacity:1; transform:none;
  transition:opacity .55s var(--e), transform .55s var(--e);
  transition-delay:calc(var(--i,0) * 60ms + 200ms);   /* after panel (.in) lands */
}
```

```js
panels.forEach((cell) => {
  const host = cell.querySelector('[data-cascade-host]') || cell;
  [...host.children]
    .filter(k => !k.classList.contains('blob'))
    .forEach((k, i) => { k.classList.add('st'); k.style.setProperty('--i', i); });
});
```

---

## 5 · Cursor parallax — continuous, grid-wide depth

Blobs drift toward the pointer relative to the **grid** center, giving layered depth.

```css
.panel .blob{ transition:translate .5s var(--e); }
```

```js
const grid  = document.querySelector('.bento');     // the grid wrapper
const blobs = [...document.querySelectorAll('.panel .blob')];
grid.addEventListener('pointermove', (e) => {
  const r  = grid.getBoundingClientRect();
  const gx = ((e.clientX - r.left) / r.width  - 0.5) * 2;  // -1..1
  const gy = ((e.clientY - r.top)  / r.height - 0.5) * 2;
  blobs.forEach(b => { b.style.translate = `${gx * 24}px ${gy * 24}px`; }); // ±24px
});
grid.addEventListener('pointerleave', () => blobs.forEach(b => (b.style.translate = '')));
```

> Composes with #3: drift animates `transform`, parallax sets `translate` — separate properties, no conflict.

---

## 6 · Mono decode — one-shot, on the monospace labels

```js
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·—/@✶';
const decTargets = [...document.querySelectorAll('[data-decode]')];
decTargets.forEach(el => (el.dataset.txt = el.textContent));   // stash real text

function decode(el){
  const final = el.dataset.txt; let frame = 0;
  const id = setInterval(() => {
    frame++;
    el.textContent = final.split('').map((c, i) => {
      if (c === ' ') return ' ';
      if (i < frame / 2) return c;                              // resolve left→right
      return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
    }).join('');
    if (frame / 2 >= final.length) { clearInterval(id); el.textContent = final; }
  }, 38);
}
// fire staggered when the grid enters, or right after entrance:
decTargets.forEach((el, i) => setTimeout(() => decode(el), 160 + i * 90));
```

Mark labels in markup with `data-decode`. Run once.

---

## Accessibility — REQUIRED gate

```css
@media (prefers-reduced-motion: reduce){
  .panel{ opacity:1 !important; transform:none !important; filter:none !important; }
  .panel .st{ opacity:1 !important; transform:none !important; }
  .panel .blob{ animation:none !important; translate:none !important; }
}
```

In JS, short-circuit the continuous + decode effects:

```js
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
// entrance: if (RM) panels.forEach(p => p.classList.add('in'));  // skip stagger
// decode:   if (RM) decTargets.forEach(el => el.textContent = el.dataset.txt);
// skip the pointermove listeners for tilt/parallax when RM is true
```

---

## Implementation notes

- **One-shot** (run on enter viewport, then stop): Entrance, Inner cascade, Mono decode.
- **Continuous**: Cursor spotlight + tilt, Ambient drift, Cursor parallax.
- Wrap pointermove writes in `requestAnimationFrame` if you want it buttery on lower-end devices.
- On touch devices, consider skipping tilt + parallax entirely (no real pointer) — they add nothing without a cursor.
- `will-change: transform` on panels; don't put it on everything — it costs memory.
- Recommended pairing in production: all 6 compose cleanly; parallax + spotlight + drift is the "alive" core, entrance + cascade is the load story, decode is the dev-portfolio flourish.
