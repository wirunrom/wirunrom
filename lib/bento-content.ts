/* ------------------------------------------------------------------
   WIRUNROM bento — content data
   Edit copy here without touching the cell markup.
   ------------------------------------------------------------------ */

export type Experience = {
  role: string
  org: string
  period: string
  /** highlight the org in accent + keep meta un-muted (current role) */
  current?: boolean
}

export const EXPERIENCE: Experience[] = [
  { role: "Full-Stack Developer", org: "Infogrammer", period: "2024 — Now", current: true },
  { role: "Full-Stack Developer · Intern", org: "AppIntouch", period: "2023" },
  { role: "Full-Stack Developer · Intern", org: "CMEx", period: "2020" },
]

export const EDUCATION = {
  degree: "Software Engineering",
  school: "Payap University",
  year: "2021 - 2024",
}

export type Project = {
  name: string
  meta: string
  href?: string
}

export const PROJECTS: Project[] = [
  { name: "Finjar", meta: "NEXT · RUST ↗", href: "https://finjar.wirunrom.com/" },
  { name: "hqr-generate", meta: "REACT · OSS ↗", href: "https://github.com/wirunrom/hqr-generate" },
  { name: "Internal tools", meta: "@ INFOGRAMMER" },
]

export type StackGroup = {
  key: string
  /** emphasised technologies */
  primary: string
  /** secondary / "also know" technologies, rendered faint */
  faint?: string
}

export const STACK: StackGroup[] = [
  { key: "Frontend", primary: "TypeScript · Next.js · Tailwind", faint: "· React · Vue · Angular" },
  { key: "Backend", primary: "Node · C# · REST · gRPC · SQL/NoSQL", faint: "· Rust · Go" },
  { key: "Infra", primary: "Docker · Microservices · Azure · AWS · Networking" },
]

export type CaseStudy = {
  tag: string
  title: string
  /** trusted HTML — authored here, rendered via dangerouslySetInnerHTML */
  body: string
}

export const CASE_STUDIES: Record<string, CaseStudy> = {
  ledger: {
    tag: "Featured · @ Infogrammer",
    title: "Food Ordering Platform",
    body:
      "<p><strong>Overview</strong>A food-ordering platform that goes well beyond placing orders — covering payments, back-office management, and POS integration across the stack.</p>" +
      "<p><strong>What I did</strong>Built ordering and payment flows, back-office management tools, and integrations with the POS — including building some POS modules myself. Maintained the cloud infrastructure that keeps it all running.</p>" +
      "<p><strong>Legacy rebuild</strong>Migrated an older .NET MVC system to a modern Next.js stack, and split parts of it into microservices.</p>" +
      "<p><strong>Stack</strong>Next.js · ASP.NET · Go · PostgreSQL · Redis · REST · gRPC</p>" +
      "<p><strong>Scale</strong>Handles hundreds of thousands of orders every day (around a million order items/day), placed and routed to kitchen displays &amp; POS in production.</p>" +
      "<p><strong>Traffic</strong>Serves millions of requests per day through a gateway front door and containerised microservices.</p>",
  },
}

export type CaseStudyKey = keyof typeof CASE_STUDIES
