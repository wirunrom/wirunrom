"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"

import { CASE_STUDIES, type CaseStudyKey } from "@/lib/bento-content"

const ModalContext = createContext<(key: CaseStudyKey) => void>(() => {})

/** Open a case-study modal from anywhere inside <ModalProvider>. */
export function useCaseStudy() {
  return useContext(ModalContext)
}

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [key, setKey] = useState<CaseStudyKey | null>(null)

  const open = useCallback((k: CaseStudyKey) => {
    if (!CASE_STUDIES[k]) return
    setKey(k)
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
        <div className="modal" role="dialog" aria-modal="true">
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
