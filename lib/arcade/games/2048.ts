import type { GameServices } from "../game-runtime"
import type { Direction } from "../game-types"

export function create2048(services: GameServices) {
  const { TOUCH, store, setHud, won } = services
  const { board, label, flash } = services.keypad
  /* 02 2048 */
  const G2048 = {
    best: 0,
    g: [] as number[],
    score: 0,
    over: false,
    id: "g2048" as const,
    title: "2048",
    hint: TOUCH
      ? "swipe on the board. merge equal numbers"
      : "arrows / wasd. merge equal numbers",
    mode: "deck" as const,
    enter() {
      board(4, 4, { width: "min(76%, 380px)", depth: 18 })
      this.best = store.get("2048", 0)
      this.reset()
    },
    reset() {
      this.g = Array(16).fill(0)
      this.score = 0
      this.over = false
      this.add()
      this.add()
      this.render()
      setHud({ m: "", mc: "mute" })
    },
    add() {
      const e = this.g.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0)
      if (!e.length) return -1
      const i = e[(Math.random() * e.length) | 0]
      this.g[i] = Math.random() < 0.9 ? 2 : 4
      return i
    },
    render(pop: number[] = []) {
      services.keypad.keys.forEach((k, i) => {
        const v = this.g[i]
        label(i, v || "")
        k.classList.toggle("empty", !v)
        k.classList.toggle("hot", v >= 8 && v < 128)
        k.classList.toggle("lit", v >= 128)
      })
      pop.forEach((i) => i >= 0 && flash(i, "pop", 140))
      setHud({
        c: `max tile ${Math.max(...this.g)}`,
        s: `score ${this.score} · best ${this.best}`,
      })
    },
    move(d: Direction) {
      if (this.over) return this.reset()
      let moved = false
      const merged = []
      for (let a = 0; a < 4; a++) {
        const l = []
        for (let b = 0; b < 4; b++)
          l.push(
            d === "l"
              ? a * 4 + b
              : d === "r"
                ? a * 4 + 3 - b
                : d === "u"
                  ? b * 4 + a
                  : (3 - b) * 4 + a
          )
        const vals = l.map((i) => this.g[i]).filter(Boolean),
          out: number[] = []
        for (let j = 0; j < vals.length; j++) {
          if (vals[j] === vals[j + 1]) {
            out.push(vals[j] * 2)
            this.score += vals[j] * 2
            merged.push(l[out.length - 1])
            j++
          } else out.push(vals[j])
        }
        l.forEach((i, j) => {
          const nv = out[j] || 0
          if (this.g[i] !== nv) moved = true
          this.g[i] = nv
        })
      }
      if (!moved) return
      const n = this.add()
      if (this.score > this.best) {
        this.best = this.score
        store.set("2048", this.score)
      }
      this.render([...merged, n])
      const mx = Math.max(...this.g)
      if (mx >= 128) won("128 tile")
      if (mx >= 2048) setHud({ m: "2048. you actually did it.", mc: "sig" })
      if (!this.canMove()) {
        this.over = true
        setHud({ m: "no moves left. any move restarts.", mc: "sig" })
      }
    },
    canMove() {
      if (this.g.includes(0)) return true
      for (let i = 0; i < 16; i++) {
        if (i % 4 < 3 && this.g[i] === this.g[i + 1]) return true
        if (i < 12 && this.g[i] === this.g[i + 4]) return true
      }
      return false
    },
    keydown(e: KeyboardEvent) {
      const mapping: Partial<Record<string, Direction>> = {
        ArrowLeft: "l",
        KeyA: "l",
        ArrowRight: "r",
        KeyD: "r",
        ArrowUp: "u",
        KeyW: "u",
        ArrowDown: "d",
        KeyS: "d",
      }
      const d = mapping[e.code]
      if (!d) return false
      this.move(d)
      return true
    },
    swipe(d: Direction) {
      this.move(d)
    },
  }

  return G2048
}
