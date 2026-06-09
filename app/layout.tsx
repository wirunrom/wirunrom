import type { Metadata } from "next"
import { Syne, JetBrains_Mono } from "next/font/google"

import "./globals.css"
import { STORAGE_KEY } from "@/lib/bento-theme"
import { cn } from "@/lib/utils"

/* Runs before first paint: apply the saved palette (hue + paper mode) to
   <body> so a reload doesn't flash the default dark-lime theme first. */
const themeScript = `(function(){try{var s=JSON.parse(localStorage.getItem(${JSON.stringify(
  STORAGE_KEY
)}));if(!s)return;if(s.h!=null)document.body.style.setProperty('--base-h',s.h);if(s.mode==='light')document.body.setAttribute('data-theme','paper');}catch(e){}})();`

const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-syne",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-jbmono",
})

export const metadata: Metadata = {
  title: "WIRUNROM — Full-Stack Developer",
  description:
    "Wirunrom Wankasemsan — senior full-stack developer building production ordering, payments, POS and cloud systems.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={cn("bento ds", syne.variable, jetbrainsMono.variable)}
      >
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {children}
      </body>
    </html>
  )
}
