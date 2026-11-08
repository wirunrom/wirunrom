"use client"

import { useEffect, useState, type RefObject } from "react"
import { previewHour, twelveHourLabel } from "@/lib/arcade/time"
import { castPolygons, drawCastShadows } from "@/lib/arcade/desk-shadows"

// [left, right, bottomY, bottomZ, topY, topZ], in desk coordinates.
// Keep aligned with Panel/Box geometry in project-desk.tsx.
const OCCLUDERS = [
  [214, 604, 258, 12, 198, 253], // laptop lid (-76°)
  [630, 1130, 146, 86, 146, 386], // monitor
  [861, 899, 126, 8, 126, 178], // monitor neck
  [657, 749, 400, 10, 336, 185], // phone (-70°)
] as const

export function DeskLightSurface({
  x,
  y,
  z = 0,
}: {
  x: number
  y: number
  z?: number
}) {
  return (
    <div
      className="lit"
      data-light-origin={`${x},${y},${z}`}
      aria-hidden="true"
    />
  )
}

// Adapted from wirunrom-desk-light-shadow.zip. Rasterize the soft panes once
// per minute; no CSS blur or per-frame canvas work on the CSS-3D scene.
export function useDeskLighting(host: RefObject<HTMLDivElement | null>) {
  const [clock, setClock] = useState("")
  useEffect(() => {
    const scene = host.current
    if (!scene) return
    const canvas = document.createElement("canvas")
    const castCanvas = document.createElement("canvas")
    const context = canvas.getContext("2d")
    if (!context) return
    const width = 1200,
      height = 520,
      scale = 0.5
    canvas.width = width * scale
    canvas.height = height * scale
    function paint(
      color: string,
      azimuth: number,
      elevation: number,
      wx: number,
      wy: number,
      lx: number,
      ly: number
    ) {
      if (!context) return "none"
      context.clearRect(0, 0, canvas.width, canvas.height)
      context.save()
      context.scale(scale, scale)
      context.shadowColor = color
      context.shadowBlur = 22 * scale
      context.shadowOffsetX = 4000 * scale
      context.translate(width / 2 - 4000, height / 2)
      context.rotate(((-6 - azimuth * 4) * Math.PI) / 180)
      context.transform(
        1,
        0,
        Math.tan((-azimuth * 28 * Math.PI) / 180),
        1,
        0,
        0
      )
      context.scale(1, 1 + (1 - elevation) * 0.25)
      context.fillStyle = "#000"
      for (let row = 0; row < 2; row++)
        for (let column = 0; column < 3; column++)
          context.fillRect(-282 + column * 194, -159 + row * 168, 176, 150)
      context.restore()
      // Cut projected occluders out of the panes, as in lightonlaptop.zip.
      // Draw off-canvas: only the soft shadow lands on the light texture.
      context.save()
      context.scale(scale, scale)
      context.globalCompositeOperation = "destination-out"
      context.shadowColor = "#000"
      context.shadowBlur = 26 * scale
      context.shadowOffsetX = 4000 * scale
      context.fillStyle = "#000"
      for (const [left, right, bottomY, bottomZ, topY, topZ] of OCCLUDERS) {
        const points = [
          [left, bottomY, bottomZ],
          [right, bottomY, bottomZ],
          [right, topY, topZ],
          [left, topY, topZ],
        ]
        context.beginPath()
        points.forEach(([x, y, z], index) => {
          const u = x + lx * z - wx + width / 2 - 4000
          const v = y + ly * z - wy + height / 2
          if (index === 0) context.moveTo(u, v)
          else context.lineTo(u, v)
        })
        context.closePath()
        context.fill()
      }
      context.restore()
      return `url(${canvas.toDataURL("image/png")})`
    }
    let placed = false
    let inView = false
    let lastMinute = -1
    function update() {
      if (
        !scene ||
        document.hidden ||
        !inView ||
        (window.visualViewport?.scale ?? 1) > 1.05
      )
        return
      const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Bangkok",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).formatToParts(new Date())
      const hours = Number(parts.find((p) => p.type === "hour")?.value ?? 0)
      const minutes = Number(parts.find((p) => p.type === "minute")?.value ?? 0)
      const hour =
        previewHour(new URLSearchParams(location.search)) ??
        hours + minutes / 60
      const minute = Math.floor(hour * 60)
      if (placed && minute === lastMinute) return
      lastMinute = minute
      // Read dimensions together, before applying the new textures/positions.
      const surfaces = Array.from(
        scene.querySelectorAll<HTMLElement>("[data-light-origin]"),
        (layer) => ({
          layer,
          width: layer.parentElement?.clientWidth ?? 0,
          height: layer.parentElement?.clientHeight ?? 0,
        })
      )
      const day = hour >= 6 && hour < 18
      const progress = ((((hour - 6) % 12) + 12) % 12) / 12
      const azimuth = -1 + 2 * progress
      const elevation = Math.sin(progress * Math.PI)
      const style = scene.style
      const sun = day
        ? `rgba(255,${Math.round(248 + 5 * elevation)},${Math.round(236 + 14 * elevation)},${(0.62 + 0.12 * elevation).toFixed(2)})`
        : "rgba(255,252,246,.42)"
      const wx = 340 - azimuth * 260
      const wy = 150 + (1 - elevation) * 120
      const altitude = ((16 + 58 * elevation) * Math.PI) / 180
      const shadowLength = Math.min(2.4, 1 / Math.tan(altitude))
      const direction = (-azimuth * 72 * Math.PI) / 180
      const lx = Math.sin(direction) * shadowLength
      const ly = Math.cos(direction) * shadowLength
      const silhouettes = castPolygons(lx, ly)
      style.setProperty(
        "--cast-sun",
        drawCastShadows(castCanvas, silhouettes, false)
      )
      style.setProperty(
        "--cast-moon",
        drawCastShadows(castCanvas, silhouettes, true)
      )
      style.setProperty(
        "--window-sun",
        paint(sun, azimuth, elevation, wx, wy, lx, ly)
      )
      style.setProperty(
        "--window-moon",
        paint("rgba(170,195,255,.36)", azimuth, elevation, wx, wy, lx, ly)
      )
      surfaces.forEach(
        ({ layer, width: surfaceWidth, height: surfaceHeight }) => {
          // React mounts before this effect: don't animate from the CSS default
          // (0,0), which briefly washes light across unrelated objects.
          if (!placed) layer.style.transition = "none"
          else layer.style.removeProperty("transition")
          const [x, y, z] = (layer.dataset.lightOrigin ?? "0,0,0")
            .split(",")
            .map(Number)
          const left = wx - x - width / 2 - lx * z
          const top = wy - y - height / 2 - ly * z
          layer.style.backgroundPosition = `${left.toFixed(1)}px ${top.toFixed(1)}px`
          // Don't submit a light texture for surfaces entirely outside its
          // footprint. In particular, front-row folders never catch this pane.
          const intersects =
            left < surfaceWidth &&
            top < surfaceHeight &&
            left + width > 0 &&
            top + height > 0
          layer.style.setProperty("--surface-lit", intersects ? "1" : "0")
          layer.hidden = !intersects
        }
      )
      placed = true
      setClock(`${day ? "sun" : "moon"} · ${twelveHourLabel(hour)} chiang mai`)
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting
        if (inView) update()
      },
      { rootMargin: "200px" }
    )
    observer.observe(scene)
    const timer = window.setInterval(update, 60_000)
    document.addEventListener("visibilitychange", update)
    return () => {
      clearInterval(timer)
      observer.disconnect()
      document.removeEventListener("visibilitychange", update)
      for (const key of [
        "--cast-sun",
        "--cast-moon",
        "--window-sun",
        "--window-moon",
      ])
        scene.style.removeProperty(key)
    }
  }, [host])
  return clock
}
