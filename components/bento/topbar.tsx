import { ThemeControls } from "./theme-controls"

export function Topbar() {
  return (
    <header className="topbar">
      <a href="#" className="brand">
        WIRUNROM<b>®</b>
      </a>
      <div className="controls">
        <span className="brand nav-hide" style={{ marginRight: 6 }}>
          Bento
        </span>
        <ThemeControls />
      </div>
    </header>
  )
}
