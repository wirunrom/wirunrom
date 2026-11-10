import type { GameServices } from "../game-runtime"
import type { ClickSave, Upgrade } from "../game-types"

export function createShipIt(services: GameServices) {
  const { store, setHud, later, scope, won, fmt, side, $$, deckStage, listen } =
    services
  const { board, label, tap } = services.keypad
  /* 09 ship it — an idle clicker */
  const UPG: Upgrade[] = [
    { id: "duck", n: "rubber duck", d: "+1 per click", c: 15, click: 1 },
    { id: "intern", n: "intern", d: "+1 line / s", c: 50, ps: 1 },
    { id: "so", n: "stack overflow tab", d: "+6 lines / s", c: 400, ps: 6 },
    { id: "ci", n: "ci pipeline", d: "+30 lines / s", c: 3000, ps: 30 },
    {
      id: "ai",
      n: "ai pair programmer",
      d: "+150 lines / s",
      c: 20000,
      ps: 150,
    },
    { id: "farm", n: "server farm", d: "+900 lines / s", c: 150000, ps: 900 },
  ]
  const CLICK = {
    s: { lines: 0, own: {}, total: 0, t: 0 } as ClickSave,
    id: "clicker" as const,
    title: "ship it",
    hint: "tap the key to write code. buy things that write it for you",
    mode: "deck" as const,
    enter() {
      board(1, 1, {
        width: "min(46vw, 210px)",
        depth: 30,
        layers: 8,
        tilt: [40, -12],
      })
      label(0, "SHIP", "01", "ship")
      this.s = store.get<ClickSave>("clk", {
        lines: 0,
        own: {},
        total: 0,
        t: Date.now(),
      })
      const gain =
        Math.min(
          8 * 3600,
          Math.max(0, (Date.now() - (this.s.t || Date.now())) / 1000)
        ) * this.ps()
      if (gain >= 1) {
        this.s.lines += gain
        this.s.total += gain
        setHud({ m: `while you were away: +${fmt(gain)} lines`, mc: "sig" })
      }
      this.renderSide()
      this.hud()
      this.tick()
    },
    ps() {
      return UPG.reduce((a, u) => a + (u.ps || 0) * (this.s.own[u.id] || 0), 0)
    },
    per() {
      return (
        1 +
        UPG.reduce((a, u) => a + (u.click || 0) * (this.s.own[u.id] || 0), 0)
      )
    },
    cost(u: Upgrade) {
      return Math.ceil(u.c * Math.pow(1.15, this.s.own[u.id] || 0))
    },
    hud() {
      setHud({
        c: `${fmt(this.s.lines)} lines`,
        s: `+${fmt(this.ps())}/s · +${fmt(this.per())}/tap`,
      })
    },
    renderSide() {
      side.innerHTML = UPG.map(
        (u) =>
          `<button type="button" data-u="${u.id}"><span><b>${u.n}</b> <span class="mute">×${this.s.own[u.id] || 0}</span></span><span class="cost">${fmt(this.cost(u))}</span><span class="mute">${u.d}</span></button>`
      ).join("")
      this.refresh()
    },
    refresh() {
      $$<HTMLButtonElement>("button", side).forEach((b) => {
        const upgrade = UPG.find((x) => x.id === b.dataset.u)
        b.disabled = !upgrade || this.s.lines < this.cost(upgrade)
      })
    },
    press() {
      tap(0)
      const p = this.per()
      this.s.lines += p
      this.s.total += p
      this.pop(`+${fmt(p)}`)
      this.hud()
      this.refresh()
    },
    buy(id: string) {
      const u = UPG.find((x) => x.id === id)
      if (!u) return
      const c = this.cost(u)
      if (this.s.lines < c) return
      this.s.lines -= c
      this.s.own[id] = (this.s.own[id] || 0) + 1
      this.save()
      this.renderSide()
      this.hud()
    },
    tick() {
      if (!services.isActive(CLICK)) return
      const g = this.ps() / 4
      if (g) {
        this.s.lines += g
        this.s.total += g
        this.hud()
        this.refresh()
      }
      if (this.s.total >= 1e6) won("a million lines shipped")
      this.save()
      later(() => this.tick(), 250)
    },
    save() {
      this.s.t = Date.now()
      store.set("clk", this.s)
    },
    pop(t: string) {
      const e = document.createElement("span")
      e.className = "floater m"
      e.textContent = t
      const r = deckStage.getBoundingClientRect(),
        k = services.keypad.keys[0].getBoundingClientRect()
      e.style.left = `${k.left - r.left + k.width / 2 + (Math.random() - 0.5) * k.width * 0.6}px`
      e.style.top = `${k.top - r.top}px`
      deckStage.appendChild(e)
      scope.timeout(() => e.remove(), 800)
    },
    keydown(e: KeyboardEvent) {
      if (e.code === "Enter" || e.code === "Space") {
        if (!e.repeat) this.press()
        return true
      }
      return false
    },
    exit() {
      this.save()
    },
  }
  listen(side, "click", (e) => {
    const b = (
      e.target instanceof Element ? e.target : null
    )?.closest<HTMLButtonElement>("button[data-u]")
    if (b && services.isActive(CLICK)) CLICK.buy(b.dataset.u!)
  })

  return CLICK
}
