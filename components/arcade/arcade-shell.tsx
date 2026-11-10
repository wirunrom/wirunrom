"use client"

import { useRef } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"
import { setupArcadeIntro } from "./arcade-intro"
import { setupArcadePointer } from "./arcade-pointer"
import { createLifetime } from "@/lib/arcade/lifetime"

gsap.registerPlugin(ScrollTrigger, useGSAP)

export function ArcadeShell({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null)

  useGSAP(
    (context, contextSafe) => {
      const host = root.current!
      const scope = createLifetime(window)
      const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches
      const query = <T extends HTMLElement>(selector: string) =>
        host.querySelector<T>(selector)!
      const all = <T extends HTMLElement>(selector: string) => [
        ...host.querySelectorAll<T>(selector),
      ]
      const wordmark = query("#name"),
        negative = query("#neg"),
        wrapper = query(".namewrap")
      const footer = query("#big"),
        footerText = query("#bigt")
      let lastY = scrollY,
        velocity = 0
      const seen = new WeakMap<Element, boolean>()
      const observer = new IntersectionObserver(
        (entries) =>
          entries.forEach((entry) =>
            seen.set(entry.target, entry.isIntersecting)
          ),
        { rootMargin: "100px" }
      )
      const tracks = all(".ticker").map((el) => {
        observer.observe(el)
        return {
          el,
          track: el.querySelector<HTMLElement>(".track")!,
          x: 0,
          width: 0,
          speed: Number(el.dataset.speed),
        }
      })

      function fitNames() {
        const width = wrapper.clientWidth
        if (width > 0) {
          wordmark.style.fontSize = "100px"
          const natural = query("#name .nm").getBoundingClientRect().width
          if (natural > 0) {
            const size = `${(100 * width) / natural}px`
            wordmark.style.fontSize = size
            negative.style.fontSize = size
          }
        }
        footer.style.fontSize = "100px"
        const style = getComputedStyle(footer)
        const available =
          footer.clientWidth -
          parseFloat(style.paddingLeft) -
          parseFloat(style.paddingRight)
        if (footerText.getBoundingClientRect().width > 0)
          footer.style.fontSize = `${(100 * available) / footerText.getBoundingClientRect().width}px`
        tracks.forEach((track) => {
          track.width = track.track.scrollWidth / 3
        })
      }

      // ResizeObserver follows actual containers rather than assuming viewport width.
      const resize = new ResizeObserver(fitNames)
      resize.observe(wrapper)
      resize.observe(host)
      fitNames()

      all<HTMLAnchorElement>("[data-scroll]").forEach((anchor) => {
        scope.on(anchor, "click", (event) => {
          event.preventDefault()
          const destination = host.querySelector(anchor.hash)
          destination?.scrollIntoView({ behavior: reduced ? "auto" : "smooth" })
        })
      })
      scope.on(query("[data-top]"), "click", (event) => {
        event.preventDefault()
        window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" })
      })

      const pointer = setupArcadePointer(host, reduced, contextSafe!)

      function animate(_time: number, delta: number) {
        if (document.hidden) return
        const y = scrollY
        velocity += (y - lastY - velocity) * 0.1
        lastY = y
        tracks.forEach((track) => {
          if (!track.width || seen.get(track.el) === false) return
          track.x -=
            (track.speed * 0.6 + velocity * 0.08 * Math.sign(track.speed)) *
            Math.min(delta / 16.667, 3)
          if (track.x < -track.width) track.x += track.width
          if (track.x > 0) track.x -= track.width
          gsap.set(track.track, { x: track.x })
        })
        pointer.update()
      }
      if (!reduced) gsap.ticker.add(animate)

      const disposeIntro = setupArcadeIntro(host, context, reduced, fitNames)

      return () => {
        disposeIntro()
        pointer.dispose()
        scope.dispose()
        resize.disconnect()
        observer.disconnect()
        gsap.ticker.remove(animate)
        document.documentElement.classList.remove("arcade-cursor", "negative")
      }
    },
    { scope: root }
  )

  return (
    <div ref={root} className="arcade-app relative min-h-svh">
      <div className="grain" aria-hidden="true" />
      <div className="crosshair" aria-hidden="true">
        <div className="h" />
        <div className="v" />
        <div className="box" />
        <div className="rd" />
      </div>
      {children}
    </div>
  )
}
