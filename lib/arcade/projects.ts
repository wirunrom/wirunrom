export type ProjectNote = {
  id: string
  title: string
  notes?: string[]
  hint?: string
  summary: string
  object?: "laptop" | "terminal" | "notebook" | "print" | "envelope" | "disk"
  platform?: string
  status?: string
  category?: string
  stack?: string[]
  placeholder?: boolean
  hidden?: boolean
  media?: {
    src: string
    alt: string
    caption: string
    width: number
    height: number
  }[]
  links?: {
    label: string
    href: string
    kind: "web" | "github" | "npm" | "mail" | "linkedin" | "pdf"
    download?: string
  }[]
}

const PROJECT_FILES: ProjectNote[] = [
  {
    id: "finjar",
    object: "laptop",
    platform: "web + mobile",
    title: "Finjar",
    stack: [
      "Next.js",
      "TypeScript",
      "Tailwind CSS",
      "SwiftUI",
      "Rust",
      "Axum",
      "PostgreSQL",
    ],
    notes: [
      "track income, spending, recurring payments and budgets in one place",
      "forecast the rest of a billing cycle, including upcoming commitments",
      "monthly financial reviews with saved snapshots and cycle-to-cycle comparisons",
      "built end to end: a Next.js web app, native SwiftUI iOS app and Rust API",
      "shared financial calculations across web and iOS; a sample API reference is available on GitHub",
    ],
    summary:
      "a personal finance app for understanding where money goes, what is left this cycle and what comes next. a solo project across web and native iOS.",
    media: [
      {
        src: "/projects/finjar-web.png",
        alt: "Finjar transaction history with income and expenses grouped by date.",
        caption: "earlier web snapshot · sample data",
        width: 1440,
        height: 900,
      },
    ],
    links: [
      { label: "web", href: "https://finjar.wirunrom.com/", kind: "web" },
      {
        label: "GitHub",
        href: "https://github.com/wirunrom/finjar-api-reference",
        kind: "github",
      },
    ],
  },
  {
    id: "pos-heart",
    object: "terminal",
    platform: "desktop",
    title: "POS Heart",
    stack: ["Rust", "egui / eframe", "Diesel", "SQLite"],
    status: "just experimenting",
    category: "personal experiment",
    notes: [
      "trying out checkout, payments, stock and shift flows",
      "exploring local data and offline desktop workflows",
    ],
    summary:
      "an offline desktop POS, built for fun and learning how the pieces fit together.",
    links: [
      {
        label: "GitHub",
        href: "https://github.com/wirunrom/pos-heart",
        kind: "github",
      },
    ],
    media: [
      {
        src: "/projects/pos-heart-desktop.png",
        alt: "POS Heart desktop showing shift totals, shop tasks and open bills.",
        caption: "desktop development snapshot · sample data",
        width: 1280,
        height: 820,
      },
    ],
  },
  {
    id: "barqrcode",
    object: "print",
    title: "barqrcode",
    stack: ["Rust", "WebAssembly", "JavaScript", "React", "Vue"],
    platform: "Rust + WASM",
    status: "open source · MIT",
    category: "library",
    summary: "QR codes and barcodes, made to be read.",
    notes: [
      "generate and decode, in the browser or Node.js",
      "PNG and SVG output, with React and Vue wrappers",
    ],
    links: [
      {
        label: "npm",
        href: "https://www.npmjs.com/package/barqrcode",
        kind: "npm",
      },
    ],
  },
  {
    id: "online-ordering",
    object: "print",
    title: "Online Ordering",
    platform: "web + POS",
    status: "production",
    category: "work at Infogrammer",
    summary:
      "a food-ordering platform I work on as part of the team at Infogrammer.",
    stack: ["Next.js", "ASP.NET", "Go", "PostgreSQL", "Redis", "REST", "gRPC"],
    notes: [
      "built ordering and payment flows, back-office tools and POS integrations",
      "rebuilt legacy .NET MVC screens in Next.js and moved parts into microservices",
      "maintained the cloud infrastructure supporting the platform",
    ],
    hint: "hint: think of a famous shabu chain in red.",
  },
  {
    id: "sample-05",
    hidden: true,
    object: "envelope",
    title: "Project 05",
    summary:
      "a sample file for a future project. replace it when you’re ready.",
    placeholder: true,
  },
  {
    id: "sample-06",
    hidden: true,
    object: "disk",
    title: "Project 06",
    summary:
      "a sample file for a future project. replace it when you’re ready.",
    placeholder: true,
  },
]

export const PROJECT_NOTES = PROJECT_FILES.filter((project) => !project.hidden)

// Owner-authored desk message; separate from the project list and its count.
export const DESK_CONTACT = {
  name: "Wirunrom Wankasemsan",
  role: "Senior Full-Stack Developer",
  location: "Chiang Mai, Thailand",
  timezone: "GMT+7",
  email: "wirunrom@gmail.com",
  invitation:
    "happy to talk about software, side projects, or a good cup of matcha.",
}

export const DESK_NOTE: ProjectNote & { short: string[] } = {
  id: "desk-note",
  title: "say hello",
  category: "contact",
  status: "pinned",
  short: ["say hello", "— github", "— mail", "— linkedin"],
  summary: "a question, an idea, or just a hello. here’s where to find me.",
  links: [
    { label: "GitHub", href: "https://github.com/wirunrom", kind: "github" },
    { label: "mail", href: "mailto:wirunrom@gmail.com", kind: "mail" },
    {
      label: "LinkedIn",
      href: "https://www.linkedin.com/in/wirunrom/",
      kind: "linkedin",
    },
    {
      label: "resume · PDF",
      href: "/wirunrom_resume.pdf",
      kind: "pdf",
      download: "Wirunrom_Resume.pdf",
    },
  ],
}
