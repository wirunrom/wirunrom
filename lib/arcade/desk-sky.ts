function requiredContext(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d")
  if (!context) throw new Error("Window canvas unavailable")
  return context
}
// Tiny sky renderer adapted from wirunrom-desk-cat-window.zip.
export function makeDeskSky(cv: HTMLCanvasElement) {
  const ctx = requiredContext(cv)
  const W = cv.width,
    H = cv.height
  const img = ctx.createImageData(W, H),
    px = img.data
  const dayRGB = new Float32Array(W * H * 3),
    region = new Uint8Array(W * H)
  const base = new Float32Array(W * H),
    CW = W * 3,
    cloud = new Float32Array(CW * H)
  const BY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(
    (v) => (v + 0.5) / 16
  )
  const INK = [12, 12, 14],
    SIG = [43, 85, 255],
    PAP = [231, 229, 222]
  const NIGHT = { dark: INK, mid: SIG, light: PAP }
  const hash = (x: number, y: number) => {
    const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
    return s - Math.floor(s)
  }
  const sm = (a: number, b: number, x: number) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)
  }
  type Moon = ReturnType<typeof moonInfo>
  let st: {
    h: number
    s: number
    day: boolean
    bx: number
    by: number
    sunAlt: number
    m: Moon
    hillTop: number
  }
  let off = 0,
    last = 0
  let birds: { x: number; y: number; f: number }[] = []
  let meteor: { x: number; y: number; l: number } | null = null
  // cloud field, three windows wide so it can drift and wrap: a few flat, wide puffs (clusters of ellipses)
  const PUFFS: number[][] = []
  for (let k = 0; k < 6; k++) {
    const cx = (k + 0.3 * hash(k, 1)) * (CW / 6),
      cy = H * (0.12 + 0.3 * hash(k, 2)),
      w = 16 + 14 * hash(k, 3)
    PUFFS.push(
      [cx, cy, w, w * 0.28],
      [cx - w * 0.55, cy + 2, w * 0.6, w * 0.2],
      [cx + w * 0.5, cy + 1.5, w * 0.7, w * 0.22],
      [cx + w * 0.1, cy - w * 0.12, w * 0.45, w * 0.22]
    )
  }
  for (let y = 0; y < H; y++)
    for (let x = 0; x < CW; x++) {
      const yy = y / H
      let c = 0
      for (const [cx, cy, rx, ry] of PUFFS) {
        const dx = Math.min(Math.abs(x - cx), CW - Math.abs(x - cx)) / rx,
          dy = (y - cy) / ry
        c = Math.max(c, 1 - dx * dx - dy * dy)
      }
      cloud[y * CW + x] = sm(0, 0.35, c) * sm(0.7, 0.4, yy)
    }
  function moonAge() {
    const syn = 29.530588853
    return (
      ((((Date.now() - Date.UTC(2000, 0, 6, 18, 14)) / 86400000) % syn) + syn) %
      syn
    )
  }
  function moonInfo() {
    const age = moonAge(),
      lit = Math.round(
        ((1 - Math.cos((age / 29.530588853) * 2 * Math.PI)) / 2) * 100
      )
    const names = [
      "new moon",
      "waxing crescent",
      "first quarter",
      "waxing gibbous",
      "full moon",
      "waning gibbous",
      "last quarter",
      "waning crescent",
      "new moon",
    ]
    const name = names[Math.round((age / 29.530588853) * 8)]
    const toFull = Math.round((((14.765 - age) % 29.53) + 29.53) % 29.53)
    return { age, lit, name, toFull }
  }
  // static part of the picture for this minute: gradient, sun/moon, stars, hills
  // lamp on = daytime sky, lamp off = night sky (same rule as the window light on the desk);
  // the hour only places the sun / moon along the same 12h arc the desk light uses
  function prepare(h: number, day: boolean) {
    const p = ((((h - 6) % 12) + 12) % 12) / 12,
      arc = Math.sin(p * Math.PI)
    const sunAlt = day ? 0.08 + 0.92 * arc : -1
    const s = day ? sm(-0.2, 0.35, sunAlt) : 0,
      tw = day ? Math.exp(-((sunAlt / 0.16) ** 2)) : 0
    // same light model as placeLight(): az −1 (rise, light from the left) … +1 (set, from the right),
    // altitude 16°…74°. The sun / moon sits opposite the shadow direction, as high as the shadows are short.
    const az = -1 + 2 * p,
      altDeg = 16 + 58 * arc
    const bx = W / 2 + az * W * 0.4,
      by = H * (0.66 - ((altDeg - 16) / 58) * 0.54)
    const top = 0.05 + 0.6 * s,
      hor0 = 0.24 + 0.72 * s,
      hor = hor0 + (0.52 - hor0) * tw * 0.75
    const m = moonInfo(),
      ph = (m.age / 29.530588853) * 2 * Math.PI,
      R = 8
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const yy = y / H,
          xx = x / W
        let v = top + (hor - top) * yy ** 1.4
        const d = Math.hypot(x - bx, y - by)
        if (day) {
          v += 0.33 * Math.exp(-((d / 20) ** 2))
          if (d < 6.5) v = 1
        } else {
          if (s < 0.4 && yy < 0.72 && hash(x, y) < 0.0045) v = -1 - hash(y, x) // star (twinkles per frame)
          if (d < R) {
            // moon with tonight's real phase
            const dx = (x - bx) / R,
              dy = (y - by) / R,
              edge = Math.sqrt(Math.max(0, 1 - dy * dy)),
              c = Math.cos(ph)
            const lit = ph < Math.PI ? dx > c * edge : dx < -c * edge
            v = lit ? 0.97 : dx * dx + dy * dy > 0.72 ? 0.42 : 0.26
          } else v += 0.12 * Math.exp(-((d / 16) ** 2)) * (m.lit / 100)
        }
        const r1 =
          0.75 + 0.05 * Math.sin(xx * 7 + 1) + 0.025 * Math.sin(xx * 19 + 2)
        const r2 =
          0.86 + 0.04 * Math.sin(xx * 4.3 + 4) + 0.02 * Math.sin(xx * 23)
        if (day) {
          // natural daylight colours
          const mix = (a: number[], b: number[], k: number) => [
            a[0] + (b[0] - a[0]) * k,
            a[1] + (b[1] - a[1]) * k,
            a[2] + (b[2] - a[2]) * k,
          ]
          let c = mix([72, 146, 222], [196, 226, 246], yy ** 1.3) // sky: deep blue → pale horizon
          c = mix(c, [250, 214, 170], tw * 0.6 * yy) // warm horizon near sunrise / sunset
          const g = Math.exp(-((d / 22) ** 2))
          c = mix(c, [255, 250, 225], g * 0.75) // sun glow
          if (d < 6.5) c = [255, 251, 222]
          region[y * W + x] = 0
          const shade = 0.82 + 0.18 * Math.sin(xx * 31 + yy * 17) // a little texture on the hills
          if (yy > r2) {
            c = mix([58, 112, 58], [44, 90, 46], (yy - r2) * 6).map(
              (v) => v * shade
            )
            region[y * W + x] = 2
          } else if (yy > r1) {
            c = mix([120, 160, 110], [150, 182, 140], 0.4).map(
              (v) => v * (0.94 + 0.06 * shade)
            )
            region[y * W + x] = 1
          }
          const o3 = (y * W + x) * 3
          dayRGB[o3] = c[0]
          dayRGB[o3 + 1] = c[1]
          dayRGB[o3 + 2] = c[2]
        }
        if (yy > r2)
          v =
            s < 0.3 &&
            hash(Math.floor(x / 2), Math.floor(y / 2)) < 0.006 &&
            Math.abs(xx - 0.62) < 0.18
              ? 1
              : 0.0 + 0.16 * s
        // near hills, a few lit windows at night
        else if (yy > r1) v = 0.05 + 0.31 * s
        base[y * W + x] = v
      }
    st = { h, s, day, bx, by, sunAlt, m, hillTop: H * 0.7 }
  }
  function frame(t: number) {
    const dt = Math.min(0.2, (t - (last || t)) / 1000)
    last = t
    off = (off + dt * 2.2) % CW // clouds drift slowly to the left
    const cv1 = st.day ? 0.98 : 0.3
    // occasional birds by day, a shooting star at night
    if (
      st.day &&
      st.sunAlt > 0.15 &&
      !birds.length &&
      Math.random() < dt * 0.06
    )
      birds = Array.from({ length: 3 }, (_, i) => ({
        x: -6 - i * 9,
        y: H * (0.2 + Math.random() * 0.25) + i * 3,
        f: i,
      }))
    birds.forEach((b) => {
      b.x += dt * 26
      b.f += dt * 6
    })
    birds = birds.filter((b) => b.x < W + 8)
    if (!st.day && st.s < 0.3 && !meteor && Math.random() < dt * 0.05)
      meteor = {
        x: W * (0.3 + Math.random() * 0.6),
        y: H * 0.05 + Math.random() * H * 0.2,
        l: 0,
      }
    if (meteor) {
      meteor.l += dt * 90
      if (meteor.l > 70) meteor = null
    }
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const i = y * W + x
        let v = base[i]
        if (v < 0)
          v = hash(x + Math.floor(t / 600), y) < 0.75 ? 1 : 0.55 // twinkle
        else if (y < st.hillTop) {
          const c = cloud[y * CW + ((x + Math.floor(off)) % CW)]
          if (c) v = v + (cv1 - v) * c
        }
        const th = BY[(y & 3) * 4 + (x & 3)],
          o = i * 4
        if (st.day) {
          // full colour, ordered-dithered to 6 levels per channel
          const o3 = i * 3
          let r = dayRGB[o3],
            g = dayRGB[o3 + 1],
            b = dayRGB[o3 + 2]
          if (y < st.hillTop && !region[i]) {
            const c = cloud[y * CW + ((x + Math.floor(off)) % CW)]
            if (c) {
              r += (252 - r) * c
              g += (252 - g) * c
              b += (250 - b) * c
            }
          }
          const q = (u: number) => Math.min(255, Math.floor(u / 51 + th) * 51)
          px[o] = q(r)
          px[o + 1] = q(g)
          px[o + 2] = q(b)
          px[o + 3] = 255
          continue
        }
        const col =
          v < 0.5
            ? v * 2 > th
              ? NIGHT.mid
              : NIGHT.dark
            : v * 2 - 1 > th
              ? NIGHT.light
              : NIGHT.mid
        px[o] = col[0]
        px[o + 1] = col[1]
        px[o + 2] = col[2]
        px[o + 3] = 255
      }
    const dot = (x: number, y: number, c: number[]) => {
      x |= 0
      y |= 0
      if (x < 0 || y < 0 || x >= W || y >= H) return
      const o = (y * W + x) * 4
      px[o] = c[0]
      px[o + 1] = c[1]
      px[o + 2] = c[2]
    }
    birds.forEach((b) => {
      const up = Math.sin(b.f) > 0 ? -1 : 0
      dot(b.x - 2, b.y + up, INK)
      dot(b.x - 1, b.y, INK)
      dot(b.x, b.y + 1, INK)
      dot(b.x + 1, b.y, INK)
      dot(b.x + 2, b.y + up, INK)
    })
    if (meteor)
      for (let k = 0; k < 14; k++) {
        const d = meteor.l - k * 1.2
        if (d > 0) dot(meteor.x - d, meteor.y + d * 0.45, k < 5 ? PAP : SIG)
      }
    ctx.putImageData(img, 0, 0)
  }
  function info() {
    if (!st.day) return `outside · night · ${st.m.name}, ${st.m.lit}% lit`
    const p = ((((st.h - 6) % 12) + 12) % 12) / 12
    return `outside · ${st.sunAlt < 0.3 ? (p < 0.5 ? "early light" : "late light") : "daylight"}`
  }
  // what's under a tap on the window
  function poke(u: number, v: number) {
    const x = u * W,
      y = v * H,
      near = Math.hypot(x - st.bx, y - st.by) < 14
    if (near && st.day) return "don't stare at the sun."
    if (near)
      return `the moon tonight: ${st.m.name} · ${st.m.lit}% lit · ${st.m.toFull ? `full in ${st.m.toFull} days` : "full tonight"}`
    return null
  }
  return { prepare, frame, info, poke, cv }
}
