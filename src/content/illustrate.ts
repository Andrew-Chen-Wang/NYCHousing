import { compute, standalone } from "./model"
import { BOROUGH_RENT, NEIGHBORHOODS, type Neighborhood } from "./neighborhoods"
import { type Ctx, defaultSite, PROTOTYPES, type Prototype, type TaxPath } from "./project"
import { appliesTo, DEFAULT_CHOICES, KEEP_ALL, type Regulation } from "./regulations"
import { type Borough, BOROUGHS } from "./types"

/** A typical neighborhood for each borough: the borough's median rent and its most common rules. */
export function boroughTypical(b: Borough): Neighborhood {
  const flags: Record<Borough, Partial<Neighborhood>> = {
    Manhattan: { parkingZone: 1, zone485x: "A" },
    Brooklyn: { parkingZone: 1, zone485x: "C" },
    Queens: { parkingZone: 2, zone485x: "C" },
    Bronx: { parkingZone: 1, zone485x: "C" },
    "Staten Island": { parkingZone: 3, zone485x: "C", ldgma: true },
  }
  return {
    slug: `typical-${b}`,
    name: `Typical ${b}`,
    borough: b,
    rent: BOROUGH_RENT[b],
    rent2019: null,
    months: 12,
    historic: "none",
    flood: false,
    mih: false,
    ldgma: false,
    zone485x: "C",
    parkingZone: 2,
    ...flags[b],
  }
}

/** A context where the regulation applies, turning on the site conditions it needs. */
export function ctxWhereApplies(r: Regulation, proto: Prototype, nb: Neighborhood): Ctx | null {
  const site = defaultSite(nb)
  const tries: Ctx[] = []
  for (const tax of ["485x", "full"] as TaxPath[])
    for (const rezoning of [false, true])
      for (const historic of [site.historic, true])
        for (const flood of [site.flood, true])
          tries.push({ proto, nb, tax, site: { rezoning, historic, flood } })
  return tries.find((c) => appliesTo(r, c)) ?? null
}

/** What a regulation costs per home in each borough and building type, where it applies. */
export function regulationGrid(r: Regulation) {
  return PROTOTYPES.map((proto) => ({
    proto,
    cells: BOROUGHS.map((b) => {
      const nb = boroughTypical(b)
      const ctx = ctxWhereApplies(r, proto, nb)
      if (!ctx) return { b, ctx: null, remove: null, def: null }
      return {
        b,
        ctx,
        remove: standalone(ctx, r.id, "remove"),
        def: r.stance === "keep" ? null : standalone(ctx, r.id, r.stance),
      }
    }),
  }))
}

/** Current law vs. the default picks for a neighborhood and building type. */
export function summary(nb: Neighborhood, proto: Prototype, tax: TaxPath = "485x", rezoning = false) {
  const ctx: Ctx = { proto, nb, tax, site: { ...defaultSite(nb), rezoning } }
  return { ctx, base: compute(ctx, KEEP_ALL), def: compute(ctx, DEFAULT_CHOICES) }
}

export const REAL_NEIGHBORHOODS = NEIGHBORHOODS.filter((n) => !n.boroughWide)
