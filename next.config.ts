import type { NextConfig } from "next"

/** STATIC_EXPORT=1 builds a plain static site (in `out/`) for GitHub Pages. */
const staticExport = process.env.STATIC_EXPORT === "1"
/** PAGES_BASE_PATH serves the site from a subpath, e.g. /NYCHousing on github.io. */
const basePath = (process.env.PAGES_BASE_PATH ?? "").replace(/\/+$/, "")

const nextConfig: NextConfig = {
  ...(basePath && { basePath }),
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  ...(staticExport && {
    output: "export",
    // GitHub Pages serves /foo/ from foo/index.html.
    trailingSlash: true,
    images: { unoptimized: true },
  }),
}

export default nextConfig
