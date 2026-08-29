"use client"

import { useEffect, useRef } from "react"

import systemMapShader from "./system-map-background.wgsl"
import { getPortfolioFrameRate, getPortfolioGpu } from "./vgpu-runtime"

type VgpuModule = typeof import("vgpu")
type Loop = ReturnType<VgpuModule["frameLoop"]>

type Point = { x: number; y: number }

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

/**
 * A living architecture map beneath the portfolio. Quiet routes continuously
 * move through the page; pointing at any cell reroutes their packets toward
 * that piece of work so the background behaves like one connected system.
 */
export function SystemMapBackgroundCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !("gpu" in navigator)) return

    let disposed = false
    let loop: Loop | undefined
    let stopResize: (() => void) | undefined
    let drawStatic: (() => void) | undefined
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches
    const pointer: Point = { x: 0.5, y: 0.46 }
    const pointerTarget: Point = { ...pointer }
    const focus: Point = { x: 0.5, y: 0.54 }
    const focusTarget = { ...focus, strength: 0 }
    let focusStrength = 0
    let hoveredCell: HTMLElement | null = null
    let focusedCell: HTMLElement | null = null
    let scroll = 0

    const updateScroll = () => {
      const range = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight
      )
      scroll = window.scrollY / range
    }

    const targetCell = () => focusedCell ?? hoveredCell

    const updateFocus = () => {
      const cell = targetCell()
      if (!cell) {
        focusTarget.strength = 0
        return
      }
      const rect = cell.getBoundingClientRect()
      focusTarget.x = clamp(
        (rect.left + rect.width * 0.5) / Math.max(1, window.innerWidth),
        0.04,
        0.96
      )
      focusTarget.y = clamp(
        (rect.top + rect.height * 0.5) / Math.max(1, window.innerHeight),
        0.06,
        0.94
      )
      focusTarget.strength = 1
    }

    const cellFromEvent = (target: EventTarget | null) =>
      target instanceof Element ? target.closest<HTMLElement>(".cell") : null

    const onPointerMove = (event: PointerEvent) => {
      pointerTarget.x = event.clientX / Math.max(1, window.innerWidth)
      pointerTarget.y = event.clientY / Math.max(1, window.innerHeight)
    }
    const onPointerOver = (event: PointerEvent) => {
      const next = cellFromEvent(event.target)
      if (next === hoveredCell) return
      hoveredCell = next
      updateFocus()
    }
    const onPointerOut = (event: PointerEvent) => {
      const next = cellFromEvent(event.relatedTarget)
      if (next === hoveredCell) return
      hoveredCell = next
      updateFocus()
    }
    const onFocusIn = (event: FocusEvent) => {
      focusedCell = cellFromEvent(event.target)
      updateFocus()
    }
    const onFocusOut = (event: FocusEvent) => {
      focusedCell = cellFromEvent(event.relatedTarget)
      updateFocus()
    }
    const onScroll = () => {
      updateScroll()
      updateFocus()
    }
    const onResize = () => updateFocus()

    window.addEventListener("pointermove", onPointerMove, { passive: true })
    document.addEventListener("pointerover", onPointerOver, { passive: true })
    document.addEventListener("pointerout", onPointerOut, { passive: true })
    document.addEventListener("focusin", onFocusIn)
    document.addEventListener("focusout", onFocusOut)
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onResize, { passive: true })
    updateScroll()

    let startLoop: (() => void) | undefined
    const syncLoop = () => {
      if (!startLoop) return
      if (document.hidden) {
        loop?.stop()
        loop = undefined
        return
      }
      startLoop()
    }
    const onVisibilityChange = () => syncLoop()
    document.addEventListener("visibilitychange", onVisibilityChange)

    void (async () => {
      try {
        const vgpu = await import("vgpu")
        const gpu = await getPortfolioGpu(vgpu)
        if (disposed) return

        const target = vgpu.surface(gpu, canvas, {
          alphaMode: "premultiplied",
          dpr: [1, 1.25],
          label: "portfolio-system-map-surface",
        })
        const systemMap = vgpu.effect(gpu, systemMapShader, {
          label: "portfolio-living-system-map",
          set: {
            params: {
              time: 0,
              aspect: target.size[0] / Math.max(1, target.size[1]),
              pointer: [pointer.x, pointer.y],
              focus: [focus.x, focus.y],
              focusStrength: 0,
              scroll,
              paper: document.body.dataset.theme === "paper" ? 1 : 0,
              motion: reduced ? 0 : 1,
            },
          },
        })

        await systemMap.compile({ colors: [target.format] })
        if (disposed) return

        const draw = (
          frameTime: number,
          frame?: Parameters<Parameters<VgpuModule["frameLoop"]>[1]>[0]
        ) => {
          pointer.x += (pointerTarget.x - pointer.x) * 0.055
          pointer.y += (pointerTarget.y - pointer.y) * 0.055
          focus.x += (focusTarget.x - focus.x) * 0.075
          focus.y += (focusTarget.y - focus.y) * 0.075
          focusStrength += (focusTarget.strength - focusStrength) * 0.08

          systemMap.set({
            params: {
              time: frameTime,
              aspect: target.size[0] / Math.max(1, target.size[1]),
              pointer: [pointer.x, pointer.y],
              focus: [focus.x, focus.y],
              focusStrength,
              scroll,
              paper: document.body.dataset.theme === "paper" ? 1 : 0,
              motion: reduced ? 0 : 1,
            },
          })
          if (frame) frame.pass(target, systemMap)
          else systemMap.draw(target)
        }

        startLoop = () => {
          if (loop || reduced || disposed || document.hidden) return
          const timer = vgpu.clock(gpu)
          loop = vgpu.frameLoop(gpu, (frame) => draw(timer.time, frame), {
            fps: getPortfolioFrameRate("background"),
          })
        }

        canvas.classList.add("is-ready")

        if (reduced) {
          drawStatic = () => {
            if (!disposed) draw(0)
          }
          drawStatic()
          const resizeObserver = new ResizeObserver(() => {
            requestAnimationFrame(() => drawStatic?.())
          })
          resizeObserver.observe(canvas)
          stopResize = () => resizeObserver.disconnect()
          return
        }

        syncLoop()
      } catch {
        // The charcoal material remains a complete no-WebGPU fallback.
      }
    })()

    return () => {
      disposed = true
      loop?.stop()
      stopResize?.()
      document.removeEventListener("visibilitychange", onVisibilityChange)
      window.removeEventListener("pointermove", onPointerMove)
      document.removeEventListener("pointerover", onPointerOver)
      document.removeEventListener("pointerout", onPointerOut)
      document.removeEventListener("focusin", onFocusIn)
      document.removeEventListener("focusout", onFocusOut)
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onResize)
      canvas.classList.remove("is-ready")
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="system-map-background"
      aria-hidden="true"
    />
  )
}
