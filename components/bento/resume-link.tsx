"use client"

/** Resume link — placeholder until a PDF is wired to `href`. */
export function ResumeLink() {
  return (
    <a
      className="resume"
      href="#"
      target="_blank"
      rel="noopener"
      onClick={(e) => {
        if (e.currentTarget.getAttribute("href") === "#") {
          e.preventDefault()
          alert("Resume PDF not added yet — send the file and it will download from here.")
        }
      }}
    >
      Resume ↓
    </a>
  )
}
