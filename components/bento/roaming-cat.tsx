"use client"

import { useCallback, useEffect, useRef, useState } from "react"

const WALK = [
  " /\\_/\\\n(=^.^=)\n (\"\")(\"\")",
  " /\\_/\\\n(=^.^=)\n  (\"\")(\"\")",
]
const SIT = " /\\_/\\\n(=^.^=)\n  u  u"
const SLEEP = " /\\_/\\\n(= -.- =)z\n (\"\")(\"\")"

/** Roaming orange ASCII cat — walks, sits, sleeps, hops + meows when petted. */
export function RoamingCat() {
  const catRef = useRef<HTMLDivElement>(null)
  const hopEndRef = useRef(0)
  const [art, setArt] = useState(SIT)

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const cat = catRef.current
    if (!cat) return

    if (reduced) {
      setArt(SIT)
      cat.style.transform = "translateX(24px)"
      return
    }

    let cx = 60
    let dir = 1
    let t0 = 0
    let phase = 0
    let mode: "walk" | "sit" | "sleep" = "walk"
    let modeUntil = 0
    let frameArt = WALK[0]
    const SPEED = 48
    let raf = 0

    setArt(WALK[0])
    cat.style.transform = "translateX(60px)"

    const frame = (ts: number) => {
      if (!t0) t0 = ts
      const dt = Math.min(0.05, (ts - t0) / 1000)
      t0 = ts
      const vw = window.innerWidth
      if (ts > modeUntil) {
        const r = Math.random()
        mode =
          mode !== "walk" ? "walk" : r < 0.3 ? "sit" : r < 0.4 ? "sleep" : "walk"
        modeUntil =
          ts +
          (mode === "walk"
            ? 2400 + Math.random() * 3600
            : mode === "sleep"
              ? 3200 + Math.random() * 2600
              : 1500 + Math.random() * 1800)
        if (mode === "sit" && frameArt !== SIT) {
          frameArt = SIT
          setArt(SIT)
        }
        if (mode === "sleep" && frameArt !== SLEEP) {
          frameArt = SLEEP
          setArt(SLEEP)
        }
      }
      let bob = 0
      if (mode === "walk") {
        cx += dir * SPEED * dt
        if (cx > vw - 80) {
          cx = vw - 80
          dir = -1
        }
        if (cx < 8) {
          cx = 8
          dir = 1
        }
        phase += dt * 6
        const next = WALK[Math.floor(phase) % 2]
        if (next !== frameArt) {
          frameArt = next
          setArt(next)
        }
        bob = Math.abs(Math.sin(phase)) * -3
      }
      let hopY = 0
      if (ts < hopEndRef.current) {
        const p = 1 - (hopEndRef.current - ts) / 420
        hopY = -Math.sin(p * Math.PI) * 18
      }
      cat.style.transform = `translate(${cx.toFixed(1)}px,${(bob + hopY).toFixed(1)}px)`
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [])

  const pet = useCallback(() => {
    hopEndRef.current = performance.now() + 420
    const cat = catRef.current
    if (!cat) return
    cat.classList.remove("say")
    void cat.offsetWidth
    cat.classList.add("say")
  }, [])

  return (
    <div id="cat-layer" aria-hidden="true">
      <div id="cat" ref={catRef} title="pet me" onClick={pet}>
        <pre>{art}</pre>
        <span className="meow">meow!</span>
      </div>
    </div>
  )
}
