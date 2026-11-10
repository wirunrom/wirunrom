import type { GameServices } from "../game-runtime"
import type { Point } from "../game-types"
import { swipeDir, DIRECTION_VECTORS } from "../game-controls"

export function createSnake(services: GameServices) {
  const { TOUCH, store, setHud, setReadout, now, won } = services
  const { pxSize, P, clear, R } = services.pixel
  /* 08 snake */
  const SNAKE = {
    best: 0,
    on: false,
    cs: 3,
    cols: 0,
    rows: 0,
    body: [] as Point[],
    dir: [1, 0] as Point,
    q: [] as Point[],
    food: [0, 0] as Point,
    grow: 0,
    score: 0,
    live: false,
    dead: false,
    deadAt: 0,
    acc: 0,
    sw: null as Point | null,
    id: "snake" as const,
    title: "snake",
    hint: TOUCH
      ? "swipe to turn. eat, grow, don't bite yourself"
      : "arrows / wasd. eat, grow, don't bite yourself",
    mode: "px" as const,
    enter() {
      pxSize()
      this.best = store.get("snake", 0)
      this.cs = 3
      this.cols = Math.floor(P.W / 3)
      this.rows = Math.floor(P.H / 3)
      this.reset()
      this.on = true
      setHud({
        c: TOUCH ? "swipe to start" : "press an arrow to start",
        s: `score 0 · best ${this.best}`,
        m: "",
        mc: "mute",
      })
    },
    reset() {
      const cy = this.rows >> 1
      this.body = [
        [6, cy],
        [5, cy],
        [4, cy],
      ]
      this.dir = [1, 0]
      this.q = []
      this.grow = 0
      this.score = 0
      this.live = false
      this.dead = false
      this.acc = 0
      this.place()
    },
    place() {
      do {
        this.food = [
          (Math.random() * this.cols) | 0,
          (Math.random() * this.rows) | 0,
        ]
      } while (
        this.body.some((s) => s[0] === this.food[0] && s[1] === this.food[1])
      )
    },
    start() {
      if (this.dead) {
        if (now() - this.deadAt < 400) return false
        this.reset()
      }
      if (!this.live) {
        this.live = true
        setHud({ c: "0", m: "" })
      }
      return true
    },
    update(dt: number) {
      if (!this.live || this.dead) return
      this.acc += dt
      const st = Math.max(45, 95 - this.score * 1.5)
      while (this.acc >= st && !this.dead) {
        this.acc -= st
        this.step()
      }
    },
    step() {
      if (this.q.length) this.dir = this.q.shift()!
      const h = this.body[0],
        n: Point = [
          (h[0] + this.dir[0] + this.cols) % this.cols,
          (h[1] + this.dir[1] + this.rows) % this.rows,
        ]
      if (
        this.body.some(
          (s, k) => k < this.body.length - 1 && s[0] === n[0] && s[1] === n[1]
        )
      )
        return this.die()
      this.body.unshift(n)
      if (n[0] === this.food[0] && n[1] === this.food[1]) {
        this.grow += 2
        this.score++
        setReadout(String(this.score))
        if (this.score > this.best) {
          this.best = this.score
          store.set("snake", this.score)
        }
        setHud({ s: `score ${this.score} · best ${this.best}` })
        if (this.score >= 15) won("snake 15")
        this.place()
      }
      if (this.grow > 0) this.grow--
      else this.body.pop()
    },
    die() {
      this.dead = true
      this.deadAt = now()
      setHud({
        c: String(this.score),
        m: "you bit yourself. turn to retry.",
        mc: "sig",
      })
    },
    turn(d: Point) {
      const l = this.q.length ? this.q[this.q.length - 1] : this.dir
      if (
        (d[0] === -l[0] && d[1] === -l[1]) ||
        (d[0] === l[0] && d[1] === l[1])
      )
        return
      if (this.q.length < 3) this.q.push(d)
    },
    keydown(e: KeyboardEvent) {
      const mapping: Partial<Record<string, Point>> = {
        ArrowUp: [0, -1],
        KeyW: [0, -1],
        ArrowDown: [0, 1],
        KeyS: [0, 1],
        ArrowLeft: [-1, 0],
        KeyA: [-1, 0],
        ArrowRight: [1, 0],
        KeyD: [1, 0],
      }
      const d = mapping[e.code]
      if (!d) return false
      if (this.start()) this.turn(d)
      return true
    },
    pdown(p: Point) {
      this.sw = p
    },
    pmove(p: Point) {
      if (!this.sw) return
      const d = swipeDir(this.sw, p, 5)
      if (!d) return
      this.sw = p
      if (this.start()) this.turn(DIRECTION_VECTORS[d])
    },
    pup() {
      if (this.sw && !this.live) this.start()
      this.sw = null
    },
    draw() {
      clear()
      const c = this.cs
      R(this.food[0] * c, this.food[1] * c, c, c, services.pixel.COL.sig)
      this.body.forEach(([i, j], k) =>
        R(
          i * c,
          j * c,
          c - (k ? 1 : 0),
          c - (k ? 1 : 0),
          this.dead && !k ? services.pixel.COL.sig : services.pixel.COL.ink
        )
      )
    },
  }

  return SNAKE
}
