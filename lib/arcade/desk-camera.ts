export type Camera = {
  cx: number
  cy: number
  cz: number
  rx: number
  rz: number
  k: number
  ox: number
  oy: number
}
type Viewport = { width: number; height: number }

/** Camera poses in the supplied 1200×700 desk coordinate system. */
export function homeCamera(viewport: Viewport, sceneHeight: number): Camera {
  return {
    cx: viewport.width < 600 ? 590 : 600,
    cy: viewport.width < 600 ? 370 : 360,
    cz: 40,
    rx: viewport.width < 600 ? 50 : 56,
    rz: viewport.width < 600 ? -16 : -30,
    k: viewport.width < 600 ? 1.32 : 0.88,
    ox: 0,
    oy: viewport.width > 820 ? -sceneHeight * 0.08 : 0,
  }
}

export function projectCamera(
  index: number,
  viewport: Viewport,
  scene: Viewport
): Camera {
  const bottomSheet = viewport.width <= 820 && viewport.height >= viewport.width
  const target =
    index === -1
      ? { cx: 1112, cy: 488, cz: 0, rx: 22, rz: -2, k: 3.6 }
      : index === 0
        ? { cx: 470, cy: 330, cz: 110, rx: 62, rz: -14, k: 1.9 }
        : index === 1
          ? { cx: 880, cy: 150, cz: 236, rx: 80, rz: -5, k: 2.1 }
          : {
              cx: 286 + (index - 2) * 226,
              cy: 636,
              cz: 0,
              rx: 34,
              rz: -6,
              k: 2.7,
            }
  return {
    ...target,
    k: target.k * (viewport.width < 600 ? 1.3 : 1),
    ox: bottomSheet
      ? 0
      : -Math.min(400, scene.width * (viewport.width <= 820 ? 0.46 : 0.4)) / 2 -
        10,
    oy: bottomSheet ? -scene.height * 0.32 : 0,
  }
}

/** Window view has no dossier offset and fits the whole sill on compact screens. */
export function windowCamera(scene: Viewport, fit: number): Camera {
  return {
    cx: 600,
    cy: -40,
    cz: 567,
    rx: 87,
    rz: 0,
    k: Math.min(
      (scene.width * (scene.width < 600 ? 0.86 : 0.5)) / (556 * fit),
      (scene.height * 0.55) / (314 * fit)
    ),
    ox: 0,
    oy: 0,
  }
}
