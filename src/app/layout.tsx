import "./globals.css"
import { MobileNav, Sidebar } from "@site/components/site/sidebar"
import { SIDEBAR } from "@site/content/navigation"
import { RENT_WINDOW } from "@site/content/rents.generated"
import type { Metadata } from "next"
import localFont from "next/font/local"
import Link from "next/link"

// The font files live in ./fonts (latin subset, from Fontsource) so the build never
// downloads from Google Fonts.
const serif = localFont({
  src: "./fonts/source-serif-4-latin-wght-normal.woff2",
  weight: "200 900",
  variable: "--font-source-serif",
  display: "swap",
})
const sans = localFont({
  src: [
    { path: "./fonts/ibm-plex-sans-latin-400-normal.woff2", weight: "400" },
    { path: "./fonts/ibm-plex-sans-latin-500-normal.woff2", weight: "500" },
    { path: "./fonts/ibm-plex-sans-latin-600-normal.woff2", weight: "600" },
    { path: "./fonts/ibm-plex-sans-latin-700-normal.woff2", weight: "700" },
  ],
  variable: "--font-plex-sans",
  display: "swap",
})
const mono = localFont({
  src: [
    { path: "./fonts/ibm-plex-mono-latin-400-normal.woff2", weight: "400" },
    { path: "./fonts/ibm-plex-mono-latin-500-normal.woff2", weight: "500" },
    { path: "./fonts/ibm-plex-mono-latin-600-normal.woff2", weight: "600" },
  ],
  variable: "--font-plex-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "NYC Housing Costs: what it costs to build, and which rules could go",
    template: "%s · NYC Housing Costs",
  },
  description:
    "Every cost of developing housing in New York City, every regulation that adds to it with its history and citations, and a calculator for development cost, savings and rent by neighborhood.",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
      <body>
        <MobileNav parts={SIDEBAR} />
        <div className="flex min-h-dvh">
          <Sidebar parts={SIDEBAR} />
          <main className="min-w-0 flex-1">
            {children}
            <footer className="mx-auto max-w-5xl border-t border-rule px-4 pt-6 pb-10 text-xs leading-relaxed text-muted-foreground sm:px-8">
              <nav className="mb-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                <Link className="hover:text-foreground" href="/">Overview</Link>
                <Link className="hover:text-foreground" href="/calculator">Calculator</Link>
                <Link className="hover:text-foreground" href="/regulations">Regulations</Link>
                <Link className="hover:text-foreground" href="/boroughs">Boroughs</Link>
                <Link className="hover:text-foreground" href="/method">Method & assumptions</Link>
                <Link className="hover:text-foreground" href="/sources">Sources</Link>
              </nav>
              Rents are StreetEasy median asking rents averaged over {RENT_WINDOW.from} to{" "}
              {RENT_WINDOW.to}. Costs are 2026 estimates built from published cost surveys, land
              sales and regulatory studies; each regulation states its confidence. Law current as of
              October 2026.
            </footer>
          </main>
        </div>
      </body>
    </html>
  )
}
