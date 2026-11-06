import type { GameId } from "./storage"

export type Point = [number, number]
export type Direction = "l" | "r" | "u" | "d"
export type TetrisAction = Direction | "slam"
export type Matrix = number[][]
export type Shape = "I" | "O" | "T" | "S" | "Z" | "J" | "L"
export type Piece = { k: Shape; m: Matrix }
export type FallingPiece = Piece & { x: number; y: number }
export type Brick = {
  x: number
  y: number
  w: number
  h: number
  a: boolean
  s: boolean
}
export type Obstacle = { x: number; y: number; w: number; h: number }
export type ClickSave = {
  lines: number
  own: Record<string, number>
  total: number
  t: number
}
export type Upgrade = {
  id: string
  n: string
  d: string
  c: number
  click?: number
  ps?: number
}
export type BoardOptions = {
  depth?: number
  layers?: number
  gap?: string
  width?: string
  tilt?: Point
}
export type HudUpdate = Partial<
  Record<"t" | "h" | "c" | "s" | "m" | "mc", string>
>

interface GameInputs {
  exit?(): void
  press?(index: number): void
  flag?(index: number): void
  swipe?(direction: Direction): void
  keydown?(event: KeyboardEvent): boolean | void
  keyup?(event: KeyboardEvent): void
  pdown?(point: Point, event: PointerEvent): void
  pmove?(point: Point, event: PointerEvent): void
  pup?(point: Point, event: PointerEvent): void
}
interface GameBase extends GameInputs {
  id: GameId
  title: string
  hint: string
  enter(): void
}
export interface DeckGame extends GameBase {
  mode: "deck"
}
export interface TerminalGame extends GameBase {
  mode: "term"
}
export interface PixelGame extends GameBase {
  mode: "px"
  on: boolean
  update(deltaMs: number): void
  draw(): void
}
export type Game = DeckGame | PixelGame | TerminalGame
