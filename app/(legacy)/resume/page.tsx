import { BentoBoard } from "@/components/bento/bento-board"
import {
  CapabilitiesCell,
  ContactCell,
  EducationCell,
  ExperienceCell,
  FeaturedCell,
  FinjarCell,
  HeroCell,
  WorkCell,
} from "@/components/bento/cells"
import { ModalProvider } from "@/components/bento/modal-provider"
import { SystemMapBackgroundCanvas } from "@/components/bento/system-map-background-canvas"

export default function Page() {
  return (
    <ModalProvider>
      <div className="stage">
        <SystemMapBackgroundCanvas />
        <BentoBoard>
          <HeroCell />
          <FeaturedCell />
          <FinjarCell />
          <EducationCell />
          <ExperienceCell />
          <WorkCell />
          <CapabilitiesCell />
          <ContactCell />
        </BentoBoard>
      </div>
    </ModalProvider>
  )
}
