"use client"

import { useEffect, useRef } from "react"
import { gsap } from "gsap"

const PARALLAX = 24 // max px the blobs drift toward the pointer

/**
 * The grid board. Renders the server-rendered cells as children and runs
 * the motion layers:
 *  - entrance: cells start shifted (.preanim) and settle once painted (CSS)
 *  - inner cascade: each cell's content settles after the cell lands (CSS)
 *  - cursor spotlight: a hover glow that tracks --mx/--my (CSS + pointer)
 *  - cursor parallax: the blob drifts toward the pointer via `translate` (CSS)
 *  - ambient drift: GSAP nudges each blob's transform on a randomized loop,
 *    so it never reads as a repeating keyframe. Drift owns `transform`,
 *    parallax owns `translate` — separate properties, no conflict.
 * Opacity stays 1 throughout, so no-JS / print always show content.
 * Honors prefers-reduced-motion; parallax also skips touch.
 */
export function BentoBoard({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const board = ref.current
    if (!board) return
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches
    const coarse = matchMedia("(pointer: coarse)").matches
    const cells = Array.from(board.querySelectorAll<HTMLElement>(".cell"))

    // blob (drift + parallax target) + cascade tags
    const blobs: HTMLElement[] = []
    cells.forEach((cell) => {
      const blob = document.createElement("span")
      blob.className = "blob"
      blob.setAttribute("aria-hidden", "true")
      cell.prepend(blob)
      blobs.push(blob)
      // tag the cell's content blocks for the inner cascade (CSS)
      let i = 0
      for (const child of Array.from(cell.children)) {
        if (child === blob) continue
        ;(child as HTMLElement).style.setProperty("--i", String(i++))
        child.classList.add("st")
      }
    })

    // reveal — drops .preanim so entrance + cascade fire together
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => board.classList.remove("preanim"))
    )

    const cleanups: Array<() => void> = []

    // ambient drift — GSAP, randomized so it never loops identically.
    // Uses transform (xPercent/yPercent/scale); parallax stays on `translate`.
    if (!reduced) {
      blobs.forEach((blob, i) => {
        const tl = gsap.timeline({
          repeat: -1,
          delay: i * 0.4,
          defaults: { ease: "sine.inOut" },
        })
        for (let k = 0; k < 3; k++) {
          tl.to(blob, {
            xPercent: gsap.utils.random(-28, 42),
            yPercent: gsap.utils.random(0, 55),
            scale: gsap.utils.random(0.9, 1.2),
            duration: gsap.utils.random(5, 8),
          })
        }
        tl.to(blob, { xPercent: 0, yPercent: 0, scale: 1, duration: 6 })
        cleanups.push(() => tl.kill())
      })
    }

    // cursor spotlight — track the pointer per cell (CSS handles the glow)
    if (!reduced && !coarse) {
      cells.forEach((cell) => {
        let frame = 0
        const onMove = (e: PointerEvent) => {
          if (frame) return
          frame = requestAnimationFrame(() => {
            frame = 0
            const r = cell.getBoundingClientRect()
            cell.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`)
            cell.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`)
          })
        }
        cell.addEventListener("pointermove", onMove)
        cleanups.push(() => {
          cancelAnimationFrame(frame)
          cell.removeEventListener("pointermove", onMove)
        })
      })

      // grid-wide parallax — nudge every blob's `translate` toward the pointer
      let gFrame = 0
      const onGrid = (e: PointerEvent) => {
        if (gFrame) return
        gFrame = requestAnimationFrame(() => {
          gFrame = 0
          const r = board.getBoundingClientRect()
          const gx = ((e.clientX - r.left) / r.width - 0.5) * 2
          const gy = ((e.clientY - r.top) / r.height - 0.5) * 2
          for (const b of blobs)
            b.style.translate = `${gx * PARALLAX}px ${gy * PARALLAX}px`
        })
      }
      const onGridLeave = () => {
        cancelAnimationFrame(gFrame)
        gFrame = 0
        for (const b of blobs) b.style.translate = ""
      }
      board.addEventListener("pointermove", onGrid)
      board.addEventListener("pointerleave", onGridLeave)
      cleanups.push(() => {
        cancelAnimationFrame(gFrame)
        board.removeEventListener("pointermove", onGrid)
        board.removeEventListener("pointerleave", onGridLeave)
      })
    }

    return () => {
      cancelAnimationFrame(raf)
      cleanups.forEach((fn) => fn())
      // tidy up injected nodes / tags (safe under StrictMode double-mount)
      blobs.forEach((b) => b.remove())
      cells.forEach((cell) => {
        for (const child of Array.from(cell.children)) {
          ;(child as HTMLElement).classList.remove("st")
        }
      })
    }
  }, [])

  return (
    <main className="board preanim" ref={ref}>
      {children}
    </main>
  )
}
