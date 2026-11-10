import type { GameServices } from "../game-runtime"

export function createLightsOut(services: GameServices) {
  const { store, setHud, now, won } = services
  const { board, tap, wave } = services.keypad
  /* 01 lights out */
  const LIGHTS = {
    best: 0,
    on: [] as boolean[],
    moves: 0,
    done: false,
    doneAt: 0,
    id: "lights" as const,
    title: "lights out",
    hint: "each press flips a key and its neighbours. turn every light off",
    mode: "deck" as const,
    enter() {
      board(5, 5, { width: "min(80%, 440px)", depth: 16 })
      this.best = store.get("lights", 0)
      this.deal()
    },
    deal() {
      this.on = Array(25).fill(false)
      for (let n = 0; n < 9; n++) this.flip((Math.random() * 25) | 0)
      if (!this.on.some(Boolean)) this.flip(12)
      this.moves = 0
      this.done = false
      this.render()
      setHud({ m: "", mc: "mute" })
    },
    flip(i: number) {
      const x = i % 5,
        y = (i / 5) | 0
      ;[
        [0, 0],
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ].forEach(([dx, dy]) => {
        const a = x + dx,
          b = y + dy
        if (a >= 0 && a < 5 && b >= 0 && b < 5)
          this.on[b * 5 + a] = !this.on[b * 5 + a]
      })
    },
    render() {
      services.keypad.keys.forEach((k, i) =>
        k.classList.toggle("lit", this.on[i])
      )
      setHud({
        c: `${this.on.filter(Boolean).length} lights on`,
        s: `moves ${this.moves} · best ${this.best || "—"}`,
      })
    },
    press(i: number) {
      tap(i)
      if (this.done) {
        if (now() - this.doneAt > 600) this.deal()
        return
      }
      this.flip(i)
      this.moves++
      this.render()
      if (!this.on.some(Boolean)) {
        this.done = true
        this.doneAt = now()
        if (!this.best || this.moves < this.best) {
          this.best = this.moves
          store.set("lights", this.moves)
        }
        this.render()
        setHud({ m: `dark in ${this.moves}. tap to deal again.`, mc: "sig" })
        wave()
        won("lights out")
      }
    },
  }

  return LIGHTS
}
