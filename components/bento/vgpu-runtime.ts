type VgpuModule = typeof import("vgpu")
type Gpu = Awaited<ReturnType<VgpuModule["init"]>>
type SurfaceKind = "background" | "hero" | "cell"

let portfolioGpuPromise: Promise<Gpu> | undefined

/** One device backs every decorative portfolio surface. */
export function getPortfolioGpu(vgpu: VgpuModule) {
  portfolioGpuPromise ??= vgpu.init()
  return portfolioGpuPromise
}

/**
 * Desktop hero/background follow the display's native refresh via rAF. Smaller
 * narrative cells stay capped because several can be visible together. Touch
 * devices use a cooler battery-friendly profile; resizing a desktop window
 * does not change its performance class.
 */
export function getPortfolioFrameRate(kind: SurfaceKind) {
  const compact = matchMedia("(pointer: coarse)").matches

  if (compact) return kind === "hero" ? 45 : 30
  return kind === "cell" ? 60 : 0
}
