"use client"

import { useEffect, useRef } from "react"

/**
 * The single Editorial Fold board. Content stays server-rendered; this island
 * only owns the one-shot entrance cascade. Continuous interaction belongs to
 * the WebGPU surfaces inside each narrative cell.
 */
export function BentoBoard({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const board = ref.current
    if (!board) return

    board.classList.add("preanim")
    const cells = Array.from(board.querySelectorAll<HTMLElement>(".cell"))

    cells.forEach((cell) => {
      let index = 0
      for (const child of Array.from(cell.children)) {
        ;(child as HTMLElement).style.setProperty("--i", String(index++))
        child.classList.add("st")
      }
    })

    const frame = requestAnimationFrame(() =>
      requestAnimationFrame(() => board.classList.remove("preanim"))
    )

    return () => {
      cancelAnimationFrame(frame)
      cells.forEach((cell) => {
        for (const child of Array.from(cell.children)) {
          ;(child as HTMLElement).classList.remove("st")
        }
      })
    }
  }, [])

  return (
    <main className="board preanim" ref={ref}>
      {children}
    </main>
  )
}
