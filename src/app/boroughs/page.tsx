import { Cite, Page, PageHeader, Section, Table } from "@site/components/site/ui"
import { BOROUGH_NOTES } from "@site/content/boroughs"
import { boroughTypical, summary } from "@site/content/illustrate"
import { money, usd } from "@site/content/model"
import { BOROUGH_RENT, NEIGHBORHOODS, slug } from "@site/content/neighborhoods"
import { BOROUGH_HARD_FACTOR, LAND_PSF, PROTOTYPE_BY_ID } from "@site/content/project"
import { REGULATIONS } from "@site/content/regulations"
import { BOROUGHS } from "@site/content/types"
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Boroughs",
  description: "How the cost of building housing, and the rules behind it, differ across New York City's five boroughs.",
}

export default function BoroughsPage() {
  const mid = PROTOTYPE_BY_ID.mid
  return (
    <Page>
      <PageHeader
        eyebrow="Boroughs & neighborhoods"
        title="Same city, different rules"
        lede="Most building codes and taxes are citywide, but zoning, wage tiers, parking, landmarks and flood rules vary by borough and neighborhood, and land prices vary most of all."
      />
      <Section id="compare" title="The five boroughs compared">
        <Table>
          <thead>
            <tr>
              <th>Borough</th>
              <th className="text-right">Avg rent</th>
              <th className="text-right">Land / bsf</th>
              <th className="text-right">Hard-cost factor</th>
              <th className="text-right">Parking zones (P1/P2/P3)</th>
              <th className="text-right">Mid-rise per home</th>
              <th className="text-right">Break-even</th>
            </tr>
          </thead>
          <tbody>
            {BOROUGHS.map((b) => {
              const nbs = NEIGHBORHOODS.filter((n) => n.borough === b)
              const z = [1, 2, 3].map((k) => nbs.filter((n) => n.parkingZone === k).length)
              const { base } = summary(boroughTypical(b), mid)
              return (
                <tr key={b}>
                  <td>
                    <Link href={`/boroughs/${slug(b)}`} className="font-medium hover:text-primary hover:underline">{b}</Link>
                  </td>
                  <td className="num text-right">{usd(BOROUGH_RENT[b])}</td>
                  <td className="num text-right">${LAND_PSF[b].v}</td>
                  <td className="num text-right">{BOROUGH_HARD_FACTOR[b].toFixed(2)}×</td>
                  <td className="num text-right">{z.join(" / ")}</td>
                  <td className="num text-right">{money(base.perUnit)}</td>
                  <td className="num text-right">{usd(base.marketRent)}</td>
                </tr>
              )
            })}
          </tbody>
        </Table>
        <p className="mt-2 text-xs text-muted-foreground">
          Parking zones count StreetEasy neighborhoods in each City of Yes zone. Hard-cost factors
          are our estimates of logistics and labor differences relative to Brooklyn.
          <Cite ids={["dcp-city-of-yes"]} />
        </p>
      </Section>
      <Section id="rules" title="Rules that differ by place">
        <Table>
          <thead>
            <tr>
              <th>Rule</th>
              <th>Where it differs</th>
            </tr>
          </thead>
          <tbody>
            {REGULATIONS.filter((r) => r.geography).map((r) => (
              <tr key={r.id}>
                <td className="font-medium whitespace-nowrap">
                  <Link href={`/regulations/${r.id}`} className="hover:text-primary hover:underline">{r.title}</Link>
                </td>
                <td className="text-sm">{r.geography}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Section>
      <Section id="each" title="Each borough">
        <div className="grid gap-4 sm:grid-cols-2">
          {BOROUGHS.map((b) => (
            <Link key={b} href={`/boroughs/${slug(b)}`} className="group rounded-md border border-rule bg-card p-4 hover:border-primary">
              <div className="font-semibold group-hover:text-primary">{b} →</div>
              <p className="mt-1 text-sm text-foreground/75">{BOROUGH_NOTES[b].lede}</p>
            </Link>
          ))}
        </div>
      </Section>
    </Page>
  )
}
