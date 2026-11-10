"use client"
import { DeskScene } from "./desk-scene"
import { ProjectDossier } from "./project-dossier"
import { useDeskCamera } from "./use-desk-camera"
import { useDeskLighting } from "./desk-lighting"
import { LIGHTING_TOKENS, transitionDeskTheme } from "./desk-theme"
import { useEffect, useRef, useState } from "react"
import { gsap } from "gsap"
import { arcadeStore } from "@/lib/arcade/storage"
import {
  DESK_NOTE,
  DESK_CONTACT,
  PROJECT_NOTES,
  type ProjectNote,
} from "@/lib/arcade/projects"

export function ProjectDesk({
  projects = PROJECT_NOTES,
}: {
  projects?: ProjectNote[]
}) {
  const current = useRef<number | null>(null)
  const camera = useDeskCamera(current)
  const { host, world, reveal, veil } = camera
  const opener = useRef<HTMLElement | null>(null)
  const lightClock = useDeskLighting(host)
  const [selected, setSelected] = useState<number | null>(null),
    [light, setLight] = useState(true)
  const [closing, setClosing] = useState(false)
  const closeDelay = useRef<gsap.core.Tween | null>(null)
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">(
    "idle"
  )
  const compactRendering = useRef(false)
  const lighting = useRef<gsap.core.Animation | null>(null)
  const lightOn = useRef(true)
  const panelWasOpen = useRef(false)
  function open(index: number, button?: HTMLElement) {
    camera.finishEntrance()
    closeDelay.current?.kill()
    closeDelay.current = null
    setClosing(false)
    if (current.current === index) return
    setCopyStatus("idle")
    const entering = current.current === null
    if (button) opener.current = button
    current.current = index
    setSelected(index)
    camera.focus(index)
    const rect = host.current?.getBoundingClientRect()
    const bottomSheet = innerWidth <= 820 && innerHeight >= innerWidth
    if (
      entering &&
      !bottomSheet &&
      rect &&
      (rect.top < 40 || rect.bottom > innerHeight)
    )
      host.current?.scrollIntoView({
        block: "center",
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      })
  }
  function step(direction: -1 | 1) {
    const active = current.current
    open(
      active === -1
        ? direction === 1
          ? 0
          : projects.length - 1
        : ((active ?? 0) + direction + projects.length) % projects.length
    )
  }
  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(DESK_CONTACT.email)
      setCopyStatus("copied")
    } catch {
      setCopyStatus("error")
    }
  }
  function close() {
    if (current.current === null || closeDelay.current) return
    const finish = () => {
      closeDelay.current = null
      current.current = null
      setSelected(null)
      setClosing(false)
      opener.current?.focus({ preventScroll: true })
    }
    if (
      innerWidth <= 820 &&
      innerHeight >= innerWidth &&
      !matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setClosing(true)
      camera.reset({ anticipateCollapse: true })
      closeDelay.current = gsap.delayedCall(0.65, finish)
    } else {
      finish()
      camera.reset()
    }
  }
  function toggle() {
    const next = !lightOn.current
    lightOn.current = next
    setLight(next)
    arcadeStore.set("light", next)
    lighting.current?.kill()
    lighting.current = transitionDeskTheme(next, compactRendering)
  }
  useEffect(() => {
    const quality = matchMedia("(any-pointer: coarse), (max-width: 820px)")
    const syncQuality = () => {
      compactRendering.current = quality.matches
      if (host.current)
        host.current.dataset.renderQuality = quality.matches
          ? "compact"
          : "full"
    }
    syncQuality()
    quality.addEventListener("change", syncQuality)
    const on = arcadeStore.get("light", true)
    lightOn.current = on
    document.documentElement.classList.toggle("arcade-dark", !on)
    window.dispatchEvent(new Event("arcade-theme-change"))
    // Hydrate the persisted lamp control on the first browser frame.
    const initialPaint = requestAnimationFrame(() => setLight(lightOn.current))
    return () => {
      cancelAnimationFrame(initialPaint)
      quality.removeEventListener("change", syncQuality)
      lighting.current?.kill()
      closeDelay.current?.kill()
      for (const key of LIGHTING_TOKENS)
        document.documentElement.style.removeProperty(key)
      document.documentElement.classList.remove(
        "arcade-dark",
        "arcade-light-shifting"
      )
    }
  }, [host])
  useEffect(() => {
    if (
      selected !== null &&
      !panelWasOpen.current &&
      innerWidth <= 820 &&
      innerHeight >= innerWidth
    )
      host.current?.scrollIntoView({
        block: "start",
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      })
    panelWasOpen.current = selected !== null
  }, [selected, host])
  const isNote = selected === -1
  const work =
    selected === null ? null : isNote ? DESK_NOTE : projects[selected]
  return (
    <section
      className="reference-desk"
      data-focused={selected !== null}
      data-closing={closing}
      aria-label="Project desk"
      onKeyDown={(e) => {
        e.stopPropagation()
        if (selected === null) return
        if (e.key === "Escape") close()
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
          e.preventDefault()
          step(e.key === "ArrowRight" ? 1 : -1)
        }
      }}
    >
      <div
        ref={host}
        {...camera.sceneHandlers}
        className={`scene ${work ? "focused" : ""} ${closing ? "closing" : ""}`}
        onClick={(e) => {
          if (!(e.target as Element).closest(".it,.lamp,.detail,.crumb"))
            close()
        }}
      >
        <div
          ref={veil}
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background: "var(--paper)",
            opacity: 0,
            pointerEvents: "none",
            zIndex: 6,
          }}
        />
        {camera.zoomed && (
          <button
            type="button"
            className="zoom-reset m"
            onClick={(e) => {
              e.stopPropagation()
              camera.resetZoom()
            }}
          >
            reset zoom
          </button>
        )}
        <div className="timechip m mute" aria-hidden="true">
          {lightClock}
        </div>
        {work && (
          <div className="crumb m">
            <span>desk / {work.title}</span>
            <button onClick={close}>← back to desk</button>
          </div>
        )}
        <div ref={world} className="world">
          <div
            ref={reveal}
            className="desk-reveal"
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              transformStyle: "preserve-3d",
            }}
          >
            <DeskScene
              projects={projects}
              selected={selected}
              light={light}
              onOpen={open}
              onToggleLight={toggle}
            />
          </div>
        </div>
      </div>
      <ProjectDossier
        work={work}
        selected={selected}
        projectCount={projects.length}
        copyStatus={copyStatus}
        onCopyEmail={copyEmail}
        onStep={step}
        onClose={close}
      />
      <div
        className="list sr-only focus-within:not-sr-only"
        aria-label="Project shortcuts"
      >
        {projects.map((p, i) => (
          <button
            key={p.id}
            className="min-h-11"
            onClick={(e) => open(i, e.currentTarget)}
          >
            <span>{String(i + 1).padStart(2, "0")}</span>
            <b>{p.title}</b>
            <span className="mute">{p.platform || "sample"}</span>
            <span className="sig">↗</span>
          </button>
        ))}
      </div>
    </section>
  )
}
