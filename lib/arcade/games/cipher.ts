import type { GameServices } from "../game-runtime"

export function createCipher(services: GameServices) {
  const { TOUCH, store, setHud, scope, termlog, termin, $, listen } = services
  /* 10 ???? — three locks */
  const CIPH = {
    lv: 0,
    wrong: 0,
    id: "ciph" as const,
    title: "????",
    hint: "three locks. answers are lowercase",
    mode: "term" as const,
    L: [
      {
        q: "68 65 6c 6c 6f",
        a: "hello",
        t: "hex → text",
        h: "two digits, one letter. look up an ascii table.",
      },
      {
        q: "vhfuhw",
        a: "secret",
        t: "caesar shift",
        h: "every letter moved three steps forward. move them back.",
      },
      {
        q: "01101000 01101001",
        a: "hi",
        t: "binary → text",
        h: "eight bits, one letter.",
      },
    ],
    enter() {
      this.lv = store.get("ciph2", 0)
      this.wrong = 0
      this.render()
      if (!TOUCH) scope.timeout(() => termin.focus({ preventScroll: true }), 60)
    },
    render(msg = "") {
      const L = this.L,
        lv = this.lv
      if (lv >= L.length) {
        termlog.innerHTML =
          '<div class="mute">all locks open.</div><div class="q">access granted.</div><div>there is nothing else down here.</div><div>no prize, no form, no newsletter.</div><div class="sig">just: thanks for playing.</div><div class="mute">(type "reset" to lock it again)</div>'
        setHud({
          c: "access granted",
          s: "3 / 3 open",
          m: msg || "",
          mc: "sig",
        })
        return
      }
      const it = L[lv]
      termlog.innerHTML = `<div class="mute">lock 0${lv + 1} / 03 · ${it.t}</div><div class="q">${it.q}</div><div class="mute">${this.wrong >= 2 ? "hint: " + it.h : "&nbsp;"}</div>`
      setHud({
        c: `lock ${lv + 1} / 3`,
        s: `${lv} / 3 open`,
        m: msg || "",
        mc: msg === "open." ? "sig" : "mute",
      })
    },
    submit(v: string) {
      v = v.trim().toLowerCase()
      if (v === "reset") {
        this.lv = 0
        this.wrong = 0
        store.set("ciph2", 0)
        return this.render("locked again.")
      }
      if (this.lv >= this.L.length || !v) return
      if (v === this.L[this.lv].a) {
        this.lv++
        this.wrong = 0
        store.set("ciph2", this.lv)
        this.render("open.")
      } else {
        this.wrong++
        this.render(this.wrong >= 2 ? "no. here is a hint." : "no.")
      }
    },
  }
  listen($("#termf"), "submit", (e) => {
    e.preventDefault()
    CIPH.submit(termin.value)
    termin.value = ""
  })

  return CIPH
}
