import test from "node:test"
import assert from "node:assert/strict"
import { chooseGame, GAME_IDS } from "../lib/arcade/storage.ts"
import { createLifetime } from "../lib/arcade/lifetime.ts"

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
