import { Cite, NextLinks, Page, PageHeader, Section, StanceTag, Table } from "@site/components/site/ui"
import { boroughTypical, summary } from "@site/content/illustrate"
import { LINE_BY_ID, LINES, money, pct } from "@site/content/model"
import { moversOf } from "@site/content/movers"
import { LAND_PSF, PROTOTYPES } from "@site/content/project"
import { BOROUGHS, type LineId } from "@site/content/types"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

export const dynamicParams = false

export function generateStaticParams() {
  return LINES.map((l) => ({ id: l.id }))
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const l = LINE_BY_ID[id as LineId]
  return l ? { title: l.label, description: l.what } : {}
}

export default async function CostLinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const line = LINE_BY_ID[id as LineId]
  if (!line) notFound()
  const i = LINES.indexOf(line)
  const next = LINES[(i + 1) % LINES.length]
  const movers = moversOf(line.id)
  return (
    <Page>
      <PageHeader
        eyebrow={<Link href="/costs" className="hover:underline">Where the money goes · {line.group}</Link>}
        title={line.label}
        lede={line.what}
      />
      <Section id="how" title="How it's estimated">
        <p className="max-w-3xl leading-relaxed">{line.how}</p>
        {line.id === "land" && (
          <div className="mt-5">
            <Table>
              <thead>
                <tr>
                  <th>Borough</th>
                  <th className="text-right">Per buildable sq ft</th>
                  <th>Basis</th>
                </tr>
              </thead>
              <tbody>
                {BOROUGHS.map((b) => (
                  <tr key={b}>
                    <td>{b}</td>
                    <td className="num text-right">${LAND_PSF[b].v}</td>
                    <td className="text-sm">
                      {LAND_PSF[b].note} <span className="text-xs text-muted-foreground">({LAND_PSF[b].confidence} confidence)</span>
                      <Cite ids={LAND_PSF[b].sources} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Section>
      <Section id="by-borough" title="Per home, current law" intro="Typical neighborhood in each borough, 485-x, as-of-right site. Second line: share of total development cost.">
        <Table>
          <thead>
            <tr>
              <th>Building</th>
              {BOROUGHS.map((b) => (
                <th key={b} className="text-right">{b}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PROTOTYPES.map((p) => (
              <tr key={p.id}>
                <td className="whitespace-nowrap">{p.short}</td>
                {BOROUGHS.map((b) => {
                  const { base } = summary(boroughTypical(b), p)
                  return (
                    <td key={b} className="num text-right">
                      {money(base.lines[line.id] / base.units)}
                      <div className="text-xs text-muted-foreground">{pct(base.lines[line.id] / base.tdc, 1)}</div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </Table>
      </Section>
      <Section id="rules" title="Regulations that move this line">
        {movers.length === 0 ? (
          <p className="text-foreground/75">No regulation in the catalog changes this line directly.</p>
        ) : (
          <Table>
            <thead>
              <tr>
                <th>Rule</th>
                <th>Effect</th>
                <th>Suggested</th>
              </tr>
            </thead>
            <tbody>
              {movers.map(({ r, how }) => (
                <tr key={r.id}>
                  <td>
                    <Link href={`/regulations/${r.id}`} className="font-medium hover:text-primary hover:underline">{r.title}</Link>
                  </td>
                  <td className="text-sm">{how}</td>
                  <td><StanceTag stance={r.stance} prefix="" /></td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Section>
      <NextLinks links={[{ href: "/costs", label: "All cost lines" }, { href: `/costs/${next.id}`, label: next.label }]} />
    </Page>
  )
}
