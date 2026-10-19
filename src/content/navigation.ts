import { LINES } from "./model"
import { NEIGHBORHOODS } from "./neighborhoods"
import { CATEGORIES, REGULATIONS } from "./regulations"
import { BOROUGHS } from "./types"
import { slug } from "./neighborhoods"

export type SideItem = { id: string; label: string; href: string }
export type SideGroup = { id: string; title: string; items: SideItem[] }
export type SidePart = { id: string; title: string; href: string; groups: SideGroup[] }

export const boroughSlug = slug

export const SIDEBAR: SidePart[] = [
  {
    id: "costs",
    title: "Where the money goes",
    href: "/costs",
    groups: (["Land", "Hard costs", "Soft costs", "Financing & time"] as const).map((g) => ({
      id: `c-${slug(g)}`,
      title: g,
      items: LINES.filter((l) => l.group === g).map((l) => ({
        id: l.id,
        label: l.label,
        href: `/costs/${l.id}`,
      })),
    })),
  },
  {
    id: "regulations",
    title: "Regulations",
    href: "/regulations",
    groups: CATEGORIES.map((c) => ({
      id: `r-${slug(c)}`,
      title: c,
      items: REGULATIONS.filter((r) => r.category === c).map((r) => ({
        id: r.id,
        label: r.title,
        href: `/regulations/${r.id}`,
      })),
    })),
  },
  {
    id: "places",
    title: "Boroughs & neighborhoods",
    href: "/boroughs",
    groups: BOROUGHS.map((b) => ({
      id: `b-${slug(b)}`,
      title: b,
      items: [
        { id: `b-${slug(b)}-all`, label: `${b} overview`, href: `/boroughs/${slug(b)}` },
        ...NEIGHBORHOODS.filter((n) => n.borough === b && !n.boroughWide).map((n) => ({
          id: n.slug,
          label: n.name,
          href: `/neighborhoods/${n.slug}`,
        })),
      ],
    })),
  },
]
