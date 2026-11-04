/** Owns every external resource created by one mounted game. */
export function createLifetime(
  clock: Pick<
    Window,
    | "requestAnimationFrame"
    | "cancelAnimationFrame"
    | "setTimeout"
    | "clearTimeout"
  >
) {
  let disposed = false
  const frames = new Set<number>()
  const timers = new Set<number>()
  const listeners = new Set<() => void>()

  return {
    get disposed() {
      return disposed
    },
    frame(callback: FrameRequestCallback): number {
      if (disposed) return 0
      const id = clock.requestAnimationFrame((time) => {
        frames.delete(id)
        if (!disposed) callback(time)
      })
      frames.add(id)
      return id
    },
    timeout(callback: () => void, delay = 0): number {
      if (disposed) return 0
      const id = clock.setTimeout(() => {
        timers.delete(id)
        if (!disposed) callback()
      }, delay)
      timers.add(id)
      return id
    },
    cancelTimeout(id: number) {
      clock.clearTimeout(id)
      timers.delete(id)
    },
    on(
      target: EventTarget,
      event: string,
      callback: EventListener,
      options?: AddEventListenerOptions
    ) {
      if (disposed) return () => {}
      target.addEventListener(event, callback, options)
      const remove = () => {
        target.removeEventListener(event, callback, options)
        listeners.delete(remove)
      }
      listeners.add(remove)
      return remove
    },
    dispose() {
      if (disposed) return
      disposed = true
      frames.forEach((id) => clock.cancelAnimationFrame(id))
      timers.forEach((id) => clock.clearTimeout(id))
      listeners.forEach((remove) => remove())
      frames.clear()
      timers.clear()
    },
  }
}
