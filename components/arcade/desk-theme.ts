import { gsap } from "gsap"

export const LIGHTING_TOKENS = [
  "--paper",
  "--paper-2",
  "--ink",
  "--ink-2",
  "--mute",
  "--line",
  "--signal",
  "--shade",
  "--lamp-power",
] as const

/** Animate from the currently painted palette; caller owns cancellation. */
export function transitionDeskTheme(
  next: boolean,
  compact: { current: boolean }
) {
  const root = document.documentElement
  const before = getComputedStyle(root)
  const from = LIGHTING_TOKENS.map((key) => before.getPropertyValue(key))
  root.classList.toggle("arcade-dark", !next)
  for (const key of LIGHTING_TOKENS) root.style.removeProperty(key)
  const after = getComputedStyle(root)
  const target = Object.fromEntries(
    LIGHTING_TOKENS.map((key) => [key, after.getPropertyValue(key)])
  )
  const refresh = () => window.dispatchEvent(new Event("arcade-theme-change"))
  // Touch / small screens: switch instantly. Tweening root tokens restyles and repaints every 3D layer per frame.
  if (
    compact.current ||
    matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    root.classList.remove("arcade-light-shifting")
    refresh()
    return null
  }
  LIGHTING_TOKENS.forEach((key, i) => root.style.setProperty(key, from[i]))
  root.classList.add("arcade-light-shifting")
  // Interpolate a small proxy; limit DOM palette writes on touch devices.
  const palette = Object.fromEntries(
    LIGHTING_TOKENS.map((key, i) => [key, from[i]])
  )
  let lastPalettePaint = 0
  const paintPalette = () => {
    const now = performance.now()
    if (compact.current && now - lastPalettePaint < 1000 / 30) return
    lastPalettePaint = now
    for (const key of LIGHTING_TOKENS) root.style.setProperty(key, palette[key])
    refresh()
  }
  return gsap.to(palette, {
    ...target,
    duration: next ? 1.35 : 1.1,
    ease: next ? "power2.out" : "power2.inOut",
    onUpdate: paintPalette,
    onComplete: () => {
      for (const key of LIGHTING_TOKENS) root.style.removeProperty(key)
      root.classList.remove("arcade-light-shifting")
      refresh()
    },
  })
}
