"use client"

import { type CaseStudyKey } from "@/lib/bento-content"
import { useCaseStudy } from "./modal-provider"

export function ReadMoreButton({
  study,
  children,
}: {
  study: CaseStudyKey
  children: React.ReactNode
}) {
  const open = useCaseStudy()
  return (
    <button
      className="more"
      onClick={(e) => {
        // tint the modal with the hue of the cell this button lives in
        const cell = e.currentTarget.closest<HTMLElement>(".cell")
        const hOff = cell
          ? parseFloat(getComputedStyle(cell).getPropertyValue("--h-off")) || 0
          : 0
        open(study, hOff)
      }}
    >
      {children}
    </button>
  )
}
