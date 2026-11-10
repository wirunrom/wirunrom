import type { ReactNode } from "react"
import { DeskLightSurface } from "./desk-lighting"

type Position = { x: number; y: number; z?: number }
export function Box({
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
        <DeskLightSurface x={x} y={y} z={z + h} />
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
export function Panel({
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
export function Cylinder({
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
