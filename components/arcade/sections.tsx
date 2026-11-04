import { Fragment } from "react"
import { BOOT_MESSAGES, NAME, STATEMENT, TICKERS } from "@/lib/arcade/content"
import { LocalClock, MatchaLevel } from "./live-readouts"

export function LoadingSignal() {
  return (
    <>
      <div
        className="loader inset-0 bg-ink p-4 px-gutter text-paper fixed z-[80] grid grid-rows-[auto_1fr_auto]"
        role="status"
        aria-label="Loading"
      >
        <div className="flex justify-between text-[11px]">
          <span>receiving signal</span>
          <span>file 0x57 / wirunrom</span>
        </div>
        <div
          data-loader-count
          className="font-display self-end text-[min(46vw,70vh)] leading-[.78] tracking-[-.04em] [font-variation-settings:'wdth'_62,'wght'_900]"
        >
          000
        </div>
        <div className="gap-0.5 grid text-[11px] text-[#8f8c84]">
          {BOOT_MESSAGES.map((message, i) => (
            <div key={message} data-loader-row>
              [{String(Math.round(((i + 1) / 7) * 100)).padStart(3, "0")}]{" "}
              {message} {"/".repeat(8 + i * 3)}
            </div>
          ))}
        </div>
      </div>
      <noscript>
        <style>{".loader{display:none!important}"}</style>
      </noscript>
    </>
  )
}

export function TopBar() {
  return (
    <header className="gap-3 border-ink bg-paper px-gutter py-2.5 [&>span]:min-w-0 sticky top-[env(safe-area-inset-top,0px)] z-20 grid grid-cols-2 border-b text-[11px] min-[761px]:grid-cols-4 [&>span]:overflow-hidden [&>span]:text-ellipsis [&>span]:whitespace-nowrap">
      <span>
        <span className="min-[761px]:hidden">wirunrom</span>
        <span className="hidden min-[761px]:inline">
          wirunrom — personal file
        </span>
      </span>
      <span className="text-mute hidden min-[761px]:block">
        <LocalClock />
      </span>
      <span className="text-mute hidden min-[761px]:block">
        status:{" "}
        <span data-status className="text-signal">
          unstable
        </span>
      </span>
      <nav className="gap-3.5 flex justify-end">
        <a href="#console" data-scroll>
          play
        </a>
        <a href="#notes" data-scroll>
          notes
        </a>
        <a href="#end" data-scroll>
          end
        </a>
      </nav>
    </header>
  )
}

export function HeroReadouts() {
  return (
    <div
      data-hero-readouts
      className="gap-3 hidden text-[11px] min-[761px]:grid min-[761px]:grid-cols-12"
    >
      <div className="min-[761px]:col-span-3">
        <div>file no.</div>
        <div className="text-mute">0x57-w1r-unr0m</div>
      </div>
      <div className="min-[761px]:col-span-3">
        <div>observer</div>
        <div className="text-mute" data-observer>
          x 0000 / y 0000
        </div>
      </div>
      <div className="min-[761px]:col-span-4 min-[761px]:col-start-9 min-[761px]:text-right">
        <div>18.7883° n / 98.9853° e — chiang mai</div>
      </div>
    </div>
  )
}

function Letters() {
  return (
    <span className="nm inline-block">
      {NAME.split("").map((letter, i) => (
        <span className="l inline-block" key={i}>
          {letter}
        </span>
      ))}
    </span>
  )
}

export function Wordmark() {
  return (
    <div className="min-w-0 gap-1.5 grid content-end">
      <div
        className="text-mute overflow-hidden text-[11px] tracking-[.1em] whitespace-nowrap"
        aria-hidden="true"
      >
        {"/".repeat(300)}
      </div>
      <div className="namewrap min-w-0 relative overflow-hidden">
        <h1 id="name" className="name" aria-label={NAME}>
          <Letters />
        </h1>
        <div id="neg" className="name neg" aria-hidden="true">
          <Letters />
        </div>
      </div>
    </div>
  )
}

export function HeroDetails() {
  return (
    <div className="gap-3 grid grid-cols-1 items-end min-[761px]:grid-cols-12">
      <p className="font-display text-[clamp(18px,2.2vw,30px)] leading-[1.02] tracking-[-.01em] [font-variation-settings:'wdth'_62,'wght'_500] min-[761px]:col-span-5">
        builds systems by day.
        <br />
        takes his own name apart at night.
      </p>
      <dl className="gap-x-3 gap-y-0.5 grid grid-cols-2 text-[11px] min-[761px]:col-span-5 min-[761px]:col-start-8">
        <dt className="text-mute">role</dt>
        <dd>senior developer</dd>
        <dt className="text-mute">stack</dt>
        <dd>c# | .net | typescript | next.js</dd>
        <dt className="text-mute">clouds</dt>
        <dd>azure | aws</dd>
        <dt className="text-mute">scroll</dt>
        <dd className="text-signal" data-scramble>
          if you must ↓
        </dd>
      </dl>
    </div>
  )
}

export function Ticker({ kind }: { kind: keyof typeof TICKERS }) {
  const small = kind === "notes"
  return (
    <div
      className={`ticker border-ink overflow-hidden border-y whitespace-nowrap ${kind === "process" ? "bg-ink text-paper" : ""}`}
      data-speed={kind === "process" ? -1.3 : small ? 0.6 : 1}
      aria-label={TICKERS[kind].join(", ")}
    >
      <div
        className="track inline-flex will-change-transform"
        aria-hidden="true"
      >
        {[0, 1, 2].map((copy) => (
          <div className="inline-flex" key={copy}>
            {TICKERS[kind].map((word, i) => (
              <span
                key={word}
                className={
                  small
                    ? "py-2 font-mono after:px-3 after:text-mute text-[11px] tracking-[.04em] after:content-['//']"
                    : "font-display pr-[.35em] text-[clamp(34px,6.4vw,92px)] leading-[1.02] tracking-[-.02em] uppercase [font-variation-settings:'wdth'_62,'wght'_800]"
                }
              >
                {word}
                {!small && i % 3 === 1 ? (
                  <i className="text-signal pl-[.35em] not-italic">✕</i>
                ) : null}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function Manifesto() {
  return (
    <section
      id="notes"
      className="manifesto gap-3 px-gutter grid grid-cols-1 py-[10vh] min-[761px]:grid-cols-12 min-[761px]:pt-[18vh] min-[761px]:pb-[16vh]"
      aria-label="Statement"
    >
      <div className="gap-1 grid content-start text-[11px] min-[761px]:col-span-3">
        <span>{"// statement"}</span>
        <span className="text-mute">the short version</span>
      </div>
      <p
        id="mani"
        className="font-display text-[clamp(34px,6.2vw,96px)] leading-[.92] tracking-[-.02em] [font-variation-settings:'wdth'_62,'wght'_700] min-[761px]:col-span-9 min-[761px]:col-start-4"
      >
        {STATEMENT.map((part, index) => (
          <Fragment key={part}>
            {index ? (
              <>
                {" "}
                <span className="text-signal">{"//"}</span>{" "}
              </>
            ) : null}
            {part.split(" ").map((word, i, words) => (
              <Fragment key={i}>
                <span className="w">{word}</span>
                {i < words.length - 1 ? " " : ""}
              </Fragment>
            ))}
          </Fragment>
        ))}
      </p>
    </section>
  )
}

export function Footer() {
  return (
    <footer id="end" className="bg-ink text-paper overflow-hidden pt-[18px]">
      <div className="gap-3 px-gutter [&>div]:min-w-0 grid grid-cols-2 text-[11px] min-[761px]:grid-cols-4 [&>div]:grid [&>div]:content-start [&>div]:gap-[3px]">
        <div>
          <span>end of file</span>
          <span className="text-[#8f8c84]">
            you scrolled past a perfectly good game.
          </span>
          <span className="text-[#8f8c84]">bold choice.</span>
        </div>
        <div>
          <span>local time</span>
          <span className="text-[#8f8c84]">
            <LocalClock />
          </span>
          <span className="text-[#8f8c84]">
            <MatchaLevel />
          </span>
        </div>
        <div>
          <span>elsewhere</span>
          <a href="#" className="text-[#8f8c84]" data-top>
            back to the top ↑
          </a>
        </div>
        <div>
          <span>© 2026 wirunrom</span>
          {/* <span className="text-[#8f8c84]">
            built with next.js habits and too much matcha
          </span> */}
        </div>
      </div>
      <div
        id="big"
        className="mt-10 px-gutter font-display font-black translate-y-[8%] text-[10px] leading-[.74] tracking-[-.045em] whitespace-nowrap [font-variation-settings:'wdth'_125,'wght'_900]"
        aria-hidden="true"
      >
        <span id="bigt">{NAME}</span>
      </div>
    </footer>
  )
}
