import { FlagLegend, FlagPills } from "@site/components/site/flags"
import { Cite, Page, PageHeader, Section, Stat, Table } from "@site/components/site/ui"
import { BOROUGH_NOTES } from "@site/content/boroughs"
import { boroughTypical, summary } from "@site/content/illustrate"
import { money, usd } from "@site/content/model"
import { BOROUGH_RENT, NEIGHBORHOODS, slug } from "@site/content/neighborhoods"
import { LAND_PSF, PROTOTYPES } from "@site/content/project"
import { BOROUGHS } from "@site/content/types"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

export const dynamicParams = false

export function generateStaticParams() {
  return BOROUGHS.map((b) => ({ id: slug(b) }))
}

const bySlug = (id: string) => BOROUGHS.find((b) => slug(b) === id)

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const b = bySlug(id)
  return b ? { title: b, description: BOROUGH_NOTES[b].lede } : {}
}

export default async function BoroughPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const b = bySlug(id)
  if (!b) notFound()
  const notes = BOROUGH_NOTES[b]
  const nbs = NEIGHBORHOODS.filter((n) => n.borough === b)
  const typical = boroughTypical(b)
  return (
    <Page>
      <PageHeader eyebrow={<Link href="/boroughs" className="hover:underline">Boroughs</Link>} title={b} lede={notes.lede} />
      <div className="mb-10 grid gap-3 sm:grid-cols-3">
        <Stat label="Average asking rent" value={usd(BOROUGH_RENT[b])} sub={<>StreetEasy, 12-month mean<Cite ids={["streeteasy-data"]} /></>} />
        <Stat label="Land per buildable sq ft" value={`$${LAND_PSF[b].v}`} sub={`${LAND_PSF[b].confidence} confidence`} />
        <Stat label="Neighborhoods" value={nbs.length} />
      </div>
      <Section id="different" title={`What's different in ${b}`}>
        <ul className="max-w-3xl list-disc space-y-3 pl-5 leading-relaxed">
          {notes.points.map((p) => (
            <li key={p.text.slice(0, 30)}>
              {p.text}
              <Cite ids={p.sources} />
            </li>
          ))}
        </ul>
      </Section>
      <Section id="typical" title="A typical neighborhood here" intro="Borough median rent, the borough's most common parking and wage zone, 485-x, as-of-right.">
        <Table>
          <thead>
            <tr>
              <th>Building</th>
              <th className="text-right">Per home now</th>
              <th className="text-right">Suggested</th>
              <th className="text-right">Break-even now</th>
              <th className="text-right">Suggested</th>
            </tr>
          </thead>
          <tbody>
            {PROTOTYPES.map((p) => {
              const { base, def } = summary(typical, p)
              return (
                <tr key={p.id}>
                  <td>{p.short}</td>
                  <td className="num text-right">{money(base.perUnit)}</td>
                  <td className="num text-right text-gain">{money(def.perUnit)}</td>
                  <td className="num text-right">{usd(base.marketRent)}</td>
                  <td className="num text-right text-gain">{usd(def.marketRent)}</td>
                </tr>
              )
            })}
          </tbody>
        </Table>
      </Section>
      <Section id="neighborhoods" title="Neighborhoods">
        <Table>
          <thead>
            <tr>
              <th>Neighborhood</th>
              <th className="text-right">Avg rent</th>
              <th>Local rules</th>
              <th className="text-right">Mid-rise break-even</th>
            </tr>
          </thead>
          <tbody>
            {nbs.map((n) => {
              const { base, def } = summary(n, PROTOTYPES[1])
              return (
                <tr key={n.slug}>
                  <td><Link href={`/neighborhoods/${n.slug}`} className="font-medium hover:text-primary hover:underline">{n.name}</Link></td>
                  <td className="num text-right">{usd(n.rent)}</td>
                  <td><FlagPills nb={n} /></td>
                  <td className="num text-right">{usd(base.marketRent)} <span className="text-xs text-gain">→ {usd(def.marketRent)}</span></td>
                </tr>
              )
            })}
          </tbody>
        </Table>
        <div className="mt-3"><FlagLegend /></div>
      </Section>
    </Page>
  )
}
