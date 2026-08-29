import type { Metadata } from "next"
import { Syne, JetBrains_Mono } from "next/font/google"

import "./globals.css"
import { cn } from "@/lib/utils"

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
        {children}
      </body>
    </html>
  )
}
