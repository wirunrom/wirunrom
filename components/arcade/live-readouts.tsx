"use client"

import { useEffect, useRef, useState } from "react"

export function LocalClock() {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Bangkok",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
    const update = () => {
      if (ref.current)
        ref.current.textContent = `gmt+7 ${formatter.format(new Date())}`
    }
    update()
    const timer = window.setInterval(update, 1000)
    return () => window.clearInterval(timer)
  }, [])
  return <span ref={ref}>gmt+7 00:00:00</span>
}

export function MatchaLevel() {
  const [level, setLevel] = useState(63)
  const refill = useRef(0)
  useEffect(() => {
    const update = () =>
      setLevel(
        Math.max(
          12,
          100 - Math.floor(((Date.now() - refill.current) / 60000) % 88)
        )
      )
    update()
    const timer = window.setInterval(update, 1000)
    return () => window.clearInterval(timer)
  }, [])
  return (
    <button
      type="button"
      className="cursor-pointer text-left"
      title="refill"
      onClick={() => {
        refill.current = Date.now()
        setLevel(100)
      }}
    >
      matcha level {level}%
    </button>
  )
}
