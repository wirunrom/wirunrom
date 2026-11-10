import { useEffect, useRef } from "react"
import {
  IconBrandGithub,
  IconBrandNpm,
  IconBrandLinkedin,
  IconMail,
  IconFileDownload,
  IconCopy,
  IconWorld,
} from "@tabler/icons-react"
import { DESK_CONTACT, type ProjectNote } from "@/lib/arcade/projects"

const LINK_ICONS = {
  web: IconWorld,
  github: IconBrandGithub,
  npm: IconBrandNpm,
  mail: IconMail,
  linkedin: IconBrandLinkedin,
  pdf: IconFileDownload,
}

type ProjectDossierProps = {
  work: ProjectNote | null | undefined
  selected: number | null
  projectCount: number
  copyStatus: "idle" | "copied" | "error"
  onCopyEmail: () => void
  onStep: (direction: -1 | 1) => void
  onClose: () => void
}

export function ProjectDossier({
  work,
  selected,
  projectCount,
  copyStatus,
  onCopyEmail,
  onStep,
  onClose,
}: ProjectDossierProps) {
  const detailBody = useRef<HTMLDivElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)
  const isNote = selected === -1
  useEffect(() => {
    if (detailBody.current) detailBody.current.scrollTop = 0
    if (selected !== null) closeButton.current?.focus({ preventScroll: true })
  }, [selected])
  return (
    <aside
      className={isNote ? "detail detail-contact" : "detail"}
      aria-label="Project details"
      aria-hidden={!work}
      inert={!work}
    >
      <div className="top">
        <span>
          {isNote
            ? "note"
            : `${selected === null ? "" : String(selected + 1).padStart(2, "0")} / ${projectCount}`}
        </span>
        <span>{isNote ? "sticky note" : work?.platform || "sample"}</span>
      </div>
      <div ref={detailBody} className="body">
        <span className="status">
          {work?.status ||
            (work?.placeholder ? "sample file" : "work in progress")}
        </span>
        <h2>{work?.title}</h2>
        <p>{work?.summary}</p>
        {isNote ? (
          <>
            <dl className="contact-info">
              <dt>name</dt>
              <dd>{DESK_CONTACT.name}</dd>
              <dt>role</dt>
              <dd>{DESK_CONTACT.role}</dd>
              <dt>based</dt>
              <dd>
                {DESK_CONTACT.location} · {DESK_CONTACT.timezone}
              </dd>
              <dt className="contact-email-label">email</dt>
              <dd className="contact-email">
                <span className="select-text">{DESK_CONTACT.email}</span>
                <button
                  type="button"
                  onClick={onCopyEmail}
                  className="copy-email"
                  aria-label="Copy email address"
                >
                  <IconCopy size={14} stroke={1.5} aria-hidden="true" />
                  <span>{copyStatus === "copied" ? "copied" : "copy"}</span>
                </button>
              </dd>
            </dl>
            <span
              role="status"
              className={
                copyStatus === "error" ? "text-mute text-[10px]" : "sr-only"
              }
            >
              {copyStatus === "copied"
                ? "email copied"
                : copyStatus === "error"
                  ? "couldn’t copy. select the email above to copy it."
                  : ""}
            </span>
            <p>{DESK_CONTACT.invitation}</p>
          </>
        ) : (
          <dl>
            <dt>platform</dt>
            <dd>{work?.platform || "to be decided"}</dd>
            <dt>type</dt>
            <dd>
              {work?.category ||
                (work?.placeholder ? "sample project" : "personal project")}
            </dd>
            <dt className="sr-only">Technology stack</dt>
            <dd className="min-w-0 col-span-2 wrap-break-word">
              {work?.stack?.length ? (
                <ul className="stack-tags" aria-label="Technology stack">
                  {work.stack.map((technology) => (
                    <li key={technology}>{technology}</li>
                  ))}
                </ul>
              ) : (
                "to be decided"
              )}
            </dd>
          </dl>
        )}
        {work?.notes?.length ? (
          <ul>
            {work.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        ) : null}
        {work?.hint ? (
          <small className="text-mute leading-relaxed block text-[10px]">
            {work.hint}
          </small>
        ) : null}
      </div>
      <div className="foot">
        {work?.links?.length ? (
          <nav
            className="project-links"
            aria-label={isNote ? "Contact links" : "Project links"}
          >
            {work.links.map((link) => {
              const Icon = LINK_ICONS[link.kind]
              return (
                <a
                  key={link.href}
                  href={link.href}
                  aria-label={`${work.title}: ${link.label}`}
                  title={link.label}
                  download={link.download}
                  target={
                    link.kind === "mail" || link.download ? undefined : "_blank"
                  }
                  rel="noopener noreferrer"
                >
                  <Icon size={17} stroke={1.6} aria-hidden="true" />
                  <span>{link.label}</span>
                </a>
              )
            })}
          </nav>
        ) : null}
        <nav className="project-navigation" aria-label="Project navigation">
          <button onClick={() => onStep(-1)}>← prev</button>
          <button onClick={() => onStep(1)}>next →</button>
          <button ref={closeButton} onClick={onClose}>
            close ×
          </button>
        </nav>
      </div>
    </aside>
  )
}
