import type { GameServices } from "../game-runtime"

export function createMinesweeper(services: GameServices) {
  const { TOUCH, store, setHud, setReadout, now, later, won } = services
  const { board, label, tap, wave } = services.keypad
  /* 03 minesweeper */
  const MINES = {
    best: 0,
    mine: [] as boolean[],
    open: [] as boolean[],
    flagd: [] as boolean[],
    started: false,
    over: false,
    overAt: 0,
    t0: 0,
    id: "mines" as const,
    title: "minesweeper",
    hint: TOUCH
      ? "tap to open. long-press to flag. 10 mines"
      : "click to open. right-click to flag. 10 mines",
    mode: "deck" as const,
    enter() {
      board(8, 8, {
        width: "min(84%, 500px)",
        depth: 10,
        layers: 4,
        gap: "5px",
        tilt: [40, -8],
      })
      this.best = store.get("mines", 0)
      this.reset()
    },
    reset() {
      this.mine = Array(64).fill(false)
      this.open = Array(64).fill(false)
      this.flagd = Array(64).fill(false)
      this.started = false
      this.over = false
      services.keypad.keys.forEach((k, i) => {
        k.className = "key"
        label(i, "")
      })
      setHud({
        c: "0s",
        s: `10 mines · best ${this.best ? this.best + "s" : "—"}`,
        m: "",
        mc: "mute",
      })
    },
    nb(i: number) {
      const x = i % 8,
        y = (i / 8) | 0,
        r = []
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue
          const a = x + dx,
            b = y + dy
          if (a >= 0 && a < 8 && b >= 0 && b < 8) r.push(b * 8 + a)
        }
      return r
    },
    plant(safe: number) {
      const ban = new Set([safe, ...this.nb(safe)])
      let n = 0
      while (n < 10) {
        const i = (Math.random() * 64) | 0
        if (!ban.has(i) && !this.mine[i]) {
          this.mine[i] = true
          n++
        }
      }
    },
    reveal(i: number) {
      const st = [i]
      while (st.length) {
        const j = st.pop()!
        if (this.open[j] || this.flagd[j]) continue
        this.open[j] = true
        const c = this.nb(j).filter((n) => this.mine[n]).length
        services.keypad.keys[j].classList.add("open")
        label(j, c || "")
        if (!c) this.nb(j).forEach((n) => !this.open[n] && st.push(n))
      }
    },
    press(i: number) {
      if (this.over) {
        if (now() - this.overAt > 600) this.reset()
        return
      }
      if (this.flagd[i] || this.open[i]) return
      tap(i)
      if (!this.started) {
        this.started = true
        this.plant(i)
        this.t0 = now()
        this.tick()
      }
      if (this.mine[i]) return this.lose(i)
      this.reveal(i)
      if (this.open.filter(Boolean).length === 54) {
        this.over = true
        this.overAt = now()
        const t = Math.round((now() - this.t0) / 1000)
        if (!this.best || t < this.best) {
          this.best = t
          store.set("mines", t)
        }
        setHud({
          s: `10 mines · best ${this.best}s`,
          m: `cleared in ${t}s. tap to play again.`,
          mc: "sig",
        })
        wave()
        won("minefield cleared")
      }
    },
    flag(i: number) {
      if (this.over || this.open[i]) return
      this.flagd[i] = !this.flagd[i]
      services.keypad.keys[i].classList.toggle("flag", this.flagd[i])
      label(i, this.flagd[i] ? "×" : "")
      setHud({
        m: `${this.flagd.filter(Boolean).length} / 10 flagged`,
        mc: "mute",
      })
    },
    lose(i: number) {
      this.over = true
      this.overAt = now()
      this.mine.forEach((m, j) => {
        if (m) {
          services.keypad.keys[j].classList.add("mine")
          label(j, "✱")
        }
      })
      services.keypad.keys[i].classList.add("lit")
      setHud({ m: "boom. tap to try again.", mc: "sig" })
    },
    tick() {
      if (this.over || !services.isActive(MINES)) return
      setReadout(`${Math.floor((now() - this.t0) / 1000)}s`)
      later(() => this.tick(), 250)
    },
  }

  return MINES
}
