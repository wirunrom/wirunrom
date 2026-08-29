"use client"

import { useEffect, useState } from "react"

/* 04 · Local clock. The portfolio intentionally ships with one fixed material
   system, so display controls do not compete with the content. */
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
    </section>
  )
}
