import type { GameServices } from "../game-runtime"
import type {
  FallingPiece,
  Matrix,
  Piece,
  Point,
  Shape,
  TetrisAction,
} from "../game-types"
import { swipeDir } from "../game-controls"

export function createTetris(services: GameServices) {
  const { TOUCH, store, setHud, now, won } = services
  const { pxSize, P, clear, R } = services.pixel
  /* 07 mini tetris */
  const SH: Record<Shape, Matrix> = {
    I: [[1, 1, 1, 1]],
    O: [
      [1, 1],
      [1, 1],
    ],
    T: [
      [0, 1, 0],
      [1, 1, 1],
    ],
    S: [
      [0, 1, 1],
      [1, 1, 0],
    ],
    Z: [
      [1, 1, 0],
      [0, 1, 1],
    ],
    J: [
      [1, 0, 0],
      [1, 1, 1],
    ],
    L: [
      [0, 0, 1],
      [1, 1, 1],
    ],
  }
  const rot = (m: Matrix): Matrix =>
    m[0].map((_, i) => m.map((r) => r[i]).reverse())
  const TET = {
    best: 0,
    on: false,
    c: 0,
    ox: 0,
    oy: 0,
    g: [] as Matrix,
    lines: 0,
    dead: false,
    deadAt: 0,
    bag: [] as Shape[],
    nextP: { k: "I", m: [[1, 1, 1, 1]] } as Piece,
    p: { k: "I", m: [[1, 1, 1, 1]], x: 0, y: 0 } as FallingPiece,
    acc: 0,
    live: false,
    sw: null as Point | null,
    id: "tetris" as const,
    title: "mini tetris",
    hint: TOUCH
      ? "tap left / right to move, middle to rotate, swipe down to drop"
      : "← → move · ↑ rotate · ↓ faster · space drops",
    mode: "px" as const,
    enter() {
      pxSize()
      this.best = store.get("tet", 0)
      this.c = Math.max(
        3,
        Math.min(Math.floor((P.H - 2) / 20), Math.floor((P.W - 2) / 16))
      )
      this.ox = Math.floor((P.W - this.c * 10) / 2)
      this.oy = Math.floor((P.H - this.c * 20) / 2)
      this.reset()
      this.on = true
    },
    reset() {
      this.g = Array.from({ length: 20 }, () => Array(10).fill(0))
      this.lines = 0
      this.dead = false
      this.bag = []
      this.nextP = this.draw7()
      this.spawn()
      this.acc = 0
      this.live = false
      setHud({
        c: TOUCH ? "tap to start" : "press any arrow to start",
        s: `lines 0 · best ${this.best}`,
        m: "",
        mc: "mute",
      })
    },
    draw7(): Piece {
      if (!this.bag.length)
        this.bag = (Object.keys(SH) as Shape[]).sort(() => Math.random() - 0.5)
      const k = this.bag.pop()!
      return { k, m: SH[k] }
    },
    spawn() {
      this.p = { ...this.nextP, x: 0, y: 0 }
      this.p.x = Math.floor((10 - this.p.m[0].length) / 2)
      this.nextP = this.draw7()
      if (this.hit(this.p.m, this.p.x, this.p.y)) this.die()
    },
    hit(m: Matrix, x: number, y: number) {
      return m.some((r, j) =>
        r.some(
          (v, i) =>
            v &&
            (x + i < 0 ||
              x + i >= 10 ||
              y + j >= 20 ||
              (y + j >= 0 && this.g[y + j][x + i]))
        )
      )
    },
    tryMove(dx: number, dy: number, m?: Matrix) {
      m ??= this.p.m
      if (!this.hit(m, this.p.x + dx, this.p.y + dy)) {
        this.p.x += dx
        this.p.y += dy
        this.p.m = m
        return true
      }
      return false
    },
    rotate() {
      const m = rot(this.p.m)
      for (const k of [0, -1, 1, -2, 2]) if (this.tryMove(k, 0, m)) return
    },
    lock() {
      const v = this.p.k === "T" || this.p.k === "I" ? 2 : 1
      this.p.m.forEach((r, j) =>
        r.forEach((on, i) => {
          if (on && this.p.y + j >= 0) this.g[this.p.y + j][this.p.x + i] = v
        })
      )
      let n = 0
      this.g = this.g.filter((r) => (r.every(Boolean) ? (n++, false) : true))
      while (this.g.length < 20) this.g.unshift(Array(10).fill(0))
      if (n) {
        this.lines += n
        if (this.lines > this.best) {
          this.best = this.lines
          store.set("tet", this.lines)
        }
        setHud({
          m: n >= 4 ? "four at once." : `${n} line${n > 1 ? "s" : ""}`,
          mc: n >= 4 ? "sig" : "mute",
        })
        if (this.lines >= 5) won("5 lines")
      }
      setHud({
        c: `lines ${this.lines}`,
        s: `lines ${this.lines} · best ${this.best}`,
      })
      this.spawn()
    },
    update(dt: number) {
      if (!this.live || this.dead) return
      this.acc += dt
      const step = Math.max(90, 650 - this.lines * 30)
      while (this.acc >= step && !this.dead) {
        this.acc -= step
        if (!this.tryMove(0, 1)) this.lock()
      }
    },
    die() {
      this.dead = true
      this.deadAt = now()
      setHud({
        c: "stacked out",
        m: `${this.lines} lines. any move retries.`,
        mc: "sig",
      })
    },
    act(a: TetrisAction) {
      if (this.dead) {
        if (now() - this.deadAt > 500) this.reset()
        return
      }
      if (!this.live) {
        this.live = true
        setHud({ c: `lines ${this.lines}` })
        return
      }
      if (a === "l") this.tryMove(-1, 0)
      else if (a === "r") this.tryMove(1, 0)
      else if (a === "u") this.rotate()
      else if (a === "d") {
        if (!this.tryMove(0, 1)) this.lock()
        this.acc = 0
      } else if (a === "slam") {
        while (this.tryMove(0, 1));
        this.lock()
        this.acc = 0
      }
    },
    keydown(e: KeyboardEvent) {
      const mapping: Partial<Record<string, TetrisAction>> = {
        ArrowLeft: "l",
        KeyA: "l",
        ArrowRight: "r",
        KeyD: "r",
        ArrowUp: "u",
        KeyW: "u",
        ArrowDown: "d",
        KeyS: "d",
        Space: "slam",
      }
      const a = mapping[e.code]
      if (!a) return false
      this.act(a)
      return true
    },
    pdown(p: Point) {
      this.sw = p
    },
    pup(p: Point) {
      if (!this.sw) return
      const d = swipeDir(this.sw, p, 8)
      this.sw = null
      if (d === "d") return this.act("slam")
      const rel = (p[0] - this.ox) / (this.c * 10)
      this.act(rel < 0.33 ? "l" : rel > 0.67 ? "r" : "u")
    },
    draw() {
      clear()
      const c = this.c,
        ox = this.ox,
        oy = this.oy
      R(ox - 1, oy - 1, c * 10 + 2, c * 20 + 2, services.pixel.COL.ink)
      R(ox, oy, c * 10, c * 20, services.pixel.COL.paper)
      this.g.forEach((r, j) =>
        r.forEach(
          (v, i) =>
            v &&
            R(
              ox + i * c,
              oy + j * c,
              c - 1,
              c - 1,
              v === 2 ? services.pixel.COL.sig : services.pixel.COL.ink
            )
        )
      )
      if (!this.dead) {
        let gy = this.p.y
        while (!this.hit(this.p.m, this.p.x, gy + 1)) gy++
        this.p.m.forEach((r, j) =>
          r.forEach(
            (v, i) =>
              v &&
              R(
                ox + (this.p.x + i) * c + 1,
                oy + (gy + j) * c + 1,
                Math.max(1, c - 3),
                Math.max(1, c - 3),
                services.pixel.COL.mute
              )
          )
        )
      }
      const pc =
        this.p.k === "T" || this.p.k === "I"
          ? services.pixel.COL.sig
          : services.pixel.COL.ink
      this.p.m.forEach((r, j) =>
        r.forEach(
          (v, i) =>
            v &&
            R(
              ox + (this.p.x + i) * c,
              oy + (this.p.y + j) * c,
              c - 1,
              c - 1,
              pc
            )
        )
      )
      const nx = ox + c * 12
      if (nx + c * 4 < P.W)
        this.nextP.m.forEach((r, j) =>
          r.forEach(
            (v, i) =>
              v &&
              R(
                nx + i * c,
                oy + c + j * c,
                c - 1,
                c - 1,
                services.pixel.COL.ink
              )
          )
        )
    },
  }

  return TET
}
