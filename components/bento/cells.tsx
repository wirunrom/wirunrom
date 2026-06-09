import { EDUCATION, EXPERIENCE, PROJECTS, STACK } from "@/lib/bento-content"
import { ReadMoreButton } from "./read-more-button"
import { ResumeLink } from "./resume-link"

/* 01 · IDENTITY */
export function HeroCell() {
  return (
    <section className="cell c-hero">
      <div className="row">
        <span className="label m3">(01) — Full-Stack Developer</span>
        <span className="status">
          <span className="dot" /> Open to work
        </span>
      </div>
      <h1 className="wordmark">
        <span className="ac">W</span>I<span className="ac">R</span>UN
        <span className="ac">R</span>OM
      </h1>
      <p className="hero-tag m2">
        I build production systems end to end — food ordering &amp; payments,
        back-office tools, POS integration, and cloud infra.
        <span className="th m3">
          “Heart” Wirunrom Wankasemsan · Senior Full-Stack Developer
        </span>
      </p>
    </section>
  )
}

/* 02 · FEATURED */
export function FeaturedCell() {
  return (
    <section className="cell c-feat">
      <div className="row">
        <span className="label ac">★ Featured · @ Infogrammer</span>
        <span className="label m3">Production</span>
      </div>
      <div className="feat-stat push">
        <span className="feat-stat-num ac">6-figure</span>
        <span className="feat-stat-lbl m3">daily orders in production</span>
        <span className="feat-stat-sub m3">
          millions of requests / day · high-traffic scale
        </span>
      </div>
      <div>
        <h2 className="feat-name">Food Ordering Platform</h2>
        <p className="feat-desc m2">
          Ordering &amp; payments, back-office management, POS integration, plus
          a legacy .NET MVC → Next.js rebuild and cloud infra.
        </p>
        <ReadMoreButton study="ledger">Read case study →</ReadMoreButton>
      </div>
      <div className="row push" style={{ marginTop: 14 }}>
        <span className="label m3">NEXT · ASP.NET · GO · POSTGRES · REDIS</span>
        <span className="label m2">&apos;24</span>
      </div>
    </section>
  )
}

/* 03 · NOW */
export function NowCell() {
  return (
    <section className="cell c-now">
      <span className="label m3">(02) — Now</span>
      <div>
        <div className="now-line">Building ordering &amp; POS systems</div>
        <div className="now-sub m2">@ Infogrammer · Chiang Mai</div>
      </div>
      <span className="now-avail">
        <span className="dot" /> Open to new work
      </span>
    </section>
  )
}

/* 05 · EXPERIENCE */
export function ExperienceCell() {
  return (
    <section className="cell c-stat">
      <span className="label m3" style={{ marginBottom: 4 }}>
        (03) — Experience
      </span>
      {EXPERIENCE.map((e) => (
        <div className="exp-item" key={e.role + e.org}>
          <div className="exp-role">{e.role}</div>
          <div className={`exp-meta${e.current ? "" : "m2"}`}>
            {e.current ? <span className="ac">{e.org}</span> : e.org} ·{" "}
            {e.period}
          </div>
        </div>
      ))}
      <div className="exp-edu m2">
        <span className="ac">EDU</span> · {EDUCATION}
      </div>
    </section>
  )
}

/* 06 · WORK LIST */
export function WorkCell() {
  return (
    <section className="cell c-work">
      <span className="label m3" style={{ marginBottom: 6 }}>
        Projects &amp; OSS
      </span>
      {PROJECTS.map((p) => {
        const inner = (
          <>
            <span className="work-nm">{p.name}</span>
            <span className="work-yr m3">{p.meta}</span>
          </>
        )
        return p.href ? (
          <a
            className="work-item"
            href={p.href}
            target="_blank"
            rel="noopener"
            key={p.name}
          >
            {inner}
          </a>
        ) : (
          <span className="work-item" key={p.name}>
            {inner}
          </span>
        )
      })}
    </section>
  )
}

/* 07 · CAPABILITIES */
export function CapabilitiesCell() {
  return (
    <section className="cell c-cap">
      <span className="label m3" style={{ marginBottom: 6 }}>
        (04) — Stack
      </span>
      {STACK.map((g) => (
        <div className="cap-item" key={g.key}>
          <div className="cap-k ac">{g.key}</div>
          <div className="cap-v m2">
            {g.primary} {g.faint && <span className="m3">{g.faint}</span>}
          </div>
        </div>
      ))}
    </section>
  )
}

/* 08 · CONTACT */
export function ContactCell() {
  return (
    <section className="cell c-contact">
      <h2 className="ct-title">
        Let&apos;s build
        <br />
        something.
      </h2>
      <div className="ct-right">
        <a className="email" href="mailto:wirunrom@gmail.com">
          wirunrom@gmail.com ↗
        </a>
        <div className="socials">
          <a href="https://github.com/wirunrom" target="_blank" rel="noopener">
            GitHub
          </a>
          <a
            href="https://www.linkedin.com/in/wirunrom/"
            target="_blank"
            rel="noopener"
          >
            LinkedIn
          </a>
          <ResumeLink />
        </div>
      </div>
    </section>
  )
}
