import Image from "next/image"
import type { ReactNode } from "react"
import {
  IconShoppingCart,
  IconChefHat,
  IconDeviceDesktop,
  IconArrowNarrowRight,
} from "@tabler/icons-react"
import { Box, Panel, Cylinder } from "./desk-primitives"
import { DeskLightSurface } from "./desk-lighting"
import { DeskPaws } from "./desk-window"
import { DeskScreen } from "./desk-screen"
import { DESK_NOTE, type ProjectNote } from "@/lib/arcade/projects"

type DeskSceneProps = {
  projects: ProjectNote[]
  selected: number | null
  light: boolean
  onOpen: (index: number, opener?: HTMLElement) => void
  onToggleLight: () => void
  onLookUp: (opener?: HTMLElement) => void
  windowOpen: boolean
}

/** Preserve this DOM hierarchy: wrappers can flatten the CSS 3D scene. */
export function DeskScene({
  projects,
  selected,
  light,
  onOpen,
  onToggleLight,
  onLookUp,
  windowOpen,
}: DeskSceneProps) {
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
          onOpen(index, e.currentTarget)
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            onOpen(index, e.currentTarget)
          }
        }}
      >
        {children}
      </div>
    )
  }
  return (
    <div className="desk" inert={windowOpen}>
      <div className="floor" />
      <Box x={0} y={0} z={-34} w={1200} d={700} h={34} />
      <div className="glow" />
      <div className="mat flat" style={{ transform: "translateZ(.5px)" }}>
        <DeskLightSurface x={180} y={222} z={0.5} />
      </div>
      <div className="desk-cast" aria-hidden="true" />
      <DeskPaws
        enabled={selected === null && !windowOpen}
        onFollow={onLookUp}
      />
      <div
        className="lamp"
        role="button"
        tabIndex={0}
        aria-label="Switch light and dark theme"
        aria-pressed={light}
        onClick={(e) => {
          e.stopPropagation()
          onToggleLight()
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            onToggleLight()
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
            <DeskScreen kind="web" />
          </Panel>
          <Box x={644} y={362} w={118} d={62} h={10} />
          <Panel x={657} y={400} z={10} w={92} h={186} tilt={-70} r={13}>
            <DeskScreen kind="phone" />
          </Panel>
        </>
      )}
      {group(
        1,
        <>
          <Box x={805} y={88} w={150} d={72} h={8} r={6} />
          <Box x={861} y={108} z={8} w={38} d={18} h={170} r={3} />
          <Panel x={630} y={146} z={86} w={500} h={300} thick={14} r={8}>
            <DeskScreen kind="pos" />
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
                    loading="eager"
                    fetchPriority="high"
                    decoding="sync"
                    alt=""
                    aria-hidden="true"
                  />
                  <Image
                    className="file-barcode"
                    src="/projects/barqrcode-barcode.png"
                    width={462}
                    height={80}
                    unoptimized
                    loading="eager"
                    fetchPriority="high"
                    decoding="sync"
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
                      <IconDeviceDesktop size={15} stroke={1.5} />
                      <small>POS</small>
                    </span>
                    <IconArrowNarrowRight size={18} stroke={1.5} />
                    <span>
                      <IconChefHat size={15} stroke={1.5} />
                      <small>kitchen</small>
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
          <DeskLightSurface x={1060} y={440} z={1} />
        </div>,
        "notegrp"
      )}
      <Box x={640} y={500} w={132} d={7} h={7} rot={-18} />
    </div>
  )
}
