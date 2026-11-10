import { gsap } from "gsap"
import type { BoardOptions, Point } from "./game-types"
import type { createLifetime } from "./lifetime"

export function createKeypad(
  deck: HTMLElement,
  scope: ReturnType<typeof createLifetime>,
  animations: gsap.Context,
  later: (fn: () => void, ms: number) => number,
  RM: boolean
) {
  const $ = (selector: string, parent: ParentNode) => {
    const element = parent.querySelector<HTMLElement>(selector)
    if (!element) throw new Error(`Missing arcade element: ${selector}`)
    return element
  }
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

  return {
    board,
    label,
    tap,
    flash,
    wave,
    get keys() {
      return keys
    },
    get tiltBase() {
      return tiltBase
    },
  }
}
