import { boroughTypical, ctxWhereApplies } from "./illustrate"
import { PROTOTYPE_BY_ID, PROTOTYPES } from "./project"
import { effectFor, type Regulation, REGULATIONS } from "./regulations"
import type { LineId } from "./types"

/** Regulations that move a budget line, directly or through time, density or efficiency. */
export function moversOf(line: LineId): { r: Regulation; how: string }[] {
  const out: { r: Regulation; how: string }[] = []
  for (const r of REGULATIONS.filter((x) => x.modeled)) {
    const ctx =
      PROTOTYPES.map((p) => ctxWhereApplies(r, p, boroughTypical("Brooklyn"))).find(Boolean) ??
      ctxWhereApplies(r, PROTOTYPE_BY_ID.mid, boroughTypical("Staten Island"))
    if (!ctx) continue
    const e = effectFor(r, ctx)
    const share = e.lines?.[line]
    if (share) out.push({ r, how: `${Math.round(share * 1000) / 10}% of this line` })
    else if (line === "land" && e.density) out.push({ r, how: `${Math.round(e.density * 100)}% more floor area per lot` })
    else if (line === "carry" && e.preMonths) out.push({ r, how: `${e.preMonths} months before construction` })
    else if (line === "interest" && e.buildMonths) out.push({ r, how: `${e.buildMonths} months of construction` })
  }
  return out
}
