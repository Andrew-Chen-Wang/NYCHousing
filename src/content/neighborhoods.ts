import { RENTS } from "./rents.generated"
import type { Borough } from "./types"

/**
 * Neighborhood-level rules that change what a project costs. Each flag describes most of
 * the neighborhood, not every lot: check a specific lot on ZoLa (zola.planning.nyc.gov)
 * before relying on it.
 *
 * - parkingZone: City of Yes parking zones (Dec. 2024). 1 = no parking mandates (Manhattan
 *   Core, Long Island City, Inner Transit Zone); 2 = reduced mandates (Outer Transit Zone);
 *   3 = most mandates remain.
 * - zone485x: 485-x construction wage zones. A = Manhattan south of 96th Street; B =
 *   Brooklyn community districts 1, 2, 6 and 8 and Queens community districts 1 and 2;
 *   C = everywhere else.
 * - historic: share of lots inside Landmarks Preservation Commission historic districts.
 * - flood: much of the neighborhood lies in the FEMA 1% annual-chance floodplain, so
 *   Building Code Appendix G applies.
 * - mih: a neighborhood-wide rezoning since 2016 mapped Mandatory Inclusionary Housing.
 * - ldgma: Lower Density Growth Management Area (all of Staten Island; Bronx CD 10).
 */
export type Flags = {
  parkingZone: 1 | 2 | 3
  zone485x: "A" | "B" | "C"
  historic: "high" | "some" | "none"
  flood: boolean
  mih: boolean
  ldgma: boolean
  note?: string
}

export type Neighborhood = Flags & {
  slug: string
  name: string
  borough: Borough
  /** Mean of the latest 12 monthly median asking rents (StreetEasy). */
  rent: number
  rent2019: number | null
  months: number
  /** True for the borough-wide row (used for Staten Island, where StreetEasy has no neighborhoods). */
  boroughWide?: boolean
}

type F = Partial<Flags>
const base = (zone: 1 | 2 | 3, f: F = {}): F => ({ parkingZone: zone, ...f })

/** Flags by StreetEasy neighborhood name. Unlisted keys fall back to the defaults below. */
const FLAGS: Record<string, F> = {
  // Manhattan: all of it is parking Zone 1 (Manhattan Core or Inner Transit Zone).
  "Battery Park City": base(1, { zone485x: "A", flood: true }),
  Chelsea: base(1, { zone485x: "A", historic: "some" }),
  Chinatown: base(1, { zone485x: "A" }),
  "Civic Center": base(1, { zone485x: "A", historic: "some" }),
  "East Village": base(1, { zone485x: "A", historic: "some" }),
  "Financial District": base(1, { zone485x: "A", historic: "some", flood: true }),
  Flatiron: base(1, { zone485x: "A", historic: "high" }),
  "Gramercy Park": base(1, { zone485x: "A", historic: "high" }),
  "Greenwich Village": base(1, { zone485x: "A", historic: "high" }),
  "Little Italy": base(1, { zone485x: "A", historic: "some" }),
  "Lower East Side": base(1, { zone485x: "A", historic: "some", flood: true }),
  Midtown: base(1, { zone485x: "A", note: "Midtown South Mixed-Use Plan (2025) mapped MIH in parts." }),
  "Midtown East": base(1, { zone485x: "A" }),
  "Midtown South": base(1, { zone485x: "A", mih: true, note: "Midtown South Mixed-Use Plan (2025) mapped MIH." }),
  "Midtown West": base(1, { zone485x: "A", note: "Special Clinton District rules apply in Hell's Kitchen." }),
  Nolita: base(1, { zone485x: "A", historic: "some" }),
  Soho: base(1, { zone485x: "A", historic: "high", mih: true, note: "SoHo/NoHo rezoning (2021) mapped MIH; most lots are in historic districts." }),
  "Stuyvesant Town/PCV": base(1, { zone485x: "A", flood: true }),
  Tribeca: base(1, { zone485x: "A", historic: "high", flood: true }),
  "West Village": base(1, { zone485x: "A", historic: "high", flood: true }),
  "Central Park South": base(1, { zone485x: "A" }),
  "Upper East Side": base(1, { zone485x: "A", historic: "high" }),
  "Upper West Side": base(1, { zone485x: "A", historic: "high" }),
  "Roosevelt Island": base(1, { zone485x: "A" }),
  "Morningside Heights": base(1, { historic: "some" }),
  "Central Harlem": base(1, { historic: "some" }),
  "East Harlem": base(1, { mih: true, note: "East Harlem rezoning (2017) mapped MIH." }),
  "West Harlem": base(1, { historic: "some" }),
  "Hamilton Heights": base(1, { historic: "high" }),
  "Washington Heights": base(1),
  Inwood: base(1, { mih: true, flood: true, note: "Inwood rezoning (2018) mapped MIH; waterfront lots are flood-prone." }),
  "Marble Hill": base(1),

  // Bronx
  "Mott Haven": base(1, { flood: true, note: "Waterfront lots along the Harlem River are flood-prone." }),
  "Port Morris": base(1, { flood: true }),
  Melrose: base(1),
  Morrisania: base(1),
  Concourse: base(1, { mih: true, historic: "some", note: "Jerome Avenue rezoning (2018) mapped MIH." }),
  Highbridge: base(1, { mih: true, note: "Jerome Avenue rezoning (2018) mapped MIH." }),
  "Morris Heights": base(1, { mih: true, note: "Jerome Avenue rezoning (2018) mapped MIH." }),
  "University Heights": base(1, { mih: true, note: "Jerome Avenue rezoning (2018) mapped MIH." }),
  Longwood: base(1, { historic: "some" }),
  "Hunts Point": base(1, { flood: true }),
  Woodstock: base(1),
  Tremont: base(1),
  "East Tremont": base(1),
  "Crotona Park East": base(1),
  Fordham: base(1),
  Belmont: base(1),
  "Bedford Park": base(1),
  Kingsbridge: base(1),
  Norwood: base(1),
  Riverdale: base(2, { historic: "some" }),
  Soundview: base(2, { flood: true }),
  Parkchester: base(2, { mih: true, note: "Bronx Metro-North rezoning (2024) mapped MIH near the new stations." }),
  "Van Nest": base(2, { mih: true, note: "Bronx Metro-North rezoning (2024) mapped MIH." }),
  "Morris Park": base(2, { mih: true, note: "Bronx Metro-North rezoning (2024) mapped MIH." }),
  "Pelham Parkway": base(2),
  "Pelham Gardens": base(2),
  Laconia: base(3),
  Williamsbridge: base(2),
  Bronxwood: base(2),
  Wakefield: base(2),
  Edenwald: base(2),
  Woodlawn: base(2),
  Baychester: base(2),
  Eastchester: base(2),
  "Castle Hill": base(2, { flood: true }),
  "Throgs Neck": base(3, { ldgma: true, flood: true }),
  "Country Club": base(3, { ldgma: true, flood: true }),
  "City Island": base(3, { ldgma: true, flood: true }),
  Schuylerville: base(3, { ldgma: true }),
  "Pelham Bay": base(3, { ldgma: true }),
  "Westchester Village": base(3, { ldgma: true }),
  "Co-op City": base(3, { ldgma: true }),

  // Brooklyn
  Williamsburg: base(1, { zone485x: "B", flood: true, note: "Waterfront blocks are flood-prone." }),
  Greenpoint: base(1, { zone485x: "B", flood: true, historic: "some" }),
  DUMBO: base(1, { zone485x: "B", flood: true, historic: "high" }),
  "Brooklyn Heights": base(1, { zone485x: "B", historic: "high" }),
  "Downtown Brooklyn": base(1, { zone485x: "B", historic: "some" }),
  "Fort Greene": base(1, { zone485x: "B", historic: "high" }),
  "Clinton Hill": base(1, { zone485x: "B", historic: "high" }),
  "Boerum Hill": base(1, { zone485x: "B", historic: "high" }),
  "Cobble Hill": base(1, { zone485x: "B", historic: "high" }),
  "Carroll Gardens": base(1, { zone485x: "B", historic: "some" }),
  "Columbia St Waterfront District": base(1, { zone485x: "B", flood: true }),
  "Red Hook": base(1, { zone485x: "B", flood: true }),
  Gowanus: base(1, { zone485x: "B", flood: true, mih: true, note: "Gowanus rezoning (2021) mapped MIH; canal-side lots carry E-designations." }),
  "Park Slope": base(1, { zone485x: "B", historic: "high" }),
  "Prospect Heights": base(1, { zone485x: "B", historic: "high" }),
  "Crown Heights": base(1, { zone485x: "B", historic: "some", note: "Atlantic Avenue Mixed-Use Plan (2024) mapped MIH along Atlantic Avenue; switch on 'Needs a rezoning' for sites there." }),
  "Bedford-Stuyvesant": base(1, { historic: "some", note: "Atlantic Avenue Mixed-Use Plan (2024) mapped MIH on the southern edge; switch on 'Needs a rezoning' for sites there." }),
  Bushwick: base(1),
  "Prospect Lefferts Gardens": base(1, { historic: "some" }),
  "Windsor Terrace": base(1),
  Greenwood: base(1),
  "Sunset Park": base(1, { historic: "some", flood: true }),
  Flatbush: base(1),
  "Ditmas Park": base(1, { historic: "high" }),
  "Prospect Park South": base(1, { historic: "high" }),
  Kensington: base(1),
  "East Flatbush": base(2),
  Brownsville: base(2),
  "East New York": base(2, { mih: true, note: "East New York rezoning (2016) was the first MIH neighborhood rezoning." }),
  "Borough Park": base(2),
  Midwood: base(2, { historic: "some" }),
  "Bay Ridge": base(2),
  "Dyker Heights": base(3),
  Bensonhurst: base(2),
  "Bath Beach": base(2, { flood: true }),
  Gravesend: base(2, { flood: true }),
  "Sheepshead Bay": base(2, { flood: true }),
  "Brighton Beach": base(2, { flood: true }),
  "Manhattan Beach": base(3, { flood: true }),
  "Coney Island": base(2, { flood: true }),
  Seagate: base(3, { flood: true }),
  Canarsie: base(2, { flood: true }),
  Flatlands: base(2),
  "Marine Park": base(3, { flood: true }),
  "Mill Basin": base(3, { flood: true }),
  "Old Mill Basin": base(3, { flood: true }),
  "Bergen Beach": base(3, { flood: true }),
  "Gerritsen Beach": base(3, { flood: true }),

  // Queens
  "Long Island City": base(1, { zone485x: "B", flood: true, note: "Long Island City parking area (no mandates); waterfront lots are flood-prone." }),
  Astoria: base(1, { zone485x: "B", flood: true, note: "Waterfront blocks near Hallets Point are flood-prone." }),
  Sunnyside: base(1, { zone485x: "B", historic: "some", note: "Sunnyside Gardens is a historic district." }),
  Woodside: base(1, { zone485x: "B" }),
  Ridgewood: base(1, { historic: "some" }),
  "Jackson Heights": base(2, { historic: "high" }),
  Elmhurst: base(2),
  Corona: base(2),
  "North Corona": base(2),
  "East Elmhurst": base(2, { flood: true }),
  Maspeth: base(2),
  "Rego Park": base(2),
  "Forest Hills": base(2, { historic: "some" }),
  "Kew Gardens": base(2),
  "Kew Gardens Hills": base(2),
  Briarwood: base(2),
  Jamaica: base(2, { mih: true, note: "Jamaica Neighborhood Plan (2025) mapped MIH near the transit hub." }),
  "Jamaica Hills": base(2),
  "South Jamaica": base(3),
  Flushing: base(2, { flood: true, note: "Flushing Creek waterfront is flood-prone." }),
  "Richmond Hill": base(2),
  "South Richmond Hill": base(2),
  Woodhaven: base(2),
  "Ozone Park": base(2),
  "South Ozone Park": base(3),
  "Middle Village": base(3),
  Glendale: base(3),
  "Rockaway All": base(2, { flood: true, mih: true, note: "Downtown Far Rockaway rezoning (2017) mapped MIH; almost all of the peninsula is floodplain." }),
  "Howard Beach": base(3, { flood: true }),
  "College Point": base(3, { flood: true }),
  Whitestone: base(3),
  Bayside: base(3),
  Douglaston: base(3, { historic: "some", flood: true }),
  "Little Neck": base(3),
  Auburndale: base(3),
  "Fresh Meadows": base(3),
  "Oakland Gardens": base(3),
  Bellerose: base(3),
  "Glen Oaks": base(3),
  "Queens Village": base(3),
  "Cambria Heights": base(3),
  Laurelton: base(3),
  Rosedale: base(3, { flood: true }),
  "Springfield Gardens": base(3, { flood: true }),
  "St. Albans": base(3),
  Hollis: base(3),
  "Jamaica Estates": base(3),
  Hillcrest: base(3),
  Utopia: base(3),
  Pomonok: base(3),
  Clearview: base(3),
  Brookville: base(3, { flood: true }),

  // Staten Island: StreetEasy publishes only a borough figure.
  "Staten Island": base(3, {
    ldgma: true,
    historic: "some",
    note: "Borough-wide figure. The whole borough is a Lower Density Growth Management Area; the East and South Shores are floodplain (flood is off by default; switch it on for shore sites). Special South Richmond and Natural Area districts add review in the south and center.",
  }),
}

const DEFAULTS: Flags = {
  parkingZone: 2,
  zone485x: "C",
  historic: "none",
  flood: false,
  mih: false,
  ldgma: false,
}

export const slug = (x: string) =>
  x
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")

/** Borough-wide rows from StreetEasy, used for borough medians. */
export const BOROUGH_RENT: Record<Borough, number> = Object.fromEntries(
  RENTS.filter((r) => r.kind === "borough").map((r) => [r.borough, r.avg12]),
) as Record<Borough, number>

export const CITY_RENT = RENTS.find((r) => r.kind === "city")?.avg12 ?? 0

export const NEIGHBORHOODS: Neighborhood[] = RENTS.filter(
  (r) => r.kind === "neighborhood" || r.borough === "Staten Island",
)
  .map((r) => ({
    ...DEFAULTS,
    ...FLAGS[r.name],
    slug: slug(r.name === "Rockaway All" ? "Rockaway" : r.name),
    name: r.name === "Rockaway All" ? "Rockaway" : r.name,
    borough: r.borough as Borough,
    rent: r.avg12,
    rent2019: r.avg2019,
    months: r.months,
    ...(r.kind === "borough" && { boroughWide: true }),
  }))
  .sort((a, b) => a.borough.localeCompare(b.borough) || a.name.localeCompare(b.name))

export const NEIGHBORHOOD_BY_SLUG: Record<string, Neighborhood> = Object.fromEntries(
  NEIGHBORHOODS.map((n) => [n.slug, n]),
)

/** Flag keys we set by hand, so a renamed StreetEasy neighborhood can't silently lose them. */
export const FLAGGED_NAMES = Object.keys(FLAGS)
