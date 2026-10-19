import { BOROUGH_RENT, type Neighborhood } from "./neighborhoods"
import {
  type Assumptions,
  BASE_PRE_MONTHS,
  BOROUGH_HARD_FACTOR,
  type Ctx,
  DEFAULT_ASSUMPTIONS,
  defaultSite,
  landPsfFor,
  type Prototype,
  type Site,
  TAX_SHARE,
  type TaxPath,
} from "./project"
import {
  appliesTo,
  type Choices,
  effectFor,
  KEEP_ALL,
  REGULATIONS,
  type Regulation,
} from "./regulations"
import type { LineId, Stance } from "./types"

/** Budget lines in the order they appear on the cost stack. */
export const LINES: {
  id: LineId
  label: string
  group: "Land" | "Hard costs" | "Soft costs" | "Financing & time"
  what: string
  how: string
}[] = [
  {
    id: "land",
    label: "Land",
    group: "Land",
    what: "The price of the lot. In New York it is priced per buildable square foot: what zoning lets you build on it.",
    how: "Borough price per buildable foot × the neighborhood's rent relative to its borough (squared, capped between 0.35× and 2.5×) × buildable floor area (90% of gross). More allowed floor area per lot means less land for the same building.",
  },
  {
    id: "closing",
    label: "Transfer taxes & closing",
    group: "Land",
    what: "City and state transfer taxes on the land purchase (about 3.3%) plus title, survey and legal closing costs (about 1%).",
    how: "4.3% of land.",
  },
  {
    id: "parking",
    label: "Required parking",
    group: "Hard costs",
    what: "Garage or surface spaces zoning requires, where it requires them.",
    how: "Units × required spaces per unit (by City of Yes parking zone, or LDGMA ratio) × cost per space for the building type.",
  },
  {
    id: "hard",
    label: "Construction (hard costs)",
    group: "Hard costs",
    what: "Labor and materials to build the building, including the general contractor's fee and a construction contingency.",
    how: "Gross square feet × current-law cost per square foot for the building type × borough factor. Each code, labor or tax rule removes its share from this line.",
  },
  {
    id: "design",
    label: "Architecture & engineering",
    group: "Soft costs",
    what: "Architects, structural, mechanical and civil engineers, code consultants, environmental and land-use consultants.",
    how: "6% of base hard cost (7% when the site needs a rezoning).",
  },
  {
    id: "permits",
    label: "Permits, filings & expediting",
    group: "Soft costs",
    what: "DOB, FDNY, DEP and DOT fees, special inspections, and the expediters New York projects hire to move filings through agencies.",
    how: "2% of base hard cost.",
  },
  {
    id: "legal",
    label: "Legal & accounting",
    group: "Soft costs",
    what: "Land-use and real estate lawyers, accountants and title work beyond closing.",
    how: "1.2% of base hard cost (2.2% when the site needs a rezoning).",
  },
  {
    id: "insurance",
    label: "Insurance",
    group: "Soft costs",
    what: "General liability, wrap-up (OCIP/CCIP), builder's risk and umbrella coverage. New York's Scaffold Law makes liability coverage far costlier than elsewhere.",
    how: "9% of hard cost.",
  },
  {
    id: "marketing",
    label: "Marketing & lease-up",
    group: "Soft costs",
    what: "Leasing agents, advertising, model units and, for income-restricted homes, lottery administration.",
    how: "$3,500 per unit.",
  },
  {
    id: "devfee",
    label: "Developer overhead & fee",
    group: "Soft costs",
    what: "The developer's staff and fee for organizing the project.",
    how: "4% of hard and soft costs.",
  },
  {
    id: "interest",
    label: "Construction interest & loan fees",
    group: "Financing & time",
    what: "Interest on the construction loan while the building goes up, and lender fees.",
    how: "Loan (share of cost) × rate × construction months ÷ 12 × 55% average balance, plus 1% in fees.",
  },
  {
    id: "mrt",
    label: "Mortgage recording tax",
    group: "Financing & time",
    what: "New York's 2.8% tax on recording the construction mortgage.",
    how: "2.8% of the construction loan.",
  },
  {
    id: "carry",
    label: "Pre-construction carry & escalation",
    group: "Financing & time",
    what: "What waiting costs: equity tied up in land and early design earns nothing while approvals drag, and construction prices keep rising.",
    how: "(Land + closing + half of design, permits and legal) × cost of equity × months before construction ÷ 12, plus hard cost × escalation × months of regulatory delay ÷ 12.",
  },
]

export const LINE_BY_ID = Object.fromEntries(LINES.map((l) => [l.id, l])) as Record<
  LineId,
  (typeof LINES)[number]
>

export type Result = {
  lines: Record<LineId, number>
  tdc: number
  units: number
  perUnit: number
  preMonths: number
  buildMonths: number
  landPsf: number
  taxShare: number
  /** Share of units at 60% and 80% of AMI. */
  share60: number
  share80: number
  /** Break-even rent averaged over every unit, then the rent market-rate units must charge. */
  avgRent: number
  marketRent: number
  /** What a new market-rate unit can rent for in the neighborhood. */
  bar: number
  pencils: boolean
  applied: Regulation[]
}

const factor = (s: Stance | undefined, r: Regulation) =>
  s === "remove" ? 1 : s === "reform" ? (r.reform?.share ?? 1) : 0

export function compute(ctx: Ctx, choices: Choices, a: Assumptions = DEFAULT_ASSUMPTIONS): Result {
  const { proto, nb } = ctx
  const mult = Object.fromEntries(LINES.map((l) => [l.id, 1])) as Record<LineId, number>
  let preMonths = BASE_PRE_MONTHS
  let buildMonths = proto.buildMonths
  let density = 0
  let efficiency = 0
  let taxCut = 0
  let opexAdd = 0
  const afford = { mih: 0, "485x": 0 }

  const applied = REGULATIONS.filter((r) => r.modeled && appliesTo(r, ctx))
  for (const r of applied) {
    const e = effectFor(r, ctx)
    const f = factor(choices[r.id], r)
    preMonths += (e.preMonths ?? 0) * (1 - f)
    buildMonths -= (e.buildMonths ?? 0) * f
    for (const [line, pct] of Object.entries(e.lines ?? {}))
      mult[line as LineId] *= 1 - f * (pct ?? 0)
    density += f * (e.density ?? 0)
    efficiency += f * (e.efficiency ?? 0)
    taxCut += f * (e.taxShare ?? 0)
    opexAdd += (e.opexPerUnit ?? 0) * (1 - f)
    if (e.affordable) afford[e.affordable] = 1 - f
  }

  const units = proto.units * (1 + efficiency)
  const landPsf = landPsfFor(nb, BOROUGH_RENT[nb.borough])
  const hardBase = proto.gsf * proto.hardPsf * BOROUGH_HARD_FACTOR[nb.borough]
  const review = ctx.site.rezoning ? 0.01 : 0
  const parkingRatio = nb.ldgma ? proto.ldgmaParkingPerUnit : proto.parkingPerUnit[nb.parkingZone]

  const lines = {} as Record<LineId, number>
  lines.land = ((landPsf * proto.gsf * 0.9) / (1 + density)) * mult.land
  lines.closing = lines.land * 0.043 * mult.closing
  lines.parking = proto.units * parkingRatio * proto.costPerSpace * mult.parking
  lines.hard = hardBase * mult.hard
  lines.design = (0.06 + review) * hardBase * mult.design
  lines.permits = 0.02 * hardBase * mult.permits
  lines.legal = (0.012 + review) * hardBase * mult.legal
  lines.insurance = 0.09 * lines.hard * mult.insurance
  lines.marketing = proto.units * 3_500 * mult.marketing
  lines.devfee =
    0.04 * (lines.hard + lines.design + lines.permits + lines.legal + lines.insurance)
  const subtotal =
    lines.land +
    lines.closing +
    lines.parking +
    lines.hard +
    lines.design +
    lines.permits +
    lines.legal +
    lines.insurance +
    lines.marketing +
    lines.devfee
  const loan = a.loanToCost * subtotal
  lines.interest = loan * a.constructionRate * (buildMonths / 12) * 0.55 + loan * 0.01
  lines.mrt = loan * 0.028 * mult.mrt
  lines.carry =
    (lines.land + lines.closing + 0.5 * (lines.design + lines.permits + lines.legal)) *
      a.equityRate *
      (preMonths / 12) +
    lines.hard * a.escalation * (Math.max(0, preMonths - BASE_PRE_MONTHS) / 12)

  const tdc = subtotal + lines.interest + lines.mrt + lines.carry

  const taxShare = Math.max(
    0,
    ctx.tax === "485x" ? TAX_SHARE.exempt485x : TAX_SHARE.full - taxCut,
  )
  const opex = units * (a.opexPerUnit + opexAdd)
  const egi = (a.yieldOnCost * tdc + opex) / (1 - taxShare)
  const avgRent = egi / (1 - a.vacancy) / units / 12

  const mihApplies = applied.some((r) => r.id === "mih")
  const share60 = mihApplies ? 0.25 * afford.mih : 0
  const base485 = ctx.tax === "485x" ? (proto.units >= 100 ? 0.25 : 0.2) : 0
  const share80 = Math.max(0, base485 * afford["485x"] - share60)
  const marketRent =
    (avgRent - share60 * a.rent60Ami - share80 * a.rent80Ami) / (1 - share60 - share80)
  const bar = nb.rent * (1 + a.newBuildPremium)

  return {
    lines,
    tdc,
    units,
    perUnit: tdc / units,
    preMonths,
    buildMonths,
    landPsf,
    taxShare,
    share60,
    share80,
    avgRent,
    marketRent,
    bar,
    pencils: marketRent <= bar,
    applied,
  }
}

/** What one regulation's chosen stance saves on its own, starting from current law. */
export function standalone(ctx: Ctx, id: string, stance: Stance, a?: Assumptions) {
  const base = compute(ctx, KEEP_ALL, a)
  const one = compute(ctx, { ...KEEP_ALL, [id]: stance }, a)
  return {
    perUnit: base.perUnit - one.perUnit,
    rent: base.marketRent - one.marketRent,
    months: base.preMonths + base.buildMonths - one.preMonths - one.buildMonths,
    total: base.perUnit * base.units - one.perUnit * one.units,
  }
}

/** Current law vs. a set of choices for every neighborhood: how many places a project works. */
export function feasibility(
  proto: Prototype,
  tax: TaxPath,
  rezoning: boolean,
  choices: Choices,
  neighborhoods: Neighborhood[],
  a?: Assumptions,
) {
  return neighborhoods.map((nb) => {
    const site: Site = { ...defaultSite(nb), rezoning }
    const ctx = { proto, nb, site, tax }
    const base = compute(ctx, KEEP_ALL, a)
    const scen = compute(ctx, choices, a)
    return { nb, base, scen }
  })
}

export const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`

/** $1.2M, $850K, $12,400 */
export function money(n: number) {
  const abs = Math.abs(n)
  const sign = n < 0 ? "−" : ""
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(abs >= 1e8 ? 0 : 1)}M`
  if (abs >= 10_000) return `${sign}$${Math.round(abs / 1000).toLocaleString("en-US")}K`
  return `${sign}$${Math.round(abs).toLocaleString("en-US")}`
}

export const pct = (n: number, digits = 0) => `${(n * 100).toFixed(digits)}%`
