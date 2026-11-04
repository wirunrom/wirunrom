"use client"

import { useEffect, useRef } from "react"
import { mountGame } from "@/lib/arcade/game-engine"
import { arcadeStore, chooseGame, GAME_IDS } from "@/lib/arcade/storage"

/** React owns the shell; the ref-scoped driver owns the animated game surface. */
export function GameConsole({ gameIndex }: { gameIndex?: number }) {
  const root = useRef<HTMLDivElement>(null)
  const selected = useRef<number | null>(null)

  useEffect(() => {
    if (!root.current) return
    if (selected.current === null) {
      selected.current =
        gameIndex ??
        chooseGame(
          arcadeStore.get("unlocked", false),
          arcadeStore.get<string | null>("last-game", null)
        )
      if (gameIndex === undefined)
        arcadeStore.set("last-game", GAME_IDS[selected.current])
    }
    return mountGame(root.current, selected.current)
  }, [gameIndex])

  return (
    <div
      ref={root}
      id="console"
      className="console min-h-80 min-w-0 gap-2.5 border-ink pb-2 relative grid grid-rows-[auto_minmax(240px,1fr)] border-b"
      data-game="pending"
      data-mode="deck"
      aria-label="Random arcade game"
    >
      <div className="deck-hud gap-x-3 gap-y-1 pt-1.5 min-[761px]:gap-3 [&>div]:min-w-0 grid grid-cols-[minmax(0,1fr)_auto] items-start text-[11px] min-[761px]:grid-cols-3">
        <div className="gap-0.5 col-start-1 row-start-1 grid">
          <span id="gtitle" className="truncate">
            receiving game
          </span>
          <span id="ghint" className="text-mute hidden min-[761px]:block" />
        </div>
        <div className="game-readout text-mute min-[761px]:text-ink col-span-full row-start-3 text-[11px] min-[761px]:col-span-1 min-[761px]:col-start-2 min-[761px]:row-start-1 min-[761px]:overflow-hidden min-[761px]:text-center min-[761px]:text-[13px] min-[761px]:tracking-[.12em] min-[761px]:whitespace-nowrap min-[761px]:uppercase">
          <span id="gread" />
        </div>
        <div className="gap-0.5 col-start-2 row-start-1 grid text-right min-[761px]:col-start-3">
          <span id="gstat" />
          <span id="gmsg" className="mute" />
        </div>
        <div className="col-span-full row-start-2 min-[761px]:hidden">
          <details className="game-help">
            <summary className="min-h-11 gap-3 text-mute flex cursor-pointer list-none items-center justify-between [&::-webkit-details-marker]:hidden">
              <span id="gquick" className="min-w-0 truncate" />
              <span className="shrink-0 underline underline-offset-4">
                how to play
              </span>
            </summary>
            <p id="ghelp" className="pb-3 text-xs leading-relaxed text-mute" />
          </details>
        </div>
      </div>
      <div
        id="deckstage"
        className="deck-stage min-w-0 relative grid h-[clamp(220px,38svh,420px)] w-full grid-cols-[minmax(0,1fr)] place-items-center self-center overflow-visible [perspective-origin:50%_20%] [perspective:1400px]"
      >
        <div id="deck" className="deck" role="group" aria-label="Game keys" />
        <div className="deck-shadow" aria-hidden="true" />
        <canvas id="px" className="px" aria-label="Arcade game" />
        <div id="side" className="side" />
        <div id="term" className="term">
          <div id="termlog" className="log" aria-live="polite" />
          <form id="termf" autoComplete="off">
            <span className="sig" aria-hidden="true">
              &gt;
            </span>
            <input
              id="termin"
              aria-label="Answer"
              spellCheck={false}
              autoCapitalize="off"
            />
            <button type="submit">enter</button>
          </form>
        </div>
      </div>
    </div>
  )
}
