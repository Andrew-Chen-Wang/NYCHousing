"use client"
import { usePathname } from "next/navigation"

/** The current path without a trailing slash; the static export serves /why/ for /why. */
export function useCurrentPath() {
  const p = usePathname()
  return p.length > 1 && p.endsWith("/") ? p.slice(0, -1) : p
}
