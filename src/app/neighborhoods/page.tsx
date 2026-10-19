import { FlagLegend, FlagPills } from "@site/components/site/flags"
import { Cite, Page, PageHeader, Section, Table } from "@site/components/site/ui"
import { summary } from "@site/content/illustrate"
import { pct, usd } from "@site/content/model"
import { NEIGHBORHOODS } from "@site/content/neighborhoods"
import { PROTOTYPE_BY_ID } from "@site/content/project"
import { RENT_WINDOW } from "@site/content/rents.generated"
import { BOROUGHS } from "@site/content/types"
import { slug } from "@site/content/neighborhoods"
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Every neighborhood",
  description: "Average asking rent, local rules, and the break-even rent for a new building in every New York City neighborhood.",
}

export default function NeighborhoodsPage() {
  const proto = PROTOTYPE_BY_ID.mid
  return (
    <Page wide>
      <PageHeader
        eyebrow="Neighborhoods"
        title={`Rent and the cost to build in ${NEIGHBORHOODS.length} neighborhoods`}
        lede={
          <>
            Average rent is the mean of StreetEasy&apos;s monthly median asking rents from{" "}
            {RENT_WINDOW.from} to {RENT_WINDOW.to}
            <Cite ids={["streeteasy-data"]} />. Break-even is the rent a new market-rate home must charge in a{" "}
            {proto.short} building using the 485-x exemption, under current law and with the suggested
            changes. Staten Island appears as one borough-wide row because StreetEasy doesn&apos;t
            publish its neighborhoods.
          </>
        }
      >
        <div className="mt-4">
          <FlagLegend />
        </div>
      </PageHeader>
      {BOROUGHS.map((b) => (
        <Section key={b} id={slug(b)} title={b}>
          <Table>
            <thead>
              <tr>
                <th>Neighborhood</th>
                <th className="text-right">Avg rent</th>
                <th className="text-right">vs 2019</th>
                <th>Local rules</th>
                <th className="text-right">Break-even now</th>
                <th className="text-right">Suggested</th>
                <th>Pencils?</th>
              </tr>
            </thead>
            <tbody>
              {NEIGHBORHOODS.filter((n) => n.borough === b).map((n) => {
                const { base, def } = summary(n, proto)
                return (
                  <tr key={n.slug}>
                    <td>
                      <Link href={`/neighborhoods/${n.slug}`} className="font-medium hover:text-primary hover:underline">
                        {n.name}
                      </Link>
                    </td>
                    <td className="num text-right">{usd(n.rent)}</td>
                    <td className="num text-right text-xs">
                      {n.rent2019 ? `+${pct(n.rent / n.rent2019 - 1)}` : "–"}
                    </td>
                    <td><FlagPills nb={n} /></td>
                    <td className="num text-right">{usd(base.marketRent)}</td>
                    <td className="num text-right text-gain">{usd(def.marketRent)}</td>
                    <td className="text-xs whitespace-nowrap">
                      {base.pencils ? "Yes" : def.pencils ? <span className="text-gain">With changes</span> : <span className="text-loss">No</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        </Section>
      ))}
    </Page>
  )
}
