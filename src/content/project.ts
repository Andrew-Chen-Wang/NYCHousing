import type { Neighborhood } from "./neighborhoods"
import type { Borough, Confidence } from "./types"

/** A building type the calculator prices. Gross floor area includes halls, stairs and walls. */
export type Prototype = {
  id: "small" | "mid" | "tower"
  label: string
  short: string
  stories: number
  units: number
  gsf: number
  /** Current-law hard cost per gross square foot, before the borough factor. */
  hardPsf: number
  buildMonths: number
  /** Required parking spaces per unit, by City of Yes zone (market-rate housing). */
  parkingPerUnit: Record<1 | 2 | 3, number>
  /** Parking under Lower Density Growth Management Area rules (Staten Island, Bronx CD 10). */
  ldgmaParkingPerUnit: number
  /** Cost to build one required space in this building type. */
  costPerSpace: number
  description: string
}

export const PROTOTYPES: Prototype[] = [
  {
    id: "small",
    label: "Small walk-up · 4 stories · 8 units",
    short: "4-story, 8 units",
    stories: 4,
    units: 8,
    gsf: 8_800,
    hardPsf: 300,
    buildMonths: 14,
    parkingPerUnit: { 1: 0, 2: 0, 3: 0.5 },
    ldgmaParkingPerUnit: 1.5,
    costPerSpace: 30_000,
    description:
      "A 25-by-100-foot lot with an eight-unit, four-story building: the infill type that fills most of Brooklyn, Queens and the Bronx. Parking, where required, is at grade under or behind the building.",
  },
  {
    id: "mid",
    label: "Mid-rise · 6 stories · 60 units",
    short: "6-story, 60 units",
    stories: 6,
    units: 60,
    gsf: 54_000,
    hardPsf: 330,
    buildMonths: 22,
    parkingPerUnit: { 1: 0, 2: 0.25, 3: 0.5 },
    ldgmaParkingPerUnit: 1,
    costPerSpace: 55_000,
    description:
      "A six-story elevator building of about 60 units on a mid-block lot. It stays under 100 units, below the 485-x construction wage floor, and at six stories it is the height single-stair reform would cover.",
  },
  {
    id: "tower",
    label: "High-rise · 25 stories · 220 units",
    short: "25-story, 220 units",
    stories: 25,
    units: 220,
    gsf: 200_000,
    hardPsf: 450,
    buildMonths: 32,
    parkingPerUnit: { 1: 0, 2: 0.2, 3: 0.4 },
    ldgmaParkingPerUnit: 1,
    costPerSpace: 70_000,
    description:
      "A 25-story concrete tower of about 220 units, the type built near transit in Manhattan, Downtown Brooklyn, Long Island City and the South Bronx. At 150+ units it triggers the higher 485-x wage tiers in Zones A and B.",
  },
]

export const PROTOTYPE_BY_ID = Object.fromEntries(PROTOTYPES.map((p) => [p.id, p])) as Record<
  Prototype["id"],
  Prototype
>

/**
 * Average land price per buildable square foot by borough. Manhattan and Brooklyn are
 * reported first-half 2025 averages; Queens, the Bronx and Staten Island are estimates
 * from sparse deal reports.
 */
export const LAND_PSF: Record<Borough, { v: number; confidence: Confidence; sources: string[]; note: string }> = {
  Manhattan: {
    v: 488,
    confidence: "medium",
    sources: ["ariel-manhattan-1h25", "avison-3q25"],
    note: "Ariel: $488 per buildable foot in 1H 2025; Avison Young reported $384 in Q3 2025.",
  },
  Brooklyn: {
    v: 313,
    confidence: "medium",
    sources: ["grea-brooklyn-1h25"],
    note: "GREA: $313 per buildable foot in 1H 2025, a record.",
  },
  Queens: {
    v: 230,
    confidence: "low",
    sources: [],
    note: "Estimate between Brooklyn and the Bronx; Long Island City trades far higher.",
  },
  Bronx: {
    v: 115,
    confidence: "low",
    sources: ["iprg-bronx-2025"],
    note: "IPRG reported $92 per buildable foot in January 2025 on few deals; raised for 2026.",
  },
  "Staten Island": {
    v: 85,
    confidence: "low",
    sources: [],
    note: "Estimate. Few multifamily sites trade; most land is zoned for one- and two-family homes.",
  },
}

/** Hard cost by borough relative to Brooklyn: logistics, staging and union share. Estimates. */
export const BOROUGH_HARD_FACTOR: Record<Borough, number> = {
  Manhattan: 1.12,
  Brooklyn: 1,
  Queens: 0.98,
  Bronx: 0.96,
  "Staten Island": 0.93,
}

/** Land in a neighborhood: borough price scaled by how its rent compares with the borough's. */
export function landPsfFor(nb: Neighborhood, boroughRent: number) {
  const ratio = nb.rent / boroughRent
  const scale = Math.min(2.5, Math.max(0.35, ratio ** 2))
  return LAND_PSF[nb.borough].v * scale
}

/** Inputs the reader can change in the calculator. */
export type Assumptions = {
  yieldOnCost: number
  constructionRate: number
  loanToCost: number
  equityRate: number
  escalation: number
  opexPerUnit: number
  vacancy: number
  newBuildPremium: number
  rent80Ami: number
  rent60Ami: number
}

export const DEFAULT_ASSUMPTIONS: Assumptions = {
  yieldOnCost: 0.055,
  constructionRate: 0.075,
  loanToCost: 0.65,
  equityRate: 0.1,
  escalation: 0.04,
  opexPerUnit: 10_500,
  vacancy: 0.05,
  newBuildPremium: 0.35,
  rent80Ami: 2_600,
  rent60Ami: 1_950,
}

export const ASSUMPTION_INFO: Record<
  keyof Assumptions,
  { label: string; unit: "%" | "$"; why: string; sources: string[] }
> = {
  yieldOnCost: {
    label: "Required yield on cost",
    unit: "%",
    why: "Stabilized net operating income divided by total development cost that a developer and lender need before they will build. New York rental projects are generally underwritten around 5.5–6.5%.",
    sources: ["rgb-2026-msr"],
  },
  constructionRate: {
    label: "Construction loan rate",
    unit: "%",
    why: "Floating construction debt priced off SOFR. The Rent Guidelines Board's 2026 survey put new permanent multifamily loans at 6.13%; construction loans run higher.",
    sources: ["rgb-2026-msr"],
  },
  loanToCost: {
    label: "Construction loan, share of cost",
    unit: "%",
    why: "Share of the budget financed with the construction loan; the rest is equity.",
    sources: [],
  },
  equityRate: {
    label: "Cost of equity while waiting",
    unit: "%",
    why: "Annual return equity expects on money tied up in land and pre-development before construction starts. It prices delay.",
    sources: [],
  },
  escalation: {
    label: "Construction cost escalation",
    unit: "%",
    why: "How much hard costs rise each year a start is delayed.",
    sources: ["buildingcongress-outlook"],
  },
  opexPerUnit: {
    label: "Operating cost per unit per year (before property tax)",
    unit: "$",
    why: "Payroll, utilities in common areas, repairs, insurance, management and reserves for a new building.",
    sources: [],
  },
  vacancy: {
    label: "Vacancy and collection loss",
    unit: "%",
    why: "Citywide rental vacancy is 1.4%, but new buildings lease up over months and some rent goes uncollected.",
    sources: ["vitalcity-campion-2025"],
  },
  newBuildPremium: {
    label: "New-building rent premium over the neighborhood median",
    unit: "%",
    why: "StreetEasy's median covers every listing, mostly older walk-ups. A new elevator building with amenities rents above that median; this premium sets the bar a new project must clear.",
    sources: ["streeteasy-data"],
  },
  rent80Ami: {
    label: "Rent on a unit at 80% of area median income",
    unit: "$",
    why: "Average monthly rent the owner collects on an income-restricted unit at 80% AMI across unit sizes, net of utility allowances.",
    sources: ["hpd-mih-factsheet"],
  },
  rent60Ami: {
    label: "Rent on a unit at 60% of area median income",
    unit: "$",
    why: "Average monthly rent on a unit at 60% AMI, the Mandatory Inclusionary Housing Option 1 average.",
    sources: ["hpd-mih-factsheet"],
  },
}

/** Property tax as a share of a building's effective gross income. */
export const TAX_SHARE = {
  /** Fully taxed new Class 2 rental: CBC and others put taxes near 30% of income. */
  full: 0.28,
  /** Under 485-x the building is exempt for decades; the land's prior value stays taxed. */
  exempt485x: 0.06,
}

/** Months before construction that no regulation causes: design, financing, closing. */
export const BASE_PRE_MONTHS = 8

/** The project the reader is pricing. */
export type Site = {
  rezoning: boolean
  historic: boolean
  flood: boolean
}

export type TaxPath = "485x" | "full"

export type Ctx = {
  proto: Prototype
  nb: Neighborhood
  site: Site
  tax: TaxPath
}

/** Defaults for a site in a neighborhood: historic only where most lots are designated. */
export function defaultSite(nb: Neighborhood): Site {
  return { rezoning: false, historic: nb.historic === "high", flood: nb.flood }
}
