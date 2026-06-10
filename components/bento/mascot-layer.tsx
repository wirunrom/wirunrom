"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { CatMascot, GhostMascot } from "./mascots"

const CAT_W = 52
const CAT_H = 48
const GHOST_W = 46
const GHOST_H = 44
const GHOST_OPACITY = 0.44 // faint — it's a ghost, shouldn't dominate
const GHOST_SPEED = 18 // px/s — slower drift, more suspended
const GHOST_WOBBLE = 3.5
const GHOST_WAYPOINT_MIN = 2800
const GHOST_WAYPOINT_MAX = 5200
const GHOST_FADE_MS = 3400
const GHOST_HIDDEN_MS = 900

/**
 * Two ambient companions on a fixed overlay:
 *  - a cat that peeks up over the bottom edge of a random bento cell, holds a
 *    moment, ducks back down, waits a random beat, then pops up elsewhere
 *  - a ghost that wanders the whole screen, occasionally fading out and
 *    re-appearing somewhere new
 * Tap either for a reaction. Honors prefers-reduced-motion.
 */
export function MascotLayer() {
  const clipRef = useRef<HTMLDivElement>(null)
  const catRef = useRef<HTMLDivElement>(null)
  const ghostRef = useRef<HTMLDivElement>(null)
  const catCellRef = useRef<HTMLElement | null>(null)
  const catOffsetRef = useRef(0)
  const [catFacing, setCatFacing] = useState<1 | -1>(1)

  // cat: peek up from a random cell's bottom edge
  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches
    const clip = clipRef.current
    const cat = catRef.current
    if (!clip || !cat) return

    const cells = () =>
      Array.from(document.querySelectorAll<HTMLElement>(".board .cell"))

    const syncToCell = () => {
      const cell = catCellRef.current
      if (!cell) return false
      const r = cell.getBoundingClientRect()
      const x = r.left + catOffsetRef.current
      clip.style.left = `${x}px`
      clip.style.top = `${r.bottom - (CAT_H + 30)}px`
      clip.style.width = `${CAT_W}px`
      clip.style.height = `${CAT_H + 30}px`
      return true
    }

    const place = () => {
      const list = cells()
      if (!list.length) return false
      const cell = list[Math.floor(Math.random() * list.length)]
      const r = cell.getBoundingClientRect()
      const pad = 8
      const maxX = Math.max(pad, r.width - CAT_W - pad)
      catOffsetRef.current = pad + Math.random() * Math.max(0, maxX - pad)
      catCellRef.current = cell
      setCatFacing(Math.random() < 0.5 ? 1 : -1)
      return syncToCell()
    }

    if (reduced) {
      if (place()) cat.classList.add("up")
      return
    }

    let timer: ReturnType<typeof setTimeout>
    let alive = true
    let scrollRaf = 0

    const scheduleSync = () => {
      if (scrollRaf) return
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = 0
        if (!alive) return
        syncToCell()
      })
    }

    const cycle = () => {
      if (!alive) return
      if (!place()) {
        timer = setTimeout(cycle, 500)
        return
      }
      cat.classList.remove("up")
      void cat.offsetWidth // reflow so the rise transitions from hidden
      cat.classList.add("up")
      const hold = 1500 + Math.random() * 2400
      timer = setTimeout(() => {
        cat.classList.remove("up") // duck back down
        const delay = 600 + Math.random() * 3400
        timer = setTimeout(cycle, 520 + delay)
      }, hold)
    }
    timer = setTimeout(cycle, 700)
    window.addEventListener("scroll", scheduleSync, { passive: true })
    window.addEventListener("resize", scheduleSync)
    return () => {
      alive = false
      clearTimeout(timer)
      cancelAnimationFrame(scrollRaf)
      window.removeEventListener("scroll", scheduleSync)
      window.removeEventListener("resize", scheduleSync)
    }
  }, [])

  // ghost: drift around the viewport, fade out, then respawn elsewhere
  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches
    const ghost = ghostRef.current
    if (!ghost) return
    ghost.style.visibility = "hidden"

    const rnd = () => ({
      x: 12 + Math.random() * Math.max(0, window.innerWidth - GHOST_W - 24),
      y: 12 + Math.random() * Math.max(0, window.innerHeight - GHOST_H - 24),
    })

    if (reduced) {
      const p = rnd()
      ghost.style.transform = `translate(${p.x}px,${p.y}px)`
      ghost.style.opacity = `${GHOST_OPACITY}`
      ghost.style.visibility = "visible"
      return
    }

    const start = rnd()
    let target = rnd()
    let gx = start.x
    let gy = start.y
    ghost.style.transform = `translate(${gx.toFixed(1)}px,${gy.toFixed(1)}px)`
    ghost.style.opacity = `${GHOST_OPACITY}`
    let t0 = 0
    let phase: "drift" | "fade" | "hold" = "drift"
    let phaseUntil = 0
    let nextWaypoint = 0
    let nextFade = 0
    let fadeFrom = GHOST_OPACITY
    let wobbleSeed = Math.random() * Math.PI * 2
    let raf = 0

    const frame = (ts: number) => {
      if (!t0) {
        t0 = ts
        nextWaypoint = ts + 700 + Math.random() * 900
        nextFade = ts + 5000 + Math.random() * 5000
      }
      const dt = Math.min(0.05, (ts - t0) / 1000)
      t0 = ts

      const dx = target.x - gx
      const dy = target.y - gy
      const dist = Math.hypot(dx, dy)

      if (phase === "drift") {
        if (ts > nextWaypoint || dist < 18) {
          target = rnd()
          nextWaypoint = ts + GHOST_WAYPOINT_MIN + Math.random() * (GHOST_WAYPOINT_MAX - GHOST_WAYPOINT_MIN)
        }
        const step = Math.min(dist, GHOST_SPEED * dt)
        if (dist > 0) {
          gx += (dx / dist) * step
          gy += (dy / dist) * step
        }
        if (ts > nextFade) {
          phase = "fade"
          phaseUntil = ts + GHOST_FADE_MS
          fadeFrom = Number(ghost.style.opacity || GHOST_OPACITY)
        }
      } else if (phase === "fade") {
        const elapsed = ts - (phaseUntil - GHOST_FADE_MS)
        const progress = Math.min(1, elapsed / GHOST_FADE_MS)
        const eased = 1 - Math.pow(progress, 1.4)
        ghost.style.opacity = `${Math.max(0, fadeFrom * eased).toFixed(3)}`
        const step = Math.min(dist, GHOST_SPEED * 0.85 * dt)
        if (dist > 0) {
          gx += (dx / dist) * step
          gy += (dy / dist) * step
        }
        if (progress >= 1) {
          ghost.style.opacity = "0"
          phase = "hold"
          phaseUntil = ts + GHOST_HIDDEN_MS
        }
      } else if (phase === "hold") {
        ghost.style.opacity = "0"
        if (ts > phaseUntil) {
          const p = rnd()
          gx = p.x
          gy = p.y
          target = rnd()
          ghost.style.transform = `translate(${gx.toFixed(1)}px,${gy.toFixed(1)}px)`
          ghost.style.opacity = `${(GHOST_OPACITY - 0.03 + Math.random() * 0.09).toFixed(3)}`
          phase = "drift"
          nextWaypoint = ts + 1200 + Math.random() * 1400
          nextFade = ts + 7000 + Math.random() * 5000
          wobbleSeed = Math.random() * Math.PI * 2
        }
      }

      if (phase !== "hold") {
        const wobbleX = Math.sin(ts / 1600 + wobbleSeed) * GHOST_WOBBLE
        const wobbleY = Math.cos(ts / 2100 + wobbleSeed * 0.7) * (GHOST_WOBBLE * 0.65)
        ghost.style.transform = `translate(${(gx + wobbleX).toFixed(1)}px,${(gy + wobbleY).toFixed(1)}px)`
      }
      if (ghost.style.visibility !== "visible") ghost.style.visibility = "visible"
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [])

  const say = (el: HTMLElement | null) => {
    if (!el) return
    el.classList.remove("say")
    void el.offsetWidth
    el.classList.add("say")
  }
  const petCat = useCallback(() => say(catRef.current), [])
  const petGhost = useCallback(() => say(ghostRef.current), [])

  return (
    <div id="creature-layer" aria-hidden="true">
      <div className="creature-cat-clip" ref={clipRef}>
        <div className="cat-peek" ref={catRef} title="pet me" onClick={petCat}>
          <div className="face" style={{ transform: `scaleX(${catFacing})` }}>
            <CatMascot />
          </div>
          <span className="say-bubble">meow!</span>
        </div>
      </div>

      <div
        className="creature creature-ghost"
        ref={ghostRef}
        title="boo"
        onClick={petGhost}
      >
        <div className="face">
          <GhostMascot />
        </div>
        <span className="say-bubble">boo!</span>
      </div>
    </div>
  )
}
