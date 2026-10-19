import { FlagLegend, FlagPills } from "@site/components/site/flags"
import { Callout, Cite, Page, PageHeader, Section, StanceTag, Stat, Table } from "@site/components/site/ui"
import { summary } from "@site/content/illustrate"
import { LINES, money, pct, standalone, usd } from "@site/content/model"
import { BOROUGH_RENT, NEIGHBORHOOD_BY_SLUG, NEIGHBORHOODS } from "@site/content/neighborhoods"
import { landPsfFor, PROTOTYPES } from "@site/content/project"
import { appliesTo, REGULATIONS } from "@site/content/regulations"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

export const dynamicParams = false

export function generateStaticParams() {
  return NEIGHBORHOODS.map((n) => ({ slug: n.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const n = NEIGHBORHOOD_BY_SLUG[slug]
  return n ? { title: `${n.name}, ${n.borough}`, description: `Rent, local rules and the cost to build in ${n.name}.` } : {}
}

export default async function NeighborhoodPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const nb = NEIGHBORHOOD_BY_SLUG[slug]
  if (!nb) notFound()
  const rows = PROTOTYPES.map((p) => ({ p, ...summary(nb, p) }))
  const mid = rows.find((r) => r.p.id === "mid")!
  const boroughRent = BOROUGH_RENT[nb.borough]
  const rules = REGULATIONS.filter((r) => r.modeled && appliesTo(r, mid.ctx))
    .map((r) => ({ r, s: standalone(mid.ctx, r.id, "remove") }))
    .sort((a, b) => b.s.perUnit - a.s.perUnit)
  return (
    <Page>
      <PageHeader
        eyebrow={<Link href={`/boroughs/${nb.borough.toLowerCase().replace(/ /g, "-")}`} className="hover:underline">{nb.borough}</Link>}
        title={nb.boroughWide ? `${nb.name} (borough-wide)` : nb.name}
        lede={nb.note}
      >
        <div className="mt-4"><FlagPills nb={nb} /></div>
      </PageHeader>
      <div className="mb-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Average asking rent" value={usd(nb.rent)} sub={<>12-month mean of medians ({nb.months} months)<Cite ids={["streeteasy-data"]} /></>} />
        <Stat label="Since 2019" value={nb.rent2019 ? `+${pct(nb.rent / nb.rent2019 - 1)}` : "–"} sub={nb.rent2019 ? `2019 average ${usd(nb.rent2019)}` : "No 2019 data"} tone="loss" />
        <Stat label="vs borough" value={pct(nb.rent / boroughRent - 1)} sub={`${nb.borough} averages ${usd(boroughRent)}`} />
        <Stat label="Land, est." value={`$${Math.round(landPsfFor(nb, boroughRent))}`} sub="per buildable sq ft" />
      </div>
      <Section id="buildings" title="What a new building must charge" intro="Break-even rent for a market-rate home, 485-x exemption, as-of-right site.">
        <Table>
          <thead>
            <tr>
              <th>Building</th>
              <th className="text-right">Cost per home</th>
              <th className="text-right">Break-even now</th>
              <th className="text-right">Suggested changes</th>
              <th className="text-right">New-building bar</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ p, base, def }) => (
              <tr key={p.id}>
                <td>{p.short}</td>
                <td className="num text-right">{money(base.perUnit)}<div className="text-xs text-gain">{money(def.perUnit)}</div></td>
                <td className={`num text-right ${base.pencils ? "text-gain" : "text-loss"}`}>{usd(base.marketRent)}</td>
                <td className={`num text-right ${def.pencils ? "text-gain" : "text-loss"}`}>{usd(def.marketRent)}</td>
                <td className="num text-right">{usd(base.bar)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
        <p className="mt-3 text-sm">
          <Link href={`/calculator?n=${nb.slug}`} className="underline">Open {nb.name} in the calculator</Link> to pick your own changes.
        </p>
      </Section>
      <Section id="stack" title="Mid-rise cost stack">
        <Table>
          <thead>
            <tr>
              <th>Line</th>
              <th className="text-right">Current law</th>
              <th className="text-right">Suggested</th>
            </tr>
          </thead>
          <tbody>
            {LINES.map((l) => (
              <tr key={l.id}>
                <td><Link href={`/costs/${l.id}`} className="hover:underline">{l.label}</Link></td>
                <td className="num text-right">{money(mid.base.lines[l.id] / mid.base.units)}</td>
                <td className="num text-right">{money(mid.def.lines[l.id] / mid.def.units)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td>Total per home</td>
              <td className="num text-right">{money(mid.base.perUnit)}</td>
              <td className="num text-right">{money(mid.def.perUnit)}</td>
            </tr>
          </tfoot>
        </Table>
      </Section>
      <Section id="rules" title={`Rules that apply to a mid-rise in ${nb.name}`} intro="Savings per home from removing each alone.">
        <Table>
          <thead>
            <tr>
              <th>Rule</th>
              <th className="text-right">Per home</th>
              <th className="text-right">Rent / month</th>
              <th>Suggested</th>
            </tr>
          </thead>
          <tbody>
            {rules.map(({ r, s }) => (
              <tr key={r.id}>
                <td><Link href={`/regulations/${r.id}`} className="hover:text-primary hover:underline">{r.title}</Link></td>
                <td className="num text-right">{money(s.perUnit)}</td>
                <td className="num text-right">{s.rent > 0.5 ? `−${usd(s.rent)}` : "–"}</td>
                <td><StanceTag stance={r.stance} prefix="" /></td>
              </tr>
            ))}
          </tbody>
        </Table>
        <Callout title="Site-specific rules">
          Rezoning, landmarks and flood rules depend on the exact lot. They are off here unless most
          of the neighborhood is affected; switch them on in the calculator.
        </Callout>
        <FlagLegend />
      </Section>
    </Page>
  )
}
