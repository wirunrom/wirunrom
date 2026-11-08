type Point = readonly [number, number]
type Caster =
  | readonly ["B", number, number, number, number, number, number, number?]
  | readonly ["C", number, number, number, number, number]
  | readonly ["P", number, number, number, number, number, number]

// Adapted from shadow-obj.zip; books follow the actual three rotated desk boxes.
// Keep silhouettes aligned with the geometry in project-desk.tsx.
const CASTERS: readonly Caster[] = [
  ["C", 96, 120, 40, 0, 12],
  ["B", 90, 118, 12, 6, 12, 208],
  ["B", 96, 112, 130, 12, 196, 206],
  ["C", 226, 118, 40, 150, 190],
  ["B", 805, 88, 150, 72, 0, 8],
  ["B", 861, 108, 38, 18, 8, 178],
  ["B", 630, 132, 500, 14, 86, 386],
  ["B", 214, 254, 390, 248, 0, 12],
  ["P", 214, 604, 258, 12, 198, 253],
  ["B", 644, 362, 118, 62, 0, 10],
  ["P", 657, 749, 400, 10, 336, 185],
  ["B", 692, 566, 340, 112, 0, 12],
  ["C", 1085, 621, 26, 0, 16],
  ["B", 1088, 70, 92, 126, 0, 18, -2],
  ["B", 1094, 74, 92, 126, 18, 36, 4],
  ["B", 1088, 78, 92, 126, 36, 54, -2],
  ["C", 1100, 360, 34, 0, 66],
  ["B", 1130, 350, 20, 12, 18, 50],
  ["B", 186, 576, 200, 116, 0, 8],
  ["B", 412, 576, 200, 116, 0, 8],
]

export function convexHull(points: readonly Point[]): Point[] {
  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1])
  const cross = (o: Point, a: Point, b: Point) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  function edge(sequence: readonly Point[]) {
    const result: Point[] = []
    for (const point of sequence) {
      while (
        result.length > 1 &&
        cross(result[result.length - 2], result[result.length - 1], point) <= 0
      )
        result.pop()
      result.push(point)
    }
    return result.slice(0, -1)
  }
  return [...edge(sorted), ...edge([...sorted].reverse())]
}

export function castPolygons(lx: number, ly: number): Point[][] {
  const magnitude = Math.hypot(lx, ly)
  const limit = Math.min(1, magnitude) / (magnitude || 1)
  const project = (x: number, y: number, z: number): Point => [
    x + lx * limit * z,
    y + ly * limit * z,
  ]
  return CASTERS.map((caster) => {
    const points: Point[] = []
    if (caster[0] === "B") {
      const [, x, y, w, d, z0, z1, rotation = 0] = caster
      const angle = (rotation * Math.PI) / 180
      for (const z of [z0, z1])
        for (const [u, v] of [
          [0, 0],
          [w, 0],
          [w, d],
          [0, d],
        ]) {
          const dx = u - w / 2,
            dy = v - d / 2
          points.push(
            project(
              x + w / 2 + dx * Math.cos(angle) - dy * Math.sin(angle),
              y + d / 2 + dx * Math.sin(angle) + dy * Math.cos(angle),
              z
            )
          )
        }
    } else if (caster[0] === "C") {
      const [, x, y, radius, z0, z1] = caster
      for (const z of [z0, z1])
        for (let index = 0; index < 16; index++) {
          const angle = (index / 16) * Math.PI * 2
          points.push(
            project(
              x + radius * Math.cos(angle),
              y + radius * Math.sin(angle),
              z
            )
          )
        }
    } else {
      const [, x1, x2, bottomY, bottomZ, topY, topZ] = caster
      for (const x of [x1, x2])
        points.push(
          project(x, bottomY, bottomZ),
          project(x, topY, topZ),
          project(x, bottomY, 0)
        )
    }
    return convexHull(points)
  })
}

export function drawCastShadows(
  canvas: HTMLCanvasElement,
  polygons: readonly Point[][],
  dark: boolean
): string {
  const scale = 0.5,
    offset = 5000
  canvas.width = 1600 * scale
  canvas.height = 1100 * scale
  const context = canvas.getContext("2d")
  if (!context) return "none"
  context.scale(scale, scale)
  context.shadowColor = dark ? "rgba(0,0,0,.42)" : "rgba(45,38,28,.2)"
  context.shadowBlur = 12 * scale
  context.shadowOffsetX = offset * scale
  context.fillStyle = "#000"
  context.beginPath()
  for (const polygon of polygons) {
    polygon.forEach(([x, y], index) => {
      if (index === 0) context.moveTo(x + 200 - offset, y + 200)
      else context.lineTo(x + 200 - offset, y + 200)
    })
    context.closePath()
  }
  // One combined silhouette avoids dark seams where individual shadows overlap.
  context.fill("nonzero")
  return `url(${canvas.toDataURL("image/png")})`
}
