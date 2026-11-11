// Authored menu symbols from wirunrom-desk-cat-window.zip; baked outside the client bundle.
import sharp from "sharp"
import { mkdir, writeFile } from "node:fs/promises"
const icons = [
  '<svg viewBox="0 0 48 36" fill="none" stroke="var(--ink)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><path d="M8 18 h32 a16 12 0 0 1 -32 0 z" fill="var(--paper)"/><path d="M18 30 h12"/><path d="M11 18 q13 -9 26 0" fill="var(--paper)"/><circle cx="29" cy="14" r="4.5" fill="var(--paper)"/><circle cx="29" cy="14" r="1.8" fill="var(--signal)" stroke="none"/><path d="M15 15 l3 -3 m3 2 l2 -4" stroke="var(--signal)"/></svg>',
  '<svg viewBox="0 0 48 36" fill="none" stroke="var(--ink)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><ellipse cx="24" cy="24" rx="19" ry="6" fill="var(--paper)"/><path d="M12 22 q4 -11 12 -11 q8 0 12 11" fill="var(--paper)"/><path d="M26 18 h10 l-2 4 h-8 z" fill="var(--signal)"/></svg>',
  '<svg viewBox="0 0 48 36" fill="none" stroke="var(--ink)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><rect x="4" y="20" width="40" height="11" rx="2" fill="var(--paper)"/><path d="M8 20 q6 -9 12 0" fill="var(--paper)"/><path d="M24 20 h10 a5 4 0 0 1 -10 0 z" fill="var(--signal)"/><rect x="37" y="12" width="5" height="8" fill="var(--paper)"/></svg>',
  '<svg viewBox="0 0 48 36" fill="none" stroke="var(--ink)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><ellipse cx="24" cy="25" rx="19" ry="6" fill="var(--paper)"/><path d="M11 23 q4 -6 8 0 t8 0 t8 0" /><path d="M13 19 q4 -6 8 0 t8 0 t8 0"/><path d="M31 15 q4 -3 6 1" stroke="var(--signal)"/></svg>',
  '<svg viewBox="0 0 48 36" fill="none" stroke="var(--ink)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><path d="M15 6 h18 l-3 26 h-12 z" fill="var(--ink)"/><path d="M17 10 h14" stroke="var(--paper)"/><path d="M28 2 l-3 10" /></svg>',
  '<svg viewBox="0 0 48 36" fill="none" stroke="var(--ink)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><path d="M15 6 h18 l-3 26 h-12 z" fill="var(--paper)"/><path d="M16 14 h16 l-2 18 h-12 z" fill="var(--signal)" stroke="none"/><path d="M15 6 h18 l-3 26 h-12 z"/><path d="M28 2 l-3 10"/></svg>',
  '<svg viewBox="0 0 48 36" fill="none" stroke="var(--ink)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><rect x="18" y="9" width="12" height="24" rx="3" fill="var(--paper)"/><rect x="21" y="4" width="6" height="5" fill="var(--signal)"/><path d="M18 18 h12" stroke="var(--signal)"/></svg>',
  '<svg viewBox="0 0 48 36" fill="none" stroke="var(--ink)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><rect x="16" y="6" width="16" height="26" rx="2" fill="var(--signal)"/><path d="M16 11 h16 M16 27 h16" stroke="var(--paper)"/></svg>',
  '<svg viewBox="0 0 48 36" fill="none" stroke="var(--ink)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><rect x="9" y="8" width="22" height="22" rx="2" fill="var(--paper)"/><ellipse cx="31" cy="19" rx="5" ry="11" fill="var(--paper)"/><ellipse cx="31" cy="19" rx="1.5" ry="3"/></svg>',
  '<svg viewBox="0 0 48 36" fill="none" stroke="var(--ink)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><path d="M14 10 h16 l3 6 v16 h-22 v-16 z" fill="var(--paper)"/><rect x="17" y="4" width="8" height="6" fill="var(--signal)"/><path d="M14 20 h19" stroke="var(--signal)"/></svg>',
  '<svg viewBox="0 0 48 36" fill="none" stroke="var(--ink)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><path d="M10 30 v-14 a6 6 0 0 1 4 -10 h20 a6 6 0 0 1 4 10 v14 z" fill="var(--paper)"/><path d="M15 14 h18 v12 h-18 z" fill="var(--signal)" stroke="none"/></svg>',
  '<svg viewBox="0 0 48 36" fill="none" stroke="var(--ink)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><path d="M13 6 h22 l-2 4 l2 22 h-22 l2 -22 z" fill="var(--paper)"/><circle cx="24" cy="20" r="5" fill="var(--signal)"/><path d="M13 10 h22"/></svg>',
]
const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(
  (v) => (v + 0.5) / 16
)
const palettes = {
  light: {
    ink: [12, 12, 14],
    paper: [231, 229, 222],
    secondary: [220, 217, 208],
    signal: [43, 85, 255],
  },
  dark: {
    ink: [231, 229, 222],
    paper: [15, 15, 17],
    secondary: [25, 25, 28],
    signal: [77, 111, 255],
  },
}
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t))
const dir = new URL("../public/projects/menu/", import.meta.url)
await mkdir(dir, { recursive: true })
for (let k = 0; k < icons.length; k++) {
  const svg = icons[k]
    .replaceAll("var(--ink)", "#000")
    .replaceAll("var(--signal)", "#00f")
    .replaceAll("var(--paper)", "#fff")
    .replace(
      "<svg ",
      '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="24" '
    )
    .replace('stroke-width="2"', 'stroke-width="1.5"')
  const { data } = await sharp(Buffer.from(svg))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  for (const [theme, p] of Object.entries(palettes)) {
    const out = Buffer.alloc(32 * 22 * 4),
      sigL = mix(p.signal, p.paper, 0.55),
      sigD = mix(p.signal, p.ink, 0.45)
    for (let y = 0; y < 22; y++)
      for (let x = 0; x < 32; x++) {
        const i = ((y + 1) * 32 + x) * 4,
          o = (y * 32 + x) * 4,
          th = bayer[(y & 3) * 4 + (x & 3)],
          lite = 1 - y / 22
        const c =
          data[i + 3] < 128
            ? 0.25 + 0.35 * lite > th
              ? p.secondary
              : mix(p.secondary, p.ink, 0.12)
            : data[i + 2] > 160 && data[i] < 120
              ? lite * 0.9 > th
                ? sigL
                : lite * 1.8 > th
                  ? p.signal
                  : sigD
              : data[i] > 150
                ? 0.35 + 0.65 * lite > th
                  ? p.paper
                  : p.secondary
                : p.ink
        out[o] = c[0]
        out[o + 1] = c[1]
        out[o + 2] = c[2]
        out[o + 3] = 255
      }
    await writeFile(
      new URL(`${k}-${theme}.png`, dir),
      await sharp(out, { raw: { width: 32, height: 22, channels: 4 } })
        .png()
        .toBuffer()
    )
  }
}
console.log("Generated 12 menu illustrations in both desk palettes.")
