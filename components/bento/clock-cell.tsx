"use client"

import { useEffect, useState } from "react"

import { ThemeControls } from "./theme-controls"

/* 04 · CLOCK + display settings (theme controls live here — they're a utility,
   not portfolio content, so they share this cell instead of taking their own). */
export function ClockCell() {
  const [time, setTime] = useState("--:--:--")

  useEffect(() => {
    const tick = () => {
      const now = new Date(
        Date.now() + new Date().getTimezoneOffset() * 60000 + 7 * 3600000
      )
      const p = (n: number) => String(n).padStart(2, "0")
      setTime(`${p(now.getHours())}:${p(now.getMinutes())}:${p(now.getSeconds())}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <section className="cell c-clock">
      <div>
        <span className="label m3">Local time</span>
        <div className="clock-time">{time}</div>
        <div className="clock-zone m3">Chiang Mai · TH · GMT+7</div>
      </div>
      <div className="clock-theme">
        <span className="label m3">Theme</span>
        <div className="set-controls">
          <ThemeControls />
        </div>
      </div>
    </section>
  )
}
