import test from "node:test"
import assert from "node:assert/strict"
import { chooseGame, GAME_IDS } from "../lib/arcade/storage.ts"
import { createLifetime } from "../lib/arcade/lifetime.ts"
import { previewHour, twelveHourLabel } from "../lib/arcade/time.ts"
import { castPolygons, convexHull } from "../lib/arcade/desk-shadows.ts"

test("cast silhouettes retain footprints and cap long low-angle shadows", () => {
  assert.deepEqual(
    convexHull([
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
      [5, 5],
      [0, 0],
    ]),
    [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
    ]
  )
  const normal = castPolygons(0, 1)
  assert.deepEqual(castPolygons(0, 10), normal)
  const base = normal[4]
  assert.equal(Math.min(...base.map((point) => point[1])), 88)
  assert.equal(Math.max(...base.map((point) => point[1])), 168)
  const left = castPolygons(-1, 0)[0]
  const right = castPolygons(1, 0)[0]
  assert.equal(Math.min(...left.map((point) => point[0])), 44)
  assert.equal(Math.max(...right.map((point) => point[0])), 148)
})

test("12-hour previews distinguish noon, midnight and fractional hours", () => {
  for (const [query, expected] of [
    ["hour=12am", 0],
    ["hour=0am", 0],
    ["hour=12pm", 12],
    ["hour=0pm", 12],
    ["hour=8.5pm", 20.5],
    ["hour=8&period=PM", 20],
    ["hour=8", 8],
    ["hour=13pm", null],
    ["hour=23.9", null],
    ["hour=8&period=invalid", null],
    ["hour=NaN", null],
    ["", null],
  ])
    assert.equal(previewHour(new URLSearchParams(query)), expected, query)
  assert.equal(twelveHourLabel(0), "12:00 AM")
  assert.equal(twelveHourLabel(12), "12:00 PM")
  assert.equal(twelveHourLabel(23.5), "11:30 PM")
})

test("random deals exclude the previous game and the locked cipher", () => {
  for (const previous of [null, ...GAME_IDS]) {
    for (let n = 0; n <= 100; n++) {
      const index = chooseGame(false, previous, () => n / 100)
      assert.ok(index >= 0 && index < 9)
      assert.notEqual(GAME_IDS[index], previous)
    }
  }
})

test("the unlocked cipher is reachable without repeating the last deal", () => {
  const reachable = new Set()
  for (let n = 0; n < 100; n++)
    reachable.add(chooseGame(true, null, () => n / 100))
  assert.equal(reachable.size, 10)
  assert.notEqual(
    chooseGame(true, "ciph", () => 0.999),
    9
  )
})

test("unmount cancels frames, timers and input before a Strict Mode remount", () => {
  const frames = new Map(),
    timers = new Map()
  let id = 0,
    calls = 0
  const clock = {
    requestAnimationFrame(callback) {
      frames.set(++id, callback)
      return id
    },
    cancelAnimationFrame(id) {
      frames.delete(id)
    },
    setTimeout(callback) {
      timers.set(++id, callback)
      return id
    },
    clearTimeout(id) {
      timers.delete(id)
    },
  }
  const target = new EventTarget()
  const first = createLifetime(clock)
  first.on(target, "input", () => calls++)
  first.frame(() => calls++)
  first.timeout(() => calls++)
  const stale = [...frames.values(), ...timers.values()]
  first.dispose()
  assert.equal(frames.size + timers.size, 0)
  target.dispatchEvent(new Event("input"))
  stale.forEach((callback) => callback(0))
  assert.equal(calls, 0)
  assert.equal(
    first.frame(() => calls++),
    0
  )
  assert.equal(
    first.timeout(() => calls++),
    0
  )
  const second = createLifetime(clock)
  second.on(target, "input", () => calls++)
  target.dispatchEvent(new Event("input"))
  assert.equal(calls, 1)
  second.dispose()
  target.dispatchEvent(new Event("input"))
  assert.equal(calls, 1)
})
