import type { GameServices } from "../game-runtime"
import type { Obstacle } from "../game-types"

export function createRunner(services: GameServices) {
  const { TOUCH, store, setHud, setReadout, now, won } = services
  const { pxSize, P, clear, R } = services.pixel
  /* 06 runner */
  const RUN = {
    best: 0,
    on: false,
    gy: 0,
    y: 0,
    vy: 0,
    obs: [] as Obstacle[],
    dist: 0,
    speed: 0,
    next: 0,
    live: false,
    dead: false,
    hold: false,
    deadAt: 0,
    id: "runner" as const,
    title: "runner",
    hint: TOUCH
      ? "tap to jump, hold for higher. duck under the blue ones"
      : "space / ↑ to jump, hold for higher. stay under the blue ones",
    mode: "px" as const,
    enter() {
      pxSize()
      this.best = store.get("run", 0)
      this.reset()
      this.on = true
      setHud({
        c: TOUCH ? "tap to start" : "space to start",
        s: `score 0 · best ${this.best}`,
        m: "",
        mc: "mute",
      })
    },
    reset() {
      this.gy = P.H - 8
      this.y = 0
      this.vy = 0
      this.obs = []
      this.dist = 0
      this.speed = 0.07
      this.next = 60
      this.live = false
      this.dead = false
      this.hold = false
    },
    jump() {
      if (this.dead) {
        if (now() - this.deadAt < 500) return
        this.reset()
      }
      if (!this.live) {
        this.live = true
        setHud({ c: "0", m: "" })
      }
      if (this.y === 0) this.vy = 0.16
      this.hold = true
    },
    update(dt: number) {
      if (!this.live || this.dead) return
      this.dist += this.speed * dt
      this.speed = Math.min(0.2, 0.07 + this.dist / 40000)
      this.vy -= (this.hold && this.vy > 0 ? 0.00032 : 0.0007) * dt
      this.y += this.vy * dt
      if (this.y <= 0) {
        this.y = 0
        this.vy = 0
      }
      this.next -= this.speed * dt
      if (this.next <= 0) {
        const fly = this.dist > 600 && Math.random() < 0.25,
          tall = Math.random() < 0.45
        this.obs.push(
          fly
            ? { x: P.W, w: 6, h: 3, y: 11 + ((Math.random() * 6) | 0) }
            : {
                x: P.W,
                w: 2 + ((Math.random() * 4) | 0),
                h: tall
                  ? 10 + ((Math.random() * 4) | 0)
                  : 5 + ((Math.random() * 3) | 0),
                y: 0,
              }
        )
        this.next = 40 + Math.random() * 60 + this.speed * 120
      }
      this.obs.forEach((o) => (o.x -= this.speed * dt))
      this.obs = this.obs.filter((o) => o.x + o.w > 0)
      for (const o of this.obs)
        if (
          17 > o.x + 0.5 &&
          12 < o.x + o.w - 0.5 &&
          this.y < o.y + o.h &&
          this.y + 7 > o.y
        )
          return this.die()
      const sc = Math.floor(this.dist / 10)
      setReadout(String(sc))
      if (sc >= 300) won("300 on the runner")
    },
    die() {
      this.dead = true
      this.deadAt = now()
      const sc = Math.floor(this.dist / 10),
        nb = sc > this.best
      if (nb) {
        this.best = sc
        store.set("run", sc)
      }
      setHud({
        c: String(sc),
        s: `score ${sc} · best ${this.best}`,
        m: nb ? "new best. jump to retry." : "tripped. jump to retry.",
        mc: "sig",
      })
    },
    draw() {
      clear()
      const gy = this.gy
      R(0, gy, P.W, 1, services.pixel.COL.ink)
      const off = this.dist % 8
      for (let x = -off; x < P.W; x += 8)
        R(x, gy + 3, 3, 1, services.pixel.COL.mute)
      const top = gy - this.y - 7
      R(
        12,
        top,
        5,
        7,
        this.dead ? services.pixel.COL.sig : services.pixel.COL.ink
      )
      R(15, top + 1, 1, 1, services.pixel.COL.paper)
      if (this.live && !this.dead && this.y === 0)
        R(
          12 + (((this.dist / 4) | 0) % 2) * 3,
          gy - 1,
          2,
          1,
          services.pixel.COL.paper
        )
      this.obs.forEach((o) =>
        R(
          o.x,
          gy - o.y - o.h,
          o.w,
          o.h,
          o.y ? services.pixel.COL.sig : services.pixel.COL.ink
        )
      )
    },
    keydown(e: KeyboardEvent) {
      if (["Space", "ArrowUp", "KeyW"].includes(e.code)) {
        if (!e.repeat) this.jump()
        return true
      }
      return false
    },
    keyup(e: KeyboardEvent) {
      if (["Space", "ArrowUp", "KeyW"].includes(e.code)) this.hold = false
    },
    pdown() {
      this.jump()
    },
    pup() {
      this.hold = false
    },
  }

  return RUN
}
