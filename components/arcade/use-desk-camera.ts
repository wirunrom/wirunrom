"use client"

import {
  useEffect,
  useEffectEvent,
  useRef,
  type RefObject,
  type PointerEvent,
} from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"
import {
  homeCamera,
  projectCamera,
  windowCamera,
  type Camera,
} from "@/lib/arcade/desk-camera"
import { useDeskPinch } from "./use-desk-pinch"

gsap.registerPlugin(ScrollTrigger, useGSAP)

/** Owns camera motion and its resources; selection stays synchronous in the desk. */
export function useDeskCamera(current: RefObject<number | null>) {
  const host = useRef<HTMLDivElement>(null)
  const world = useRef<HTMLDivElement>(null)
  const reveal = useRef<HTMLDivElement>(null)
  const veil = useRef<HTMLDivElement>(null)
  const cam = useRef<Camera>({
    cx: 600,
    cy: 360,
    cz: 40,
    rx: 56,
    rz: -30,
    k: 1,
    ox: 0,
    oy: 0,
  })
  const travelling = useRef(false)
  const tilt = useRef({ rx: 0, rz: 0 })
  // Touch: pinch zooms the camera inside the scene instead of the page (see use-desk-pinch.ts).
  const pinch = useDeskPinch(host)
  const fit = useRef(1)
  const entrance = useRef<gsap.core.Timeline | null>(null)
  const { contextSafe } = useGSAP(
    () => {
      if (
        !reveal.current ||
        matchMedia("(prefers-reduced-motion: reduce)").matches
      )
        return
      entrance.current = gsap
        .timeline({
          scrollTrigger: {
            trigger: host.current,
            start: "top 85%",
            once: true,
          },
        })
        .fromTo(
          reveal.current,
          { z: -40 },
          { z: 0, duration: 0.8, ease: "power2.out", clearProps: "transform" },
          0
        )
        .fromTo(
          veil.current,
          { opacity: 1 },
          { opacity: 0, duration: 0.65, ease: "power1.out" },
          0
        )
    },
    { scope: host }
  )
  function home(): Camera {
    return homeCamera(
      { width: innerWidth, height: innerHeight },
      host.current?.clientHeight ?? 0
    )
  }
  function apply() {
    if (!host.current || !world.current) return
    const c = cam.current
    const v = pinch.view.current
    world.current.style.transform = `translate(${c.ox + v.x}px,${c.oy + v.y}px) scale(${fit.current * c.k * v.z}) rotateX(${c.rx + tilt.current.rx}deg) rotateZ(${c.rz + tilt.current.rz}deg) translate3d(${-c.cx}px,${-c.cy}px,${-c.cz}px)`
  }
  function destination(index: number): Camera {
    const bounds = host.current!.getBoundingClientRect()
    if (index === -2) return windowCamera(bounds, fit.current)
    return projectCamera(
      index,
      { width: innerWidth, height: innerHeight },
      bounds
    )
  }
  function fly(to: Camera) {
    pinch.reset()
    travelling.current = true
    if (host.current) host.current.dataset.cameraMoving = "true"
    gsap.killTweensOf(tilt.current)
    tilt.current.rx = tilt.current.rz = 0
    contextSafe(() =>
      gsap.to(cam.current, {
        ...to,
        duration: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? 0
          : 0.65,
        ease: "power2.inOut",
        overwrite: true,
        onUpdate: apply,
        onComplete: () => {
          travelling.current = false
          if (host.current) host.current.dataset.cameraMoving = "false"
          apply()
        },
      })
    )()
  }
  function reset({
    anticipateCollapse = false,
  }: { anticipateCollapse?: boolean } = {}) {
    const target = home()
    if (anticipateCollapse) {
      const idleHeight = Math.min(500, Math.max(340, innerHeight * 0.52))
      const idleFit = Math.min(
        (host.current?.clientWidth ?? 0) / 1560,
        idleHeight / 1080
      )
      target.k *= idleFit / fit.current
    }
    fly(target)
  }
  const retargetFlight = useEffectEvent((target: Camera) => fly(target))
  const applyCamera = useEffectEvent(() => apply())
  const connectPinch = useEffectEvent(() =>
    pinch.connect(
      apply,
      () =>
        travelling.current ||
        (entrance.current !== null && entrance.current.progress() < 1)
    )
  )
  useEffect(() => {
    connectPinch()
    const viewport = window.visualViewport
    const syncZoom = () => {
      if (host.current)
        host.current.dataset.nativeZoomed = String(
          (viewport?.scale ?? 1) > 1.02
        )
    }
    syncZoom()
    viewport?.addEventListener("resize", syncZoom, { passive: true })
    // iOS WebKit (Safari and Chrome) also needs its non-standard gesture events cancelled to stop a pinch that starts on the desk.
    const scene = host.current
    const blockGesture = (event: Event) => event.preventDefault()
    for (const type of ["gesturestart", "gesturechange"])
      scene?.addEventListener(type, blockGesture, { passive: false })
    const camera = cam.current
    const pointerTilt = tilt.current
    let previousWidth = -1,
      previousHeight = -1
    let previousBottomSheet = innerWidth <= 820 && innerHeight >= innerWidth
    let layoutRestore: gsap.core.Tween | null = null
    const observer = new ResizeObserver(([entry]) => {
      const width = Math.round(entry.contentRect.width)
      const height = Math.round(entry.contentRect.height)
      if (width === previousWidth && height === previousHeight) return
      fit.current = Math.min(width / 1560, height / 1080)
      previousWidth = width
      previousHeight = height
      const bottomSheet = innerWidth <= 820 && innerHeight >= innerWidth
      const changedLayout = bottomSheet !== previousBottomSheet
      previousBottomSheet = bottomSheet
      const target =
        current.current === null ? home() : destination(current.current)
      if (travelling.current) {
        // Opening the compact sheet changes stage height during the camera flight.
        // Retarget from the current pose rather than snapping to the destination.
        retargetFlight(target)
      } else {
        Object.assign(cam.current, target)
        applyCamera()
      }
      if (changedLayout && current.current !== null) {
        layoutRestore?.kill()
        // ScrollTrigger restores page scroll during its debounced resize refresh.
        layoutRestore = gsap.delayedCall(0.35, () => {
          if (current.current !== null)
            host.current?.scrollIntoView({
              block: "start",
              behavior: "instant",
            })
        })
      }
    })
    if (host.current) observer.observe(host.current)
    return () => {
      observer.disconnect()
      viewport?.removeEventListener("resize", syncZoom)
      for (const type of ["gesturestart", "gesturechange"])
        scene?.removeEventListener(type, blockGesture)
      layoutRestore?.kill()
      gsap.killTweensOf(camera)
      gsap.killTweensOf(pointerTilt)
    }
  }, [current])
  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (
      current.current !== null ||
      travelling.current ||
      (entrance.current !== null && entrance.current.progress() < 1) ||
      e.pointerType !== "mouse" ||
      matchMedia("(prefers-reduced-motion: reduce)").matches ||
      (e.target instanceof Element &&
        e.target.closest("button,.it,.lamp,.detail,.crumb"))
    )
      return
    const r = e.currentTarget.getBoundingClientRect()
    contextSafe(() =>
      gsap.to(tilt.current, {
        rz: ((e.clientX - r.left) / r.width - 0.5) * 4,
        rx: -((e.clientY - r.top) / r.height - 0.5) * 3,
        duration: 0.25,
        ease: "power2.out",
        overwrite: true,
        onUpdate: apply,
      })
    )()
  }
  function onPointerLeave() {
    if (current.current === null && !travelling.current)
      contextSafe(() =>
        gsap.to(tilt.current, {
          rx: 0,
          rz: 0,
          duration: 0.25,
          overwrite: true,
          onUpdate: apply,
        })
      )()
  }
  function finishEntrance() {
    entrance.current?.progress(1)
  }
  return {
    host,
    world,
    reveal,
    veil,
    focus: (index: number) => fly(destination(index)),
    reset,
    finishEntrance,
    sceneHandlers: {
      onFocusCapture: finishEntrance,
      onPointerMove,
      onPointerLeave,
    },
    zoomed: pinch.zoomed,
    resetZoom: pinch.reset,
  }
}
