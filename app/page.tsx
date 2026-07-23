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
import { ClockCell } from "@/components/bento/clock-cell"
import { MascotLayer } from "@/components/bento/mascot-layer"
import { ModalProvider } from "@/components/bento/modal-provider"

export default function Page() {
  return (
    <ModalProvider>
      <div className="stage">
        <BentoBoard>
          <HeroCell />
          <FeaturedCell />
          <FinjarCell />
          <EducationCell />
          <ClockCell />
          <ExperienceCell />
          <WorkCell />
          <CapabilitiesCell />
          <ContactCell />
        </BentoBoard>
      </div>
      <MascotLayer />
    </ModalProvider>
  )
}
