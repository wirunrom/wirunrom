import type { Metadata, Viewport } from "next"
import localFont from "next/font/local"
import "./arcade.css"

const archivo = localFont({
  src: "../../public/arcade/fonts/Archivo-Variable.woff2",
  variable: "--font-archivo",
  weight: "100 900",
  display: "swap",
  declarations: [{ prop: "font-stretch", value: "62% 125%" }],
})
const geist = localFont({
  src: "../../public/arcade/fonts/GeistMono-Variable.woff2",
  variable: "--font-geist",
  weight: "100 900",
  display: "swap",
})

export const metadata: Metadata = {
  title: "WIRUNROM Signal File",
  description:
    "Wirunrom — senior developer by day. Ten small games, paper, ink, and a little signal blue.",
}
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export default function ArcadeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${archivo.variable} ${geist.variable} arcade-body`}>
        {children}
      </body>
    </html>
  )
}
