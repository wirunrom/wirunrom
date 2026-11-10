import type { Point } from "./game-types"
import type { createLifetime } from "./lifetime"

export function createPixelSurface(
  root: HTMLElement,
  deckStage: HTMLElement,
  px: HTMLCanvasElement,
  scope: ReturnType<typeof createLifetime>,
  visible: (element: Element) => boolean
) {
  /* pixel games: one low-res 1-bit canvas, scaled up crisp */
  const context = px.getContext("2d")
  if (!context) throw new Error("The arcade requires a 2D canvas context")
  const pctx = context
  const P = { W: 0, H: 0, S: 4 }
  let COL = { paper: "", ink: "", sig: "", mute: "" }
  let colorsDirty = false
  const readCols = () => {
    const cs = getComputedStyle(root)
    COL = {
      paper: cs.getPropertyValue("--paper").trim(),
      ink: cs.getPropertyValue("--ink").trim(),
      sig: cs.getPropertyValue("--signal").trim(),
      mute: cs.getPropertyValue("--mute").trim(),
    }
    colorsDirty = false
  }
  scope.on(window, "arcade-theme-change", () => {
    if (visible(deckStage)) readCols()
    else colorsDirty = true
  })
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
  return {
    px,
    P,
    pxSize,
    R,
    clear,
    pt,
    readCols,
    get COL() {
      return COL
    },
    get colorsDirty() {
      return colorsDirty
    },
  }
}
