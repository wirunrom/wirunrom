"use client"
import Image from "next/image"
import {
  IconBrandGithub,
  IconBrandNpm,
  IconBrandLinkedin,
  IconMail,
  IconFileDownload,
  IconCopy,
  IconWorld,
  IconShoppingCart,
  IconChefHat,
  IconDeviceDesktop,
  IconArrowNarrowRight,
} from "@tabler/icons-react"
import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"
import { arcadeStore } from "@/lib/arcade/storage"
import {
  DESK_NOTE,
  DESK_CONTACT,
  PROJECT_NOTES,
  type ProjectNote,
} from "@/lib/arcade/projects"

import {
  FinjarWebMock,
  FinjarMobileMock,
  PosHeartMock,
} from "./project-screen-mocks"

gsap.registerPlugin(ScrollTrigger, useGSAP)

const LINK_ICONS = {
  web: IconWorld,
  github: IconBrandGithub,
  npm: IconBrandNpm,
  mail: IconMail,
  linkedin: IconBrandLinkedin,
  pdf: IconFileDownload,
}

const LIGHTING_TOKENS = [
  "--paper",
  "--paper-2",
  "--ink",
  "--ink-2",
  "--mute",
  "--line",
  "--signal",
  "--shade",
  "--lamp-power",
] as const

type Position = { x: number; y: number; z?: number }
function Box({
  x,
  y,
  z = 0,
  w,
  d,
  h,
  rot = 0,
  r = 0,
  cls = "",
  children,
}: Position & {
  w: number
  d: number
  h: number
  rot?: number
  r?: number
  cls?: string
  children?: ReactNode
}) {
  return (
    <div
      className={`bx ${cls}`}
      style={{
        left: x,
        top: y,
        width: w,
        height: d,
        transform: `translateZ(${z}px) rotateZ(${rot}deg)`,
      }}
    >
      <div
        className="f-top"
        style={{ transform: `translateZ(${h}px)`, borderRadius: r }}
      >
        {children}
      </div>
      <div
        className="f-fr"
        style={{ top: d - h, height: h, transform: "rotateX(-90deg)" }}
      />
      <div
        className="f-lf"
        style={{ left: -h, width: h, transform: "rotateY(90deg)" }}
      />
      <div
        className="f-rt"
        style={{ left: w, width: h, transform: "rotateY(-90deg)" }}
      />
    </div>
  )
}
function Panel({
  x,
  y,
  z = 0,
  w,
  h,
  tilt = -90,
  thick = 6,
  r = 4,
  children,
}: Position & {
  w: number
  h: number
  tilt?: number
  thick?: number
  r?: number
  children?: ReactNode
}) {
  return (
    <div
      className="pl"
      style={{
        left: x,
        top: y - h,
        width: w,
        height: h,
        transformOrigin: "50% 100%",
        transform: `translateZ(${z}px) rotateX(${tilt}deg)`,
      }}
    >
      {Array.from({ length: Math.ceil(thick / 2) }, (_, i) => (
        <div
          key={i}
          className="back"
          style={{
            transform: `translateZ(${-thick + i * 2}px)`,
            borderRadius: r,
          }}
        />
      ))}
      <div className="face scr" style={{ borderRadius: r }}>
        {children}
      </div>
    </div>
  )
}
function Cylinder({
  x,
  y,
  z = 0,
  rad,
  h,
  n = 10,
  children,
}: Position & { rad: number; h: number; n?: number; children?: ReactNode }) {
  return (
    <div
      className="cy"
      style={{
        left: x - rad,
        top: y - rad,
        width: rad * 2,
        height: rad * 2,
        transform: `translateZ(${z}px)`,
      }}
    >
      {Array.from({ length: n }, (_, i) => (
        <div
          className="disc"
          key={i}
          style={{ transform: `translateZ(${(i / n) * h}px)` }}
        />
      ))}
      <div className="disc cap" style={{ transform: `translateZ(${h}px)` }}>
        {children}
      </div>
    </div>
  )
}
type Camera = {
  cx: number
  cy: number
  cz: number
  rx: number
  rz: number
  k: number
  ox: number
  oy: number
}
export function ProjectDesk({
  projects = PROJECT_NOTES,
}: {
  projects?: ProjectNote[]
}) {
  const host = useRef<HTMLDivElement>(null),
    world = useRef<HTMLDivElement>(null),
    reveal = useRef<HTMLDivElement>(null),
    veil = useRef<HTMLDivElement>(null),
    detailBody = useRef<HTMLDivElement>(null),
    closeButton = useRef<HTMLButtonElement>(null),
    opener = useRef<HTMLElement | null>(null)
  const [selected, setSelected] = useState<number | null>(null),
    [light, setLight] = useState(true)
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">(
    "idle"
  )
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
  const current = useRef<number | null>(null)
  const travelling = useRef(false)
  const tilt = useRef({ rx: 0, rz: 0 })
  const fit = useRef(1)
  const entrance = useRef<gsap.core.Timeline | null>(null)
  const lighting = useRef<gsap.core.Tween | null>(null)
  const lightOn = useRef(true)
  const panelWasOpen = useRef(false)
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
    return {
      cx: innerWidth < 600 ? 590 : 600,
      cy: innerWidth < 600 ? 370 : 360,
      cz: 40,
      rx: innerWidth < 600 ? 50 : 56,
      rz: innerWidth < 600 ? -16 : -30,
      k: innerWidth < 600 ? 1.32 : 1,
      ox: 0,
      oy: 0,
    }
  }
  function apply() {
    if (!host.current || !world.current) return
    const c = cam.current
    world.current.style.transform = `translate(${c.ox}px,${c.oy}px) scale(${fit.current * c.k}) rotateX(${c.rx + tilt.current.rx}deg) rotateZ(${c.rz + tilt.current.rz}deg) translate3d(${-c.cx}px,${-c.cy}px,${-c.cz}px)`
  }
  function destination(index: number): Camera {
    const r = host.current!.getBoundingClientRect()
    const bottomSheet = innerWidth <= 820 && innerHeight >= innerWidth
    const target =
      index === -1
        ? { cx: 1112, cy: 488, cz: 0, rx: 22, rz: -2, k: 3.6 }
        : index === 0
          ? { cx: 470, cy: 330, cz: 110, rx: 62, rz: -14, k: 1.9 }
          : index === 1
            ? { cx: 880, cy: 150, cz: 236, rx: 80, rz: -5, k: 2.1 }
            : {
                cx: 286 + (index - 2) * 226,
                cy: 636,
                cz: 0,
                rx: 34,
                rz: -6,
                k: 2.7,
              }
    return {
      ...target,
      k: target.k * (innerWidth < 600 ? 1.3 : 1),
      ox: bottomSheet
        ? 0
        : -Math.min(400, r.width * (innerWidth <= 820 ? 0.46 : 0.4)) / 2 - 10,
      oy: bottomSheet ? -r.height * 0.32 : 0,
    }
  }
  function fly(to: Camera) {
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
        },
      })
    )()
  }
  function open(index: number, button?: HTMLElement) {
    entrance.current?.progress(1)
    if (current.current === index) return
    setCopyStatus("idle")
    const entering = current.current === null
    if (button) opener.current = button
    current.current = index
    setSelected(index)
    fly(destination(index))
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
    if (current.current === null) return
    current.current = null
    setSelected(null)
    fly(home())
    opener.current?.focus({ preventScroll: true })
  }
  function toggle() {
    const next = !lightOn.current
    lightOn.current = next
    setLight(next)
    arcadeStore.set("light", next)
    const root = document.documentElement
    lighting.current?.kill()
    const before = getComputedStyle(root)
    const from = LIGHTING_TOKENS.map((key) => before.getPropertyValue(key))
    root.classList.toggle("arcade-dark", !next)
    for (const key of LIGHTING_TOKENS) root.style.removeProperty(key)
    const after = getComputedStyle(root)
    const target = Object.fromEntries(
      LIGHTING_TOKENS.map((key) => [key, after.getPropertyValue(key)])
    )
    const refresh = () => window.dispatchEvent(new Event("arcade-theme-change"))
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      root.classList.remove("arcade-light-shifting")
      refresh()
      return
    }
    LIGHTING_TOKENS.forEach((key, i) => root.style.setProperty(key, from[i]))
    root.classList.add("arcade-light-shifting")
    lighting.current = gsap.to(root, {
      ...target,
      duration: next ? 1.35 : 1.1,
      ease: next ? "power2.out" : "power2.inOut",
      onUpdate: refresh,
      onComplete: () => {
        for (const key of LIGHTING_TOKENS) root.style.removeProperty(key)
        root.classList.remove("arcade-light-shifting")
        refresh()
      },
    })
  }
  const retargetFlight = useEffectEvent((target: Camera) => fly(target))
  useEffect(() => {
    const on = arcadeStore.get("light", true)
    lightOn.current = on
    document.documentElement.classList.toggle("arcade-dark", !on)
    window.dispatchEvent(new Event("arcade-theme-change"))
    const camera = cam.current
    const pointerTilt = tilt.current
    let previousWidth = -1,
      previousHeight = -1
    let previousBottomSheet = innerWidth <= 820 && innerHeight >= innerWidth
    let layoutRestore: gsap.core.Tween | null = null
    const observer = new ResizeObserver(([entry]) => {
      if (
        entry.contentRect.width === previousWidth &&
        entry.contentRect.height === previousHeight
      )
        return
      fit.current = Math.min(
        entry.contentRect.width / 1560,
        entry.contentRect.height / 1080
      )
      previousWidth = entry.contentRect.width
      previousHeight = entry.contentRect.height
      const bottomSheet = innerWidth <= 820 && innerHeight >= innerWidth
      const changedLayout = bottomSheet !== previousBottomSheet
      previousBottomSheet = bottomSheet
      setLight(!document.documentElement.classList.contains("arcade-dark"))
      const target =
        current.current === null ? home() : destination(current.current)
      if (travelling.current) {
        // Opening the compact sheet changes stage height during the camera flight.
        // Retarget from the current pose rather than snapping to the destination.
        retargetFlight(target)
      } else {
        Object.assign(cam.current, target)
        apply()
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
      layoutRestore?.kill()
      gsap.killTweensOf(camera)
      gsap.killTweensOf(pointerTilt)
      lighting.current?.kill()
      for (const key of LIGHTING_TOKENS)
        document.documentElement.style.removeProperty(key)
      document.documentElement.classList.remove(
        "arcade-dark",
        "arcade-light-shifting"
      )
    }
  }, [])
  useEffect(() => {
    if (detailBody.current) detailBody.current.scrollTop = 0
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
    if (selected !== null) closeButton.current?.focus({ preventScroll: true })
  }, [selected])
  const isNote = selected === -1
  const work =
    selected === null ? null : isNote ? DESK_NOTE : projects[selected]
  function group(index: number, children: ReactNode, cls = "") {
    const entry = index === -1 ? DESK_NOTE : projects[index]
    if (!entry) return null
    return (
      <div
        key={entry.id}
        className={`it ${cls} ${selected === index ? "on" : ""}`}
        role="button"
        tabIndex={0}
        aria-label={
          index === -1 ? "Read sticky note" : `Open ${entry.title} project`
        }
        aria-expanded={selected === index}
        onClick={(e) => {
          e.stopPropagation()
          open(index, e.currentTarget)
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            open(index, e.currentTarget)
          }
        }}
      >
        {children}
      </div>
    )
  }
  return (
    <section
      className="reference-desk"
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
        onFocusCapture={() => entrance.current?.progress(1)}
        className={`scene ${work ? "focused" : ""}`}
        onClick={(e) => {
          if (!(e.target as Element).closest(".it,.lamp,.detail,.crumb"))
            close()
        }}
        onPointerMove={(e) => {
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
        }}
        onPointerLeave={() => {
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
            <div className="desk">
              <div className="floor" />
              <Box x={0} y={0} z={-34} w={1200} d={700} h={34} />
              <div className="glow" />
              <div
                className="mat flat"
                style={{ transform: "translateZ(.5px)" }}
              />
              <div
                className="lamp"
                role="button"
                tabIndex={0}
                aria-label="Switch light and dark theme"
                aria-pressed={light}
                onClick={(e) => {
                  e.stopPropagation()
                  toggle()
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    toggle()
                  }
                }}
              >
                <Cylinder x={96} y={120} rad={40} h={12} n={4} />
                <Panel x={90} y={124} z={12} w={12} h={196} />
                <Box x={96} y={112} z={196} w={130} d={12} h={10} />
                <div className="head">
                  <Cylinder x={226} y={118} z={150} rad={40} h={40} n={8}>
                    <i className="knob" />
                  </Cylinder>
                </div>
              </div>
              {group(
                0,
                <>
                  <Box x={214} y={254} w={390} d={248} h={12} r={8}>
                    <div className="kb">
                      {Array.from({ length: 51 }, (_, i) => (
                        <i key={i} className={i === 46 ? "w" : ""} />
                      ))}
                    </div>
                    <div className="pad-t" />
                  </Box>
                  <Panel x={214} y={258} z={12} w={390} h={248} tilt={-76}>
                    <FinjarWebMock />
                  </Panel>
                  <Box x={644} y={362} w={118} d={62} h={10} />
                  <Panel
                    x={657}
                    y={400}
                    z={10}
                    w={92}
                    h={186}
                    tilt={-70}
                    r={13}
                  >
                    <FinjarMobileMock />
                  </Panel>
                </>
              )}
              {group(
                1,
                <>
                  <Box x={805} y={88} w={150} d={72} h={8} r={6} />
                  <Box x={861} y={108} z={8} w={38} d={18} h={170} r={3} />
                  <Panel
                    x={630}
                    y={146}
                    z={86}
                    w={500}
                    h={300}
                    thick={14}
                    r={8}
                  >
                    <PosHeartMock />
                  </Panel>
                </>
              )}
              {projects.slice(2).map((p, i) =>
                group(
                  i + 2,
                  <>
                    <Box x={186 + i * 226} y={576} w={200} d={116} h={8} r={4}>
                      <div className="no">{String(i + 3).padStart(2, "0")}</div>
                      {p.id === "barqrcode" ? (
                        <>
                          <Image
                            className="file-qr"
                            src="/projects/barqrcode-qr.png"
                            width={256}
                            height={256}
                            unoptimized
                            alt=""
                            aria-hidden="true"
                          />
                          <Image
                            className="file-barcode"
                            src="/projects/barqrcode-barcode.png"
                            width={462}
                            height={80}
                            unoptimized
                            alt=""
                            aria-hidden="true"
                          />
                        </>
                      ) : p.id === "online-ordering" ? (
                        <>
                          <div className="order-ticket" aria-hidden="true">
                            <b>ORDER #04</b>
                            <span>TABLE 07 · DINE IN</span>
                            <i />
                            <i />
                            <i />
                          </div>
                          <div className="order-flow" aria-hidden="true">
                            <span>
                              <IconShoppingCart size={15} stroke={1.5} />
                              <small>order</small>
                            </span>
                            <IconArrowNarrowRight size={18} stroke={1.5} />
                            <span>
                              <IconChefHat size={15} stroke={1.5} />
                              <small>kitchen</small>
                            </span>
                            <IconArrowNarrowRight size={18} stroke={1.5} />
                            <span>
                              <IconDeviceDesktop size={15} stroke={1.5} />
                              <small>POS</small>
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="ln" />
                      )}
                      <div className="nm">
                        <span>{p.title}</span>
                        <span>↗</span>
                      </div>
                    </Box>
                    <div
                      className="tab"
                      style={{
                        left: 200 + i * 226,
                        top: 558,
                        transform: "translateZ(8px)",
                      }}
                    >
                      {p.placeholder ? "sample" : p.platform || "project"}
                    </div>
                  </>,
                  `folder${p.id === "barqrcode" ? " barcode-file" : ""}`
                )
              )}
              <div
                className="shadow"
                aria-hidden="true"
                style={{ left: 700, top: 574, width: 346, height: 116 }}
              />
              <Box x={692} y={566} w={340} d={112} h={12} r={8}>
                <div
                  className="kb kb2"
                  aria-hidden="true"
                  style={{ transform: "translateZ(.5px)" }}
                >
                  {Array.from({ length: 63 }, (_, i) => (
                    <i
                      key={i}
                      className={
                        i === 58
                          ? "w2"
                          : [14, 28, 41, 42, 54].includes(i)
                            ? "h"
                            : undefined
                      }
                    />
                  ))}
                </div>
              </Box>
              <div
                className="shadow"
                aria-hidden="true"
                style={{
                  left: 1068,
                  top: 592,
                  width: 52,
                  height: 76,
                  borderRadius: 24,
                }}
              />
              <div
                className="mouse"
                aria-hidden="true"
                style={{
                  left: 1060,
                  top: 582,
                  width: 50,
                  height: 78,
                  transform: "rotateZ(-8deg)",
                }}
              >
                {Array.from({ length: 13 }, (_, i) => {
                  const t = i / 12
                  const width = 50 * (1 - 0.16 * t * t)
                  const depth = 78 * (1 - 0.08 * t * t)
                  return (
                    <div
                      key={i}
                      className={i === 12 ? "slice cap" : "slice"}
                      style={{
                        left: (50 - width) / 2,
                        top: (78 - depth) / 2 - 3 * t,
                        width,
                        height: depth,
                        transform: `translateZ(${t * 16}px)`,
                      }}
                    >
                      {i === 12 ? (
                        <>
                          <i className="mbtn" />
                          <i className="wheel" />
                        </>
                      ) : null}
                    </div>
                  )
                })}
              </div>
              {Array.from({ length: 3 }, (_, i) => (
                <Box
                  key={i}
                  x={1088 + (i % 2) * 6}
                  y={70 + i * 4}
                  z={i * 18}
                  w={92}
                  d={126}
                  h={18}
                  rot={i === 1 ? 4 : -2}
                />
              ))}
              <Cylinder x={1100} y={360} rad={34} h={66}>
                <span
                  style={{
                    position: "absolute",
                    inset: 7,
                    borderRadius: "50%",
                    background: "var(--signal)",
                  }}
                />
              </Cylinder>
              <Box x={1130} y={350} z={18} w={20} d={12} h={32} />
              {group(
                -1,
                <div
                  className="note"
                  style={{
                    left: 1060,
                    top: 440,
                    width: 104,
                    height: 96,
                    transform: "translateZ(1px) rotate(5deg)",
                  }}
                >
                  {DESK_NOTE.short.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </div>,
                "notegrp"
              )}
              <Box x={640} y={500} w={132} d={7} h={7} rot={-18} />
            </div>
          </div>
        </div>
        <aside
          className={isNote ? "detail detail-contact" : "detail"}
          aria-label="Project details"
          aria-hidden={!work}
          inert={!work}
        >
          <div className="top">
            <span>
              {isNote
                ? "note"
                : `${selected === null ? "" : String(selected + 1).padStart(2, "0")} / ${projects.length}`}
            </span>
            <span>{isNote ? "sticky note" : work?.platform || "sample"}</span>
          </div>
          <div ref={detailBody} className="body">
            <span className="status">
              {work?.status ||
                (work?.placeholder ? "sample file" : "work in progress")}
            </span>
            <h2>{work?.title}</h2>
            <p>{work?.summary}</p>
            {isNote ? (
              <>
                <dl className="contact-info">
                  <dt>name</dt>
                  <dd>{DESK_CONTACT.name}</dd>
                  <dt>role</dt>
                  <dd>{DESK_CONTACT.role}</dd>
                  <dt>based</dt>
                  <dd>
                    {DESK_CONTACT.location} · {DESK_CONTACT.timezone}
                  </dd>
                  <dt className="contact-email-label">email</dt>
                  <dd className="contact-email">
                    <span className="select-text">{DESK_CONTACT.email}</span>
                    <button
                      type="button"
                      onClick={copyEmail}
                      className="copy-email"
                      aria-label="Copy email address"
                    >
                      <IconCopy size={14} stroke={1.5} aria-hidden="true" />
                      <span>{copyStatus === "copied" ? "copied" : "copy"}</span>
                    </button>
                  </dd>
                </dl>
                <span
                  role="status"
                  className={
                    copyStatus === "error" ? "text-mute text-[10px]" : "sr-only"
                  }
                >
                  {copyStatus === "copied"
                    ? "email copied"
                    : copyStatus === "error"
                      ? "couldn’t copy. select the email above to copy it."
                      : ""}
                </span>
                <p>{DESK_CONTACT.invitation}</p>
              </>
            ) : (
              <dl>
                <dt>platform</dt>
                <dd>{work?.platform || "to be decided"}</dd>
                <dt>type</dt>
                <dd>
                  {work?.category ||
                    (work?.placeholder ? "sample project" : "personal project")}
                </dd>
                <dt>stack</dt>
                <dd className="min-w-0 break-words">
                  {work?.stack?.join(" · ") || "to be decided"}
                </dd>
              </dl>
            )}
            {work?.notes?.length ? (
              <ul>
                {work.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            ) : null}
            {work?.hint ? (
              <small className="text-mute leading-relaxed block text-[10px]">
                {work.hint}
              </small>
            ) : null}
          </div>
          <div className="foot">
            {work?.links?.length ? (
              <nav
                className="project-links"
                aria-label={isNote ? "Contact links" : "Project links"}
              >
                {work.links.map((link) => {
                  const Icon = LINK_ICONS[link.kind]
                  return (
                    <a
                      key={link.href}
                      href={link.href}
                      aria-label={`${work.title}: ${link.label}`}
                      title={link.label}
                      download={link.download}
                      target={
                        link.kind === "mail" || link.download
                          ? undefined
                          : "_blank"
                      }
                      rel="noopener noreferrer"
                    >
                      <Icon size={17} stroke={1.6} aria-hidden="true" />
                      <span>{link.label}</span>
                    </a>
                  )
                })}
              </nav>
            ) : null}
            <nav className="project-navigation" aria-label="Project navigation">
              <button onClick={() => step(-1)}>← prev</button>
              <button onClick={() => step(1)}>next →</button>
              <button ref={closeButton} onClick={close}>
                close ×
              </button>
            </nav>
          </div>
        </aside>
      </div>
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
