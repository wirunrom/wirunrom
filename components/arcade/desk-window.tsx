"use client"

import { useEffect, useEffectEvent, useRef } from "react"
import { gsap } from "gsap"
import { Box, Panel } from "./desk-primitives"
import { makeCat } from "@/lib/arcade/desk-cat"
import { makeDeskSky } from "@/lib/arcade/desk-sky"
import { previewHour } from "@/lib/arcade/time"

const PATH = [
  [46, 676],
  [86, 560],
  [150, 430],
  [188, 300],
  [196, 212],
  [252, 112],
  [300, 8],
]
const PRINTS: { x: number; y: number; angle: number }[] = []
let side = 1,
  carry = 20
for (let k = 0; k < PATH.length - 1; k++) {
  const [ax, ay] = PATH[k],
    [bx, by] = PATH[k + 1]
  const length = Math.hypot(bx - ax, by - ay),
    ux = (bx - ax) / length,
    uy = (by - ay) / length
  for (let d = carry; d < length; d += 64) {
    PRINTS.push({
      x: ax + ux * d - uy * 11 * side,
      y: ay + uy * d + ux * 11 * side,
      angle: (Math.atan2(uy, ux) * 180) / Math.PI + 90 + side * 6,
    })
    side = -side
    carry = d + 64 - length
  }
}

export function DeskPaws({
  enabled,
  onFollow,
}: {
  enabled: boolean
  onFollow: (opener?: HTMLElement) => void
}) {
  const root = useRef<HTMLDivElement>(null)
  const trail = useRef<gsap.core.Timeline | null>(null)
  useEffect(() => {
    if (!enabled) {
      trail.current?.kill()
      trail.current = null
    }
    return () => {
      trail.current?.kill()
    }
  }, [enabled])
  function follow() {
    if (!enabled || trail.current || !root.current) return
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches
    const prints = root.current.querySelectorAll(".paw")
    trail.current = gsap
      .timeline({ onComplete: () => onFollow(root.current ?? undefined) })
      .to(prints, {
        color: "var(--signal)",
        opacity: 0.9,
        duration: reduced ? 0 : 0.12,
        stagger: reduced ? 0 : 0.07,
      })
  }
  useEffect(() => {
    if (enabled && root.current) {
      gsap.set(root.current.querySelectorAll(".paw"), {
        clearProps: "color,opacity",
      })
      trail.current?.kill()
      trail.current = null
    }
  }, [enabled])
  return (
    <div
      ref={root}
      className="paws"
      role="button"
      tabIndex={enabled ? 0 : -1}
      aria-label="Follow the cat paw prints to the window"
      aria-disabled={!enabled}
      onClick={(e) => {
        e.stopPropagation()
        follow()
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          follow()
        }
      }}
    >
      {PRINTS.map(({ x, y, angle }, i) => (
        <span
          key={i}
          className="paw"
          style={{ left: x, top: y, transform: `rotate(${angle}deg)` }}
        >
          <svg viewBox="0 0 15 17" aria-hidden="true">
            <ellipse cx="7.5" cy="11.6" rx="4.4" ry="3.9" />
            <ellipse cx="2.4" cy="6.6" rx="1.7" ry="2.2" />
            <ellipse cx="5.6" cy="3.4" rx="1.8" ry="2.3" />
            <ellipse cx="9.4" cy="3.4" rx="1.8" ry="2.3" />
            <ellipse cx="12.6" cy="6.6" rx="1.7" ry="2.2" />
          </svg>
        </span>
      ))}
    </div>
  )
}

export function DeskWindow({ light }: { light: boolean }) {
  const skyCanvas = useRef<HTMLCanvasElement>(null),
    catCanvas = useRef<HTMLCanvasElement>(null)
  const cat = useRef<ReturnType<typeof makeCat> | null>(null)
  const isDay = useEffectEvent(() => light)
  useEffect(() => {
    if (!skyCanvas.current || !catCanvas.current) return
    const skyView = makeDeskSky(skyCanvas.current),
      tabby = makeCat(catCanvas.current, { wander: true, hidden: true })
    cat.current = tabby
    const reduced = matchMedia("(prefers-reduced-motion: reduce)")
    let visible = false,
      lastFrame = -Infinity,
      minute = -1,
      previousDay: boolean | null = null
    let elapsed = 0,
      lastTime = performance.now(),
      arrived = false
    function frame() {
      const now = performance.now()
      if (
        document.hidden ||
        !visible ||
        (window.visualViewport?.scale ?? 1) > 1.05
      ) {
        lastTime = now
        return
      }
      if (now - lastFrame < 90) return
      elapsed += Math.min(100, now - lastTime)
      lastTime = now
      const day = isDay()
      const changed =
        minute !== Math.floor(Date.now() / 60000) || previousDay !== day
      if (changed) {
        const parts = new Intl.DateTimeFormat("en-GB", {
          timeZone: "Asia/Bangkok",
          hour: "2-digit",
          minute: "2-digit",
          hourCycle: "h23",
        }).formatToParts(new Date())
        const hour =
          previewHour(new URLSearchParams(location.search)) ??
          Number(parts.find((p) => p.type === "hour")?.value ?? 0) +
            Number(parts.find((p) => p.type === "minute")?.value ?? 0) / 60
        skyView.prepare(hour, day)
        minute = Math.floor(Date.now() / 60000)
        previousDay = day
      }
      if (!arrived && (reduced.matches || !day || elapsed >= 1150)) {
        if (reduced.matches || !day) tabby.settle(day, 100)
        else tabby.jumpIn(elapsed, day, 100)
        arrived = true
      }
      if (reduced.matches && !changed && lastFrame > 0) return
      skyView.frame(reduced.matches ? 0 : elapsed)
      tabby.tick(reduced.matches ? 0 : elapsed, day)
      lastFrame = now
    }
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      lastTime = performance.now()
    })
    observer.observe(skyCanvas.current)
    gsap.ticker.add(frame)
    return () => {
      observer.disconnect()
      gsap.ticker.remove(frame)
      cat.current = null
    }
  }, [])
  function pokeCat() {
    const tabby = cat.current
    if (!tabby) return
    // Animation time is private to this mounted view; use the renderer's local clock.
    tabby.poke(tabby.time(), light)
    tabby.tick(tabby.time(), light)
  }
  return (
    <div className="desk-room" onClick={(e) => e.stopPropagation()}>
      <Panel x={252} y={-40} z={370} w={696} h={454} thick={0} r={0}>
        <div
          className="window-frame"
          style={{ left: 61, top: 61, width: 556, height: 314 }}
        >
          <canvas
            ref={skyCanvas}
            width={278}
            height={157}
            aria-label="Pixel landscape outside the window"
            role="img"
          />
          <i className="window-mullion" style={{ left: "33.33%" }} />
          <i className="window-mullion" style={{ left: "66.66%" }} />
          <i className="window-crossbar" />
        </div>
      </Panel>
      <Box x={292} y={-40} z={428} w={616} d={34} h={12} r={2} />
      <Panel x={322} y={-18} z={440} w={556} h={129} thick={0} r={0}>
        <button
          type="button"
          className="sill-cat"
          aria-label={
            light ? "Pet the orange cat" : "Gently wake the sleeping cat"
          }
          onClick={(event) => {
            const rect = event.currentTarget.getBoundingClientRect()
            if (
              event.detail === 0 ||
              cat.current?.hit(
                (event.clientX - rect.left) / rect.width,
                (event.clientY - rect.top) / rect.height
              )
            )
              pokeCat()
          }}
        >
          <canvas ref={catCanvas} width={190} height={44} aria-hidden="true" />
        </button>
      </Panel>
    </div>
  )
}
