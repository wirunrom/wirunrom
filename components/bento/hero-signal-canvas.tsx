"use client"

import { useEffect, useRef } from "react"

import signalShader from "./hero-signal.wgsl"
import { getPortfolioFrameRate, getPortfolioGpu } from "./vgpu-runtime"

type VgpuModule = typeof import("vgpu")
type Gpu = Awaited<ReturnType<VgpuModule["init"]>>
type Loop = ReturnType<VgpuModule["frameLoop"]>

function getTheme() {
  const body = document.body
  return {
    paper: body.dataset.theme === "paper" ? 1 : 0,
  }
}

export function HeroSignalCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const host = canvas?.closest<HTMLElement>(".c-hero")
    if (!canvas || !host || !("gpu" in navigator)) return

    let disposed = false
    let gpu: Gpu | undefined
    let loop: Loop | undefined
    let stopResize: (() => void) | undefined
    let theme = getTheme()
    let visible = true
    let pointerInside = false
    const pointer = { x: 0.5, y: 0.5 }
    let pointerTarget = { x: 0.5, y: 0.5 }
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches

    const onPointerMove = (event: PointerEvent) => {
      const bounds = host.getBoundingClientRect()
      pointerTarget = {
        x: Math.min(
          1,
          Math.max(0, (event.clientX - bounds.left) / bounds.width)
        ),
        y: Math.min(
          1,
          Math.max(0, (event.clientY - bounds.top) / bounds.height)
        ),
      }
    }
    const onPointerEnter = () => {
      pointerInside = true
    }
    const onPointerLeave = () => {
      pointerInside = false
      pointerTarget = { x: 0.5, y: 0.5 }
    }

    host.addEventListener("pointermove", onPointerMove, { passive: true })
    host.addEventListener("pointerenter", onPointerEnter, { passive: true })
    host.addEventListener("pointerleave", onPointerLeave, { passive: true })

    const themeObserver = new MutationObserver(() => {
      theme = getTheme()
    })
    themeObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ["data-theme"],
    })

    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        visible = entry?.isIntersecting ?? false
        syncLoop()
      },
      { threshold: 0.05 }
    )
    visibilityObserver.observe(host)

    let startLoop: (() => void) | undefined
    const syncLoop = () => {
      if (!startLoop) return
      if (!visible || document.hidden) {
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
        gpu = await getPortfolioGpu(vgpu)
        if (disposed) return

        const target = vgpu.surface(gpu, canvas, {
          alphaMode: "premultiplied",
          dpr: [1, 1.5],
          label: "hero-signal-surface",
        })
        const signal = vgpu.effect(gpu, signalShader, {
          label: "hero-signal",
          set: {
            params: {
              time: 0,
              aspect: target.size[0] / Math.max(1, target.size[1]),
              pointer: [0.5, 0.5],
              paper: theme.paper,
              motion: reduced ? 0 : 1,
              energy: 0,
            },
          },
        })

        await signal.compile({ colors: [target.format] })
        if (disposed) return

        const draw = (
          frameTime: number,
          frame?: Parameters<Parameters<VgpuModule["frameLoop"]>[1]>[0]
        ) => {
          pointer.x += (pointerTarget.x - pointer.x) * 0.11
          pointer.y += (pointerTarget.y - pointer.y) * 0.11
          signal.set({
            params: {
              time: frameTime,
              aspect: target.size[0] / Math.max(1, target.size[1]),
              pointer: [pointer.x, pointer.y],
              paper: theme.paper,
              motion: reduced ? 0 : 1,
              energy: pointerInside ? 1 : 0,
            },
          })
          if (frame) frame.pass(target, signal)
          else signal.draw(target)
        }

        startLoop = () => {
          if (loop || reduced || disposed || !visible || document.hidden) return
          const timer = vgpu.clock(gpu as Gpu)
          loop = vgpu.frameLoop(
            gpu as Gpu,
            (frame) => draw(timer.time, frame),
            { fps: getPortfolioFrameRate("hero") }
          )
        }

        canvas.classList.add("is-ready")
        host.classList.add("hero-signal-active")

        if (reduced) {
          draw(0)
          const resizeObserver = new ResizeObserver(() => {
            requestAnimationFrame(() => {
              if (!disposed) draw(0)
            })
          })
          resizeObserver.observe(host)
          stopResize = () => resizeObserver.disconnect()
        } else {
          syncLoop()
        }
      } catch {
        // CSS spotlight/blob remain active as the no-WebGPU fallback.
      }
    })()

    return () => {
      disposed = true
      loop?.stop()
      stopResize?.()
      themeObserver.disconnect()
      visibilityObserver.disconnect()
      document.removeEventListener("visibilitychange", onVisibilityChange)
      host.removeEventListener("pointermove", onPointerMove)
      host.removeEventListener("pointerenter", onPointerEnter)
      host.removeEventListener("pointerleave", onPointerLeave)
      canvas.classList.remove("is-ready")
      host.classList.remove("hero-signal-active")
    }
  }, [])

  return <canvas ref={canvasRef} className="hero-signal" aria-hidden="true" />
}
