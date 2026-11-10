import type { GameServices } from "../game-runtime"

export function createWhackAMole(services: GameServices) {
  const { TOUCH, store, setHud, setReadout, now, later, scope, won } = services
  const { board, label, tap, flash } = services.keypad
  /* 04 whack-a-mole */
  const WK = [
    "KeyQ",
    "KeyW",
    "KeyE",
    "KeyA",
    "KeyS",
    "KeyD",
    "KeyZ",
    "KeyX",
    "KeyC",
  ]
  const sub = (i: number) => (TOUCH ? "" : "qweasdzxc"[i])
  const WHACK = {
    best: 0,
    on: false,
    hot: new Map<number, boolean>(),
    score: 0,
    t0: 0,
    endAt: 0,
    id: "whack" as const,
    title: "whack-a-mole",
    hint: "hit the black keys, never the blue ones. 20 seconds",
    mode: "deck" as const,
    enter() {
      board(3, 3, { width: "min(72%, 340px)", depth: 22 })
      services.keypad.keys.forEach((k, i) => label(i, "", "", sub(i)))
      this.best = store.get("whack", 0)
      this.on = false
      this.hot = new Map()
      setHud({
        c: "tap any key to start",
        s: `score 0 · best ${this.best}`,
        m: "",
        mc: "mute",
      })
    },
    start() {
      this.on = true
      this.score = 0
      this.t0 = now()
      this.hot.clear()
      this.upd()
      this.spawn()
      this.tick()
    },
    spawn() {
      if (!this.on) return
      const p = Math.min(1, (now() - this.t0) / 20000)
      const free = services.keypad.keys
        .map((_, i) => i)
        .filter((i) => !this.hot.has(i))
      if (free.length) {
        const i = free[(Math.random() * free.length) | 0],
          bad = Math.random() < 0.2
        this.hot.set(i, bad)
        services.keypad.keys[i].classList.add(bad ? "trap" : "hot")
        label(i, bad ? "✕" : "●", "", sub(i))
        later(
          () => {
            if (this.hot.has(i)) {
              this.hot.delete(i)
              this.clr(i)
            }
          },
          1000 - 450 * p
        )
      }
      later(() => this.spawn(), 620 - 300 * p)
    },
    clr(i: number) {
      services.keypad.keys[i].classList.remove("hot", "trap")
      label(i, "", "", sub(i))
    },
    tick() {
      if (!this.on) return
      const left = Math.max(0, 20 - (now() - this.t0) / 1000)
      setReadout(`${left.toFixed(1)}s`)
      if (left <= 0) return this.end()
      scope.frame(() => this.tick())
    },
    upd() {
      setHud({ s: `score ${this.score} · best ${this.best}` })
    },
    press(i: number) {
      tap(i)
      if (!this.on) {
        if (now() - (this.endAt || 0) > 900) this.start()
        return
      }
      if (this.hot.has(i)) {
        const bad = this.hot.get(i)
        this.hot.delete(i)
        this.clr(i)
        if (bad) {
          this.score = Math.max(0, this.score - 3)
          flash(i, "bad", 250)
          setHud({ m: "that was a trap. -3", mc: "sig" })
        } else {
          this.score++
          flash(i, "ok", 160)
        }
      } else {
        this.score = Math.max(0, this.score - 1)
        flash(i, "bad", 200)
      }
      this.upd()
    },
    end() {
      this.on = false
      this.endAt = now()
      ;[...this.hot.keys()].forEach((i) => this.clr(i))
      this.hot.clear()
      const nb = this.score > this.best
      if (nb) {
        this.best = this.score
        store.set("whack", this.score)
      }
      setHud({
        c: "time. tap to retry",
        s: `score ${this.score} · best ${this.best}`,
        m: nb ? "new best." : "",
        mc: "sig",
      })
      if (this.score >= 15) won("15 whacks")
    },
    keydown(e: KeyboardEvent) {
      const i = WK.indexOf(e.code)
      if (i < 0) return false
      this.press(i)
      return true
    },
    exit() {
      this.on = false
    },
  }

  return WHACK
}
