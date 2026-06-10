"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { CatMascot, GhostMascot } from "./mascots"

const CAT_W = 52
const CAT_H = 48
const GHOST_W = 46
const GHOST_H = 44
const GHOST_OPACITY = 0.5 // faint — it's a ghost, shouldn't dominate
const GHOST_SPEED = 17 // px/s — slow, drifting glide

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

    const place = () => {
      const list = cells()
      if (!list.length) return false
      const cell = list[Math.floor(Math.random() * list.length)]
      const r = cell.getBoundingClientRect()
      const pad = 8
      const maxX = Math.max(pad, r.width - CAT_W - pad)
      const x = r.left + pad + Math.random() * Math.max(0, maxX - pad)
      clip.style.left = `${x}px`
      clip.style.top = `${r.bottom - (CAT_H + 30)}px`
      clip.style.width = `${CAT_W}px`
      clip.style.height = `${CAT_H + 30}px`
      setCatFacing(Math.random() < 0.5 ? 1 : -1)
      return true
    }

    if (reduced) {
      if (place()) cat.classList.add("up")
      return
    }

    let timer: ReturnType<typeof setTimeout>
    let alive = true

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
    return () => {
      alive = false
      clearTimeout(timer)
    }
  }, [])

  // ghost: wander the whole viewport, fade out + reappear elsewhere
  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches
    const ghost = ghostRef.current
    if (!ghost) return

    const rnd = () => ({
      x: 12 + Math.random() * Math.max(0, window.innerWidth - GHOST_W - 24),
      y: 12 + Math.random() * Math.max(0, window.innerHeight - GHOST_H - 24),
    })

    if (reduced) {
      const p = rnd()
      ghost.style.transform = `translate(${p.x}px,${p.y}px)`
      return
    }

    const start = rnd()
    let target = rnd()
    let gx = start.x
    let gy = start.y
    ghost.style.transform = `translate(${gx.toFixed(1)}px,${gy.toFixed(1)}px)`
    let t0 = 0
    let phase: "roam" | "out" = "roam"
    let phaseUntil = 0
    let nextTeleport = 0
    let raf = 0

    const frame = (ts: number) => {
      if (!t0) {
        t0 = ts
        nextTeleport = ts + 6000 + Math.random() * 6000
      }
      const dt = Math.min(0.05, (ts - t0) / 1000)
      t0 = ts

      if (phase === "roam") {
        const k = Math.min(1, dt * 1.1)
        gx += (target.x - gx) * k
        gy += (target.y - gy) * k
        if (Math.hypot(target.x - gx, target.y - gy) < 8) target = rnd()
        if (ts > nextTeleport) {
          phase = "out"
          phaseUntil = ts + 450
          ghost.style.opacity = "0"
        }
      } else if (ts > phaseUntil) {
        const p = rnd()
        gx = p.x
        gy = p.y
        target = rnd()
        ghost.style.opacity = "1"
        phase = "roam"
        nextTeleport = ts + 6000 + Math.random() * 6000
      }

      ghost.style.transform = `translate(${gx.toFixed(1)}px,${gy.toFixed(1)}px)`
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

      {/* <div className="creature creature-ghost" ref={ghostRef} title="boo" onClick={petGhost}>
        <div className="face">
          <GhostMascot />
        </div>
        <span className="say-bubble">boo!</span>
      </div> */}
    </div>
  )
}
