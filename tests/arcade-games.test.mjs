import test from "node:test"
import assert from "node:assert/strict"
import { registerHooks } from "node:module"

// Node's native TS runner needs the extension that Next's bundler resolves.
registerHooks({
  resolve(specifier, context, nextResolve) {
    return nextResolve(
      specifier === "../game-controls" ? `${specifier}.ts` : specifier,
      context
    )
  },
})

const factories = await Promise.all(
  [
    ["lights-out", "createLightsOut"],
    ["2048", "create2048"],
    ["minesweeper", "createMinesweeper"],
    ["whack-a-mole", "createWhackAMole"],
    ["breakout", "createBreakout"],
    ["runner", "createRunner"],
    ["tetris", "createTetris"],
    ["snake", "createSnake"],
    ["ship-it", "createShipIt"],
    ["cipher", "createCipher"],
  ].map(
    async ([file, name]) =>
      (await import(`../lib/arcade/games/${file}.ts`))[name]
  )
)

function harness() {
  const saved = new Map()
  const labels = []
  const paints = []
  const noop = () => {}
  const keypad = {
    keys: [],
    board(cols, rows) {
      this.keys = Array.from({ length: cols * rows }, () => ({
        classList: { add: noop, remove: noop, toggle: noop },
        style: { setProperty: noop },
      }))
    },
    label(i, text) {
      labels[i] = text
    },
    tap: noop,
    wave: noop,
    flash: noop,
  }
  // Board is used as a standalone service by games.
  keypad.board = keypad.board.bind(keypad)
  const services = {
    TOUCH: true,
    store: {
      get: (key, fallback) => structuredClone(saved.get(key) ?? fallback),
      set: (key, value) => saved.set(key, structuredClone(value)),
    },
    setHud: noop,
    setReadout: noop,
    now: () => 1000,
    later: () => 1,
    scope: { frame: noop, timeout: noop },
    won: noop,
    fmt: String,
    side: { innerHTML: "" },
    $$: () => [],
    termlog: { innerHTML: "" },
    termin: { value: "" },
    $: () => ({}),
    listen: noop,
    isActive: () => true,
    keypad,
    pixel: {
      P: { W: 120, H: 96, S: 3 },
      pxSize: noop,
      clear: noop,
      R: (...args) => paints.push(args),
      COL: { paper: "paper", ink: "ink", sig: "signal", mute: "muted" },
    },
  }
  return { services, saved, labels, paints }
}

for (const factory of factories) {
  test(`${factory.name}: fresh state, enter, render and independent remount`, () => {
    const { services } = harness()
    const first = factory(services)
    const second = factory(harness().services)
    assert.notEqual(first, second)
    first.enter()
    if (first.mode === "px") {
      first.update(16)
      first.draw()
    }
    const initialHint = second.hint
    first.hint = "changed in first mount"
    assert.equal(second.hint, initialHint)
    second.enter()
    first.exit?.()
    second.exit?.()
  })
}

test("lights: a press and reversal restore lights; a new board receives the render", () => {
  const h = harness(),
    game = factories[0](h.services)
  game.enter()
  const before = [...game.on]
  game.flip(12)
  game.flip(12)
  assert.deepEqual(game.on, before)
  const oldKeys = h.services.keypad.keys
  game.enter()
  assert.notEqual(h.services.keypad.keys, oldKeys)
  game.press(12)
  assert.equal(game.moves, 1)
})

test("2048 merges equal tiles once and saves the existing best-score key", () => {
  const h = harness(),
    game = factories[1](h.services)
  game.enter()
  game.g = [2, 2, 2, 2, ...Array(12).fill(0)]
  game.move("l")
  assert.deepEqual(game.g.slice(0, 2), [4, 4])
  assert.equal(game.score, 8)
  assert.equal(h.saved.get("2048"), 8)
})

test("mines: the first square and its neighbours are safe; flags prevent opening", () => {
  const h = harness(),
    game = factories[2](h.services)
  game.enter()
  game.flag(63)
  game.press(63)
  assert.equal(game.started, false)
  game.press(27)
  assert.equal(game.mine.filter(Boolean).length, 10)
  for (const i of [27, ...game.nb(27)]) assert.equal(game.mine[i], false)
})

test("snake wraps at edges and reads the latest canvas palette", () => {
  const h = harness(),
    game = factories[7](h.services)
  game.enter()
  game.body = [[game.cols - 1, 2]]
  game.dir = [1, 0]
  game.food = [4, 4]
  game.step()
  assert.deepEqual(game.body[0], [0, 2])
  h.services.pixel.COL = {
    paper: "new-paper",
    ink: "new-ink",
    sig: "new-signal",
    mute: "new-muted",
  }
  game.draw()
  assert.ok(h.paints.some((args) => args.at(-1) === "new-signal"))
})

test("ship it preserves upgrade purchases and saved progress", () => {
  const h = harness(),
    game = factories[8](h.services)
  game.enter()
  game.s.lines = 100
  game.buy("duck")
  assert.equal(game.per(), 2)
  assert.equal(game.s.lines, 85)
  game.exit()
  const remount = factories[8](h.services)
  remount.enter()
  assert.equal(remount.s.own.duck, 1)
  assert.ok(h.saved.has("clk"))
})

test("cipher solves all locks and reset preserves the existing save key", () => {
  const h = harness(),
    game = factories[9](h.services)
  game.enter()
  for (const answer of ["hello", "secret", "hi"]) game.submit(answer)
  assert.equal(h.saved.get("ciph2"), 3)
  assert.match(h.services.termlog.innerHTML, /access granted/)
  game.submit("reset")
  assert.equal(h.saved.get("ciph2"), 0)
})
