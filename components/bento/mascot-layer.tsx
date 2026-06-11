"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { gsap } from "gsap"

import { CatMascot, GhostMascot } from "./mascots"

const CAT_W = 52
const CAT_H = 48
const GHOST_W = 46
const GHOST_H = 44
const GHOST_OPACITY = 0.44 // faint — it's a ghost, shouldn't dominate
const GHOST_SPEED = 26 // px/s — constant slow drift (duration scales with distance)

/**
 * Two ambient companions on a fixed overlay:
 *  - a cat that peeks up over the bottom edge of a random bento cell, holds a
 *    moment, ducks back down, waits a random beat, then pops up elsewhere
 *  - a ghost that drifts slowly around the viewport, fading out and re-appearing
 *    somewhere new now and then
 * Orchestration is GSAP; the per-part idle motion (blink / tail / float) stays
 * in CSS. Honors prefers-reduced-motion.
 */
export function MascotLayer() {
  const clipRef = useRef<HTMLDivElement>(null)
  const catRef = useRef<HTMLDivElement>(null)
  const ghostRef = useRef<HTMLDivElement>(null)
  const catCellRef = useRef<HTMLElement | null>(null)
  const catOffsetRef = useRef(0)
  const [catFacing, setCatFacing] = useState<1 | -1>(1)

  // cat: peek up from a random cell's bottom edge (GSAP timeline per pop)
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const clip = clipRef.current
    const cat = catRef.current
    if (!clip || !cat) return

    const cells = () =>
      Array.from(document.querySelectorAll<HTMLElement>(".board .cell"))

    const syncToCell = () => {
      const cell = catCellRef.current
      if (!cell) return false
      const r = cell.getBoundingClientRect()
      clip.style.left = `${r.left + catOffsetRef.current}px`
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
      if (place()) gsap.set(cat, { yPercent: 38 })
      return
    }

    let alive = true
    let tl: gsap.core.Timeline | null = null
    let wait: gsap.core.Tween | null = null
    let scrollRaf = 0

    const peek = () => {
      if (!alive) return
      if (!place()) {
        wait = gsap.delayedCall(0.5, peek)
        return
      }
      tl = gsap.timeline({
        onComplete: () => {
          if (alive) wait = gsap.delayedCall(gsap.utils.random(0.6, 4), peek)
        },
      })
        .fromTo(
          cat,
          { yPercent: 115 },
          { yPercent: 38, duration: 0.55, ease: "back.out(1.5)" }
        )
        .to(cat, {
          yPercent: 115,
          duration: 0.45,
          ease: "power2.in",
          delay: gsap.utils.random(1.5, 3.6),
        })
    }
    wait = gsap.delayedCall(0.7, peek)

    const scheduleSync = () => {
      if (scrollRaf) return
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = 0
        if (alive) syncToCell()
      })
    }
    window.addEventListener("scroll", scheduleSync, { passive: true })
    window.addEventListener("resize", scheduleSync)

    return () => {
      alive = false
      tl?.kill()
      wait?.kill()
      gsap.killTweensOf(cat)
      cancelAnimationFrame(scrollRaf)
      window.removeEventListener("scroll", scheduleSync)
      window.removeEventListener("resize", scheduleSync)
    }
  }, [])

  // ghost: slow drift across the viewport, fade out, respawn elsewhere
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const ghost = ghostRef.current
    if (!ghost) return

    const rnd = () => ({
      x: 12 + Math.random() * Math.max(0, window.innerWidth - GHOST_W - 24),
      y: 12 + Math.random() * Math.max(0, window.innerHeight - GHOST_H - 24),
    })

    if (reduced) {
      gsap.set(ghost, { ...rnd(), autoAlpha: GHOST_OPACITY })
      return
    }

    let alive = true
    let tl: gsap.core.Timeline | null = null

    const lifecycle = () => {
      if (!alive) return
      let from = rnd()
      gsap.set(ghost, { ...from, autoAlpha: 0 }) // reappear somewhere new
      tl = gsap.timeline({ onComplete: lifecycle, defaults: { ease: "sine.inOut" } })
      tl.to(ghost, { autoAlpha: GHOST_OPACITY, duration: 1.8, ease: "sine.out" })
      const hops = 2 + Math.floor(Math.random() * 2)
      for (let i = 0; i < hops; i++) {
        const to = rnd()
        // constant speed: longer trips take proportionally longer (no zooming)
        const dur = gsap.utils.clamp(
          4,
          14,
          Math.hypot(to.x - from.x, to.y - from.y) / GHOST_SPEED
        )
        tl.to(ghost, { x: to.x, y: to.y, duration: dur })
        from = to
      }
      tl.to(ghost, { autoAlpha: 0, duration: 3.4, ease: "power1.in" })
    }

    gsap.set(ghost, { autoAlpha: 0 })
    lifecycle()

    return () => {
      alive = false
      tl?.kill()
      gsap.killTweensOf(ghost)
    }
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
