import { gsap } from "gsap"
import { createLifetime } from "./lifetime"
import { arcadeStore } from "./storage"
import { createKeypad } from "./game-keypad"
import { createPixelSurface } from "./game-canvas"
import type { Game, HudUpdate } from "./game-types"

/** Shared services for one mounted console; every game creates its own state. */
export function createGameRuntime(
  root: HTMLElement,
  visible: (element: Element) => boolean,
  isActive: (game: Game) => boolean
) {
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
  const animations = gsap.context(() => {}, root)
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
  const deck = $("#deck"),
    deckStage = $("#deckstage"),
    side = $("#side")
  const termlog = $("#termlog"),
    termin = $<HTMLInputElement>("#termin")
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

  const keypad = createKeypad(deck, scope, animations, later, RM)
  const pixel = createPixelSurface(
    root,
    deckStage,
    $<HTMLCanvasElement>("#px"),
    scope,
    visible
  )
  return {
    scope,
    listen,
    $,
    $$,
    deck,
    deckStage,
    side,
    termlog,
    termin,
    RM,
    TOUCH,
    store,
    later,
    clearTimers,
    now,
    fmt,
    setHud,
    setReadout,
    won,
    keypad,
    pixel,
    isActive,
    dispose() {
      scope.dispose()
      animations.revert()
      deck.replaceChildren()
      side.replaceChildren()
      termlog.replaceChildren()
      root.querySelectorAll(".floater").forEach((element) => element.remove())
      document.documentElement.classList.remove("negative")
    },
  }
}
export type GameServices = ReturnType<typeof createGameRuntime>
