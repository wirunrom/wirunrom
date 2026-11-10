import { GAME_HELP, QUICK_HELP } from "./content"

import { createGameRuntime } from "./game-runtime"
import { swipeDir } from "./game-controls"
import type { Game, Point } from "./game-types"
import { createLightsOut } from "./games/lights-out"
import { create2048 } from "./games/2048"
import { createMinesweeper } from "./games/minesweeper"
import { createWhackAMole } from "./games/whack-a-mole"
import { createBreakout } from "./games/breakout"
import { createRunner } from "./games/runner"
import { createTetris } from "./games/tetris"
import { createSnake } from "./games/snake"
import { createShipIt } from "./games/ship-it"
import { createCipher } from "./games/cipher"

/**
 * Canvas and 3D-keypad driver. React owns the console shell; this instance owns
 * only the children of the ref-bound game surfaces, never page markup.
 * Every game state object is created per mount, with explicit resource teardown.
 */
export function mountGame(root: HTMLElement, gameIndex: number): () => void {
  let cur: Game | null = null
  const seen = new WeakMap<Element, boolean>()
  const visible = (element: Element) =>
    !document.hidden && seen.get(element) !== false
  const services = createGameRuntime(root, visible, (game) => cur === game)
  const {
    scope,
    $,
    deck,
    deckStage,
    listen,
    RM,
    TOUCH,
    setHud,
    clearTimers,
    won,
  } = services
  const { pixel, keypad } = services
  const { px, P, pt, readCols } = pixel
  const cons = root
  const addEventListener = <K extends keyof GlobalEventHandlersEventMap>(
    type: K,
    callback: (event: GlobalEventHandlersEventMap[K]) => void,
    options?: AddEventListenerOptions
  ) => listen(window, type, callback, options)
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => seen.set(entry.target, entry.isIntersecting))
    if (
      pixel.colorsDirty &&
      entries.some(
        (entry) => entry.target === deckStage && entry.isIntersecting
      )
    ) {
      readCols()
      if (cur?.mode === "px") cur.draw()
    }
  })
  io.observe(deckStage)
  const games: Game[] = [
    createLightsOut(services),
    create2048(services),
    createMinesweeper(services),
    createWhackAMole(services),
    createBreakout(services),
    createRunner(services),
    createTetris(services),
    createSnake(services),
    createShipIt(services),
    createCipher(services),
  ]
  function load(n: number) {
    if (cur && cur.exit) cur.exit()
    clearTimers()
    if (cur && cur.mode === "px") cur.on = false
    const game = games[n]
    if (!game) throw new RangeError(`Unknown arcade game index: ${n}`)
    cur = game
    cons.dataset.game = cur.id
    cons.dataset.mode = cur.mode
    $("#gquick").textContent = QUICK_HELP[cur.id][TOUCH ? 0 : 1]
    $("#ghelp").textContent = GAME_HELP[cur.id][TOUCH ? 0 : 1]
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
      if (pixel.colorsDirty) readCols()
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
        deck.style.transform = `rotateX(${keypad.tiltBase[0] - tilt.y * 6}deg) rotateZ(${keypad.tiltBase[1] + tilt.x * 5}deg) rotateY(${tilt.x * 3}deg)`
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
    io.disconnect()
    stageResize.disconnect()
    services.dispose()
  }
}
