import type { Direction, Point } from "./game-types"

export const DIRECTION_VECTORS: Record<Direction, Point> = {
  l: [-1, 0],
  r: [1, 0],
  u: [0, -1],
  d: [0, 1],
}

export const swipeDir = (a: Point, b: Point, min: number): Direction | null => {
  const dx = b[0] - a[0],
    dy = b[1] - a[1]
  if (Math.max(Math.abs(dx), Math.abs(dy)) < min) return null
  return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "r" : "l") : dy > 0 ? "d" : "u"
}
