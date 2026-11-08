import Image from "next/image"

const SCREENS = {
  web: { file: "finjar-web", width: 650, height: 413 },
  phone: { file: "finjar-phone", width: 153, height: 310 },
  pos: { file: "pos-heart", width: 833, height: 500 },
} as const

/** Flat captures of project-screen-mocks.tsx, using its existing sample data.
 * Two small textures replace hundreds of DOM nodes inside moving 3D panels. */
export function DeskScreen({ kind }: { kind: keyof typeof SCREENS }) {
  const screen = SCREENS[kind]
  return (
    <span className="screen-raster" aria-hidden="true">
      {(["light", "dark"] as const).map((theme) => (
        <Image
          key={theme}
          className={`screen-${theme}`}
          src={`/projects/screens/${screen.file}-${theme}.webp`}
          width={screen.width}
          height={screen.height}
          alt=""
          unoptimized
          loading="eager"
          decoding="async"
          draggable={false}
        />
      ))}
    </span>
  )
}
