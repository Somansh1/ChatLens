import type React from "react"
import type { Metadata } from "next"
import { Bricolage_Grotesque, Instrument_Sans } from "next/font/google"
import "./globals.css"

const body = Instrument_Sans({ subsets: ["latin"], variable: "--font-body" })
const heavy = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-heavy" })

const title = "ChatLens - Your chat, by the numbers"
const description =
  "Drop in a WhatsApp, Instagram or Messenger export and see who texts more, when you talk, and what you say most. Nothing leaves your browser."

// Icons and the share image are picked up from app/ by file name (icon.svg, favicon.ico,
// apple-icon.png, opengraph-image.png). metadataBase makes the share image URL absolute.
export const metadata: Metadata = {
  metadataBase: new URL("https://chat-lens-ivory.vercel.app"),
  title,
  description,
  openGraph: { title, description, type: "website", siteName: "ChatLens" },
  twitter: { card: "summary_large_image", title, description },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`font-sans antialiased ${body.variable} ${heavy.variable}`}>
        {children}
      </body>
    </html>
  )
}
