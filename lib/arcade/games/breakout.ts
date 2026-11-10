import type { GameServices } from "../game-runtime"
import type { Brick, Point } from "../game-types"

export function createBreakout(services: GameServices) {
  const { TOUCH, store, setHud, won } = services
  const { pxSize, P, clear, R } = services.pixel
  /* 05 breakout */
  const BRK = {
    best: 0,
    on: false,
    level: 1,
    score: 0,
    lives: 3,
    bricks: [] as Brick[],
    pw: 0,
    px: 0,
    stuck: true,
    b: { x: 0, y: 0, vx: 0, vy: 0 },
    keyDir: 0,
    armed: false,
    id: "breakout" as const,
    title: "breakout",
    hint: TOUCH
      ? "drag to move. tap to launch"
      : "mouse or ← → to move. click or space to launch",
    mode: "px" as const,
    enter() {
      pxSize()
      this.best = store.get("brk", 0)
      this.level = 1
      this.score = 0
      this.lives = 3
      this.build()
      this.serve()
      this.on = true
      this.hud()
      setHud({ m: TOUCH ? "tap to launch" : "click to launch", mc: "mute" })
    },
    build() {
      const cols = Math.max(6, Math.floor((P.W - 4) / 14)),
        bw = (P.W - 4 - (cols - 1) * 2) / cols
      this.bricks = []
      for (let r = 0; r < 5; r++)
        for (let c = 0; c < cols; c++)
          this.bricks.push({
            x: 2 + c * (bw + 2),
            y: 6 + r * 6,
            w: bw,
            h: 4,
            a: true,
            s: r === 0,
          })
      this.pw = Math.max(16, P.W * 0.14)
      this.px = (P.W - this.pw) / 2
    },
    serve() {
      this.stuck = true
      this.b = { x: 0, y: 0, vx: 0, vy: 0 }
    },
    launch() {
      if (!this.stuck) return
      this.stuck = false
      const s = 0.08 + 0.012 * this.level,
        a = (Math.random() - 0.5) * 0.8
      this.b.vx = Math.sin(a) * s
      this.b.vy = -Math.cos(a) * s
      setHud({ m: "", mc: "mute" })
    },
    hud() {
      setHud({
        c: `level ${this.level} · ${"●".repeat(this.lives)}${"○".repeat(3 - this.lives)}`,
        s: `score ${this.score} · best ${this.best}`,
      })
    },
    update(dt: number) {
      const py = P.H - 5
      if (this.keyDir) this.px += this.keyDir * 0.16 * dt
      this.px = Math.max(0, Math.min(P.W - this.pw, this.px))
      const b = this.b
      if (this.stuck) {
        b.x = this.px + this.pw / 2 - 1
        b.y = py - 3
        return
      }
      const steps = Math.ceil(dt / 4)
      for (let n = 0; n < steps; n++) {
        const h = dt / steps
        b.x += b.vx * h
        if (b.x < 0) {
          b.x = 0
          b.vx = Math.abs(b.vx)
        }
        if (b.x > P.W - 2) {
          b.x = P.W - 2
          b.vx = -Math.abs(b.vx)
        }
        if (this.hitBrick()) b.vx = -b.vx
        if (this.stuck) return
        b.y += b.vy * h
        if (b.y < 0) {
          b.y = 0
          b.vy = Math.abs(b.vy)
        }
        if (this.hitBrick()) b.vy = -b.vy
        if (this.stuck) return
        if (
          b.vy > 0 &&
          b.y + 2 >= py &&
          b.y + 2 <= py + 3 &&
          b.x + 2 >= this.px &&
          b.x <= this.px + this.pw
        ) {
          const rel = Math.max(
              -1,
              Math.min(1, (b.x + 1 - (this.px + this.pw / 2)) / (this.pw / 2))
            ),
            s = Math.hypot(b.vx, b.vy),
            a = rel * 1.05
          b.vx = Math.sin(a) * s
          b.vy = -Math.cos(a) * s
          b.y = py - 2
        }
        if (b.y > P.H) {
          this.lives--
          if (this.lives <= 0) return this.lose()
          this.serve()
          this.hud()
          return
        }
      }
    },
    hitBrick() {
      const b = this.b
      for (const k of this.bricks) {
        if (
          k.a &&
          b.x + 2 > k.x &&
          b.x < k.x + k.w &&
          b.y + 2 > k.y &&
          b.y < k.y + k.h
        ) {
          k.a = false
          this.score += k.s ? 3 : 1
          if (this.score > this.best) {
            this.best = this.score
            store.set("brk", this.score)
          }
          this.hud()
          if (!this.bricks.some((q) => q.a)) {
            this.level++
            setHud({ m: `level ${this.level - 1} cleared.`, mc: "sig" })
            won("breakout cleared")
            this.build()
            this.serve()
            this.hud()
          }
          return true
        }
      }
      return false
    },
    lose() {
      setHud({ m: `game over at ${this.score}. tap to go again.`, mc: "sig" })
      this.lives = 3
      this.level = 1
      this.score = 0
      this.build()
      this.serve()
      this.hud()
    },
    draw() {
      clear()
      this.bricks.forEach(
        (k) =>
          k.a &&
          R(
            k.x,
            k.y,
            k.w,
            k.h,
            k.s ? services.pixel.COL.sig : services.pixel.COL.ink
          )
      )
      R(this.px, P.H - 5, this.pw, 2, services.pixel.COL.ink)
      R(this.b.x, this.b.y, 2, 2, services.pixel.COL.ink)
    },
    pmove(p: Point) {
      this.px = p[0] - this.pw / 2
    },
    pdown(p: Point) {
      this.px = p[0] - this.pw / 2
      this.armed = true
    },
    pup() {
      if (this.armed) this.launch()
      this.armed = false
    },
    keydown(e: KeyboardEvent) {
      if (["Space", "ArrowUp", "KeyW"].includes(e.code)) {
        this.launch()
        return true
      }
      const d =
        e.code === "ArrowLeft" || e.code === "KeyA"
          ? -1
          : e.code === "ArrowRight" || e.code === "KeyD"
            ? 1
            : 0
      if (!d) return false
      this.keyDir = d
      return true
    },
    keyup(e: KeyboardEvent) {
      if (["ArrowLeft", "KeyA", "ArrowRight", "KeyD"].includes(e.code))
        this.keyDir = 0
    },
  }

  return BRK
}
