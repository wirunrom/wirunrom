import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { transpileModule, ModuleKind, JsxEmit } from "typescript"
import { makeDeskSky } from "../lib/arcade/desk-sky.ts"
import { makeCat } from "../lib/arcade/desk-cat.ts"
import { previewHour } from "../lib/arcade/time.ts"

// Exercise the actual mounted window effect and pixel renderers. Only the
// browser scheduler, canvas backend and React commit are controlled here.
function mountWindow({ reduced = false, scale = 1 } = {}) {
  let now = 1000,
    effect,
    cleanup
  const observers = []
  const listeners = new Set(),
    canvases = []
  const host = {
    kind: "scene",
    getBoundingClientRect: () => ({
      top: 50,
      bottom: 450,
      left: 0,
      right: 390,
    }),
  }
  const document = { hidden: false }
  const react = {
    useRef: (value) => ({ current: value }),
    useEffect: (callback) => {
      effect = callback
    },
    useEffectEvent: (callback) => callback,
  }
  const jsx = (type, props) => ({ type, props })
  const require = createRequire(import.meta.url)
  const source = transpileModule(
    readFileSync(
      new URL("../components/arcade/desk-window.tsx", import.meta.url),
      "utf8"
    ),
    {
      compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
    }
  ).outputText
  const compiledModule = { exports: {} }
  const imports = {
    react,
    "react/jsx-runtime": { jsx, jsxs: jsx },
    gsap: {
      gsap: {
        ticker: {
          add: (fn) => listeners.add(fn),
          remove: (fn) => listeners.delete(fn),
        },
      },
    },
    "./desk-primitives": { Box: "box", Panel: "panel" },
    "@/lib/arcade/desk-cat": { makeCat },
    "@/lib/arcade/desk-sky": { makeDeskSky },
    "@/lib/arcade/time": { previewHour },
  }
  class Observer {
    constructor(callback) {
      this.callback = callback
      observers.push(this)
    }
    observe(target) {
      this.target = target
    }
    disconnect() {
      this.disconnected = true
    }
  }
  const viewport = { scale }
  new Function(
    "require",
    "module",
    "exports",
    "document",
    "window",
    "performance",
    "matchMedia",
    "IntersectionObserver",
    "location",
    "innerWidth",
    "innerHeight",
    source
  )(
    (name) => imports[name] ?? require(name),
    compiledModule,
    compiledModule.exports,
    document,
    { visualViewport: viewport },
    { now: () => now },
    () => ({ matches: reduced }),
    Observer,
    { search: "?hour=10am" },
    390,
    844
  )
  const tree = compiledModule.exports.DeskWindow({
    light: true,
    host: { current: host },
  })
  function commit(node) {
    if (!node || typeof node !== "object") return
    if (node.type === "canvas") {
      const { width, height, ref } = node.props
      const canvas = {
        kind: "transformed-canvas",
        width,
        height,
        paints: [],
        closest: () => host,
        getContext: () => ({
          createImageData: (w, h) => ({
            data: new Uint8ClampedArray(w * h * 4),
          }),
          putImageData: (image) =>
            canvas.paints.push(image.data.some((v, i) => i % 4 === 3 && v > 0)),
          clearRect() {},
          fillRect() {},
        }),
      }
      ref.current = canvas
      canvases.push(canvas)
    }
    for (const child of [node.props?.children].flat(Infinity)) commit(child)
  }
  commit(tree)
  cleanup = effect()
  return {
    sky: canvases[0],
    cat: canvases[1],
    host,
    document,
    viewport,
    listeners,
    tick(ms = 100) {
      now += ms
      for (const fn of listeners) fn()
    },
    reportVisibility() {
      observers[0].callback([{ isIntersecting: observers[0].target === host }])
    },
    get observed() {
      return observers[0].target
    },
    unmount() {
      cleanup()
      assert.equal(observers[0].disconnected, true)
    },
  }
}

test("window paints a sky before the asynchronous visibility report", () => {
  const view = mountWindow()
  assert.ok(
    view.sky.paints.includes(true),
    "visible window must not start as an unpainted black canvas"
  )
  view.unmount()
})

test("window watches the flat scene, so a 3D canvas visibility miss cannot stop sky and cat", () => {
  const view = mountWindow()
  view.reportVisibility()
  for (let i = 0; i < 35; i++) view.tick()
  assert.equal(view.observed, view.host)
  assert.ok(view.sky.paints.includes(true), "sky is painted")
  assert.ok(view.cat.paints.includes(true), "cat arrives on the sill")
  const count = view.sky.paints.length
  view.document.hidden = true
  view.tick()
  assert.equal(view.sky.paints.length, count, "hidden tabs pause")
  view.unmount()
  assert.equal(view.listeners.size, 0)
})

test("zoom pause keeps an initial sky and resumes cat animation after zoom ends", () => {
  const view = mountWindow({ scale: 1.2 })
  assert.ok(view.sky.paints.includes(true))
  const initial = view.sky.paints.length
  view.reportVisibility()
  for (let i = 0; i < 20; i++) view.tick()
  assert.equal(view.sky.paints.length, initial)
  view.viewport.scale = 1
  for (let i = 0; i < 35; i++) view.tick()
  assert.ok(view.cat.paints.includes(true))
  view.unmount()
})

test("reduced motion paints a static sky and settled cat without waiting for visibility", () => {
  const view = mountWindow({ reduced: true })
  assert.ok(view.sky.paints.includes(true))
  assert.ok(view.cat.paints.includes(true))
  view.reportVisibility()
  view.tick()
  const painted = view.sky.paints.length
  for (let i = 0; i < 20; i++) view.tick()
  assert.equal(view.sky.paints.length, painted)
  view.unmount()
})
