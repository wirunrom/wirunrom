"use client"

import { useRef } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"
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
      const loader = query(".loader")
      let active = true
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

      const glyphs = "/\\_-=+*#01<>[]{}xX"
      if (!reduced)
        all("[data-scramble], header nav a").forEach((el) => {
          const text = el.textContent || ""
          scope.on(
            el,
            "pointerenter",
            contextSafe!(() => {
              const progress = { value: 0 }
              gsap.to(progress, {
                value: text.length,
                duration: 0.25,
                ease: "none",
                onUpdate: () => {
                  el.textContent = text
                    .split("")
                    .map((letter, i) =>
                      letter === " " || i < progress.value
                        ? letter
                        : glyphs[Math.floor(Math.random() * glyphs.length)]
                    )
                    .join("")
                },
                onComplete: () => {
                  el.textContent = text
                },
              })
            })
          )
        })

      const windowState = { x: 0, y: 0, scale: 0 }
      const moveX = gsap.quickTo(windowState, "x", { duration: 0.18 })
      const moveY = gsap.quickTo(windowState, "y", { duration: 0.18 })
      const scale = gsap.quickTo(windowState, "scale", { duration: 0.2 })
      scope.on(wrapper, "pointerenter", () => {
        if (!reduced) scale(1)
      })
      scope.on(wrapper, "pointerleave", () => scale(0))
      scope.on(wrapper, "pointermove", (event) => {
        const pointer = event as PointerEvent,
          bounds = wrapper.getBoundingClientRect()
        moveX(pointer.clientX - bounds.left)
        moveY(pointer.clientY - bounds.top)
      })

      if (matchMedia("(pointer: fine)").matches && !reduced) {
        const cursor = query(".crosshair"),
          horizontal = query(".crosshair .h"),
          vertical = query(".crosshair .v")
        const box = query(".crosshair .box"),
          readout = query(".crosshair .rd"),
          coordinates = query("[data-observer]")
        document.documentElement.classList.add("arcade-cursor")
        gsap.set(cursor, { display: "block" })
        const boxX = gsap.quickTo(box, "x", { duration: 0.18 }),
          boxY = gsap.quickTo(box, "y", { duration: 0.18 })
        scope.on(
          window,
          "pointermove",
          (event) => {
            if (window.innerWidth <= 760) return
            const { clientX: x, clientY: y } = event as PointerEvent
            gsap.set(horizontal, { y })
            gsap.set(vertical, { x })
            boxX(x)
            boxY(y)
            gsap.set(readout, { x: x + 12, y: y + 10 })
            const pad = (value: number) =>
              String(Math.round(value)).padStart(4, "0")
            readout.textContent = `x ${pad(x)} y ${pad(y)}`
            coordinates.textContent = `x ${pad(x)} / y ${pad(y)}`
          },
          { passive: true }
        )
      }

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
        if (windowState.scale > 0.001) {
          const half =
            windowState.scale * Math.min(150, wrapper.clientHeight * 0.75)
          negative.style.visibility = "visible"
          negative.style.clipPath = `inset(${windowState.y - half}px ${wrapper.clientWidth - windowState.x - half}px ${wrapper.clientHeight - windowState.y - half}px ${windowState.x - half}px)`
        } else negative.style.visibility = "hidden"
      }
      if (!reduced) gsap.ticker.add(animate)

      // Fonts are local/preloaded. Promise completion is guarded against unmount.
      void document.fonts.ready.then(() => {
        if (!active) return
        context.add(() => {
          fitNames()
          if (reduced) {
            gsap.set(loader, { display: "none" })
            return
          }
          const counter = { value: 0 }
          const timeline = gsap.timeline()
          timeline.fromTo(
            "[data-loader-row]",
            { opacity: 0 },
            { opacity: 1, stagger: 0.2, duration: 0.1 },
            0
          )
          timeline.to(
            counter,
            {
              value: 100,
              duration: 1.8,
              ease: "power2.out",
              onUpdate: () => {
                query("[data-loader-count]").textContent = String(
                  Math.round(counter.value)
                ).padStart(3, "0")
              },
            },
            0
          )
          timeline.to(
            loader,
            {
              clipPath: "inset(0 0 100% 0)",
              duration: 1,
              ease: "power3.inOut",
              onComplete: () => {
                gsap.set(loader, { display: "none" })
              },
            },
            1.8
          )
          timeline.fromTo(
            "#name .l",
            { yPercent: 105 },
            { yPercent: 0, duration: 1.1, stagger: 0.05, ease: "expo.out" },
            2.05
          )
          gsap.fromTo(
            "#mani .w",
            { opacity: 0.12 },
            {
              opacity: 1,
              stagger: 0.025,
              ease: "none",
              scrollTrigger: {
                trigger: "#mani",
                start: "top 85%",
                end: "bottom 50%",
                scrub: true,
              },
            }
          )
          gsap.to(wordmark, {
            yPercent: -18,
            ease: "none",
            scrollTrigger: {
              trigger: ".hero",
              start: "top top",
              end: "bottom top",
              scrub: true,
            },
          })
          gsap.from(footer, {
            yPercent: 40,
            ease: "none",
            scrollTrigger: {
              trigger: "footer",
              start: "top bottom",
              end: "bottom bottom",
              scrub: true,
            },
          })
          ScrollTrigger.refresh()
        })
      })

      return () => {
        active = false
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
