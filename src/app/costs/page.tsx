import { Callout, Cite, Page, PageHeader, Section, StackBar, Table } from "@site/components/site/ui"
import { boroughTypical, summary } from "@site/content/illustrate"
import { LINES, money, pct } from "@site/content/model"
import { moversOf } from "@site/content/movers"
import { PROTOTYPES } from "@site/content/project"
import { BOROUGHS } from "@site/content/types"
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Where the money goes",
  description: "Every line in a New York City apartment development budget, by borough and building type.",
}

const GROUPS = ["Land", "Hard costs", "Soft costs", "Financing & time"] as const
const STYLE: Record<string, string> = {
  Land: "bg-caution/70",
  "Hard costs": "bg-ink/70",
  "Soft costs": "bg-primary/70",
  "Financing & time": "bg-loss/60",
}

export default function CostsPage() {
  const rows = BOROUGHS.flatMap((b) =>
    PROTOTYPES.map((p) => ({ b, p, ...summary(boroughTypical(b), p) })),
  )
  const mid = rows.filter((r) => r.p.id === "mid")
  return (
    <Page>
      <PageHeader
        eyebrow="Where the money goes"
        title="Every cost in a New York apartment project"
        lede={
          <>
            A development budget has four parts: land, construction (hard costs), professional
            and regulatory costs (soft costs), and the cost of money and time. Nationally hard costs
            are about 60% and soft costs 15–30%
            <Cite ids={["vitalcity-campion-2025", "ncsha-soft", "fanniemae-2019"]} />. In New York
            land and time take more.
          </>
        }
      />
      <Section id="by-borough" title="Mid-rise budget by borough" intro="A six-story, 60-unit building in a typical neighborhood of each borough, under current law with the 485-x exemption.">
        <div className="space-y-4">
          {mid.map(({ b, base }) => (
            <div key={b}>
              <div className="mb-1 flex justify-between text-sm">
                <Link href={`/boroughs/${b.toLowerCase().replace(/ /g, "-")}`} className="font-medium hover:underline">{b}</Link>
                <span className="num">{money(base.perUnit)} per home · {money(base.tdc)}</span>
              </div>
              <StackBar
                total={base.tdc}
                parts={GROUPS.map((g) => ({
                  label: g,
                  v: LINES.filter((l) => l.group === g).reduce((s, l) => s + base.lines[l.id], 0),
                  className: STYLE[g],
                }))}
              />
            </div>
          ))}
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            {GROUPS.map((g) => (
              <span key={g} className="flex items-center gap-1.5">
                <span className={`inline-block h-2 w-4 rounded-sm ${STYLE[g]}`} /> {g}
              </span>
            ))}
          </div>
        </div>
      </Section>

      {GROUPS.map((g) => (
        <Section key={g} id={g.toLowerCase().replace(/[^a-z]+/g, "-")} title={g}>
          <Table>
            <thead>
              <tr>
                <th>Line</th>
                <th>What it is</th>
                <th className="text-right">Mid-rise, Brooklyn</th>
                <th className="text-right">Share</th>
                <th className="text-right">Rules that move it</th>
              </tr>
            </thead>
            <tbody>
              {LINES.filter((l) => l.group === g).map((l) => {
                const bk = mid.find((m) => m.b === "Brooklyn")!.base
                return (
                  <tr key={l.id}>
                    <td className="font-medium whitespace-nowrap">
                      <Link href={`/costs/${l.id}`} className="hover:text-primary hover:underline">{l.label}</Link>
                    </td>
                    <td className="text-sm text-foreground/75">{l.what}</td>
                    <td className="num text-right">{money(bk.lines[l.id] / bk.units)}</td>
                    <td className="num text-right">{pct(bk.lines[l.id] / bk.tdc, 1)}</td>
                    <td className="num text-right">{moversOf(l.id).length}</td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        </Section>
      ))}

      <Section id="all" title="Per home, every borough and building type" intro="Total development cost per home under current law (485-x, as-of-right site).">
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
                  const r = rows.find((x) => x.b === b && x.p.id === p.id)!
                  return (
                    <td key={b} className="num text-right">
                      {money(r.base.perUnit)}
                      <div className="text-xs text-gain">{money(r.def.perUnit)} suggested</div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </Table>
        <Callout tone="caution" title="Estimates, not appraisals">
          Hard costs per square foot are calibrated to published surveys (New York ranks first
          worldwide at about US$7,900 per square meter across building types in 2026
          <Cite ids={["nrca-tt-2026"]} />) and to what new buildings must rent for to be built.
          Land prices come from 2025 deal reports. A real project can differ by a third either way.
        </Callout>
      </Section>
    </Page>
  )
}
