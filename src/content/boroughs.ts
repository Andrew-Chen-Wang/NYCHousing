import type { Para } from "./regulations"
import type { Borough } from "./types"

/** What is different about building in each borough. */
export const BOROUGH_NOTES: Record<Borough, { lede: string; points: Para[] }> = {
  Manhattan: {
    lede: "The highest land prices and rents, no parking mandates anywhere, the steepest 485-x wage tier below 96th Street, and the most landmarked land in the city.",
    points: [
      {
        text: "Land averaged $488 per buildable foot in the first half of 2025, versus $313 in Brooklyn.",
        sources: ["ariel-manhattan-1h25", "grea-brooklyn-1h25"],
      },
      {
        text: "All of Manhattan is parking Zone 1 after City of Yes; the Manhattan Core has had no residential parking minimums since the 1982 Manhattan Core rules.",
        sources: ["dcp-city-of-yes"],
      },
      {
        text: "Projects of 150+ units south of 96th Street using 485-x must pay the lesser of $76.12 an hour or 65% of prevailing wage (from July 2026).",
        sources: ["comptroller-485x"],
      },
      {
        text: "About 27% of Manhattan lots are landmarked or in historic districts, against 3.4% citywide.",
        sources: ["furman-landmarks-50"],
      },
      {
        text: "The repeal of the state's 12 FAR cap in 2024 matters most here, where zoning would otherwise allow towers above it; the Midtown South Mixed-Use Plan (2025) mapped new high-density residential districts.",
        sources: ["co-mdl-12far", "kramer-12far"],
      },
    ],
  },
  Brooklyn: {
    lede: "Record land prices in north and brownstone Brooklyn, a 485-x Zone B in Community Districts 1, 2, 6 and 8, large historic districts, and parking still required in the southern neighborhoods.",
    points: [
      {
        text: "Development sites averaged a record $313 per buildable foot in the first half of 2025, with Gowanus sites from $236 to $417.",
        sources: ["grea-brooklyn-1h25"],
      },
      {
        text: "485-x Zone B (Brooklyn CDs 1, 2, 6 and 8: Williamsburg, Greenpoint, Downtown, Fort Greene, Park Slope, Red Hook, Prospect Heights, Crown Heights North) carries the $63-an-hour tier for 150+ units.",
        sources: ["comptroller-485x", "co-485x-2024"],
      },
      {
        text: "Brooklyn Heights, Park Slope, Fort Greene, Prospect Heights and other brownstone areas are largely historic districts.",
        sources: ["furman-landmarks-50"],
      },
      {
        text: "Neighborhood rezonings with MIH: East New York (2016), Gowanus (2021), Atlantic Avenue (2024). Coney Island, Red Hook and the southern shore are floodplain.",
        sources: ["hpd-mih-factsheet", "dcp-flood-text"],
      },
    ],
  },
  Queens: {
    lede: "Western Queens behaves like inner Brooklyn; eastern Queens keeps parking mandates and low-density zoning, and has fought most upzonings.",
    points: [
      {
        text: "Long Island City has its own parking area with no mandates; Astoria, Sunnyside and Woodside are in the Inner Transit Zone; most of eastern Queens is Zone 3, where mandates remain.",
        sources: ["dcp-city-of-yes", "citylimits-coy-deal"],
      },
      {
        text: "Queens CDs 1 and 2 (Astoria, Long Island City, Sunnyside, Woodside) are 485-x Zone B.",
        sources: ["comptroller-485x"],
      },
      {
        text: "The Jamaica Neighborhood Plan (October 2025, 47–0) created the city's largest MIH area, about 230 blocks and 11,800 planned homes.",
        sources: ["qns-jamaica-plan"],
      },
      {
        text: "Many Queens Council members opposed City of Yes and promised court challenges; low-production districts here are targets of the 2025 Affordable Housing Appeals Board.",
        sources: ["queenseagle-coy-vote", "charter-commission-proposals"],
      },
      {
        text: "Rockaway, Howard Beach and parts of the north shore are floodplain.",
        sources: ["dcp-flood-text"],
      },
    ],
  },
  Bronx: {
    lede: "The cheapest land and rents of the four large boroughs, most of it without parking mandates, MIH along Jerome Avenue and near the new Metro-North stations, and a growth-management overlay in the east.",
    points: [
      {
        text: "Development sites traded around $92 per buildable foot in early 2025.",
        sources: ["iprg-bronx-2025"],
      },
      {
        text: "Bronx Community District 10 (Throgs Neck, Pelham Bay, City Island, Co-op City) is a Lower Density Growth Management Area with higher parking and yard rules.",
        sources: ["dcp-ldgma"],
      },
      {
        text: "The Jerome Avenue (2018) and Bronx Metro-North (2024) rezonings mapped MIH.",
        sources: ["hpd-mih-factsheet"],
      },
      {
        text: "Developers here are keeping projects at 99 units to avoid the $40-an-hour 485-x floor.",
        sources: ["hoodline-99-unit"],
      },
    ],
  },
  "Staten Island": {
    lede: "Mostly zoned for one- and two-family homes, the whole borough is a Lower Density Growth Management Area with the city's highest parking requirements, plus special districts that add review in the south and center.",
    points: [
      {
        text: "In 2004 the entire borough became the first Lower Density Growth Management Area: 1.5 parking spaces per home in low-density districts, larger yards and lots.",
        sources: ["dcp-ldgma", "dcp-sigrowth"],
      },
      {
        text: "Before City of Yes, Furman found Staten Island developers were required to build 122 parking spaces per 100 homes on average, against 5 in Manhattan.",
        sources: ["furman-parking-brief-2012"],
      },
      {
        text: "The Special South Richmond Development District and Special Natural Area District require extra review for tree, slope and wetland protection.",
        sources: ["zoning-handbook"],
      },
      {
        text: "The East and South Shores, flooded in Hurricane Sandy, are floodplain under Appendix G.",
        sources: ["dcp-flood-text", "dcp-flood-zfr"],
      },
      {
        text: "StreetEasy publishes only a borough-wide rent for Staten Island, so it is one row in the calculator.",
        sources: ["streeteasy-data"],
      },
    ],
  },
}
