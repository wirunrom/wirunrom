"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"

import { CASE_STUDIES, type CaseStudyKey } from "@/lib/bento-content"

/** open(key, hueOffset) — hueOffset tints the modal to match the cell it came from. */
const ModalContext = createContext<(key: CaseStudyKey, hueOffset?: number) => void>(
  () => {}
)

/** Open a case-study modal from anywhere inside <ModalProvider>. */
export function useCaseStudy() {
  return useContext(ModalContext)
}

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [key, setKey] = useState<CaseStudyKey | null>(null)
  const [hueOffset, setHueOffset] = useState(0)

  const open = useCallback((k: CaseStudyKey, hOff = 0) => {
    if (!CASE_STUDIES[k]) return
    setKey(k)
    setHueOffset(hOff)
    document.body.style.overflow = "hidden"
  }, [])

  const close = useCallback(() => {
    setKey(null)
    document.body.style.overflow = ""
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [close])

  const study = key ? CASE_STUDIES[key] : null

  return (
    <ModalContext.Provider value={open}>
      {children}
      <div
        className={`modal-back${study ? " open" : ""}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) close()
        }}
      >
        <div
          className="modal"
          role="dialog"
          aria-modal="true"
          style={{ "--modal-h-off": hueOffset } as React.CSSProperties}
        >
          <button className="modal-close" aria-label="Close" onClick={close}>
            ✕
          </button>
          <div className="modal-tag">{study?.tag}</div>
          <h3>{study?.title}</h3>
          <div
            className="modal-body"
            dangerouslySetInnerHTML={{ __html: study?.body ?? "" }}
          />
        </div>
      </div>
    </ModalContext.Provider>
  )
}
