"use client"

import { useEffect, useRef } from "react"

/**
 * The grid board. Renders server-rendered cells as children and runs the
 * transform-only entrance reveal: cells start shifted (.preanim) and settle
 * once painted. Opacity stays 1 throughout so no-JS/print still show content.
 */
export function BentoBoard({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const board = ref.current
    if (!board) return
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => board.classList.remove("preanim"))
    )
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <main className="board preanim" ref={ref}>
      {children}
    </main>
  )
}
