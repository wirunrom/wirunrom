import { BentoBoard } from "@/components/bento/bento-board"
import {
  CapabilitiesCell,
  ContactCell,
  ExperienceCell,
  FeaturedCell,
  HeroCell,
  NowCell,
  WorkCell,
} from "@/components/bento/cells"
import { ClockCell } from "@/components/bento/clock-cell"
import { ModalProvider } from "@/components/bento/modal-provider"
import { RoamingCat } from "@/components/bento/roaming-cat"
import { Topbar } from "@/components/bento/topbar"

export default function Page() {
  return (
    <ModalProvider>
      <div className="stage">
        <Topbar />
        <BentoBoard>
          <HeroCell />
          <FeaturedCell />
          <NowCell />
          <ClockCell />
          <ExperienceCell />
          <WorkCell />
          <CapabilitiesCell />
          <ContactCell />
        </BentoBoard>
      </div>
      <RoamingCat />
    </ModalProvider>
  )
}
