import { ArcadeShell } from "@/components/arcade/arcade-shell"
import { GameConsole } from "@/components/arcade/game-console"
import { ProjectNotes } from "@/components/arcade/project-notes"
import {
  Footer,
  HeroDetails,
  HeroReadouts,
  LoadingSignal,
  Manifesto,
  Ticker,
  TopBar,
  Wordmark,
} from "@/components/arcade/sections"

export default function Page() {
  return (
    <ArcadeShell>
      <LoadingSignal />
      <TopBar />
      <main>
        <section
          className="hero gap-2.5 px-gutter pt-3.5 [&>*]:min-w-0 relative grid min-h-[calc(100svh-40px)] grid-rows-[minmax(260px,1fr)_auto_auto] pb-[18px] min-[761px]:grid-rows-[auto_minmax(260px,1fr)_auto_auto]"
          aria-label="WIRUNROM"
        >
          <HeroReadouts />
          <GameConsole />
          <Wordmark />
          <HeroDetails />
        </section>
        <Ticker kind="stack" />
        <Manifesto />
        <ProjectNotes />
        <Ticker kind="process" />
        <Ticker kind="notes" />
      </main>
      <Footer />
    </ArcadeShell>
  )
}
