import type { Ctx } from "./project"
import type { Confidence, LineId, Stance } from "./types"

/**
 * What a regulation costs, stated as what fully removing it would save. The calculator
 * scales it by 1 for "remove", by `reform.share` for "reform", and by 0 for "keep".
 */
export type Effect = {
  /** Share of each budget line the rule accounts for (0.05 = 5% of that line). */
  lines?: Partial<Record<LineId, number>>
  /** Months of pre-construction delay the rule adds. */
  preMonths?: number
  /** Months the rule adds to construction. */
  buildMonths?: number
  /** Extra floor area allowed on the same lot if the rule goes (0.25 = 25% more). */
  density?: number
  /** More homes from the same floor area if the rule goes (0.05 = 5% more units). */
  efficiency?: number
  /** Points of property tax as a share of income the rule accounts for. */
  taxShare?: number
  /** Annual operating cost per unit the rule accounts for. */
  opexPerUnit?: number
  /** The rule requires income-restricted units. */
  affordable?: "mih" | "485x"
}

export type Para = { text: string; sources: string[] }

export type Category =
  | "Zoning & land use"
  | "Review & approvals"
  | "Building code & design"
  | "Energy & environment"
  | "Construction site, labor & insurance"
  | "Taxes & fees"
  | "Affordability & tenancy"
  | "Federal & materials"

export const CATEGORIES: Category[] = [
  "Zoning & land use",
  "Review & approvals",
  "Building code & design",
  "Energy & environment",
  "Construction site, labor & insurance",
  "Taxes & fees",
  "Affordability & tenancy",
  "Federal & materials",
]

export type Regulation = {
  id: string
  title: string
  short: string
  category: Category
  level: "City" | "State" | "Federal" | "Utility"
  enacted: string
  citation: string
  history: Para[]
  /** How it raises cost, in words, with the numbers behind the estimate. */
  cost: Para
  effect: Effect | ((ctx: Ctx) => Effect)
  /** When it applies to a project; omitted means always. */
  applies?: (ctx: Ctx) => boolean
  appliesNote: string
  reform: { label: string; share: number } | null
  removeLabel: string
  stance: Stance
  stanceWhy: string
  keepCase: string[]
  changeCase: string[]
  /** How it differs across boroughs or neighborhoods. */
  geography?: string
  /** What changed in 2024–2026. */
  recent?: string
  confidence: Confidence
  /** False when the calculator's prototypes don't capture the cost (listed for completeness). */
  modeled: boolean
}

const lowRise = (c: Ctx) => c.proto.stories <= 6
const needsReview = (c: Ctx) => c.site.rezoning

export const REGULATIONS: Regulation[] = [
  // ───────────────────────────── Zoning & land use ─────────────────────────────
  {
    id: "far-height-limits",
    title: "Floor-area and height limits",
    short:
      "Zoning caps how much floor area (FAR) and how tall a building may be on each lot, so land cost is spread over fewer homes.",
    category: "Zoning & land use",
    level: "City",
    enacted: "1916; rewritten 1961",
    citation: "NYC Zoning Resolution, Articles II–III (residence district bulk regulations)",
    history: [
      {
        text: "New York wrote the country's first comprehensive zoning code in 1916, after the 40-story Equitable Building cast its neighbors into shadow. That code controlled height through setbacks but left density largely alone.",
        sources: ["zoning-handbook", "dcp-history"],
      },
      {
        text: "The 1961 Zoning Resolution replaced it with floor-area ratios and tower-in-the-park rules, and sharply cut how much housing could be built, mostly at the edges of the city. Later 'contextual' districts from the 1980s onward capped heights further in much of Brooklyn, Queens and the Bronx.",
        sources: ["mcny-1961", "zoning-handbook"],
      },
      {
        text: "A state cap added to the Multiple Dwelling Law around the same time held residential floor area at 12 times the lot size citywide. The FY2025 state budget repealed it in April 2024, and City of Yes for Housing Opportunity (December 2024) added density for housing near transit and a 20% bonus for affordable homes.",
        sources: ["co-mdl-12far", "kramer-12far", "citylimits-coy-deal"],
      },
    ],
    cost: {
      text: "Land is about a fifth of a typical budget and much more in New York. If a lot may hold 25% more floor area, the same building needs about 20% less land. The Citizens Budget Commission and others name restrictive land-use rules as a main reason New York land is among the most expensive in the country. The calculator models removal as allowing 50% more floor area on the same lot and reform as 25% more (City of Yes taken further near transit).",
      sources: ["vitalcity-campion-2025"],
    },
    effect: { density: 0.5 },
    appliesNote: "Every project: the land price per buildable foot already reflects today's limits.",
    reform: { label: "Upzone near transit: +25% floor area", share: 0.5 },
    removeLabel: "Roughly 50% more floor area on every residential lot",
    stance: "reform",
    stanceWhy:
      "More floor area per lot is the single biggest lever on land cost per home, but infrastructure, light and air are real concerns. The default takes City of Yes further near transit rather than removing limits.",
    keepCase: [
      "Height limits protect light, air and neighborhood scale that residents value.",
      "Schools, sewers and transit need planning to keep up with more people.",
    ],
    changeCase: [
      "Limits on floor area raise land cost per home in direct proportion.",
      "City of Yes was cut from an estimated 109,000 homes to 80,000 as the Council narrowed it; much of the city still cannot add housing as of right.",
    ],
    geography:
      "Contextual districts with tight height caps cover much of brownstone Brooklyn, Queens and the north Bronx. Manhattan below 96th Street and Downtown Brooklyn carry the highest allowances; Staten Island is mostly zoned for one- and two-family homes.",
    recent:
      "The 12 FAR cap was repealed in April 2024; City of Yes passed the Council 31–20 on December 5, 2024.",
    confidence: "medium",
    modeled: true,
  },
  {
    id: "parking-minimums",
    title: "Residential parking minimums",
    short:
      "Zoning requires off-street parking for new apartments outside the transit core, at $30,000–$70,000+ a space.",
    category: "Zoning & land use",
    level: "City",
    enacted: "1961; narrowed 1982 (Manhattan Core) and 2024 (City of Yes)",
    citation: "Zoning Resolution §25-20 et seq. (required accessory off-street parking)",
    applies: (c) => c.proto.parkingPerUnit[c.nb.parkingZone] > 0 || c.nb.ldgma,
    history: [
      {
        text: "The 1961 Zoning Resolution required parking with new housing almost everywhere outside Manhattan. NYU's Furman Center found developers were required to provide on average 43 spaces per 100 new homes, from 5 in Manhattan to 122 on Staten Island, and that developers mostly built only the minimum: the rule was binding.",
        sources: ["furman-parking-brief-2012", "furman-parking-study"],
      },
      {
        text: "At the time, above-ground garage spaces cost more than $21,000 each to build in New York and below-ground spaces up to $50,000, before land.",
        sources: ["streetsblog-parking"],
      },
      {
        text: "Mayor Adams proposed ending parking mandates citywide in City of Yes. The Council's December 2024 deal instead created three zones: no mandates in the Manhattan Core, Long Island City and the Inner Transit Zone; reduced mandates in the Outer Transit Zone; and most mandates kept beyond it. Affordable, senior, transit-oriented and Town Center housing, ADUs and conversions are exempt everywhere.",
        sources: ["dcp-city-of-yes", "citylimits-coy-deal", "openplans-parking"],
      },
    ],
    cost: {
      text: "Each required space in a structured or below-grade garage costs about $55,000–$70,000 to build today, and every space also uses floor area or lot area that could hold homes. The calculator multiplies the spaces required in the neighborhood's parking zone (estimated at 0.2–0.5 per unit in Zones 2 and 3) by the cost per space.",
      sources: ["furman-parking-brief-2012", "openplans-parking"],
    },
    effect: { lines: { parking: 1 } },
    appliesNote:
      "Neighborhoods in parking Zones 2 and 3, and Lower Density Growth Management Areas. Zone 1 has no mandate.",
    reform: { label: "Halve the remaining minimums", share: 0.5 },
    removeLabel: "End parking mandates citywide; let builders choose",
    stance: "remove",
    stanceWhy:
      "Builders still provide parking where tenants will pay for it. Mandates only bind where parking costs more than it earns, which is exactly where they raise rents.",
    keepCase: [
      "In car-dependent parts of eastern Queens and Staten Island, new residents without off-street parking compete for curb space.",
    ],
    changeCase: [
      "Developers build the bare minimum, which shows the requirement binds.",
      "Furman found parking requirements made projects smaller and costlier in outer boroughs.",
      "2.6 million people already live in the mandate-free zone without problems.",
    ],
    geography:
      "Zone 1 (none): all of Manhattan, Long Island City, and the Inner Transit Zone across north and central Brooklyn, western Queens and the South Bronx. Zone 2 (reduced): much of south Brooklyn, central Queens and the north Bronx. Zone 3 (kept): eastern Queens, the Brooklyn and Bronx waterfront edges, and Staten Island.",
    recent: "City of Yes (December 2024) replaced citywide mandates with three zones.",
    confidence: "medium",
    modeled: true,
  },
  {
    id: "ldgma",
    title: "Lower Density Growth Management Area rules",
    short:
      "On Staten Island and in the east Bronx, extra parking (1.5 spaces per home in low-density districts), bigger yards and larger lots.",
    category: "Zoning & land use",
    level: "City",
    enacted: "2004",
    citation: "Zoning Resolution §12-10 (definition) and LDGMA provisions in Articles II and X",
    applies: (c) => c.nb.ldgma,
    history: [
      {
        text: "A Staten Island Growth Management Task Force concluded in 2004 that the borough's fast growth called for stricter rules. In August 2004 the city designated all of Staten Island the first Lower Density Growth Management Area, raising parking from one space per home to 1.5, and requiring bigger yards and more space between buildings. Throgs Neck and the rest of Bronx Community District 10 were added that September.",
        sources: ["dcp-ldgma", "dcp-sigrowth"],
      },
      {
        text: "The Council refined minimum lot area, lot width and rear-yard open space rules in December 2005. The designation now covers Staten Island Community Districts 1, 2 and 3 and Bronx Community District 10.",
        sources: ["dcp-ldgma"],
      },
    ],
    cost: {
      text: "The added parking roughly doubles the spaces a small building needs, and the yard and lot rules mean more land per home. The calculator counts the LDGMA parking ratio (1.5 per unit for a small building, 1 for larger ones) and about 9% more land.",
      sources: ["dcp-ldgma"],
    },
    effect: { lines: { land: 0.09, parking: 0.5 } },
    appliesNote: "Staten Island and Bronx Community District 10 (Throgs Neck, Pelham Bay, City Island, Co-op City).",
    reform: { label: "Return to citywide low-density rules", share: 0.6 },
    removeLabel: "Repeal the LDGMA overlay",
    stance: "remove",
    stanceWhy:
      "The overlay was written to slow growth. Staten Island has some of the city's lowest rents, so it is where homes could be added most cheaply.",
    keepCase: [
      "Staten Island has limited transit, so most households drive.",
      "Residents asked for the rules after a building boom of poorly sited attached homes.",
    ],
    changeCase: [
      "It applies one of the highest parking ratios in the city where land is cheapest.",
      "Larger yard and lot rules turn every home into a larger land purchase.",
    ],
    geography: "Only Staten Island and Bronx CD 10. It is the clearest borough-specific rule in the code.",
    confidence: "medium",
    modeled: true,
  },
  {
    id: "bulk-envelope",
    title: "Setbacks, sky-exposure planes, yards and lot coverage",
    short:
      "Rules that shape the building envelope force step-backs, transfer beams and awkward floor plates.",
    category: "Zoning & land use",
    level: "City",
    enacted: "1916 (setbacks); 1961 and 1987 (contextual envelopes)",
    citation: "Zoning Resolution §§23-40 to 23-60 (yards, height and setback)",
    history: [
      {
        text: "The 1916 code introduced setback rules that produced the city's wedding-cake skyline. The 1961 code added sky-exposure planes and open-space ratios, and the Quality Housing program of 1987 introduced street-wall and base-height rules that now govern most new apartment buildings.",
        sources: ["zoning-handbook", "dcp-history"],
      },
      {
        text: "City of Yes loosened some of these rules in 2024, mainly by allowing taller envelopes where buildings add affordable homes, but the basic setback and yard structure remains.",
        sources: ["dcp-city-of-yes"],
      },
    ],
    cost: {
      text: "Each setback adds structural transfers, extra roofing and waterproofing, and less efficient floors. We estimate about 2.5% of hard cost and 2% of rentable area for a typical building; this is an estimate, not a measured figure.",
      sources: [],
    },
    effect: { lines: { hard: 0.025 }, efficiency: 0.02 },
    appliesNote: "Every project.",
    reform: { label: "Simplify to a single base height and rear yard", share: 0.6 },
    removeLabel: "Replace envelope rules with a simple height limit",
    stance: "reform",
    stanceWhy:
      "Some envelope control protects light on narrow streets; the number of separate rules is what adds cost.",
    keepCase: ["Setbacks keep sunlight on sidewalks and in rear yards."],
    changeCase: [
      "Stacked envelope rules produce costly structures and smaller apartments for the same floor area.",
    ],
    confidence: "low",
    modeled: true,
  },
  {
    id: "dwelling-unit-factor",
    title: "Dwelling unit factor (minimum average unit size)",
    short:
      "Zoning caps the number of apartments by dividing floor area by 680, which blocks studio-heavy buildings.",
    category: "Zoning & land use",
    level: "City",
    enacted: "1961; set at 680 for most buildings in 2024",
    citation: "Zoning Resolution §23-52",
    history: [
      {
        text: "The zoning code limits how many homes a building may hold by dividing its residential floor area by a 'dwelling unit factor'. Older text varied it by district (870 in R3 and R4 districts, for instance). The current text, as amended by City of Yes in December 2024, applies 680 to most multifamily buildings and exempts qualifying senior housing, conversions and some other types.",
        sources: ["zr-23-52"],
      },
    ],
    cost: {
      text: "The cap only binds on buildings with many studios or small one-bedrooms, so our prototypes (about 900 gross square feet per home) are not affected. Where it binds it raises cost per home by forcing larger units.",
      sources: ["zr-23-52"],
    },
    effect: {},
    applies: () => false,
    appliesNote: "Binds only when average unit size falls below about 600 net square feet; not in our prototypes.",
    reform: { label: "Exempt buildings near transit", share: 1 },
    removeLabel: "Repeal the dwelling unit factor",
    stance: "remove",
    stanceWhy: "Unit mix should follow demand from single people and couples, not a zoning ratio.",
    keepCase: ["Supporters say it prevents too many tiny units and protects family-size apartments."],
    changeCase: ["Most new households in New York are one or two people."],
    confidence: "medium",
    modeled: false,
  },
  {
    id: "manufacturing-ban",
    title: "No housing in manufacturing districts",
    short:
      "Residential use is banned in M districts, which cover large swaths of waterfront and rail-adjacent land.",
    category: "Zoning & land use",
    level: "City",
    enacted: "1961",
    citation: "Zoning Resolution Article IV (manufacturing districts, use groups)",
    history: [
      {
        text: "The 1961 code separated uses strictly, mapping manufacturing districts where no new homes are allowed. As industry left, neighborhood rezonings (Williamsburg in 2005, Gowanus in 2021) converted some M districts, each needing years of ULURP.",
        sources: ["dcp-history"],
      },
    ],
    cost: {
      text: "This limits which land can hold housing at all, raising residential land prices citywide. It does not change the cost of a single project on residential land, so it is not in the calculator.",
      sources: [],
    },
    effect: {},
    applies: () => false,
    appliesNote: "Shapes land supply citywide rather than a single budget.",
    reform: { label: "Allow housing as of right in light-manufacturing districts", share: 1 },
    removeLabel: "Allow mixed use in most M districts",
    stance: "reform",
    stanceWhy: "Keep heavy industrial areas, but light-manufacturing districts could take housing without a rezoning.",
    keepCase: ["Industrial jobs need protected land; mixing uses brings conflicts over noise and trucks."],
    changeCase: ["Each conversion now needs a multi-year rezoning, keeping land scarce."],
    confidence: "medium",
    modeled: false,
  },
  {
    id: "bike-trees-refuse",
    title: "Bicycle parking, street trees and planting strips",
    short: "Required bike rooms for 10+ units, street trees and planting strips with every new building.",
    category: "Zoning & land use",
    level: "City",
    enacted: "2008 (street trees); 2009 (bicycle parking)",
    citation: "Zoning Resolution §25-80 (bicycle parking) and §26-41 (street tree planting)",
    applies: (c) => c.proto.units >= 10,
    history: [
      {
        text: "PlaNYC-era amendments required street trees along new buildings' frontages (2008) and indoor bicycle parking in new residential buildings with ten or more units (2009). Both were small, popular greening measures.",
        sources: ["dcp-history"],
      },
    ],
    cost: {
      text: "A bike room typically takes ground-floor space that could be a rentable unit or retail; with trees and planting strips we estimate about 0.3% of hard cost. Small but certain.",
      sources: [],
    },
    effect: { lines: { hard: 0.003 } },
    appliesNote: "Buildings with ten or more homes.",
    reform: { label: "Allow fees in lieu or wall-hung racks", share: 0.5 },
    removeLabel: "Make bike parking and planting optional",
    stance: "keep",
    stanceWhy: "The cost is small and the benefits are real.",
    keepCase: ["Bike storage and street trees are cheap amenities tenants value."],
    changeCase: ["Space rules are inflexible on tight lots."],
    confidence: "low",
    modeled: true,
  },

  // ───────────────────────────── Review & approvals ─────────────────────────────
  {
    id: "ulurp",
    title: "ULURP and Council member deference",
    short:
      "Any rezoning goes through a 7-month public review after years of pre-certification, and the local Council member effectively decides.",
    category: "Review & approvals",
    level: "City",
    enacted: "1975 (ULURP); 1989 (Council final vote)",
    citation: "NYC Charter §§197-c, 197-d",
    applies: needsReview,
    history: [
      {
        text: "Voters approved ULURP in the 1975 City Charter, after decades of urban renewal fights. It gave community boards and borough presidents formal advisory roles and the Board of Estimate the final vote.",
        sources: ["dcp-ulurp-evolution"],
      },
      {
        text: "In 1989 the U.S. Supreme Court struck down the Board of Estimate (Board of Estimate v. Morris). The new charter gave the City Council the final vote, and the custom of 'member deference' grew: the Council follows the local member, who can kill a project alone. The Citizens Housing and Planning Council testified in 2025 that rezonings fell after 1989 and that neighborhoods that resisted them added the least housing.",
        sources: ["dcp-ulurp-evolution", "chpc-charter"],
      },
      {
        text: "The Citizens Budget Commission studied 171 private rezoning applications filed from 2014 to 2017 and found a median of about two and a half years from filing to approval, 80% of it before the formal clock starts, adding 11–16% to development costs (up to $82,000 per unit in 2025 dollars).",
        sources: ["cbc-ulurp-2022", "cbc-3-proposals"],
      },
      {
        text: "In November 2025 voters approved Charter Proposals 2–4: a fast track at the Board of Standards and Appeals for publicly financed affordable housing, a 90-day Expedited Land Use Review (ELURP) for modest projects, and an Affordable Housing Appeals Board that can overturn Council rejections in low-production districts. The Council called the ballot language misleading.",
        sources: ["charter-commission-proposals", "ny1-ballot-2025", "council-ballot-statement", "enr-elurp"],
      },
    ],
    cost: {
      text: "For a market-rate project that needs a rezoning we count 18 months of pre-certification and review (the environmental piece is counted separately), land carried at the cost of equity through that time, hard costs escalating, plus about 10% of design and 40% of legal spending for the application itself.",
      sources: ["cbc-ulurp-2022", "cbc-3-proposals"],
    },
    effect: { preMonths: 18, lines: { design: 0.1, legal: 0.4 } },
    appliesNote: "Only projects that need a rezoning or special permit (switch on 'Needs a rezoning').",
    reform: {
      label: "End member deference; 90-day review and shot clocks for housing",
      share: 0.6,
    },
    removeLabel: "Replace discretionary rezonings with as-of-right zoning near transit",
    stance: "reform",
    stanceWhy:
      "Public review of big land-use changes is worth keeping; a single member's veto and open-ended pre-certification are not.",
    keepCase: [
      "ULURP was a hard-won response to top-down urban renewal that displaced whole neighborhoods.",
      "Community input can improve projects.",
    ],
    changeCase: [
      "A median two and a half years per private rezoning adds up to $82,000 a home.",
      "Member deference concentrates power in whoever can mobilize against a project.",
    ],
    geography:
      "The 2025 Affordable Housing Appeals Board and ELURP target the community districts that produced the least housing, which are disproportionately in Queens, Staten Island and the east Bronx.",
    recent: "Charter Proposals 2, 3 and 4 passed in November 2025 with 56–59% of the vote.",
    confidence: "medium",
    modeled: true,
  },
  {
    id: "ceqr",
    title: "Environmental review (CEQR / SEQRA)",
    short:
      "Discretionary approvals require environmental review; since May 2026 most housing up to 250 units (500 in dense districts) is exempt.",
    category: "Review & approvals",
    level: "State",
    enacted: "1975 (SEQRA); 1977 (CEQR, Executive Order 91)",
    citation: "ECL Article 8 (SEQRA); 62 RCNY Ch. 5 and 43 RCNY Ch. 6 (CEQR)",
    applies: needsReview,
    history: [
      {
        text: "After the federal NEPA (1969), New York City adopted its own environmental review of major projects in 1973 (Executive Order 87). The state passed SEQRA in 1975, and in 1977 Executive Order 91 created City Environmental Quality Review, run by City Planning and the Department of Environmental Protection.",
        sources: ["wiki-ceqr", "oec-ceqr-laws"],
      },
      {
        text: "Over time environmental impact statements for rezonings grew to thousands of pages and often more than 18 months, even for modest projects, and became a frequent basis for lawsuits. The Citizens Budget Commission argued in 2026 that exempting modest residential development would make housing cheaper and faster at no cost to government.",
        sources: ["cbc-seqr-testimony", "cozen-seqra-2026"],
      },
      {
        text: "The FY2027 state budget, signed in late May 2026 as part of Governor Hochul's 'Let Them Build' agenda, exempted housing up to 250 units (500 in medium- and high-density districts) on previously disturbed land from environmental review, required exemption decisions within 120 days and set two-year deadlines for any remaining EIS. The state estimated reviews had delayed housing by up to two years and added about $82,000 a unit in the city.",
        sources: ["nyconstructionreport-fy27", "co-fy27-budget", "cozen-seqra-2026"],
      },
    ],
    cost: {
      text: "Our prototypes all fall under the new exemption, so the remaining cost is about four months waiting for the exemption determination and some consultant work (about 5% of design). Larger projects outside the exemption still face a full EIS of up to two years.",
      sources: ["cozen-seqra-2026"],
    },
    effect: { preMonths: 4, lines: { design: 0.05 } },
    appliesNote: "Only projects needing a discretionary approval (rezoning); as-of-right projects skip it.",
    reform: { label: "Decide exemptions in 30 days", share: 0.75 },
    removeLabel: "Exempt all housing on previously developed urban land",
    stance: "keep",
    stanceWhy:
      "The 2026 reform already fixed most of the problem for housing. The remaining review covers the largest projects, where it is most defensible.",
    keepCase: ["Large projects can strain infrastructure and should disclose impacts."],
    changeCase: ["The review was used to delay infill housing that is good for the environment."],
    recent: "Exemption for most housing passed in the FY2027 state budget (May 2026).",
    confidence: "medium",
    modeled: true,
  },
  {
    id: "landmarks",
    title: "Landmarks Preservation Commission review",
    short:
      "In historic districts, new buildings need a Certificate of Appropriateness: hearings, redesigns and costlier materials.",
    category: "Review & approvals",
    level: "City",
    enacted: "1965",
    citation: "NYC Administrative Code Title 25, Chapter 3 (Landmarks Law)",
    applies: (c) => c.site.historic,
    history: [
      {
        text: "Demolition of McKim, Mead & White's Pennsylvania Station began in October 1963 and galvanized the preservation movement. Mayor Wagner signed the Landmarks Law in April 1965, creating the Landmarks Preservation Commission.",
        sources: ["amny-landmarks-law"],
      },
      {
        text: "By 2014 only 3.4% of the city's lots were landmarked or in historic districts, but 27% of Manhattan's were. Furman found historic districts are as densely populated as surrounding areas, but they add little new housing because new buildings and additions must pass design review.",
        sources: ["furman-landmarks-50"],
      },
    ],
    cost: {
      text: "Commission review typically adds hearings and redesign cycles; we count six months of delay and about 4% more hard cost for required materials and details. Estimates based on practitioner reports; they vary widely by project.",
      sources: ["furman-landmarks-50"],
    },
    effect: { preMonths: 6, lines: { hard: 0.04, design: 0.1 } },
    appliesNote: "Sites in historic districts (switch on 'In a historic district').",
    reform: {
      label: "Staff-level approval and a 90-day clock for non-contributing and vacant lots",
      share: 0.5,
    },
    removeLabel: "End design review for new buildings on non-landmark lots",
    stance: "reform",
    stanceWhy:
      "Protecting individual landmarks is worth it; slowing every new building in a district of 27% of Manhattan is not.",
    keepCase: [
      "Historic districts preserve architecture, tourism value and neighborhood character.",
    ],
    changeCase: [
      "Districts cover over a quarter of Manhattan's lots, the most expensive and transit-rich land.",
      "City of Yes even barred accessory dwelling units in historic districts.",
    ],
    geography:
      "Concentrated in Manhattan (27% of lots) and brownstone Brooklyn (Brooklyn Heights, Park Slope, Fort Greene, Prospect Heights). Rare in the Bronx, Queens and Staten Island.",
    confidence: "low",
    modeled: true,
  },
  {
    id: "dob-permitting",
    title: "Building permits and multi-agency sign-offs",
    short:
      "Plan review at Buildings plus separate approvals from FDNY, DEP (water, sewer, site connection), DOT (curb cuts, builders pavement plans) and others.",
    category: "Review & approvals",
    level: "City",
    enacted: "1938 code onward; DOB NOW since 2016",
    citation: "NYC Administrative Code Title 28 (Construction Codes) and agency rules",
    history: [
      {
        text: "Every new building needs DOB approval of architectural, structural, mechanical and plumbing plans, and before occupancy a certificate of occupancy that depends on sign-offs from many agencies.",
        sources: ["dob-mmr-2026"],
      },
      {
        text: "DOB's average time from filing to approval rose from 8.3 days in 2020 to 20.3 in 2025 and 25.4 days in fiscal 2026, and first plan review on new buildings went from 6.3 to 9.4 days. Most of that time is spent on rounds of objections and corrections, which the department says take applicants three times as long as its own reviews. The State Comptroller blamed staffing and budget constraints.",
        sources: ["dob-mmr-2026", "osc-dob-audit-2026"],
      },
    ],
    cost: {
      text: "Official review clocks are short, but the full permitting path (objections, agency sign-offs, sewer connection proposals, builders pavement plans, final certificate of occupancy) commonly takes months. We count five months before construction and half the permit and expediting budget.",
      sources: ["dob-mmr-2026", "osc-dob-audit-2026"],
    },
    effect: { preMonths: 5, lines: { permits: 0.5 } },
    appliesNote: "Every project.",
    reform: {
      label: "Professional self-certification, parallel agency review and a 30-day shot clock",
      share: 0.6,
    },
    removeLabel: "Self-certification by licensed professionals with audits",
    stance: "reform",
    stanceWhy: "Safety review stays; serial reviews by agencies that don't talk to each other don't need to.",
    keepCase: ["Plan review catches safety problems before they are built."],
    changeCase: [
      "Review times have tripled since 2020.",
      "Applicants spend most of the time answering objections across separate agencies.",
    ],
    confidence: "low",
    modeled: true,
  },
  {
    id: "utility-connections",
    title: "Utility service connections (Con Edison)",
    short:
      "New service needs Con Edison design, equipment and street work on the utility's schedule; delays can hold a finished building empty.",
    category: "Review & approvals",
    level: "Utility",
    enacted: "Public Service Law; Con Edison tariffs",
    citation: "NY Public Service Law; Con Edison Schedule for Electricity Service (PSC No. 10)",
    history: [
      {
        text: "Con Edison is a regulated monopoly; the state Public Service Commission sets its rules and rates, but not firm deadlines for new service. Developers report months-long waits and costly requirements, as when Phipps Houses was told to trench up to 300 yards across a former NYCHA campus in Forest Hills to reach power for an affordable project.",
        sources: ["qchron-coned-2019"],
      },
      {
        text: "All-electric new buildings under Local Law 154 need larger electrical service, which can mean new transformer vaults and longer lead times.",
        sources: ["sprlaw-ll154"],
      },
    ],
    cost: {
      text: "We count three months of delay to the start or to occupancy. Estimate from developer reports; it varies widely by block and grid capacity.",
      sources: ["qchron-coned-2019"],
    },
    effect: { preMonths: 3 },
    appliesNote: "Every project.",
    reform: { label: "PSC-ordered connection deadlines with penalties", share: 0.6 },
    removeLabel: "Binding connection deadlines and developer-built service with utility inspection",
    stance: "reform",
    stanceWhy: "The utility should be held to deadlines like everyone else in the process.",
    keepCase: ["Grid safety and reliability need utility control of connections."],
    changeCase: ["Unbounded waits leave finished homes empty while interest accrues."],
    confidence: "low",
    modeled: true,
  },
  {
    id: "e-designation",
    title: "E-designations and environmental remediation",
    short:
      "Lots flagged during rezonings for hazardous materials, noise or air quality need Office of Environmental Remediation sign-off before permits.",
    category: "Review & approvals",
    level: "City",
    enacted: "1980s (E-designations); 2008 (Office of Environmental Remediation)",
    citation: "Zoning Resolution §11-15; 15 RCNY Ch. 24",
    applies: needsReview,
    history: [
      {
        text: "When the city rezones industrial areas, it places 'E-designations' on lots with possible contamination or noise problems. The Office of Environmental Remediation must issue a Notice to Proceed before DOB grants permits, and developers pay for testing and cleanup even when contamination came from elsewhere.",
        sources: ["globest-edesig"],
      },
    ],
    cost: {
      text: "Typical work includes soil testing, a vapor barrier, sub-slab depressurization and air monitoring. We estimate about 1% of hard cost and two months of sign-off time.",
      sources: ["globest-edesig"],
    },
    effect: { preMonths: 2, lines: { hard: 0.01 } },
    appliesNote: "Rezoned sites, where E-designations are usually placed.",
    reform: { label: "Fixed OER review deadlines", share: 0.4 },
    removeLabel: "Rely on state brownfield rules only",
    stance: "keep",
    stanceWhy: "Cleaning contaminated soil under homes is a real health protection.",
    keepCase: ["Residents should not live over toxic soil or vapors."],
    changeCase: ["Review timing is open-ended."],
    geography:
      "Common in rezoned former industrial areas: Gowanus, Long Island City, Greenpoint-Williamsburg, Port Morris, Jamaica.",
    confidence: "low",
    modeled: true,
  },
  {
    id: "conh",
    title: "Certification of No Harassment",
    short:
      "Owners of buildings with tenant-harassment findings must prove no harassment before demolition or major work permits.",
    category: "Review & approvals",
    level: "City",
    enacted: "1974 (Special Clinton District); 2018 pilot; expanded 2021",
    citation: "NYC Administrative Code §27-2093.1 (Local Law 1 of 2018, as amended)",
    applies: () => false,
    history: [
      {
        text: "The Certification of No Harassment began in the Special Clinton District. A 2018 pilot extended it to 11 community districts in northern Manhattan, the Bronx, north Brooklyn and the Rockaways, and in October 2021 the Council expanded it citywide for buildings with harassment findings, with a guaranteed payment of at least $5,000 to tenants when an application is denied.",
        sources: ["anhd-conh", "bisnow-conh"],
      },
    ],
    cost: {
      text: "It matters only when a project demolishes or guts an occupied building, so vacant-lot prototypes are not affected.",
      sources: ["bisnow-conh"],
    },
    effect: {},
    appliesNote: "Only when demolishing or altering certain occupied buildings.",
    reform: null,
    removeLabel: "Repeal the certification",
    stance: "keep",
    stanceWhy: "It targets owners found to have harassed tenants.",
    keepCase: ["It deters forcing tenants out to clear sites."],
    changeCase: ["Broad screening criteria can tie up innocent buyers of a building."],
    confidence: "medium",
    modeled: false,
  },

  // ───────────────────────────── Building code & design ─────────────────────────────
  {
    id: "two-stairs",
    title: "Two-stair requirement for mid-rise apartments",
    short:
      "Apartment buildings above small floor plates need two exit stairs, which forces double-loaded corridors and fewer, smaller family units.",
    category: "Building code & design",
    level: "City",
    enacted: "1968 code; current NYC Building Code §1006",
    citation: "NYC Building Code §1006.3 (single exits)",
    applies: lowRise,
    history: [
      {
        text: "Most of the world builds four- to six-story apartments around a single stair. U.S. codes require two in most cases. New York allows a single exit only in very small buildings, unlike Seattle, which has allowed single-stair buildings up to six stories for decades.",
        sources: ["pew-single-stair", "intro-261"],
      },
      {
        text: "Pew found in 2025 that fire death rates in modern single-stair buildings of four to six stories in New York City matched other residential buildings from 2012 to 2024, and that a missing second stair played no role in the four deaths it found across New York and Seattle.",
        sources: ["pew-single-stair"],
      },
      {
        text: "Council bills (Int. 794-2022, Int. 261-2024) to allow single-stair buildings up to six stories died at session end. The state ordered a single-stair study due July 1, 2026 (Executive Law §373-b), and S10501, introduced in May 2026, would allow them up to six stories in cities over one million.",
        sources: ["intro-261", "exec-law-373b", "nysenate-s10501"],
      },
    ],
    cost: {
      text: "A second stair and the corridor connecting the two take roughly 5–7% of a small floor plate and add construction. We count 2% of hard cost and 6% more homes from the same floor area on a small lot (3% on a mid-rise floor plate).",
      sources: ["pew-single-stair"],
    },
    effect: (c) => ({ lines: { hard: 0.02 }, efficiency: c.proto.id === "small" ? 0.06 : 0.03 }),
    appliesNote: "Buildings of six stories or fewer.",
    reform: { label: "Allow one stair up to four stories", share: 0.5 },
    removeLabel: "Allow one sprinklered stair up to six stories",
    stance: "remove",
    stanceWhy:
      "The safety evidence from New York's own existing buildings and from Europe supports single stairs in sprinklered mid-rises.",
    keepCase: ["A second stair is a backup if smoke fills the first."],
    changeCase: [
      "Pew found no safety difference in sprinklered single-stair buildings.",
      "Single-stair layouts allow cross-ventilated, family-size units on small lots.",
    ],
    recent: "State study due July 2026; S10501 pending in the Senate Housing Committee.",
    confidence: "medium",
    modeled: true,
  },
  {
    id: "construction-type",
    title: "Limits on wood-frame and mass-timber construction",
    short:
      "The code effectively requires concrete or steel for most apartment buildings and caps mass timber at 85 feet.",
    category: "Building code & design",
    level: "City",
    enacted: "Fire limits since the 19th century; 2022 code (mass timber to 85 ft)",
    citation: "NYC Building Code Chapters 5–6 (construction types, height and area limits)",
    applies: lowRise,
    history: [
      {
        text: "New York has restricted combustible construction since its great fires, and its building code still largely requires concrete and steel for apartment buildings, mostly barring the wood-frame 'five-over-one' buildings common elsewhere in the country.",
        sources: ["vitalcity-campion-2025"],
      },
      {
        text: "The 2022 NYC Building Code allowed mass timber (cross-laminated timber) for the first time, but only up to 85 feet, about six or seven stories, while the 2021 International Building Code allows up to 270 feet. A September 2026 Assembly bill (A11674) would direct the city to adopt the IBC mass timber types.",
        sources: ["dob-mass-timber", "verticalurbanism-timber", "nysenate-a11674"],
      },
    ],
    cost: {
      text: "Light-frame wood over a concrete podium is often 10–15% cheaper than an all-concrete mid-rise. We count 8% of hard cost for buildings of six stories or fewer; estimate.",
      sources: ["vitalcity-campion-2025"],
    },
    effect: { lines: { hard: 0.08 } },
    appliesNote: "Buildings of six stories or fewer, where wood or timber would be viable.",
    reform: {
      label: "Allow sprinklered light-frame to five stories and mass timber to IBC heights",
      share: 0.75,
    },
    removeLabel: "Adopt IBC construction-type limits as written",
    stance: "reform",
    stanceWhy: "Fire safety in a dense city justifies caution, but modern sprinklered wood buildings are allowed in most of the country.",
    keepCase: ["Dense blocks and party walls raise the stakes of fire spread."],
    changeCase: ["Concrete-only mid-rises are a large part of New York's cost premium."],
    confidence: "low",
    modeled: true,
  },
  {
    id: "plumbing-materials",
    title: "Metal plumbing pipe requirements",
    short: "The plumbing code requires metal piping in most taller buildings and limits PEX and CPVC.",
    category: "Building code & design",
    level: "City",
    enacted: "Long-standing; 2004 state veto; NYC Plumbing Code §605",
    citation: "NYC Plumbing Code §605 (materials for water distribution)",
    history: [
      {
        text: "New York's plumbing code requires metal piping in buildings of six or more stories, and DOB bulletins limit CPVC for water distribution. Plastics like PEX and CPVC are standard in most of the country.",
        sources: ["vitalcity-campion-2025", "dob-bb-cpvc"],
      },
      {
        text: "In 2004 the legislature passed a bill to restrict plastic pipe statewide; Governor Pataki vetoed it after builders argued it would raise housing costs.",
        sources: ["pmmag-plastic-pipe-veto"],
      },
    ],
    cost: {
      text: "Plumbing is roughly 8–10% of hard cost, and copper and steel cost more to buy and install than plastic. We estimate 1.5% of hard cost.",
      sources: ["vitalcity-campion-2025"],
    },
    effect: { lines: { hard: 0.015 } },
    appliesNote: "Every project (taller buildings most).",
    reform: { label: "Allow PEX and CPVC in sprinklered buildings up to 12 stories", share: 0.6 },
    removeLabel: "Adopt the International Plumbing Code's material list",
    stance: "remove",
    stanceWhy: "These materials are used safely across the country.",
    keepCase: ["The plumbers' union argues metal pipe is more durable and fire-safe."],
    changeCase: ["Plastic pipe is standard nationally and installs faster."],
    confidence: "low",
    modeled: true,
  },
  {
    id: "electrical-wiring",
    title: "Metal conduit and armored cable requirements",
    short: "The electrical code requires specific metal conduits and armored cable where most states allow plastic-sheathed cable.",
    category: "Building code & design",
    level: "City",
    enacted: "NYC Electrical Code (amended NEC)",
    citation: "NYC Electrical Code, local amendments to NEC Article 334",
    history: [
      {
        text: "The NYC Electrical Code amends the National Electrical Code to require specific metal conduits and armored cable in most buildings, where most jurisdictions allow nonmetallic sheathed cable in apartments.",
        sources: ["vitalcity-campion-2025"],
      },
    ],
    cost: {
      text: "Electrical work is about 10–12% of hard cost; metal raceways take more labor. We estimate 1.5% of hard cost.",
      sources: ["vitalcity-campion-2025"],
    },
    effect: { lines: { hard: 0.015 } },
    appliesNote: "Every project.",
    reform: { label: "Allow NM cable inside units of sprinklered buildings", share: 0.7 },
    removeLabel: "Adopt the National Electrical Code as written",
    stance: "reform",
    stanceWhy: "Conduit in shared spaces is reasonable; inside apartments it is a cost with little benefit.",
    keepCase: ["Metal conduit protects wiring in dense, long-lived buildings."],
    changeCase: ["NM cable inside units is standard nationally."],
    confidence: "low",
    modeled: true,
  },
  {
    id: "accessibility",
    title: "Accessibility beyond federal law",
    short:
      "New York's code makes every unit in new multifamily buildings accessible or adaptable, beyond the federal Fair Housing Act.",
    category: "Building code & design",
    level: "City",
    enacted: "1987 (Local Law 58); 2008 and 2014 codes",
    citation: "Local Law 58 of 1987; NYC Building Code Chapter 11 (ICC A117.1)",
    history: [
      {
        text: "Local Law 58 of 1987 required that most units in new buildings of three or more apartments be accessible or readily adaptable for people with disabilities, going beyond the federal Fair Housing Act (1988). Critics at the Manhattan Institute called it a serious hurdle for new construction.",
        sources: ["ll58-1987", "mi-ll58"],
      },
      {
        text: "The 2008 and 2014 codes replaced Local Law 58 with Building Code Chapter 11 based on ICC A117.1, aligning with federal law while keeping some stricter local rules.",
        sources: ["ll58-1987"],
      },
    ],
    cost: {
      text: "Larger bathrooms, kitchens and clearances use floor area. We estimate about 1% of hard cost.",
      sources: [],
    },
    effect: { lines: { hard: 0.01 } },
    appliesNote: "Every project.",
    reform: { label: "Align exactly with federal Fair Housing Act standards", share: 0.5 },
    removeLabel: "Federal minimum only",
    stance: "keep",
    stanceWhy: "An aging city needs accessible homes, and the cost is modest.",
    keepCase: ["One in five New Yorkers will be over 65 soon; adaptable units let people stay put."],
    changeCase: ["Some local requirements exceed federal ones without clear benefit."],
    confidence: "low",
    modeled: true,
  },
  {
    id: "fire-protection",
    title: "Sprinklers, fire alarms and high-rise fire systems",
    short: "Sprinklers, standpipes, alarms and, in tall buildings, fire command centers and pressurized stairs.",
    category: "Building code & design",
    level: "City",
    enacted: "1999 (residential sprinklers, Local Law 10); 2008 code",
    citation: "NYC Building Code Chapter 9; NYC Fire Code",
    history: [
      {
        text: "New York required sprinklers in new residential buildings of four or more units in 1999 after a series of deadly fires. High-rise buildings also need standpipes, fire command stations and smoke control.",
        sources: [],
      },
    ],
    cost: {
      text: "Fire protection is roughly 2–3% of hard cost. It saves lives and is part of why single stairs are safe, so we list it as a cost to keep.",
      sources: ["pew-single-stair"],
    },
    effect: { lines: { hard: 0.025 } },
    appliesNote: "Every project.",
    reform: null,
    removeLabel: "Remove sprinkler requirements",
    stance: "keep",
    stanceWhy: "This is the cheapest life-safety investment in the building, and it enables other reforms.",
    keepCase: ["Sprinklers are why modern fires rarely kill.", "They make single-stair reform safe."],
    changeCase: [],
    confidence: "medium",
    modeled: true,
  },
  {
    id: "light-air-rooms",
    title: "Light, air and minimum room-size rules",
    short:
      "The Multiple Dwelling Law and Housing Maintenance Code set window, court and room-size minimums that shape every floor plan.",
    category: "Building code & design",
    level: "State",
    enacted: "1901 (Tenement House Act); 1929 (Multiple Dwelling Law)",
    citation: "Multiple Dwelling Law Articles 2–4; NYC Housing Maintenance Code §27-2074 et seq.",
    history: [
      {
        text: "The 1901 Tenement House Act ended dark 'dumbbell' tenements by requiring windows in every room and courtyards for air. The 1929 Multiple Dwelling Law carried those rules forward, and they still govern window sizes, courts and minimum room sizes.",
        sources: ["dcp-history"],
      },
    ],
    cost: {
      text: "Rules like outer-court and window requirements cut into usable floor area, especially on narrow lots. We estimate 2% more homes from the same floor area under modernized rules.",
      sources: [],
    },
    effect: { efficiency: 0.02 },
    appliesNote: "Every project.",
    reform: { label: "Modern performance standards for light and ventilation", share: 0.6 },
    removeLabel: "Replace MDL light-and-air rules with the IBC's",
    stance: "reform",
    stanceWhy: "The goals are right, but 1901 prescriptions don't fit mechanical ventilation and modern glazing.",
    keepCase: ["Light and air rules ended the deadliest housing in the city's history."],
    changeCase: ["Prescriptive court sizes waste floor area on small lots."],
    confidence: "low",
    modeled: true,
  },
  {
    id: "sro-ban",
    title: "Ban on new single-room occupancy (shared) housing",
    short:
      "New rooming-house and SRO units, once 200,000 strong, have effectively been banned since 1955.",
    category: "Building code & design",
    level: "City",
    enacted: "1955",
    citation: "Multiple Dwelling Law and NYC Housing Maintenance Code (rooming unit rules)",
    applies: () => false,
    history: [
      {
        text: "City regulators banned new single-room occupancy construction in 1955, believing SROs subjected tenants to substandard conditions, and barred converting houses into rooming units. The city went from about 200,000 SROs in 1955 to under 40,000 by 1995.",
        sources: ["richmondfed-sro", "nextcity-sro"],
      },
      {
        text: "Pew argued in 2026 that the loss of SROs nationally helped drive the rise in homelessness. Illegal SROs have filled some of the gap.",
        sources: ["pew-sro-2026", "nextcity-sro"],
      },
    ],
    cost: {
      text: "This removes the cheapest type of housing from the market rather than raising the cost of an apartment building, so it is not in the calculator.",
      sources: [],
    },
    effect: {},
    appliesNote: "Determines which housing types are legal rather than the cost of an apartment.",
    reform: { label: "Legalize new shared housing with private rooms and shared kitchens", share: 1 },
    removeLabel: "Legalize SROs and rooming units",
    stance: "reform",
    stanceWhy: "Modern shared housing with safety standards would be the lowest-rent new housing the city could add.",
    keepCase: ["The old SROs had real safety and sanitation problems."],
    changeCase: ["A single room at a few hundred dollars a week beats a shelter bed."],
    confidence: "medium",
    modeled: false,
  },

  // ───────────────────────────── Energy & environment ─────────────────────────────
  {
    id: "energy-code",
    title: "NYC Energy Conservation Code (stretch code)",
    short: "Insulation, window and mechanical efficiency standards stricter than the national model code.",
    category: "Energy & environment",
    level: "City",
    enacted: "2010; updated every three years",
    citation: "NYC Energy Conservation Code (NYCECC)",
    history: [
      {
        text: "New York adopted its own energy code in 2010 and has updated it on a cycle, adding stretch provisions ahead of the national model code to meet the city's climate goals.",
        sources: ["wiki-ll97"],
      },
    ],
    cost: {
      text: "Better envelopes and efficient systems cost more up front and save on bills. We estimate 2% of hard cost.",
      sources: [],
    },
    effect: { lines: { hard: 0.02 } },
    appliesNote: "Every project.",
    reform: { label: "Hold at the national model code for three years", share: 0.5 },
    removeLabel: "Adopt the national model energy code only",
    stance: "keep",
    stanceWhy: "Efficient envelopes pay back over a building's life and cut tenant bills.",
    keepCase: ["Energy savings accrue to tenants for decades."],
    changeCase: ["Each code cycle adds cost before the last one is absorbed."],
    confidence: "low",
    modeled: true,
  },
  {
    id: "ll154-all-electric",
    title: "All-electric new buildings (Local Law 154)",
    short: "New buildings cannot burn gas or oil: heat pumps for heat and hot water, induction cooking.",
    category: "Energy & environment",
    level: "City",
    enacted: "2021",
    citation: "Local Law 154 of 2021",
    history: [
      {
        text: "The Council passed Local Law 154 on December 15, 2021 (40–7), and Mayor de Blasio signed it a week later. It bars fuels emitting over 25 kg of CO₂ per million BTU, in effect banning gas in new buildings under seven stories from January 2024 and taller ones from July 2027.",
        sources: ["sprlaw-ll154"],
      },
      {
        text: "A federal court upheld the ban. The state later passed its own all-electric requirement for new buildings; exemptions and litigation continue.",
        sources: ["barclay-gasban"],
      },
    ],
    cost: {
      text: "Studies disagree. Heat pumps avoid gas piping and boilers but need larger electric service. We count about 0.5% of hard cost, with low confidence.",
      sources: ["sprlaw-ll154"],
    },
    effect: { lines: { hard: 0.005 } },
    appliesNote: "Every new building.",
    reform: null,
    removeLabel: "Allow gas in new buildings",
    stance: "keep",
    stanceWhy: "The construction cost is small, and buildings built now will run for 50+ years.",
    keepCase: ["New gas hookups lock in emissions and indoor air pollution for decades."],
    changeCase: ["Bigger electric service can add utility delays."],
    confidence: "low",
    modeled: true,
  },
  {
    id: "ll97",
    title: "Building emissions caps (Local Law 97)",
    short: "Buildings over 25,000 square feet face annual carbon caps and fines.",
    category: "Energy & environment",
    level: "City",
    enacted: "2019 (Climate Mobilization Act)",
    citation: "Local Law 97 of 2019",
    applies: (c) => c.proto.gsf > 25_000,
    history: [
      {
        text: "Local Law 97 passed in April 2019 as part of the Climate Mobilization Act. It caps emissions for buildings over 25,000 square feet, aiming for 40% cuts by 2030 and 80% by 2050, with limits starting in 2024.",
        sources: ["wiki-ll97"],
      },
      {
        text: "Urban Green Council put compliance at $16.6 billion to $24.3 billion over a decade for existing buildings. Critics argue the caps discourage new development and ignore building density.",
        sources: ["bisnow-ll97-cost", "vitalcity-ll97"],
      },
    ],
    cost: {
      text: "An all-electric new building already meets the 2030 caps, so the cost to new construction is mostly reporting. We count $50 per unit per year.",
      sources: ["wiki-ll97"],
    },
    effect: { opexPerUnit: 50 },
    appliesNote: "Buildings over 25,000 square feet.",
    reform: null,
    removeLabel: "Exempt new construction",
    stance: "keep",
    stanceWhy: "New all-electric buildings comply easily; the burden falls on existing buildings.",
    keepCase: ["Buildings are about two-thirds of the city's emissions."],
    changeCase: ["Caps per square foot penalize dense buildings."],
    confidence: "medium",
    modeled: true,
  },
  {
    id: "sustainable-roofs",
    title: "Solar or green roof mandate (Local Laws 92 and 94)",
    short: "New buildings must cover available roof area with solar panels or a green roof.",
    category: "Energy & environment",
    level: "City",
    enacted: "2019",
    citation: "Local Laws 92 and 94 of 2019",
    history: [
      {
        text: "Part of the 2019 Climate Mobilization Act, Local Laws 92 and 94 took effect November 15, 2019. They require a 'sustainable roofing zone' on 100% of available roof space of new buildings and major roof replacements: solar, a green roof, or both.",
        sources: ["ll92-94-brief"],
      },
      {
        text: "Lawyers at Duane Morris warned the laws would likely increase construction costs; the city offered property tax abatements of $5.23 per square foot of green roof ($15 in priority districts).",
        sources: ["duanemorris-roofs", "ll92-94-brief"],
      },
    ],
    cost: {
      text: "Green roofs need structure, waterproofing and soil; solar needs racking and wiring. We estimate 0.6% of hard cost.",
      sources: ["duanemorris-roofs"],
    },
    effect: { lines: { hard: 0.006 } },
    appliesNote: "Every new building.",
    reform: { label: "Solar-ready roof or a payment in lieu", share: 0.5 },
    removeLabel: "Make sustainable roofs optional",
    stance: "reform",
    stanceWhy: "Solar-ready roofs capture most of the benefit at a fraction of the cost.",
    keepCase: ["Green roofs absorb stormwater and cut heat."],
    changeCase: ["Roof space competes with mechanical equipment and amenities."],
    confidence: "low",
    modeled: true,
  },
  {
    id: "bird-glass",
    title: "Bird-friendly glass (Local Law 15)",
    short: "Patterned or treated glass on 90% of the facade up to 75 feet.",
    category: "Energy & environment",
    level: "City",
    enacted: "2020 (effective January 2021)",
    citation: "Local Law 15 of 2020",
    history: [
      {
        text: "Local Law 15 of 2020 requires bird-safe materials on 90% of a new building's facade up to 75 feet. Estimates of the premium run from 3% for tinted glass to 50% for specialty glass; one affordable project at Willets Point expected about $2 million in costs, and REBNY asked for exemptions for affordable housing.",
        sources: ["ll15-2020", "inman-birdglass", "trd-birds-2026"],
      },
    ],
    cost: {
      text: "Glazing is a modest share of a masonry mid-rise and larger for a glassy tower. We estimate 0.4% of hard cost (0.8% for towers).",
      sources: ["inman-birdglass"],
    },
    effect: (c) => ({ lines: { hard: c.proto.id === "tower" ? 0.008 : 0.004 } }),
    appliesNote: "Every new building.",
    reform: { label: "Exempt affordable and mostly-masonry residential buildings", share: 0.5 },
    removeLabel: "Voluntary bird-safe standards",
    stance: "reform",
    stanceWhy: "Glassy towers are the problem; masonry apartment buildings with ordinary windows are not.",
    keepCase: ["Glass collisions kill an estimated 90,000–230,000 birds a year in the city."],
    changeCase: ["It adds cost to affordable buildings with small windows."],
    confidence: "low",
    modeled: true,
  },
  {
    id: "stormwater",
    title: "Unified Stormwater Rule",
    short: "Sites disturbing 20,000 square feet or adding 5,000 of impervious surface must detain and retain stormwater.",
    category: "Energy & environment",
    level: "City",
    enacted: "2022",
    citation: "15 RCNY Chapter 19.1 (DEP Unified Stormwater Rule)",
    applies: (c) => c.proto.id === "tower",
    history: [
      {
        text: "DEP's Unified Stormwater Rule took effect in February 2022, requiring sites over the thresholds to manage stormwater on site with a retention-first approach and to file stormwater pollution prevention plans. By May 2025 DEP said over 1,400 sites were complying.",
        sources: ["sprlaw-stormwater", "mgmclaren-stormwater"],
      },
    ],
    cost: {
      text: "Engineers report larger detention tanks and more space for them. We estimate 0.5% of hard cost on larger sites.",
      sources: ["mgmclaren-stormwater"],
    },
    effect: { lines: { hard: 0.005 } },
    appliesNote: "Larger sites (our high-rise prototype).",
    reform: null,
    removeLabel: "Return to pre-2022 detention rules",
    stance: "keep",
    stanceWhy: "Combined sewer overflows are a real problem and the cost is small.",
    keepCase: ["Storm runoff sends raw sewage into the harbor."],
    changeCase: ["Detention tanks use valuable cellar space."],
    confidence: "low",
    modeled: true,
  },
  {
    id: "flood-code",
    title: "Flood-resistant construction (Appendix G)",
    short: "In the floodplain, living space must sit above the design flood elevation, with flood-proofed lower floors.",
    category: "Energy & environment",
    level: "City",
    enacted: "1983; strengthened 2013 after Hurricane Sandy",
    citation: "NYC Building Code Appendix G",
    applies: (c) => c.site.flood,
    history: [
      {
        text: "Appendix G sets the design flood elevation at FEMA's base flood elevation plus one to two feet of freeboard (one foot for multifamily). Since 2017 it uses the more restrictive of FEMA's 2007 and preliminary 2015 maps. The 2021 Zoning for Coastal Flood Resiliency text lets buildings measure height from the flood elevation so they don't lose floors.",
        sources: ["dcp-flood-zfr", "dcp-flood-text"],
      },
    ],
    cost: {
      text: "Raised ground floors, flood-proofing and relocated mechanical rooms. We estimate 3% of hard cost.",
      sources: ["dcp-flood-zfr"],
    },
    effect: { lines: { hard: 0.03 } },
    appliesNote: "Sites in the 1% annual-chance floodplain (switch on 'In the floodplain').",
    reform: null,
    removeLabel: "Repeal Appendix G",
    stance: "keep",
    stanceWhy: "Sandy showed what flooding does to buildings and residents; this protects both and lowers flood insurance.",
    keepCase: ["Flood-resistant buildings protect tenants and lower insurance premiums."],
    changeCase: [],
    geography:
      "Rockaway, Coney Island, Red Hook, the Lower Manhattan waterfront, Howard Beach, the east Bronx shore and Staten Island's East and South Shores.",
    confidence: "low",
    modeled: true,
  },

  // ───────────────────────────── Construction site, labor & insurance ─────────────────────────────
  {
    id: "scaffold-law",
    title: "Scaffold Law (absolute liability for falls)",
    short:
      "Owners and contractors are fully liable for any gravity-related worker injury, even when the worker was partly at fault. New York is the only state left with this rule.",
    category: "Construction site, labor & insurance",
    level: "State",
    enacted: "1885",
    citation: "NY Labor Law §§240, 241",
    history: [
      {
        text: "The legislature enacted the Scaffold Law in 1885, before workers' compensation or OSHA existed, to protect workers falling from scaffolds and ladders. Courts read it as absolute liability: owners and contractors pay in full even if the worker's own conduct contributed.",
        sources: ["wiki-scaffold"],
      },
      {
        text: "Illinois repealed its similar Structural Work Act in 1995, leaving New York alone. Contractors and minority- and women-owned firms lobbied in 2013 for a comparative-negligence standard; a 2018 federal bill by Rep. John Faso to deny funding to projects under absolute liability stalled in the House.",
        sources: ["wiki-scaffold"],
      },
      {
        text: "Brokers say the law makes New York construction liability rates steep compared with neighboring states, with high deductibles and few insurers. A Rockefeller Institute study put related insurance costs at $785 million a year; the Citizens Budget Commission's Sean Campion cites Rockefeller estimates that it raises total development costs by at least 7%. Construction unions reject that research.",
        sources: ["businessinsurance-scaffold", "vitalcity-campion-2025"],
      },
    ],
    cost: {
      text: "General liability and wrap-up insurance on New York projects runs well above other states. We put total project insurance at 9% of hard cost and attribute about 65% of it to absolute liability, roughly 3% of total cost: below the 7% figure critics cite.",
      sources: ["vitalcity-campion-2025", "businessinsurance-scaffold"],
    },
    effect: { lines: { insurance: 0.65 } },
    appliesNote: "Every project.",
    reform: { label: "Comparative negligence only where the worker ignored provided safety gear", share: 0.6 },
    removeLabel: "Replace absolute liability with comparative negligence, as in every other state",
    stance: "remove",
    stanceWhy:
      "Workers keep the right to sue; juries would weigh fault as they do everywhere else. The current rule mostly feeds insurance and legal costs.",
    keepCase: [
      "Falls are the leading cause of construction deaths, and the law pushes owners to supply safety gear.",
      "Unions argue the cost estimates are overstated and come from industry-funded research.",
    ],
    changeCase: [
      "No other state has absolute liability.",
      "Insurance costs are passed on to every new home and public project.",
    ],
    confidence: "medium",
    modeled: true,
  },
  {
    id: "485x-wages",
    title: "485-x construction wage floors",
    short:
      "Projects of 100+ units that use the 485-x tax exemption must pay at least $40/hour; 150+ units in Manhattan below 96th St and parts of Brooklyn and Queens pay up to $76/hour.",
    category: "Construction site, labor & insurance",
    level: "State",
    enacted: "2024",
    citation: "Real Property Tax Law §485-x (FY2025 state budget)",
    applies: (c) => c.tax === "485x" && c.proto.units >= 100,
    history: [
      {
        text: "The 421-a tax exemption that underpinned most New York rental construction expired in June 2022, and proposed units collapsed from 45,593 in 2022 to 9,909 in 2023. The April 2024 state budget replaced it with 485-x, adding construction wage floors as part of a deal with the building trades.",
        sources: ["co-485x-2024", "katten-fy25-budget"],
      },
      {
        text: "Projects of 100 or more units must pay at least $40 an hour, rising 2.5% a year. Projects of 150+ units in Zone A (Manhattan south of 96th Street) pay the lesser of $72.45 (now $76.12 from July 2026) or 65% of prevailing wage; in Zone B (north and brownstone Brooklyn, western Queens) $63 or 60%. Projects with a project labor agreement are exempt.",
        sources: ["comptroller-485x", "co-485x-2024"],
      },
      {
        text: "Developers have responded by keeping projects at 99 units: a Bronx builder split a Bedford Park project in 2026 to stay under the threshold. The Independent Budget Office previously estimated prevailing wages raised affordable housing construction costs by 23%.",
        sources: ["hoodline-99-unit", "vitalcity-campion-2025", "trd-ibo-prevailing"],
      },
    ],
    cost: {
      text: "Labor is about half of hard cost, and nonunion projects run 20–30% below union ones. We count the floor as adding 14% to hard cost in Zone A, 11% in Zone B, and 5% for the $40 floor elsewhere.",
      sources: ["vitalcity-campion-2025", "trd-unions", "trd-ibo-prevailing"],
    },
    effect: (c) => ({
      lines: {
        hard:
          c.proto.units >= 150 && c.nb.zone485x === "A"
            ? 0.14
            : c.proto.units >= 150 && c.nb.zone485x === "B"
              ? 0.11
              : 0.05,
      },
    }),
    appliesNote: "Projects of 100+ units using the 485-x exemption.",
    reform: { label: "Keep the $40 floor only; drop the Zone A/B tiers", share: 0.6 },
    removeLabel: "Decouple the tax exemption from wage floors",
    stance: "remove",
    stanceWhy:
      "The wage floors are pushing projects under 100 units, so fewer large buildings get built. Workers' pay is better set through bargaining than tax law.",
    keepCase: [
      "Workers building subsidized housing should get fair wages and benefits.",
      "Nonunion construction has had higher injury and death rates.",
    ],
    changeCase: [
      "Developers are capping projects at 99 units to avoid it.",
      "Tax exemptions meant to create housing pay for higher labor costs instead.",
    ],
    geography:
      "Zone A: Manhattan below 96th Street. Zone B: Brooklyn CDs 1, 2, 6, 8 and Queens CDs 1, 2. Elsewhere only the $40 floor applies.",
    recent: "The Zone A rate rose to the lesser of $76.12/hour or 65% of prevailing wage on July 1, 2026.",
    confidence: "medium",
    modeled: true,
  },
  {
    id: "prevailing-wage-subsidized",
    title: "Prevailing wage on subsidized and public-land housing",
    short:
      "Projects with certain public financing, or on public land, must pay prevailing (union-scale) wages under state law or federal Davis-Bacon.",
    category: "Construction site, labor & insurance",
    level: "State",
    enacted: "1931 (Davis-Bacon); NY Labor Law Article 8; 2022 state expansion",
    citation: "NY Labor Law §§220, 224-a; 40 U.S.C. §3141",
    applies: () => false,
    history: [
      {
        text: "In 2016 the Independent Budget Office found prevailing wage requirements raised the cost of city-subsidized affordable housing by about 23%, nearly $80,000 a unit, after correcting an earlier 13% estimate. The building trades disputed the analysis.",
        sources: ["trd-ibo-prevailing"],
      },
    ],
    cost: {
      text: "Our prototypes are privately financed, so this is not in the calculator. For HPD-subsidized projects the IBO estimate is about 23% of construction cost.",
      sources: ["trd-ibo-prevailing"],
    },
    effect: {},
    appliesNote: "Subsidized or public-land projects; not in our privately financed prototypes.",
    reform: { label: "Exempt 100% affordable housing", share: 1 },
    removeLabel: "Repeal state prevailing wage on housing",
    stance: "reform",
    stanceWhy: "Every dollar of subsidy spent on higher wages builds fewer affordable homes.",
    keepCase: ["Public money should not undercut area wage standards."],
    changeCase: ["The IBO found it adds 23% to subsidized housing costs."],
    confidence: "medium",
    modeled: false,
  },
  {
    id: "ll196-safety-training",
    title: "Site safety training (Local Law 196)",
    short: "Every worker needs 40 hours of safety training and supervisors 62 hours before working on most sites.",
    category: "Construction site, labor & insurance",
    level: "City",
    enacted: "2017",
    citation: "Local Law 196 of 2017; NYC Building Code Chapter 33",
    applies: (c) => c.proto.id !== "small",
    history: [
      {
        text: "After a rise in construction deaths, 21 in 2016, mostly on nonunion sites, the Council passed Intro 1447-C in October 2017, sponsored in part by Jumaane Williams. It required 40 hours of training for workers and 62 for supervisors at sites that need a superintendent or site safety manager.",
        sources: ["dob-ll196"],
      },
      {
        text: "Deadlines were pushed back several times, to December 2019 and then March 2021, as training capacity lagged.",
        sources: ["trd-ll196-delay"],
      },
    ],
    cost: {
      text: "Training hours, card tracking and site paperwork. We estimate 0.6% of hard cost.",
      sources: ["dob-ll196"],
    },
    effect: { lines: { hard: 0.006 } },
    appliesNote: "Sites needing a construction superintendent or site safety manager (mid-rise and up).",
    reform: { label: "Accept OSHA-30 equivalents", share: 0.5 },
    removeLabel: "Repeal city-specific training",
    stance: "keep",
    stanceWhy: "Construction deaths are a real cost too, and the training cost is small.",
    keepCase: ["It responded to a spike in worker deaths."],
    changeCase: ["City-specific cards limit workers from other states."],
    confidence: "medium",
    modeled: true,
  },
  {
    id: "site-safety-crane",
    title: "Site safety managers and crane operator licensing",
    short:
      "Major buildings need a full-time licensed site safety manager, and New York licenses its own crane operators beyond national certification.",
    category: "Construction site, labor & insurance",
    level: "City",
    enacted: "Site safety: 1990s, expanded 2008; crane licenses: Title 28 Article 405, Local Law 80 of 2017",
    citation: "NYC Building Code Chapter 33; Administrative Code §28-405",
    applies: (c) => c.proto.id === "tower",
    history: [
      {
        text: "After the 2008 crane collapses on the East Side, the city tightened crane rules. Operators need New York's own Class A, B or C hoisting licenses on top of national certification (three years of NYC experience for Class A), and Local Law 80 of 2017 added ratings for booms over 300 feet. Campion notes the rules limit the number of operators.",
        sources: ["dob-crane-license", "ll80-2017", "vitalcity-campion-2025"],
      },
    ],
    cost: {
      text: "A full-time site safety manager, crane licensing premiums and scheduling limits. We estimate 1% of hard cost for a high-rise.",
      sources: ["vitalcity-campion-2025"],
    },
    effect: { lines: { hard: 0.01 } },
    appliesNote: "High-rise buildings.",
    reform: { label: "Accept national crane certification plus a city exam", share: 0.5 },
    removeLabel: "National certification only",
    stance: "reform",
    stanceWhy: "Keep the safety manager; open crane licensing to qualified operators from elsewhere.",
    keepCase: ["Crane collapses in 2008 killed nine people."],
    changeCase: ["Local experience requirements restrict the operator supply."],
    confidence: "low",
    modeled: true,
  },
  {
    id: "work-hours-sheds",
    title: "Work-hour limits, sidewalk sheds and construction fences",
    short:
      "Work is limited to weekdays 7am–6pm without after-hours variances, and sheds and fences are required along the sidewalk.",
    category: "Construction site, labor & insurance",
    level: "City",
    enacted: "Noise Code 2007; shed rules 1980 onward; Local Laws 47–48 of 2025",
    citation: "NYC Administrative Code §24-222; Building Code Chapter 33",
    history: [
      {
        text: "The 2007 Noise Code limits construction to weekdays from 7am to 6pm unless DOB grants an after-hours variance. Sidewalk sheds protect pedestrians during construction and facade work.",
        sources: ["randpc-sheds"],
      },
      {
        text: "In 2025 the Council passed Local Laws 47 and 48, allowing netting in place of some sheds, capping permits at 90 days, and fining long-standing sheds. In 2026 Mayor Mamdani's Buildings Department proposed rules to enforce them.",
        sources: ["randpc-sheds", "6sqft-sheds-mamdani"],
      },
    ],
    cost: {
      text: "Shorter work days stretch schedules. We count one month on a high-rise (half on smaller buildings) and 0.3% of hard cost for sheds and variances.",
      sources: [],
    },
    effect: (c) => ({ buildMonths: c.proto.id === "tower" ? 1 : 0.5, lines: { hard: 0.003 } }),
    appliesNote: "Every project.",
    reform: { label: "As-of-right extended hours for interior work", share: 0.5 },
    removeLabel: "Allow 7am–10pm work and weekend interior work",
    stance: "reform",
    stanceWhy: "Interior work after hours rarely disturbs neighbors and shortens schedules.",
    keepCase: ["Neighbors deserve quiet nights and weekends."],
    changeCase: ["Every month of construction costs interest."],
    confidence: "low",
    modeled: true,
  },

  // ───────────────────────────── Taxes & fees ─────────────────────────────
  {
    id: "class2-tax",
    title: "Higher property taxes on rental buildings (Class 2)",
    short:
      "Rental buildings pay an effective tax rate about twice that of one- and two-family homes, roughly 30% of a new building's income.",
    category: "Taxes & fees",
    level: "State",
    enacted: "1981 (classified property tax, S.7000-A)",
    citation: "Real Property Tax Law Article 18",
    applies: (c) => c.tax === "full",
    history: [
      {
        text: "After the 1975 Hellerstein decision required assessing all property at full value, the legislature in 1981 created New York City's four-class property tax system, capping assessment increases and shares for homeowners (Class 1) while rental buildings (Class 2) are assessed at 45% of market value against Class 1's 6%.",
        sources: ["furman-proptax-2025", "comptroller-proptax"],
      },
      {
        text: "Furman's 2025 data put large rentals' effective rate at 1.33% of market value against 0.70% for Class 1 homes. The Citizens Budget Commission found property taxes take about 30% of a rental building's income in the city, against 13% elsewhere, which is why almost no rentals were feasible without 421-a.",
        sources: ["furman-proptax-2025", "cbc-421a-2022", "co-proptax-2016"],
      },
      {
        text: "The Comptroller's office argued in 2022 that a single rate and valuation method across homes and small buildings would cut taxes on rental buildings by about 30%, making a developer exemption like 421-a less necessary.",
        sources: ["comptroller-proptax", "thecity-421a"],
      },
    ],
    cost: {
      text: "We model a fully taxed building paying 28% of its income in property tax. Equalizing with Class 1 effective rates would bring that to about 14%. This only applies when the project does not take the 485-x exemption.",
      sources: ["cbc-421a-2022", "furman-proptax-2025"],
    },
    effect: { taxShare: 0.14 },
    appliesNote: "Fully taxed projects (choose 'Full property tax' in the calculator).",
    reform: { label: "Narrow the class gap by half, revenue-neutral", share: 0.5 },
    removeLabel: "Equalize effective tax rates across classes",
    stance: "reform",
    stanceWhy:
      "The disparity is the root reason rentals need tax exemptions. Narrowing it lets more projects work without 485-x and its conditions.",
    keepCase: ["Shifting tax to homeowners in Queens and Staten Island would raise their bills sharply."],
    changeCase: [
      "Renters, who earn less than homeowners on average, pay the higher rate through rents.",
      "It makes nearly all new rentals infeasible without a special exemption.",
    ],
    geography:
      "Homeowner-heavy Staten Island and eastern Queens benefit most from the current split; renter-heavy Manhattan, Brooklyn and the Bronx pay more.",
    confidence: "medium",
    modeled: true,
  },
  {
    id: "mortgage-recording-tax",
    title: "Mortgage recording tax on construction loans",
    short: "A 2.8% tax on the full amount of commercial mortgages over $500,000, including construction loans.",
    category: "Taxes & fees",
    level: "State",
    enacted: "1906 (state); city rates added later",
    citation: "Tax Law Article 11; NYC Administrative Code §11-2601",
    history: [
      {
        text: "New York State has taxed recorded mortgages since 1906. In the city the combined rate on commercial mortgages of $500,000 or more, which covers construction loans on apartment buildings, is 2.8%: 1.75% city plus the state's share.",
        sources: ["hauseit-mrt", "dof-mrt-2017"],
      },
    ],
    cost: {
      text: "2.8% of the construction loan. On a $30 million loan that is $840,000, paid at closing and financed like any other cost.",
      sources: ["hauseit-mrt"],
    },
    effect: { lines: { mrt: 1 } },
    appliesNote: "Every project with a construction loan.",
    reform: { label: "Charge the residential rate", share: 0.25 },
    removeLabel: "Exempt construction loans for new housing",
    stance: "remove",
    stanceWhy: "It taxes the act of financing new homes; the city and state collect it again when permanent loans and sales record.",
    keepCase: ["It is a significant city and MTA revenue source."],
    changeCase: ["It adds about 2% to every new rental's cost, passed on in rents."],
    confidence: "high",
    modeled: true,
  },
  {
    id: "transfer-tax",
    title: "Real property transfer taxes on land",
    short: "City (2.625%) and state (0.65%) transfer taxes on commercial land sales over $2 million.",
    category: "Taxes & fees",
    level: "City",
    enacted: "1959 (city RPTT); state since 1968",
    citation: "NYC Administrative Code §11-2101; Tax Law Article 31",
    history: [
      {
        text: "The city's real property transfer tax applies 2.625% to commercial transfers over $500,000, and the state adds 0.4% plus 0.25% on commercial transfers of $2 million or more in the city. Sellers formally pay, but buyers bear it in the price of land.",
        sources: ["hauseit-mrt", "dof-mrt-2017"],
      },
    ],
    cost: {
      text: "About 3.3% of land price, counted in closing costs.",
      sources: ["hauseit-mrt"],
    },
    effect: { lines: { closing: 0.75 } },
    appliesNote: "Every project buying land.",
    reform: { label: "Exempt land bought for housing", share: 1 },
    removeLabel: "Exempt land bought for new housing",
    stance: "keep",
    stanceWhy: "It is a broad tax on real estate wealth, not a cost targeted at building.",
    keepCase: ["Major revenue for the city and MTA."],
    changeCase: ["It taxes assembling sites for housing."],
    confidence: "high",
    modeled: true,
  },
  {
    id: "sales-tax-materials",
    title: "Sales tax on construction materials",
    short: "8.875% combined sales tax on materials used in new buildings; exempt only for exempt owners.",
    category: "Taxes & fees",
    level: "State",
    enacted: "1934 (city sales tax); 1965 (state)",
    citation: "Tax Law §1105; capital improvement rules",
    history: [
      {
        text: "New York taxes construction materials even when the work is a capital improvement, and exempts them only when an exempt organization (such as a government body) owns the property. Funding from housing programs does not create an exemption.",
        sources: ["nys-tax-capital-improvements"],
      },
    ],
    cost: {
      text: "Materials are roughly 45% of hard cost, so 8.875% sales tax is about 3.9% of hard cost.",
      sources: ["nys-tax-capital-improvements"],
    },
    effect: { lines: { hard: 0.039 } },
    appliesNote: "Every project.",
    reform: { label: "Exempt materials for income-restricted units", share: 0.25 },
    removeLabel: "Exempt materials for all new housing",
    stance: "keep",
    stanceWhy: "A broad-based tax; exempting one industry invites others.",
    keepCase: ["Sales tax is broad and hard to replace."],
    changeCase: ["Many states exempt materials for affordable housing."],
    confidence: "medium",
    modeled: true,
  },
  {
    id: "agency-fees",
    title: "Permit, filing and connection fees",
    short: "DOB filing and permit fees, DEP water and sewer connection charges, DOT street permits.",
    category: "Taxes & fees",
    level: "City",
    enacted: "Various",
    citation: "NYC Administrative Code Title 28 fee schedules; DEP and DOT rules",
    history: [
      {
        text: "Agencies charge fees to recover the cost of review and inspection. New York's are modest next to its review times.",
        sources: ["dob-mmr-2026"],
      },
    ],
    cost: {
      text: "We estimate fees at about 20% of the permits and expediting line.",
      sources: [],
    },
    effect: { lines: { permits: 0.2 } },
    appliesNote: "Every project.",
    reform: null,
    removeLabel: "Waive fees for new housing",
    stance: "keep",
    stanceWhy: "Fees fund the reviewers; cutting them would slow review further.",
    keepCase: ["Fees pay for inspectors and plan examiners."],
    changeCase: [],
    confidence: "low",
    modeled: true,
  },

  // ───────────────────────────── Affordability & tenancy ─────────────────────────────
  {
    id: "mih",
    title: "Mandatory Inclusionary Housing",
    short:
      "In MIH areas, 20–30% of homes must be permanently affordable, typically 25% at an average of 60% of area median income.",
    category: "Affordability & tenancy",
    level: "City",
    enacted: "2016",
    citation: "Zoning Resolution §23-154 and Appendix F",
    applies: (c) => (c.site.rezoning || c.nb.mih) && c.proto.units > 10,
    history: [
      {
        text: "Mayor de Blasio's Mandatory Inclusionary Housing passed in March 2016. Wherever the city rezones for more housing, 20–30% of residential floor area in new buildings over 10 units must be permanently affordable. Option 1 sets aside 25% at an average of 60% of AMI (with 10% at 40% AMI after Council changes); Option 2 sets aside 30% at an average of 80%.",
        sources: ["hpd-mih-factsheet", "anhd-mih"],
      },
      {
        text: "The city's feasibility study by BAE Urban Economics found the requirement worked only in strong markets; advocates at ANHD argued it did not reach the lowest incomes. East New York was the first neighborhood rezoned under it, followed by others including Jerome Avenue, Inwood, Gowanus, SoHo/NoHo and Jamaica (the largest, in 2025).",
        sources: ["bae-mih", "anhd-mih", "qns-jamaica-plan"],
      },
    ],
    cost: {
      text: "MIH doesn't raise construction costs; it lowers revenue. Rent on 25% of the homes is capped (about $1,950 at 60% AMI), so market-rate tenants must cover more. Where MIH comes with an upzoning, the extra floor area is meant to pay for it.",
      sources: ["hpd-mih-factsheet", "bae-mih"],
    },
    effect: { affordable: "mih" },
    appliesNote: "Rezoned sites and neighborhoods with MIH mapped, buildings over 10 units.",
    reform: { label: "Allow a fee in lieu or off-site units", share: 0.4 },
    removeLabel: "Make inclusionary housing voluntary with a density bonus",
    stance: "keep",
    stanceWhy:
      "Paired with upzonings, MIH lets neighborhoods grow while guaranteeing permanent affordable homes. It is a trade, not a pure cost.",
    keepCase: [
      "It creates permanently affordable homes without direct subsidy.",
      "It makes upzonings politically possible.",
    ],
    changeCase: [
      "It works as a tax on new housing, so fewer projects pencil in weaker markets.",
      "BAE found it feasible only in strong markets.",
    ],
    geography:
      "Mapped in neighborhood rezonings (East New York, Rockaway, East Harlem, Jerome Avenue, Inwood, Gowanus, SoHo, Atlantic Avenue, Bronx Metro-North, Midtown South, Jamaica) and every private rezoning since 2016.",
    confidence: "medium",
    modeled: true,
  },
  {
    id: "485x-affordability",
    title: "485-x affordability set-aside",
    short:
      "To get the 485-x tax exemption, 20–25% of homes must be rent-stabilized at an average of 80% of area median income.",
    category: "Affordability & tenancy",
    level: "State",
    enacted: "2024",
    citation: "Real Property Tax Law §485-x",
    applies: (c) => c.tax === "485x",
    history: [
      {
        text: "485-x exempts new rental buildings from property tax for decades (35 years for 100+ units, 40 for 150+, with no land tax during construction for 150+ units) in exchange for 20–25% of homes at an average of 80% AMI, permanently stabilized. Critics like Housing Justice for All's Cea Weaver called it a 'Band-Aid' for a broken tax system.",
        sources: ["co-485x-2024", "katten-fy25-budget"],
      },
    ],
    cost: {
      text: "Like MIH, it lowers revenue rather than raising cost: 25% of homes (20% under 100 units) rent for about $2,600. It is the price of a tax exemption worth far more.",
      sources: ["co-485x-2024"],
    },
    effect: { affordable: "485x" },
    appliesNote: "Projects that use the 485-x exemption.",
    reform: { label: "Allow 20% at 100% AMI instead", share: 0.4 },
    removeLabel: "Grant the exemption without income limits",
    stance: "keep",
    stanceWhy: "Fixing the Class 2 tax gap is the better route; as long as 485-x exists, its affordability is the public's return.",
    keepCase: ["A tax break worth decades of taxes should buy affordable homes."],
    changeCase: ["80% AMI units rent close to market in many outer-borough neighborhoods."],
    confidence: "medium",
    modeled: true,
  },
  {
    id: "housing-lottery",
    title: "Affordable unit marketing and Housing Connect lottery",
    short: "Income-restricted units must be leased through HPD's lottery, with income verification and long lease-up.",
    category: "Affordability & tenancy",
    level: "City",
    enacted: "1980s marketing guidelines; Housing Connect 2013",
    citation: "HPD Marketing Handbook",
    applies: (c) => c.tax === "485x" || ((c.site.rezoning || c.nb.mih) && c.proto.units > 10),
    history: [
      {
        text: "Affordable units are rented through HPD's Housing Connect lottery, with marketing plans, document review and appeals. Lease-up of income-restricted units routinely takes many months.",
        sources: ["hpd-mih-factsheet"],
      },
    ],
    cost: {
      text: "Marketing agents, compliance and slower lease-up. We count about 25% of the marketing and lease-up line.",
      sources: [],
    },
    effect: { lines: { marketing: 0.25 } },
    appliesNote: "Projects with income-restricted units.",
    reform: { label: "Pre-qualified applicant pools and 60-day lease-up targets", share: 0.6 },
    removeLabel: "Owner-run marketing with audits",
    stance: "reform",
    stanceWhy: "Fair access matters; the paperwork can be faster.",
    keepCase: ["Lotteries keep affordable units from being steered to insiders."],
    changeCase: ["Empty units during slow lease-up help no one."],
    confidence: "low",
    modeled: true,
  },
  {
    id: "good-cause",
    title: "Good Cause Eviction",
    short: "Caps rent increases and requires a reason for eviction in many market-rate units; new buildings are exempt for 30 years.",
    category: "Affordability & tenancy",
    level: "State",
    enacted: "2024",
    citation: "Real Property Law Article 6-A; RPL §231-c",
    applies: () => false,
    history: [
      {
        text: "Good Cause Eviction took effect April 20, 2024. It covers most market-rate apartments, but buildings with a certificate of occupancy on or after January 1, 2009 are exempt until 30 years after that date, along with small landlords.",
        sources: ["hpd-good-cause", "nysenate-rpl-231c"],
      },
    ],
    cost: {
      text: "Because new buildings are exempt for 30 years, it has no effect on a new project's budget or rents in the calculator.",
      sources: ["hpd-good-cause"],
    },
    effect: {},
    appliesNote: "New buildings are exempt for 30 years.",
    reform: null,
    removeLabel: "Repeal Good Cause",
    stance: "keep",
    stanceWhy: "It does not affect new construction.",
    keepCase: ["It protects existing tenants from sudden large increases."],
    changeCase: ["Lenders may price in future coverage after 30 years."],
    confidence: "high",
    modeled: false,
  },
  {
    id: "rent-stabilization",
    title: "Rent stabilization and the 2026 rent freeze",
    short:
      "About one million apartments have regulated rents; the 2019 HSTPA ended deregulation, and in June 2026 the Rent Guidelines Board froze stabilized rents.",
    category: "Affordability & tenancy",
    level: "State",
    enacted: "1969 (stabilization); 2019 (HSTPA); 2026 (freeze)",
    citation: "Emergency Tenant Protection Act; Rent Stabilization Law; HSTPA 2019",
    applies: () => false,
    history: [
      {
        text: "Rent stabilization began in 1969. The 2019 Housing Stability and Tenant Protection Act ended vacancy decontrol and limited improvement increases.",
        sources: ["furman-soc-2025"],
      },
      {
        text: "In June 2026 Mayor Mamdani's Rent Guidelines Board voted 7–1 for a 0% increase on one- and two-year leases signed from October 2026 to September 2027, even as its price index showed operating costs up 5.3%.",
        sources: ["ny1-rent-freeze", "brownstoner-rent-freeze"],
      },
    ],
    cost: {
      text: "It does not raise the cost of building a new market-rate building, but it governs the affordable units in 485-x projects and makes it hard to clear occupied sites for redevelopment.",
      sources: ["ny1-rent-freeze"],
    },
    effect: {},
    appliesNote: "Existing stabilized apartments and 485-x affordable units.",
    reform: null,
    removeLabel: "Phase out stabilization",
    stance: "keep",
    stanceWhy: "Outside our scope of development costs; listed because it shapes which sites can be redeveloped.",
    keepCase: ["A million households depend on predictable rents."],
    changeCase: ["Lenders and owners price the risk of frozen rents into stabilized units."],
    recent: "Rent freeze approved June 2026 for leases from October 2026.",
    confidence: "high",
    modeled: false,
  },

  // ───────────────────────────── Federal & materials ─────────────────────────────
  {
    id: "tariffs",
    title: "Federal tariffs on steel, aluminum, copper and lumber",
    short: "Steel and aluminum tariffs rose to 50% in June 2025, with tariffs on copper products and Canadian lumber.",
    category: "Federal & materials",
    level: "Federal",
    enacted: "2018; raised 2025",
    citation: "Section 232 proclamations (Trade Expansion Act of 1962)",
    history: [
      {
        text: "Section 232 tariffs on steel and aluminum began in 2018 and rose from 25% to 50% in June 2025. Industry estimates put 2025 materials cost increases at 8.5–9.6% and total project costs up 4.4–4.8%. A 2026 proclamation set a 10% rate from 2028 for goods that are 85% U.S.-made metal.",
        sources: ["agmetalminer-tariffs", "trd-tariffs-2026"],
      },
    ],
    cost: {
      text: "New York's concrete-and-steel buildings use rebar, structural steel, copper pipe and aluminum windows. We estimate 2.5% of hard cost, low confidence.",
      sources: ["agmetalminer-tariffs"],
    },
    effect: { lines: { hard: 0.025 } },
    appliesNote: "Every project.",
    reform: { label: "Exempt building materials", share: 1 },
    removeLabel: "Repeal construction-material tariffs",
    stance: "remove",
    stanceWhy: "Tariffs on construction inputs are a direct tax on new housing.",
    keepCase: ["Protects domestic steel and aluminum producers."],
    changeCase: ["Adds several percent to every new building's cost."],
    confidence: "low",
    modeled: true,
  },
]

export const REG_BY_ID: Record<string, Regulation> = Object.fromEntries(
  REGULATIONS.map((r) => [r.id, r]),
)

export const effectFor = (r: Regulation, ctx: Ctx): Effect =>
  typeof r.effect === "function" ? r.effect(ctx) : r.effect

export const appliesTo = (r: Regulation, ctx: Ctx) => (r.applies ? r.applies(ctx) : true)

export type Choices = Record<string, Stance>

export const DEFAULT_CHOICES: Choices = Object.fromEntries(REGULATIONS.map((r) => [r.id, r.stance]))
export const KEEP_ALL: Choices = Object.fromEntries(REGULATIONS.map((r) => [r.id, "keep" as Stance]))
