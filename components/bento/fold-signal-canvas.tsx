"use client"

import { useEffect, useRef } from "react"

import foldSignalShader from "./fold-signal.wgsl"
import { getPortfolioFrameRate, getPortfolioGpu } from "./vgpu-runtime"

type VgpuModule = typeof import("vgpu")
type Loop = ReturnType<VgpuModule["frameLoop"]>
type SignalKind =
  | "orders"
  | "forecast"
  | "experience"
  | "projects"
  | "capabilities"
  | "contact"

const KIND_INDEX: Record<SignalKind, number> = {
  orders: 0,
  forecast: 1,
  experience: 2,
  projects: 3,
  capabilities: 4,
  contact: 5,
}

function getPageState() {
  return {
    paper: document.body.dataset.theme === "paper" ? 1 : 0,
  }
}

/**
 * A small WebGPU narrative surface. All instances share one GPU context; each
 * canvas owns a pre-warmed effect and pauses while offscreen or hidden.
 */
export function FoldSignalCanvas({ kind }: { kind: SignalKind }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const host = canvas?.closest<HTMLElement>(".cell")
    if (!canvas || !host || !("gpu" in navigator)) return

    let disposed = false
    let loop: Loop | undefined
    let stopResize: (() => void) | undefined
    let drawStatic: (() => void) | undefined
    let pageState = getPageState()
    let visible = true
    let pointerInside = false
    let energy = 0
    const pointer = { x: 0.72, y: 0.45 }
    let pointerTarget = { ...pointer }
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
      pointerTarget = { x: 0.72, y: 0.45 }
    }

    host.addEventListener("pointermove", onPointerMove, { passive: true })
    host.addEventListener("pointerenter", onPointerEnter, { passive: true })
    host.addEventListener("pointerleave", onPointerLeave, { passive: true })

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

    const pageObserver = new MutationObserver(() => {
      pageState = getPageState()
      drawStatic?.()
      syncLoop()
    })
    pageObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ["data-theme"],
    })

    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        visible = entry?.isIntersecting ?? false
        syncLoop()
      },
      { threshold: 0.04 }
    )
    visibilityObserver.observe(host)

    const onVisibilityChange = () => syncLoop()
    document.addEventListener("visibilitychange", onVisibilityChange)

    void (async () => {
      try {
        const vgpu = await import("vgpu")
        const gpu = await getPortfolioGpu(vgpu)
        if (disposed) return

        const target = vgpu.surface(gpu, canvas, {
          alphaMode: "premultiplied",
          dpr: [1, 1.35],
          label: `fold-${kind}-surface`,
        })
        const signal = vgpu.effect(gpu, foldSignalShader, {
          label: `fold-${kind}-signal`,
          set: {
            params: {
              time: 0,
              aspect: target.size[0] / Math.max(1, target.size[1]),
              pointer: [pointer.x, pointer.y],
              paper: pageState.paper,
              energy: 0,
              kind: KIND_INDEX[kind],
            },
          },
        })

        await signal.compile({ colors: [target.format] })
        if (disposed) return

        const draw = (
          frameTime: number,
          frame?: Parameters<Parameters<VgpuModule["frameLoop"]>[1]>[0]
        ) => {
          pointer.x += (pointerTarget.x - pointer.x) * 0.12
          pointer.y += (pointerTarget.y - pointer.y) * 0.12
          energy += ((pointerInside ? 1 : 0) - energy) * 0.1
          signal.set({
            params: {
              time: frameTime,
              aspect: target.size[0] / Math.max(1, target.size[1]),
              pointer: [pointer.x, pointer.y],
              paper: pageState.paper,
              energy,
              kind: KIND_INDEX[kind],
            },
          })
          if (frame) frame.pass(target, signal)
          else signal.draw(target)
        }

        startLoop = () => {
          if (loop || reduced || disposed || !visible || document.hidden) return
          const timer = vgpu.clock(gpu)
          loop = vgpu.frameLoop(gpu, (frame) => draw(timer.time, frame), {
            fps: getPortfolioFrameRate("cell"),
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
          resizeObserver.observe(host)
          stopResize = () => resizeObserver.disconnect()
          return
        }

        syncLoop()
      } catch {
        // The editorial surface remains fully legible without WebGPU.
      }
    })()

    return () => {
      disposed = true
      loop?.stop()
      stopResize?.()
      pageObserver.disconnect()
      visibilityObserver.disconnect()
      document.removeEventListener("visibilitychange", onVisibilityChange)
      host.removeEventListener("pointermove", onPointerMove)
      host.removeEventListener("pointerenter", onPointerEnter)
      host.removeEventListener("pointerleave", onPointerLeave)
      canvas.classList.remove("is-ready")
    }
  }, [kind])

  return (
    <canvas
      className={`fold-signal fold-signal-${kind}`}
      ref={canvasRef}
      aria-hidden="true"
    />
  )
}
