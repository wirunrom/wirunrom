function requiredContext(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d")
  if (!context) throw new Error("Window canvas unavailable")
  return context
}
// Pixel tabby adapted from wirunrom-desk-cat-window.zip. No global loop or listeners.
export function makeCat(
  cv: HTMLCanvasElement,
  opt: {
    wander?: boolean
    hidden?: boolean
    x?: number
    dir?: number
    nap?: boolean
  } = {}
) {
  const ctx = requiredContext(cv)
  const W = cv.width,
    H = cv.height,
    BASE = H - 1,
    wander = !!opt.wander
  let hidden = !!opt.hidden,
    yoff = 0,
    script: ((time: number) => void) | null = null,
    leapA = 0,
    landQ = 0
  const img = ctx.createImageData(W, H),
    px = img.data
  const BY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(
    (v) => (v + 0.5) / 16
  )
  const C = {
    line: [58, 30, 18],
    dark: [170, 82, 30],
    mid: [228, 126, 46],
    light: [248, 172, 92],
    cream: [250, 228, 196],
    eye: [196, 214, 70],
    pupil: [30, 22, 16],
    nose: [214, 120, 120],
  }
  const mask = new Uint8Array(W * H),
    mat = new Uint8Array(W * H) // mat: 1 fur, 2 cream, 3 eye, 4 pupil, 5 nose, 6 closed-eye line
  let x = opt.x ?? W * 0.72,
    dir = opt.dir ?? -1,
    pose: "sit" | "look" | "walk" | "sleep" | "wake" | "leap" | "land" = "sit",
    until = 0,
    target = x,
    t0 = 0,
    woke = 0,
    phase = 0
  const set = (i: number, m: number) => {
    mask[i] = 1
    if (!mat[i] || m > 1) mat[i] = m
  }
  const ell = (cx: number, cy: number, rx: number, ry: number, m = 1) => {
    for (
      let y = Math.max(0, Math.floor(cy - ry));
      y <= Math.min(H - 1, cy + ry);
      y++
    )
      for (
        let xx = Math.max(0, Math.floor(cx - rx));
        xx <= Math.min(W - 1, cx + rx);
        xx++
      ) {
        const a = (xx + 0.5 - cx) / rx,
          b = (y + 0.5 - cy) / ry
        if (a * a + b * b <= 1) set(y * W + xx, m)
      }
  }
  const tri = (
    ax: number,
    ay: number,
    bx: number,
    by: number,
    cx: number,
    cy: number
  ) => {
    const minx = Math.floor(Math.min(ax, bx, cx)),
      maxx = Math.ceil(Math.max(ax, bx, cx)),
      miny = Math.floor(Math.min(ay, by, cy)),
      maxy = Math.ceil(Math.max(ay, by, cy))
    for (let y = Math.max(0, miny); y <= Math.min(H - 1, maxy); y++)
      for (let xx = Math.max(0, minx); xx <= Math.min(W - 1, maxx); xx++) {
        const px_ = xx + 0.5,
          py = y + 0.5
        const d1 = (px_ - bx) * (ay - by) - (ax - bx) * (py - by),
          d2 = (px_ - cx) * (by - cy) - (bx - cx) * (py - cy),
          d3 = (px_ - ax) * (cy - ay) - (cx - ax) * (py - ay)
        if (!((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0)))
          set(y * W + xx, 1)
      }
  }
  const tube = (pts: [number, number][], r: number) => {
    for (let k = 0; k < pts.length - 1; k++) {
      const [ax, ay] = pts[k],
        [bx, by] = pts[k + 1],
        n = Math.ceil(Math.hypot(bx - ax, by - ay) * 2)
      for (let j = 0; j <= n; j++)
        ell(ax + ((bx - ax) * j) / n, ay + ((by - ay) * j) / n, r, r)
    }
  }
  const dot = (cx: number, cy: number, m: number) => {
    const i = Math.round(cy) * W + Math.round(cx)
    if (i >= 0 && i < W * H) set(i, m)
  }
  const ears = (hx: number, hy: number, r: number, f = 0) => {
    tri(
      hx - r * 0.95,
      hy - r * 0.35,
      hx - r * 0.25 + f,
      hy - r * 0.85,
      hx - r * 0.75 + f,
      hy - r * 1.6
    )
    tri(
      hx + r * 0.95,
      hy - r * 0.35,
      hx + r * 0.25 + f,
      hy - r * 0.85,
      hx + r * 0.75 + f,
      hy - r * 1.6
    )
  }
  function face(hx: number, hy: number, r: number, open: boolean) {
    ell(hx, hy + r * 0.45, r * 0.55, r * 0.38, 2) // muzzle
    if (open) {
      for (const s of [-1, 1]) {
        ell(hx + s * r * 0.42, hy - r * 0.1, 1.4, 1.6, 3)
        dot(hx + s * r * 0.42, hy - r * 0.1, 4)
      }
    } else
      for (const s of [-1, 1])
        for (let k = -1; k <= 1; k++)
          dot(hx + s * r * 0.42 + k, hy - r * 0.05 + (k === 0 ? 0.6 : 0), 6)
    dot(hx, hy + r * 0.25, 5)
  }
  function build(t: number) {
    mask.fill(0)
    mat.fill(0)
    const b = BASE + yoff
    if (pose === "sleep" || pose === "wake") {
      // curled loaf, tail around the front
      const br = 1 + 0.04 * Math.sin(t / 700)
      ell(x, b - 8.5 * br, 20, 9.5 * br)
      ell(x - dir * 2, b - 4.5, 19, 5)
      const hx = x + dir * 15,
        hy = b - 10
      ell(hx, hy, 7.8, 6.8)
      ears(hx, hy, 6.5, dir * 0.6)
      tube(
        [
          [x - dir * 19, b - 3],
          [x - dir * 5, b - 1.5],
          [x + dir * 10, b - 2],
        ],
        2.4
      )
      face(hx, hy, 6.5, pose === "wake")
    } else if (pose === "leap") {
      // mid-air: stretched long, front paws reaching, hind legs trailing
      const a = leapA,
        ca = Math.cos(a),
        sa = Math.sin(a) // a > 0 nose up (take-off), a < 0 nose down (landing)
      const P = (u: number, v: number): [number, number] => [
        x + dir * (u * ca - v * sa * 0),
        b - 14 - u * sa + v,
      ] // body axis u (along dir), v down
      const hip = P(-13, 0),
        chest = P(9, -1)
      tube([hip, P(-3, -1.5), chest], 6.2)
      ell(...P(-2, 0.5), 9.5, 6.2) // long stretched torso
      const head = P(17, -3)
      ell(head[0], head[1], 6.6, 5.9)
      ears(head[0], head[1], 6.2, dir * 1.2)
      ell(head[0] + dir * 4, head[1] + 2, 2.8, 2.2, 2)
      dot(head[0] + dir * 6.3, head[1] + 1.4, 5)
      ell(head[0] + dir * 2.2, head[1] - 1, 1.1, 1.3, 3)
      dot(head[0] + dir * 2.6, head[1] - 1, 4)
      const reach = a < 0 ? 1 : 0.4 // front legs reach down for the sill when landing
      tube([P(8, 2), [chest[0] + dir * 11, chest[1] + 6 + reach * 6]], 1.7)
      tube([P(6, 2), [chest[0] + dir * 8, chest[1] + 8 + reach * 6]], 1.7)
      tube([P(-12, 3), [hip[0] - dir * 12, hip[1] + 7]], 2)
      tube([P(-10, 3), [hip[0] - dir * 9, hip[1] + 9]], 2) // hind legs pushed back
      tube(
        [
          P(-15, -1),
          [hip[0] - dir * 20, hip[1] - 6],
          [hip[0] - dir * 25, hip[1] - 12],
        ],
        2
      ) // tail streaming behind
    } else if (pose === "land") {
      // crouched on landing, absorbing the jump
      const q = landQ // 1 = deepest crouch
      ell(x, b - 7 + q * 1.5, 15, 6.8 - q * 1.2)
      ell(x - dir * 7, b - 6, 9, 6)
      tube(
        [
          [x + dir * 8, b - 6],
          [x + dir * 14, b - 1],
        ],
        1.8
      )
      tube(
        [
          [x + dir * 4, b - 5],
          [x + dir * 9, b - 1],
        ],
        1.8
      )
      const hx = x + dir * 15,
        hy = b - 13 + q * 2
      ell(hx, hy, 6.8, 6)
      ears(hx, hy, 6.4, dir * 0.6)
      ell(hx + dir * 4, hy + 2, 2.8, 2.2, 2)
      ell(hx + dir * 2.2, hy - 1, 1.1, 1.3, 3)
      dot(hx + dir * 2.6, hy - 1, 4)
      dot(hx + dir * 6.3, hy + 1.4, 5)
      tube(
        [
          [x - dir * 14, b - 4],
          [x - dir * 22, b - 6],
          [x - dir * 26, b - 12 + q * 4],
        ],
        2
      )
    } else if (pose === "walk") {
      // side view, legs swinging
      const s = Math.sin(phase),
        bob = Math.abs(Math.cos(phase)) * 0.8
      ell(x, b - 12.5 - bob, 15.5, 8)
      ell(x, b - 9.5 - bob, 12.5, 6)
      for (const [ox, ph] of [
        [-9, 0],
        [-5, Math.PI],
        [6, Math.PI],
        [10, 0],
      ]) {
        const sw = Math.sin(phase + ph) * 2
        tube(
          [
            [x + dir * ox, b - 8 - bob],
            [x + dir * (ox + sw), b - 1],
          ],
          1.8
        )
      }
      const hx = x + dir * 16.5,
        hy = b - 19 - bob
      ell(hx, hy, 7.2, 6.4)
      ears(hx, hy, 6, dir * 0.8)
      tube(
        [
          [x - dir * 14, b - 15 - bob],
          [x - dir * 19, b - 22],
          [x - dir * (18 + s), b - 28],
        ],
        2.1
      )
      ell(hx + dir * 4, hy + 2, 3, 2.4, 2) // muzzle in profile
      ell(hx + dir * 2.5, hy - 1, 1.2, 1.4, 3)
      dot(hx + dir * 3, hy - 1, 4)
      dot(hx + dir * 6.4, hy + 1.5, 5)
    } else {
      // sitting, back to you (watching the window) or turned to look
      const look = pose === "look"
      ell(x, b - 10, 13.5, 10.5)
      ell(x, b - 4.5, 15.5, 4.8) // haunches
      ell(x, b - 19, 9.5, 7.5) // chest/shoulders
      const hx = x + (look ? 0 : dir * 0.5),
        hy = b - 26.5
      ell(hx, hy, 8, 7)
      ears(hx, hy, 7.2)
      const sw = Math.sin(t / 900) * 2 // tail flicks along the sill
      tube(
        [
          [x + dir * 12, b - 2],
          [x + dir * 19, b - 1.5],
          [x + dir * (23 + sw), b - 4 - Math.max(0, sw)],
        ],
        2.2
      )
      if (look) {
        face(hx, hy, 7.4, true)
        ell(x, b - 13, 5.5, 6.5, 2)
      }
    }
  }
  function paint(t: number) {
    if (hidden) {
      mask.fill(0)
      ctx.clearRect(0, 0, W, H)
      return
    }
    build(t)
    const night = pose === "sleep" || pose === "wake",
      dim = night ? 0.55 : 1
    for (let y = 0; y < H; y++)
      for (let xx = 0; xx < W; xx++) {
        const i = y * W + xx,
          o = i * 4
        if (!mask[i]) {
          px[o + 3] = 0
          continue
        }
        const edge =
          xx === 0 ||
          xx === W - 1 ||
          y === 0 ||
          y === H - 1 ||
          !mask[i - 1] ||
          !mask[i + 1] ||
          !mask[i - W] ||
          !mask[i + W]
        let c
        const m = mat[i]
        if (m === 3) c = C.eye
        else if (m === 4) c = C.pupil
        else if (m === 5) c = C.nose
        else if (m === 6) c = C.line
        else if (edge) c = C.line
        else {
          // shade: light from above (the window), tabby stripes across the fur, cream on muzzle / chest
          let v = 0.75 - ((y - (BASE - 36)) / 36) * 0.45
          if (m === 2) v = 1.15
          else if (
            Math.sin(xx * 0.9 + y * 0.35 + (pose === "walk" ? 0 : 1.5)) > 0.55
          )
            v -= 0.32
          v *= dim
          const th = BY[(y & 3) * 4 + (xx & 3)]
          const L = [C.dark, C.mid, C.light, C.cream],
            f = Math.max(0, Math.min(2.999, v * 3))
          c = L[Math.floor(f) + (f % 1 > th ? 1 : 0)] || C.cream
        }
        px[o] = c[0]
        px[o + 1] = c[1]
        px[o + 2] = c[2]
        px[o + 3] = 255
      }
    ctx.putImageData(img, 0, 0)
    if (pose === "sleep") {
      // z z
      ctx.fillStyle = "#e7e5de"
      const k = (t / 1200) % 1,
        zx = x + dir * 14,
        zy = BASE - 20 - k * 10
      ctx.globalAlpha = 1 - k
      ctx.fillRect(zx, zy, 3, 1)
      ctx.fillRect(zx + 1, zy + 1, 1, 1)
      ctx.fillRect(zx, zy + 2, 3, 1)
      ctx.globalAlpha = 1
    }
  }
  function think(t: number, day: boolean) {
    if (hidden) return
    if (script) return script(t)
    if (!wander) {
      if (!day) {
        if (pose !== "wake" || t > woke) pose = "sleep"
      } else pose = opt.nap ? "wake" : "look"
      return
    }
    if (!day) {
      if (pose !== "wake" || t > woke) pose = "sleep"
      return
    }
    if (pose === "sleep" || pose === "wake") {
      pose = "sit"
      until = t + 3000
    }
    if (pose === "walk") {
      const step = 0.022 * (t - t0)
      t0 = t
      phase += step * 0.55
      if (Math.abs(target - x) < step + 0.5) {
        x = target
        pose = "sit"
        until = t + 4000 + Math.random() * 6000
      } else x += Math.sign(target - x) * step
      return
    }
    if (t < until) return
    if (pose === "look") {
      pose = "sit"
      until = t + 4000 + Math.random() * 6000
      return
    }
    if (Math.random() < 0.35) {
      pose = "look"
      until = t + 1600 + Math.random() * 1200
    } else {
      target = 28 + Math.random() * (W - 56)
      if (Math.abs(target - x) < 30) target = x < W / 2 ? W - 40 : 40
      dir = Math.sign(target - x)
      pose = "walk"
      t0 = t
    }
  }
  let clock = 0
  function tick(t: number, day: boolean) {
    clock = t
    think(t, day)
    paint(t)
  }
  // forgiving hit test: anything within a few pixels of the cat counts (a curled-up cat is a small target)
  function hit(u: number, v: number, pad = 3) {
    const cx = Math.floor(u * W),
      cy = Math.floor(v * H)
    for (let y = cy - pad; y <= cy + pad; y++)
      for (let x2 = cx - pad; x2 <= cx + pad; x2++)
        if (x2 >= 0 && y >= 0 && x2 < W && y < H && mask[y * W + x2])
          return true
    return false
  }
  function poke(t: number, day: boolean) {
    if (!day) {
      const was = pose
      pose = "wake"
      woke = t + 2200
      return was === "sleep"
        ? "you woke the cat. it blinks at you and goes back to sleep."
        : "shh. it is still sleeping."
    }
    if (pose === "walk") {
      pose = "look"
      until = t + 2600
      return "the cat stops and stares at you."
    }
    pose = "look"
    until = t + 2600
    const L = [
      "mrrp.",
      "meow.",
      "prrrr.",
      "mrow?",
      "it slow-blinks at you. that means it likes you.",
      "it turns back to the window. birds are more interesting.",
    ]
    return L[Math.floor(Math.random() * L.length)]
  }
  // jump up onto the canvas floor from below, then settle: sit by day, curl up by night
  function jumpIn(t: number, day: boolean, at: number) {
    hidden = false
    dir = Math.random() < 0.5 ? -1 : 1
    const ts = t,
      x0 = at - dir * 26,
      x1 = at
    const UP = 430,
      LAND = 420 // airtime, then landing crouch
    script = (now) => {
      const e = now - ts
      if (e < UP) {
        // ballistic arc from below the sill
        const k = e / UP
        pose = "leap"
        x = x0 + (x1 - x0) * k
        yoff = H * 1.05 * (1 - k) - H * 0.55 * Math.sin(k * Math.PI) * 1.15 // rises past the sill line, peaks, drops onto it
        yoff = Math.max(yoff, -14)
        leapA = 0.75 - 1.15 * k // nose up on take-off → nose down to land
        return
      }
      const k = Math.min(1, (e - UP) / LAND)
      x = x1
      yoff = 0
      pose = "land"
      landQ = k < 0.35 ? k / 0.35 : 1 - (k - 0.35) / 0.65 // squash, then rise
      if (k >= 1) {
        script = null
        pose = day ? "sit" : "sleep"
        until = now + 3000
      }
    }
  }
  const settle = (day: boolean, at: number) => {
    hidden = false
    script = null
    yoff = 0
    x = at
    pose = day ? "sit" : "sleep"
    until = performance.now() + 3000
  }
  return {
    time: () => clock,
    tick,
    hit,
    poke,
    cv,
    jumpIn,
    settle,
    W,
  }
}
