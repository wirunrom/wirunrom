"use client"

import { useEffect, useState } from "react"

import { BASE_HUE, STORAGE_KEY } from "@/lib/bento-theme"

type ThemeState = { h: number; mode: "dark" | "light" }

/**
 * Topbar controls that drive the hue engine. State is written to <body>
 * (--base-h + data-theme="paper"); the CSS does the rest. Persisted to
 * localStorage so the palette survives reloads.
 */
export function ThemeControls() {
  const [theme, setTheme] = useState<ThemeState>({ h: BASE_HUE, mode: "dark" })

  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY)
      if (s) setTheme(JSON.parse(s))
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    const body = document.body
    body.style.setProperty("--base-h", String(theme.h))
    if (theme.mode === "light") body.setAttribute("data-theme", "paper")
    else body.removeAttribute("data-theme")
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(theme))
    } catch {
      /* ignore */
    }
  }, [theme])

  return (
    <>
      <button
        className="btn accent"
        title="Rotate the palette"
        onClick={() => setTheme((s) => ({ ...s, h: +(Math.random() * 360).toFixed(1) }))}
      >
        ⚄ Shuffle
      </button>
      {Math.round(theme.h) !== BASE_HUE && (
        <button className="btn" onClick={() => setTheme((s) => ({ ...s, h: BASE_HUE }))}>
          Reset
        </button>
      )}
      <button
        className="btn"
        onClick={() =>
          setTheme((s) => ({ ...s, mode: s.mode === "light" ? "dark" : "light" }))
        }
      >
        {theme.mode === "light" ? "Dark" : "Light"}
      </button>
    </>
  )
}
