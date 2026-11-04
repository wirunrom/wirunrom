export const GAME_IDS = [
  "lights",
  "g2048",
  "mines",
  "whack",
  "breakout",
  "runner",
  "tetris",
  "snake",
  "clicker",
  "ciph",
] as const

export type GameId = (typeof GAME_IDS)[number]

export const arcadeStore = {
  get<T>(key: string, fallback: T): T {
    try {
      const value = localStorage.getItem(`wr.${key}`)
      return value === null ? fallback : JSON.parse(value)
    } catch {
      return fallback
    }
  },
  set(key: string, value: unknown) {
    try {
      localStorage.setItem(`wr.${key}`, JSON.stringify(value))
    } catch {}
  },
}

export function chooseGame(
  unlocked: boolean,
  previous: string | null,
  random = Math.random
): number {
  const pool = GAME_IDS.map((id, index) => ({ id, index })).filter(
    ({ id, index }) => (unlocked || index < 9) && id !== previous
  )
  const offset = Math.min(
    pool.length - 1,
    Math.max(0, Math.floor(random() * pool.length))
  )
  return pool[offset].index
}
