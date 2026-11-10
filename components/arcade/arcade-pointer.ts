import { gsap } from "gsap"
import type { useGSAP } from "@gsap/react"
import { createLifetime } from "@/lib/arcade/lifetime"

/** Pointer-only effects; the shell calls update from its shared ticker. */
export function setupArcadePointer(
  host: HTMLElement,
  reduced: boolean,
  contextSafe: ReturnType<typeof useGSAP>["contextSafe"]
) {
  const scope = createLifetime(window)
  const query = <T extends HTMLElement>(selector: string) =>
    host.querySelector<T>(selector)!
  const all = <T extends HTMLElement>(selector: string) => [
    ...host.querySelectorAll<T>(selector),
  ]
  const wrapper = query(".namewrap"),
    negative = query("#neg")
  const glyphs = "/\\_-=+*#01<>[]{}xX"
  if (!reduced)
    all("[data-scramble], header nav a").forEach((el) => {
      const text = el.textContent || ""
      scope.on(
        el,
        "pointerenter",
        contextSafe!(() => {
          const progress = { value: 0 }
          gsap.to(progress, {
            value: text.length,
            duration: 0.25,
            ease: "none",
            onUpdate: () => {
              el.textContent = text
                .split("")
                .map((letter, i) =>
                  letter === " " || i < progress.value
                    ? letter
                    : glyphs[Math.floor(Math.random() * glyphs.length)]
                )
                .join("")
            },
            onComplete: () => {
              el.textContent = text
            },
          })
        })
      )
    })

  const windowState = { x: 0, y: 0, scale: 0 }
  const moveX = gsap.quickTo(windowState, "x", { duration: 0.18 })
  const moveY = gsap.quickTo(windowState, "y", { duration: 0.18 })
  const scale = gsap.quickTo(windowState, "scale", { duration: 0.2 })
  scope.on(wrapper, "pointerenter", () => {
    if (!reduced) scale(1)
  })
  scope.on(wrapper, "pointerleave", () => scale(0))
  scope.on(wrapper, "pointermove", (event) => {
    const pointer = event as PointerEvent,
      bounds = wrapper.getBoundingClientRect()
    moveX(pointer.clientX - bounds.left)
    moveY(pointer.clientY - bounds.top)
  })

  if (matchMedia("(pointer: fine)").matches && !reduced) {
    const cursor = query(".crosshair"),
      horizontal = query(".crosshair .h"),
      vertical = query(".crosshair .v")
    const box = query(".crosshair .box"),
      readout = query(".crosshair .rd"),
      coordinates = query("[data-observer]")
    document.documentElement.classList.add("arcade-cursor")
    gsap.set(cursor, { display: "block" })
    const boxX = gsap.quickTo(box, "x", { duration: 0.18 }),
      boxY = gsap.quickTo(box, "y", { duration: 0.18 })
    scope.on(
      window,
      "pointermove",
      (event) => {
        if (window.innerWidth <= 760) return
        const { clientX: x, clientY: y } = event as PointerEvent
        gsap.set(horizontal, { y })
        gsap.set(vertical, { x })
        boxX(x)
        boxY(y)
        gsap.set(readout, { x: x + 12, y: y + 10 })
        const pad = (value: number) =>
          String(Math.round(value)).padStart(4, "0")
        readout.textContent = `x ${pad(x)} y ${pad(y)}`
        coordinates.textContent = `x ${pad(x)} / y ${pad(y)}`
      },
      { passive: true }
    )
  }

  return {
    update() {
      if (windowState.scale > 0.001) {
        const half =
          windowState.scale * Math.min(150, wrapper.clientHeight * 0.75)
        negative.style.visibility = "visible"
        negative.style.clipPath = `inset(${windowState.y - half}px ${wrapper.clientWidth - windowState.x - half}px ${wrapper.clientHeight - windowState.y - half}px ${windowState.x - half}px)`
      } else negative.style.visibility = "hidden"
    },
    dispose() {
      scope.dispose()
      document.documentElement.classList.remove("arcade-cursor")
    },
  }
}
