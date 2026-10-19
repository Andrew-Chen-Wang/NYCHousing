import type { Neighborhood } from "@site/content/neighborhoods"
import { Pill } from "./ui"

export function FlagPills({ nb }: { nb: Neighborhood }) {
  return (
    <span className="inline-flex flex-wrap gap-1">
      <Pill tone={nb.parkingZone === 1 ? "gain" : nb.parkingZone === 2 ? "caution" : "loss"}>
        P{nb.parkingZone}
      </Pill>
      {nb.zone485x !== "C" && <Pill tone="caution">485-x {nb.zone485x}</Pill>}
      {nb.ldgma && <Pill tone="loss">LDGMA</Pill>}
      {nb.mih && <Pill tone="primary">MIH</Pill>}
      {nb.historic === "high" && <Pill tone="loss">Historic</Pill>}
      {nb.historic === "some" && <Pill>Some historic</Pill>}
      {nb.flood && <Pill tone="caution">Flood</Pill>}
    </span>
  )
}

export function FlagLegend() {
  return (
    <p className="text-xs leading-relaxed text-muted-foreground">
      P1/P2/P3: City of Yes parking zone (none, reduced, kept). 485-x A/B: higher construction wage
      tiers for 150+ units. LDGMA: Lower Density Growth Management Area. MIH: Mandatory Inclusionary
      Housing mapped by a neighborhood rezoning. Historic: most or some lots in historic districts.
      Flood: much of the area is in the 1% floodplain.
    </p>
  )
}
