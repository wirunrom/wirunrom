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
    <button className="more" onClick={() => open(study)}>
      {children}
    </button>
  )
}
