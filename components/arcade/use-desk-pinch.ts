"use client"

import { useCallback, useEffect, useRef, useState, type RefObject } from "react"
import gsap from "gsap"

/** User view on top of the camera: extra zoom `z` and screen-space pan `x/y` (px from the scene centre). */
export type DeskView = { z: number; x: number; y: number }

const MAX_ZOOM = 3
const TAP_SLOP = 6

/**
 * Touch only: two-finger pinch on the desk zooms the camera inside the scene (and one finger pans while zoomed),
 * instead of the browser's page zoom — which on iOS re-rasterizes every 3D layer at the zoom scale and crashes.
 * The view is separate from the camera, so camera flights, resizes and pointer tilt never fight it.
 * Desktop (fine pointers) is untouched.
 */
export function useDeskPinch(host: RefObject<HTMLDivElement | null>) {
  const view = useRef<DeskView>({ z: 1, x: 0, y: 0 })
  const [zoomed, setZoomed] = useState(false)
  // The desk wires these in an effect: repaint the camera, and whether a gesture may start now.
  const applyRef = useRef<() => void>(() => {})
  const blockedRef = useRef<() => boolean>(() => false)
  const sceneRef = useRef<HTMLDivElement | null>(null)

  const reset = (duration = 0.45) => {
    gsap.killTweensOf(view.current)
    if (view.current.z === 1 && view.current.x === 0 && view.current.y === 0)
      return
    gsap.to(view.current, {
      z: 1,
      x: 0,
      y: 0,
      duration,
      ease: "power2.out",
      onUpdate: () => applyRef.current(),
    })
    setZoomed(false)
    if (sceneRef.current) sceneRef.current.dataset.userZoom = "false"
  }
  const resetRef = useRef(reset)
  useEffect(() => {
    resetRef.current = reset
  })

  useEffect(() => {
    const scene = host.current
    if (!scene || !matchMedia("(any-pointer: coarse)").matches) return
    sceneRef.current = scene
    const v = view.current
    let mode: "none" | "pinch" | "pan" = "none"
    let moved = false
    let startDist = 1,
      startMid = { x: 0, y: 0 },
      start = { ...v }

    const centre = () => {
      const r = scene.getBoundingClientRect()
      return {
        x: r.left + r.width / 2,
        y: r.top + r.height / 2,
        w: r.width,
        h: r.height,
      }
    }
    const mid = (t: TouchList) => ({
      x: (t[0].clientX + t[1].clientX) / 2,
      y: (t[0].clientY + t[1].clientY) / 2,
    })
    const dist = (t: TouchList) =>
      Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY) || 1
    const clamp = () => {
      const c = centre()
      const limit = (c.w > c.h ? c.w : c.h) * 0.55 * (v.z - 1) + 24
      v.x = Math.max(-limit, Math.min(limit, v.x))
      v.y = Math.max(-limit, Math.min(limit, v.y))
    }
    const markZoomed = () => {
      const on = v.z > 1.04
      scene.dataset.userZoom = String(on)
      setZoomed(on)
    }
    const begin = (t: TouchList) => {
      gsap.killTweensOf(v)
      start = { ...v }
      if (t.length >= 2) {
        mode = "pinch"
        startDist = dist(t)
        startMid = mid(t)
      } else if (t.length === 1 && v.z > 1.04) {
        mode = "pan"
        startMid = { x: t[0].clientX, y: t[0].clientY }
      } else mode = "none"
    }

    const onStart = (e: TouchEvent) => {
      if (blockedRef.current()) return
      if (e.touches.length === 1) moved = false
      begin(e.touches)
    }
    const onMove = (e: TouchEvent) => {
      if (mode === "none") return
      e.preventDefault()
      const c = centre()
      if (mode === "pinch" && e.touches.length >= 2) {
        const m = mid(e.touches)
        const z = Math.max(
          1,
          Math.min(MAX_ZOOM, (start.z * dist(e.touches)) / startDist)
        )
        const f = z / start.z
        // keep the point under the starting midpoint under the fingers, then follow the midpoint
        const ax = startMid.x - c.x,
          ay = startMid.y - c.y
        v.z = z
        v.x = ax - (ax - start.x) * f + (m.x - startMid.x)
        v.y = ay - (ay - start.y) * f + (m.y - startMid.y)
        moved = true
      } else if (mode === "pan" && e.touches.length === 1) {
        const dx = e.touches[0].clientX - startMid.x,
          dy = e.touches[0].clientY - startMid.y
        if (Math.hypot(dx, dy) > TAP_SLOP) moved = true
        v.x = start.x + dx
        v.y = start.y + dy
      }
      clamp()
      applyRef.current()
    }
    const onEnd = (e: TouchEvent) => {
      if (e.touches.length > 0) return begin(e.touches) // pinch → one finger keeps panning
      mode = "none"
      if (v.z <= 1.04) resetRef.current(0.3)
      else markZoomed()
    }
    // a pinch or pan must not also count as a tap on whatever is under the fingers
    const onClick = (e: MouseEvent) => {
      if (!moved) return
      moved = false
      e.stopPropagation()
      e.preventDefault()
    }
    scene.addEventListener("touchstart", onStart, { passive: true })
    scene.addEventListener("touchmove", onMove, { passive: false })
    scene.addEventListener("touchend", onEnd)
    scene.addEventListener("touchcancel", onEnd)
    scene.addEventListener("click", onClick, true)
    return () => {
      scene.removeEventListener("touchstart", onStart)
      scene.removeEventListener("touchmove", onMove)
      scene.removeEventListener("touchend", onEnd)
      scene.removeEventListener("touchcancel", onEnd)
      scene.removeEventListener("click", onClick, true)
      gsap.killTweensOf(v)
    }
  }, [host])

  const connect = useCallback((apply: () => void, blocked: () => boolean) => {
    applyRef.current = apply
    blockedRef.current = blocked
  }, [])

  return {
    connect,
    view,
    zoomed,
    reset: (d?: number) => resetRef.current(d),
  }
}
