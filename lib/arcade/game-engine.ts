import { gsap } from "gsap"
import { QUICK_HELP } from "./content"
import { createLifetime } from "./lifetime"
import { arcadeStore } from "./storage"

import type {
  BoardOptions,
  Brick,
  ClickSave,
  Direction,
  FallingPiece,
  Game,
  HudUpdate,
  Matrix,
  Obstacle,
  Piece,
  Point,
  Shape,
  TetrisAction,
  Upgrade,
} from "./game-types"

const DIRECTION_VECTORS: Record<Direction, Point> = {
  l: [-1, 0],
  r: [1, 0],
  u: [0, -1],
  d: [0, 1],
}

/**
 * Canvas and 3D-keypad driver. React owns the console shell; this instance owns
 * only the children of the ref-bound game surfaces, never page markup.
 * Every game state object is created per mount, with explicit resource teardown.
 */
export function mountGame(root: HTMLElement, gameIndex: number): () => void {
  const scope = createLifetime(window)
  const listen = <K extends keyof GlobalEventHandlersEventMap>(
    target: EventTarget,
    type: K,
    callback: (event: GlobalEventHandlersEventMap[K]) => void,
    options?: AddEventListenerOptions
  ) =>
    scope.on(
      target,
      type,
      (event) => callback(event as GlobalEventHandlersEventMap[K]),
      options
    )
  const addEventListener = <K extends keyof GlobalEventHandlersEventMap>(
    type: K,
    callback: (event: GlobalEventHandlersEventMap[K]) => void,
    options?: AddEventListenerOptions
  ) => listen(window, type, callback, options)
  const RM = matchMedia("(prefers-reduced-motion: reduce)").matches
  const $ = <T extends HTMLElement = HTMLElement>(
    selector: string,
    parent: ParentNode = root
  ): T => {
    const element = parent.querySelector<T>(selector)
    if (!element) throw new Error(`Missing arcade element: ${selector}`)
    return element
  }
  const $$ = <T extends HTMLElement = HTMLElement>(
    selector: string,
    parent: ParentNode = root
  ): T[] => [...parent.querySelectorAll<T>(selector)]
  const seen = new WeakMap<Element, boolean>()
  const io = new IntersectionObserver((entries) =>
    entries.forEach((entry) => seen.set(entry.target, entry.isIntersecting))
  )
  const watch = <T extends Element>(element: T): T => {
    io.observe(element)
    return element
  }
  const visible = (element: Element) =>
    !document.hidden && seen.get(element) !== false
  const animations = gsap.context(() => {}, root)
  /* ── game console: ten cartridges share one stage ── */
  const deck = $("#deck"),
    deckStage = watch($("#deckstage")),
    cons = root,
    side = $("#side")
  const hud = {
    t: $("#gtitle"),
    h: $("#ghint"),
    c: $("#gread"),
    s: $("#gstat"),
    m: $("#gmsg"),
  }
  const setReadout = (value: string) => {
    hud.c.textContent = value
    root.dataset.readoutIdle = String(
      !value || /to start|to launch/i.test(value)
    )
  }
  const setHud = (o: HudUpdate) => {
    for (const k of Object.keys(o) as (keyof HudUpdate)[]) {
      const value = o[k]
      if (value === undefined) continue
      if (k === "mc") hud.m.className = value
      else if (k === "c") setReadout(value)
      else hud[k].textContent = value
      if (k === "h") $("#ghelp").textContent = value
    }
  }
  const store = arcadeStore
  const timers = new Set<number>()
  const later = (fn: () => void, ms: number) => {
    const id = scope.timeout(() => {
      timers.delete(id)
      fn()
    }, ms)
    timers.add(id)
    return id
  }
  const clearTimers = () => {
    timers.forEach(scope.cancelTimeout)
    timers.clear()
  }
  const now = () => performance.now()
  const fmt = (n: number) => Math.floor(n).toLocaleString("en-US")
  const TOUCH = matchMedia("(pointer: coarse)").matches

  /* 2.5D key boards */
  let keys: HTMLButtonElement[] = []
  let tiltBase: Point = [46, -10]
  function board(cols: number, rows: number, o: BoardOptions = {}) {
    const depth = o.depth || 18,
      layers = o.layers || 6
    deck.innerHTML = ""
    keys = []
    deck.style.setProperty("--cols", String(cols))
    deck.style.setProperty("--gap", o.gap || "10px")
    deck.style.width = o.width || "min(100%, 460px)"
    for (let i = 0; i < cols * rows; i++) {
      const k = document.createElement("button")
      k.className = "key"
      k.type = "button"
      k.dataset.i = String(i)
      k.setAttribute("aria-label", `Game key ${i + 1}`)
      let s = ""
      for (let z = 0; z < layers; z++)
        s += `<span class="s" style="--z:${(z / layers) * depth}"></span>`
      k.innerHTML =
        s +
        `<span class="top" style="--depth:${depth}"><i></i><b></b><u></u></span>`
      deck.appendChild(k)
      keys.push(k)
    }
    tiltBase = o.tilt ? [...o.tilt] : [46, -10]
    if (innerWidth < 600) {
      tiltBase[0] -= 8
      tiltBase[1] *= 0.6
    }
    deck.style.transform = ""
  }
  const label = (i: number, t: string | number = "", corner = "", sub = "") => {
    const k = keys[i],
      b = $("b", k),
      L = String(t).length
    k.setAttribute(
      "aria-label",
      [t, corner, sub].filter(Boolean).join(" ") || `Game key ${i + 1}`
    )
    b.textContent = String(t)
    b.style.fontSize = (L <= 1 ? 58 : L === 2 ? 44 : L === 3 ? 32 : 25) + "cqw"
    $("i", k).textContent = corner
    $("u", k).textContent = sub
  }
  const tap = (i: number) => {
    const k = keys[i]
    if (!k) return
    k.classList.add("down")
    scope.timeout(() => k.classList.remove("down"), 120)
  }
  const flash = (i: number, c: string, ms: number) => {
    if (!keys[i]) return
    keys[i].classList.add(c)
    later(() => keys[i] && keys[i].classList.remove(c), ms)
  }
  const wave = () => {
    if (!RM)
      animations.add(() =>
        gsap.fromTo(
          keys,
          { z: 0 },
          {
            z: -14,
            duration: 0.16,
            stagger: 0.025,
            yoyo: true,
            repeat: 1,
            ease: "power2.out",
            clearProps: "transform",
          }
        )
      )
  }

  /* the locked cartridge opens when you win anything */
  function won(how: string) {
    if (store.get("unlocked", false)) return
    store.set("unlocked", true)
    later(
      () =>
        setHud({
          m: `${how}. secret game unlocked. refresh to find it.`,
          mc: "sig",
        }),
      1200
    )
  }

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
      keys.forEach((k, i) => k.classList.toggle("lit", this.on[i]))
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
      keys.forEach((k, i) => {
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
      keys.forEach((k, i) => {
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
        keys[j].classList.add("open")
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
      keys[i].classList.toggle("flag", this.flagd[i])
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
          keys[j].classList.add("mine")
          label(j, "✱")
        }
      })
      keys[i].classList.add("lit")
      setHud({ m: "boom. tap to try again.", mc: "sig" })
    },
    tick() {
      if (this.over || cur !== MINES) return
      setReadout(`${Math.floor((now() - this.t0) / 1000)}s`)
      later(() => this.tick(), 250)
    },
  }

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
      keys.forEach((k, i) => label(i, "", "", sub(i)))
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
      const free = keys.map((_, i) => i).filter((i) => !this.hot.has(i))
      if (free.length) {
        const i = free[(Math.random() * free.length) | 0],
          bad = Math.random() < 0.2
        this.hot.set(i, bad)
        keys[i].classList.add(bad ? "trap" : "hot")
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
      keys[i].classList.remove("hot", "trap")
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

  /* pixel games: one low-res 1-bit canvas, scaled up crisp */
  const px = $<HTMLCanvasElement>("#px")
  const context = px.getContext("2d")
  if (!context) throw new Error("The arcade requires a 2D canvas context")
  const pctx = context
  const P = { W: 0, H: 0, S: 4 }
  let COL = { paper: "", ink: "", sig: "", mute: "" }
  const readCols = () => {
    const cs = getComputedStyle(root)
    COL = {
      paper: cs.getPropertyValue("--paper").trim(),
      ink: cs.getPropertyValue("--ink").trim(),
      sig: cs.getPropertyValue("--signal").trim(),
      mute: cs.getPropertyValue("--mute").trim(),
    }
  }
  scope.on(window, "arcade-theme-change", () => readCols())
  function pxSize() {
    const r = deckStage.getBoundingClientRect()
    P.S = r.width < 600 ? 3 : 4
    P.W = Math.max(32, Math.floor((r.width - 2) / P.S))
    P.H = Math.max(64, Math.floor((r.height - 2) / P.S))
    px.width = P.W
    px.height = P.H
    px.style.width = P.W * P.S + "px"
    px.style.height = P.H * P.S + "px"
  }
  const R = (x: number, y: number, w: number, h: number, c: string) => {
    pctx.fillStyle = c
    pctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h))
  }
  const clear = () => R(0, 0, P.W, P.H, COL.paper)
  const pt = (e: PointerEvent): Point => {
    const r = px.getBoundingClientRect()
    return [
      ((e.clientX - r.left) / r.width) * P.W,
      ((e.clientY - r.top) / r.height) * P.H,
    ]
  }
  const swipeDir = (a: Point, b: Point, min: number): Direction | null => {
    const dx = b[0] - a[0],
      dy = b[1] - a[1]
    if (Math.max(Math.abs(dx), Math.abs(dy)) < min) return null
    return Math.abs(dx) > Math.abs(dy)
      ? dx > 0
        ? "r"
        : "l"
      : dy > 0
        ? "d"
        : "u"
  }

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
        (k) => k.a && R(k.x, k.y, k.w, k.h, k.s ? COL.sig : COL.ink)
      )
      R(this.px, P.H - 5, this.pw, 2, COL.ink)
      R(this.b.x, this.b.y, 2, 2, COL.ink)
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
      R(0, gy, P.W, 1, COL.ink)
      const off = this.dist % 8
      for (let x = -off; x < P.W; x += 8) R(x, gy + 3, 3, 1, COL.mute)
      const top = gy - this.y - 7
      R(12, top, 5, 7, this.dead ? COL.sig : COL.ink)
      R(15, top + 1, 1, 1, COL.paper)
      if (this.live && !this.dead && this.y === 0)
        R(12 + (((this.dist / 4) | 0) % 2) * 3, gy - 1, 2, 1, COL.paper)
      this.obs.forEach((o) =>
        R(o.x, gy - o.y - o.h, o.w, o.h, o.y ? COL.sig : COL.ink)
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
      R(ox - 1, oy - 1, c * 10 + 2, c * 20 + 2, COL.ink)
      R(ox, oy, c * 10, c * 20, COL.paper)
      this.g.forEach((r, j) =>
        r.forEach(
          (v, i) =>
            v &&
            R(ox + i * c, oy + j * c, c - 1, c - 1, v === 2 ? COL.sig : COL.ink)
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
                COL.mute
              )
          )
        )
      }
      const pc = this.p.k === "T" || this.p.k === "I" ? COL.sig : COL.ink
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
            (v, i) => v && R(nx + i * c, oy + c + j * c, c - 1, c - 1, COL.ink)
          )
        )
    },
  }

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
      R(this.food[0] * c, this.food[1] * c, c, c, COL.sig)
      this.body.forEach(([i, j], k) =>
        R(
          i * c,
          j * c,
          c - (k ? 1 : 0),
          c - (k ? 1 : 0),
          this.dead && !k ? COL.sig : COL.ink
        )
      )
    },
  }

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
      if (cur !== CLICK) return
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
        k = keys[0].getBoundingClientRect()
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
    if (b && cur === CLICK) CLICK.buy(b.dataset.u!)
  })

  /* 10 ???? — three locks */
  const termlog = $("#termlog"),
    termin = $<HTMLInputElement>("#termin")
  const CIPH = {
    lv: 0,
    wrong: 0,
    id: "ciph" as const,
    title: "????",
    hint: "three locks. answers are lowercase",
    mode: "term" as const,
    L: [
      {
        q: "68 65 6c 6c 6f",
        a: "hello",
        t: "hex → text",
        h: "two digits, one letter. look up an ascii table.",
      },
      {
        q: "vhfuhw",
        a: "secret",
        t: "caesar shift",
        h: "every letter moved three steps forward. move them back.",
      },
      {
        q: "01101000 01101001",
        a: "hi",
        t: "binary → text",
        h: "eight bits, one letter.",
      },
    ],
    enter() {
      this.lv = store.get("ciph2", 0)
      this.wrong = 0
      this.render()
      if (!TOUCH) scope.timeout(() => termin.focus({ preventScroll: true }), 60)
    },
    render(msg = "") {
      const L = this.L,
        lv = this.lv
      if (lv >= L.length) {
        termlog.innerHTML =
          '<div class="mute">all locks open.</div><div class="q">access granted.</div><div>there is nothing else down here.</div><div>no prize, no form, no newsletter.</div><div class="sig">just: thanks for playing.</div><div class="mute">(type "reset" to lock it again)</div>'
        setHud({
          c: "access granted",
          s: "3 / 3 open",
          m: msg || "",
          mc: "sig",
        })
        return
      }
      const it = L[lv]
      termlog.innerHTML = `<div class="mute">lock 0${lv + 1} / 03 · ${it.t}</div><div class="q">${it.q}</div><div class="mute">${this.wrong >= 2 ? "hint: " + it.h : "&nbsp;"}</div>`
      setHud({
        c: `lock ${lv + 1} / 3`,
        s: `${lv} / 3 open`,
        m: msg || "",
        mc: msg === "open." ? "sig" : "mute",
      })
    },
    submit(v: string) {
      v = v.trim().toLowerCase()
      if (v === "reset") {
        this.lv = 0
        this.wrong = 0
        store.set("ciph2", 0)
        return this.render("locked again.")
      }
      if (this.lv >= this.L.length || !v) return
      if (v === this.L[this.lv].a) {
        this.lv++
        this.wrong = 0
        store.set("ciph2", this.lv)
        this.render("open.")
      } else {
        this.wrong++
        this.render(this.wrong >= 2 ? "no. here is a hint." : "no.")
      }
    },
  }
  listen($("#termf"), "submit", (e) => {
    e.preventDefault()
    CIPH.submit(termin.value)
    termin.value = ""
  })

  /* One randomly dealt game per page load; no game-selection controls. */
  const GAMES: Game[] = [
    LIGHTS,
    G2048,
    MINES,
    WHACK,
    BRK,
    RUN,
    TET,
    SNAKE,
    CLICK,
    CIPH,
  ]
  let cur: Game | null = null
  function load(n: number) {
    if (cur && cur.exit) cur.exit()
    clearTimers()
    if (cur && cur.mode === "px") cur.on = false
    const game = GAMES[n]
    if (!game) throw new RangeError(`Unknown arcade game index: ${n}`)
    cur = game
    cons.dataset.game = cur.id
    cons.dataset.mode = cur.mode
    $("#gquick").textContent = QUICK_HELP[cur.id][TOUCH ? 0 : 1]
    setHud({
      t: `${String(n + 1).padStart(2, "0")} / ${cur.title}`,
      h: cur.hint,
      c: "",
      s: "",
      m: "",
      mc: "mute",
    })
    if (cur.mode === "px") readCols()
    px.setAttribute("aria-label", cur.title + " game")
    cur.enter()
    if (cur.mode === "px") cur.draw()
  }

  // keys: click, right-click / long-press to flag
  let lp = 0,
    lpFired = false
  listen(deck, "click", (e) => {
    const k = (
      e.target instanceof Element ? e.target : null
    )?.closest<HTMLButtonElement>(".key")
    if (!k || !cur || !cur.press) return
    if (lpFired) {
      lpFired = false
      return
    }
    cur.press(Number(k.dataset.i))
  })
  listen(deck, "contextmenu", (e) => {
    const k = (
      e.target instanceof Element ? e.target : null
    )?.closest<HTMLButtonElement>(".key")
    if (k && cur && cur.flag) {
      e.preventDefault()
      cur.flag(Number(k.dataset.i))
    }
  })
  listen(deck, "pointerdown", (e) => {
    const k = (
      e.target instanceof Element ? e.target : null
    )?.closest<HTMLButtonElement>(".key")
    if (!k || !cur || !cur.flag || e.pointerType === "mouse") return
    lpFired = false
    const flag = cur.flag.bind(cur)
    lp = scope.timeout(() => {
      lpFired = true
      flag(Number(k.dataset.i))
      if (navigator.vibrate) navigator.vibrate(15)
    }, 420)
  })
  ;(["pointerup", "pointercancel", "pointerleave"] as const).forEach((t) =>
    listen(deck, t, () => scope.cancelTimeout(lp))
  )
  // swipes on the board (2048)
  let sw0: Point | null = null
  listen(deckStage, "pointerdown", (e) => {
    if (cur && cur.swipe) sw0 = [e.clientX, e.clientY]
  })
  listen(deckStage, "pointerup", (e) => {
    if (!sw0 || !cur || !cur.swipe) return
    const d = swipeDir(sw0, [e.clientX, e.clientY], 24)
    sw0 = null
    if (d) cur.swipe(d)
  })
  // pixel canvas pointer
  listen(px, "pointerdown", (e) => {
    if (cur && cur.pdown) {
      px.setPointerCapture(e.pointerId)
      cur.pdown(pt(e), e)
    }
  })
  listen(px, "pointermove", (e) => cur && cur.pmove && cur.pmove(pt(e), e))
  listen(px, "pointerup", (e) => cur && cur.pup && cur.pup(pt(e), e))
  // keyboard
  addEventListener("keydown", (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || !cur) return
    if (
      (e.target instanceof Element ? e.target : null)?.closest &&
      (e.target instanceof Element ? e.target : null)?.closest(
        "input, textarea, summary"
      )
    )
      return
    if (
      (e.code === "Space" || e.code === "Enter") &&
      (e.target instanceof Element ? e.target : null)?.closest &&
      (e.target instanceof Element ? e.target : null)?.closest(
        ".key, .side button"
      )
    )
      return
    if (!visible(deckStage)) return
    if (cur.keydown && cur.keydown(e)) e.preventDefault()
  })
  addEventListener("keyup", (e) => cur && cur.keyup && cur.keyup(e))
  // Observe the independently sized stage, never the canvas's intrinsic size.
  // This also catches parent/container changes without a window resize.
  let rsz = 0
  const stageResize = new ResizeObserver(() => {
    scope.cancelTimeout(rsz)
    rsz = scope.timeout(() => {
      if (!cur || cur.mode !== "px") return
      const r = deckStage.getBoundingClientRect(),
        scale = r.width < 600 ? 3 : 4
      const w = Math.max(32, Math.floor((r.width - 2) / scale))
      const h = Math.max(64, Math.floor((r.height - 2) / scale))
      if (w === P.W && h === P.H && scale === P.S) return
      cur.enter()
      cur.draw()
    }, 100)
  })
  stageResize.observe(deckStage)

  // one loop drives the pixel games
  let lastT = 0
  function pxLoop(t: number) {
    if (cur && cur.mode === "px" && cur.on && visible(deckStage)) {
      cur.update(Math.min(50, t - (lastT || t)))
      cur.draw()
    }
    lastT = t
    scope.frame(pxLoop)
  }
  pxLoop(0)

  // pointer tilts the board
  const tilt = { x: 0, y: 0, tx: 0, ty: 0 }
  listen(deckStage, "pointermove", (e) => {
    if (e.pointerType !== "mouse") return
    const r = deckStage.getBoundingClientRect()
    tilt.tx = ((e.clientX - r.left) / r.width - 0.5) * 2
    tilt.ty = ((e.clientY - r.top) / r.height - 0.5) * 2
  })
  listen(deckStage, "pointerleave", () => {
    tilt.tx = 0
    tilt.ty = 0
  })
  function deckTick() {
    if (visible(deckStage) && cur && cur.mode === "deck") {
      const k = RM ? 1 : 0.08
      tilt.x += (tilt.tx - tilt.x) * k
      tilt.y += (tilt.ty - tilt.y) * k
      if (
        Math.abs(tilt.tx - tilt.x) + Math.abs(tilt.ty - tilt.y) > 0.0005 ||
        !deck.style.transform
      )
        deck.style.transform = `rotateX(${tiltBase[0] - tilt.y * 6}deg) rotateZ(${tiltBase[1] + tilt.x * 5}deg) rotateY(${tilt.x * 3}deg)`
    }
    scope.frame(deckTick)
  }
  deckTick()

  /* easter egg: konami flips the file negative (physical keys, any layout) */
  const KON = [
    "ArrowUp",
    "ArrowUp",
    "ArrowDown",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "ArrowLeft",
    "ArrowRight",
    "KeyB",
    "KeyA",
  ]
  const KSYM: Record<string, string> = {
    ArrowUp: "↑",
    ArrowDown: "↓",
    ArrowLeft: "←",
    ArrowRight: "→",
    KeyB: "b",
    KeyA: "a",
  }
  let kp = 0
  addEventListener("keydown", (e) => {
    const k = e.code
    if (!(k in KSYM)) return
    kp = k === KON[kp] ? kp + 1 : k === KON[0] ? (kp === 2 ? 2 : 1) : 0
    if (kp >= 3 && kp < KON.length)
      setHud({
        m:
          KON.slice(0, kp)
            .map((c) => KSYM[c])
            .join(" ") + " …",
        mc: "sig",
      })
    if (kp === KON.length) {
      kp = 0
      const on = document.documentElement.classList.toggle("negative")
      const status = root.closest(".arcade-app")?.querySelector("[data-status]")
      if (status) status.textContent = on ? "inverted" : "unstable"
      readCols()
      setHud({
        m: on ? "konami. the file is inverted." : "back to normal.",
        mc: "sig",
      })
      won("konami")
    }
  })
  load(gameIndex)

  return () => {
    if (cur?.exit) cur.exit()
    if (cur?.mode === "px") cur.on = false
    scope.dispose()
    io.disconnect()
    stageResize.disconnect()
    animations.revert()
    deck.replaceChildren()
    side.replaceChildren()
    termlog.replaceChildren()
    root.querySelectorAll(".floater").forEach((element) => element.remove())
    document.documentElement.classList.remove("negative")
  }
}
