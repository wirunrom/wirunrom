import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

/** Loader and scroll reveals share the shell's scoped GSAP context. */
export function setupArcadeIntro(
  host: HTMLElement,
  context: gsap.Context,
  reduced: boolean,
  fitNames: () => void
) {
  let active = true
  const query = <T extends HTMLElement>(selector: string) =>
    host.querySelector<T>(selector)!
  const loader = query(".loader"),
    wordmark = query("#name"),
    footer = query("#big")

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
      const bridgeMotion = gsap.timeline({
        scrollTrigger: {
          trigger: ".desk-bridge",
          start: "top 90%",
          end: "top 55%",
          scrub: true,
        },
      })
      bridgeMotion.fromTo(
        ".desk-link-line",
        { scaleY: 0.25, transformOrigin: "top" },
        { scaleY: 1, ease: "none" },
        0
      )
      bridgeMotion.fromTo(
        ".desk-link-arrow",
        { y: -27 },
        { y: 0, ease: "none" },
        0
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
  }
}
