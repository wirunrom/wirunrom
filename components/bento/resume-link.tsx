"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

const SRC = "/wirunrom_resume.pdf"
const ZOOM_MIN = 0.5
const ZOOM_MAX = 3
const ZOOM_STEP = 0.2

const clamp = (n: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, n))

/** Inner content width of the scroll area (clientWidth minus its padding). */
function availWidth(host: HTMLElement | null, fallback: number) {
  if (!host) return fallback
  const cs = getComputedStyle(host)
  return host.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)
}

export function ResumeLink() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button className="resume" onClick={() => setOpen(true)}>
        Resume ↓
      </button>
      {open && <ResumeViewer onClose={() => setOpen(false)} />}
    </>
  )
}

function ResumeViewer({ onClose }: { onClose: () => void }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const docRef = useRef<any>(null)
  const baseWidthRef = useRef(1) // page width at scale 1 (PDF points)
  const fitRef = useRef(1) // scale that fits the page to the scroll width
  const seqRef = useRef(0) // cancels stale render passes

  const [zoom, setZoom] = useState(1)
  const [pages, setPages] = useState(0)
  const [cur, setCur] = useState(1)
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")

  // lock the page scroll + wire Escape
  useEffect(() => {
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = ""
      window.removeEventListener("keydown", onKey)
    }
  }, [onClose])

  // paint every page into its (React-owned) canvas at the given zoom
  const render = useCallback(async (z: number) => {
    const doc = docRef.current
    if (!doc) return
    const seq = ++seqRef.current
    const dpr = window.devicePixelRatio || 1
    const cssScale = fitRef.current * z

    for (let i = 1; i <= doc.numPages; i++) {
      const canvas = canvasRefs.current[i - 1]
      if (!canvas) continue
      const page = await doc.getPage(i)
      if (seq !== seqRef.current) return // a newer pass started; bail
      const vp = page.getViewport({ scale: cssScale * dpr })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const prev = (canvas as any)._task
      if (prev) prev.cancel()
      canvas.width = vp.width
      canvas.height = vp.height
      canvas.style.width = `${vp.width / dpr}px`
      canvas.style.height = `${vp.height / dpr}px`
      const task = page.render({
        canvasContext: canvas.getContext("2d")!,
        viewport: vp,
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(canvas as any)._task = task
      try {
        await task.promise
      } catch {
        /* cancelled — ignore */
      }
    }
  }, [])

  // load the document once
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const pdfjs = await import("pdfjs-dist")
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs"
        const task = pdfjs.getDocument({ url: SRC })
        const doc = await task.promise
        if (cancelled) {
          task.destroy()
          return
        }
        docRef.current = doc
        const p1 = await doc.getPage(1)
        baseWidthRef.current = p1.getViewport({ scale: 1 }).width
        const avail = availWidth(scrollRef.current, baseWidthRef.current)
        fitRef.current = Math.max(0.2, avail / baseWidthRef.current)
        setPages(doc.numPages)
        setStatus("ready")
      } catch {
        if (!cancelled) setStatus("error")
      }
    })()
    return () => {
      cancelled = true
      docRef.current?.destroy?.()
    }
  }, [])

  // (re)render once the canvases exist or the zoom changes
  useEffect(() => {
    if (status === "ready") render(zoom)
  }, [status, zoom, pages, render])

  // recompute fit + re-render on resize
  useEffect(() => {
    if (status !== "ready") return
    let raf = 0
    const onResize = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const avail = availWidth(scrollRef.current, baseWidthRef.current)
        fitRef.current = Math.max(0.2, avail / baseWidthRef.current)
        render(zoom)
      })
    }
    window.addEventListener("resize", onResize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", onResize)
    }
  }, [status, zoom, render])

  // track which page is in view for the indicator
  useEffect(() => {
    const host = scrollRef.current
    if (status !== "ready" || !host || pages < 2) return
    const onScroll = () => {
      const mid = host.scrollTop + host.clientHeight / 2
      let best = 1
      host.querySelectorAll<HTMLElement>(".rv-page").forEach((el) => {
        if (el.offsetTop <= mid) best = Number(el.dataset.page)
      })
      setCur(best)
    }
    host.addEventListener("scroll", onScroll, { passive: true })
    return () => host.removeEventListener("scroll", onScroll)
  }, [status, pages])

  // ctrl/⌘ + wheel to zoom, like a native viewer
  useEffect(() => {
    const host = scrollRef.current
    if (!host) return
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      setZoom((z) => clamp(+(z - e.deltaY * 0.002).toFixed(2)))
    }
    host.addEventListener("wheel", onWheel, { passive: false })
    return () => host.removeEventListener("wheel", onWheel)
  }, [])

  // drag to pan — mouse only; touch keeps native momentum scrolling
  useEffect(() => {
    const host = scrollRef.current
    if (!host) return
    let dragging = false
    let sx = 0
    let sy = 0
    let sl = 0
    let st = 0
    const down = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return
      dragging = true
      sx = e.clientX
      sy = e.clientY
      sl = host.scrollLeft
      st = host.scrollTop
      host.classList.add("rv-grab")
      try {
        host.setPointerCapture(e.pointerId)
      } catch {
        /* no active pointer (e.g. synthetic event) */
      }
    }
    const move = (e: PointerEvent) => {
      if (!dragging) return
      host.scrollLeft = sl - (e.clientX - sx)
      host.scrollTop = st - (e.clientY - sy)
    }
    const end = (e: PointerEvent) => {
      if (!dragging) return
      dragging = false
      host.classList.remove("rv-grab")
      try {
        host.releasePointerCapture(e.pointerId)
      } catch {
        /* capture already released */
      }
    }
    host.addEventListener("pointerdown", down)
    host.addEventListener("pointermove", move)
    host.addEventListener("pointerup", end)
    host.addEventListener("pointercancel", end)
    return () => {
      host.removeEventListener("pointerdown", down)
      host.removeEventListener("pointermove", move)
      host.removeEventListener("pointerup", end)
      host.removeEventListener("pointercancel", end)
    }
  }, [])

  const goto = (p: number) => {
    scrollRef.current
      ?.querySelector<HTMLElement>(`[data-page="${p}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  // portal to <body> — the contact cell uses `isolation: isolate`, which
  // would otherwise trap this fixed overlay below the mascot layer
  return createPortal(
    <div
      className="rv-back"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="rv-panel" role="dialog" aria-modal="true" aria-label="Resume">
        <div className="rv-bar">
          <span className="rv-title">RESUME — WIRUNROM</span>

          <div className="rv-tools">
            {pages > 1 && (
              <>
                <button
                  className="rv-btn"
                  onClick={() => goto(Math.max(1, cur - 1))}
                  disabled={cur <= 1}
                  aria-label="Previous page"
                >
                  ↑
                </button>
                <span className="rv-read">
                  {cur} / {pages}
                </span>
                <button
                  className="rv-btn"
                  onClick={() => goto(Math.min(pages, cur + 1))}
                  disabled={cur >= pages}
                  aria-label="Next page"
                >
                  ↓
                </button>
                <span className="rv-sep" />
              </>
            )}

            <button
              className="rv-btn"
              onClick={() => setZoom((z) => clamp(+(z - ZOOM_STEP).toFixed(2)))}
              disabled={zoom <= ZOOM_MIN}
              aria-label="Zoom out"
            >
              −
            </button>
            <button
              className="rv-read rv-zoom"
              onClick={() => setZoom(1)}
              title="Reset zoom"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              className="rv-btn"
              onClick={() => setZoom((z) => clamp(+(z + ZOOM_STEP).toFixed(2)))}
              disabled={zoom >= ZOOM_MAX}
              aria-label="Zoom in"
            >
              +
            </button>

            <span className="rv-sep" />

            <a
              className="rv-btn"
              href={SRC}
              download="Wirunrom_Resume.pdf"
              aria-label="Download"
            >
              ↓PDF
            </a>
            <button className="rv-btn rv-x" onClick={onClose} aria-label="Close">
              ✕
            </button>
          </div>
        </div>

        <div className="rv-scroll" ref={scrollRef}>
          {status === "loading" && <div className="rv-msg">Loading résumé…</div>}
          {status === "error" && (
            <div className="rv-msg">
              Couldn’t render the PDF.{" "}
              <a href={SRC} target="_blank" rel="noopener">
                Open it directly ↗
              </a>
            </div>
          )}
          {status === "ready" &&
            Array.from({ length: pages }).map((_, i) => (
              <div className="rv-page" data-page={i + 1} key={i}>
                <canvas
                  ref={(el) => {
                    canvasRefs.current[i] = el
                  }}
                />
              </div>
            ))}
        </div>
      </div>
    </div>,
    document.body
  )
}
