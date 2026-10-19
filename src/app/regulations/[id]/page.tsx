import { Callout, Cite, ConfidenceTag, NextLinks, Page, PageHeader, Pill, Section, SourceList, StanceTag, Table } from "@site/components/site/ui"
import { regulationGrid } from "@site/content/illustrate"
import { LINE_BY_ID, money, usd } from "@site/content/model"
import { REG_BY_ID, REGULATIONS } from "@site/content/regulations"
import type { LineId } from "@site/content/types"
import { BOROUGHS } from "@site/content/types"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

export const dynamicParams = false

export function generateStaticParams() {
  return REGULATIONS.map((r) => ({ id: r.id }))
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const r = REG_BY_ID[id]
  return r ? { title: r.title, description: r.short } : {}
}

export default async function RegulationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const r = REG_BY_ID[id]
  if (!r) notFound()
  const i = REGULATIONS.indexOf(r)
  const next = REGULATIONS[(i + 1) % REGULATIONS.length]
  const prev = REGULATIONS[(i - 1 + REGULATIONS.length) % REGULATIONS.length]
  const grid = r.modeled ? regulationGrid(r) : []
  const effectLines =
    typeof r.effect === "function" ? null : (Object.keys(r.effect.lines ?? {}) as LineId[])
  const allSources = [...r.history.flatMap((p) => p.sources), ...r.cost.sources]

  return (
    <Page>
      <PageHeader
        eyebrow={
          <Link href="/regulations" className="hover:underline">
            Regulations · {r.category}
          </Link>
        }
        title={r.title}
        lede={r.short}
      >
        <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
          <StanceTag stance={r.stance} prefix="Suggested: " />
          <Pill>{r.level}</Pill>
          <Pill>Since {r.enacted}</Pill>
          <ConfidenceTag level={r.confidence} />
          {!r.modeled && <Pill tone="caution">Not in the project budget</Pill>}
        </div>
        <p className="mt-3 text-sm text-muted-foreground">Legal basis: {r.citation}</p>
      </PageHeader>

      <Section id="history" title="How it came about">
        <div className="max-w-3xl space-y-4 leading-relaxed">
          {r.history.map((p) => (
            <p key={p.text.slice(0, 40)}>
              {p.text}
              <Cite ids={p.sources} />
            </p>
          ))}
        </div>
        {r.recent && (
          <Callout tone="caution" title="Recent changes (2024–2026)">
            {r.recent}
          </Callout>
        )}
      </Section>

      <Section id="cost" title="What it costs">
        <p className="max-w-3xl leading-relaxed">
          {r.cost.text}
          <Cite ids={r.cost.sources} />
        </p>
        {effectLines && effectLines.length > 0 && (
          <p className="mt-3 text-sm text-muted-foreground">
            Budget lines it moves:{" "}
            {effectLines.map((l, k) => (
              <span key={l}>
                {k > 0 && ", "}
                <Link href={`/costs/${l}`} className="underline">
                  {LINE_BY_ID[l].label}
                </Link>
              </span>
            ))}
          </p>
        )}
        <p className="mt-2 text-sm text-muted-foreground">Where it applies: {r.appliesNote}</p>
        {grid.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-2 font-semibold">Savings per home from removing it, by borough</h3>
            <p className="mb-3 text-sm text-muted-foreground">
              Each cell is a typical neighborhood in that borough at its median asking rent, with the
              conditions this rule needs switched on. Second line: break-even rent change per
              market-rate home each month.
            </p>
            <Table>
              <thead>
                <tr>
                  <th>Building</th>
                  {BOROUGHS.map((b) => (
                    <th key={b} className="text-right">
                      {b}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grid.map((row) => (
                  <tr key={row.proto.id}>
                    <td className="whitespace-nowrap">{row.proto.short}</td>
                    {row.cells.map((c) => (
                      <td key={c.b} className="num text-right">
                        {c.remove ? (
                          <>
                            {money(c.remove.perUnit)}
                            <div className="text-xs text-gain">
                              {c.remove.rent > 0.5 ? `−${usd(c.remove.rent)}/mo` : "–"}
                            </div>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">doesn&apos;t apply</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Section>

      {r.geography && (
        <Section id="geography" title="Borough and neighborhood differences">
          <p className="max-w-3xl leading-relaxed">{r.geography}</p>
        </Section>
      )}

      <Section id="stance" title="Keep, reform or remove?">
        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <Option label="Keep" body="Current law stays as it is." on={r.stance === "keep"} />
          <Option
            label="Reform"
            body={r.reform ? `${r.reform.label} (counted as ${Math.round(r.reform.share * 100)}% of full removal).` : "No partial reform modeled."}
            on={r.stance === "reform"}
          />
          <Option label="Remove" body={r.removeLabel} on={r.stance === "remove"} />
        </div>
        <p className="max-w-3xl leading-relaxed">
          <span className="font-semibold">Why the calculator suggests “{r.stance}”: </span>
          {r.stanceWhy}
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <List title="The case for keeping it" items={r.keepCase} tone="neutral" />
          <List title="The case for changing it" items={r.changeCase} tone="gain" />
        </div>
      </Section>

      <Section id="sources" title="Sources">
        <SourceList ids={allSources} />
      </Section>

      <NextLinks
        links={[
          { href: `/regulations/${prev.id}`, label: `← ${prev.title}` },
          { href: `/regulations/${next.id}`, label: next.title },
        ]}
      />
    </Page>
  )
}

function Option({ label, body, on }: { label: string; body: string; on: boolean }) {
  return (
    <div className={on ? "rounded-md border-2 border-primary bg-accent/50 p-3" : "rounded-md border border-rule bg-card p-3"}>
      <div className="text-sm font-semibold">
        {label} {on && <span className="text-xs font-normal text-primary">· suggested</span>}
      </div>
      <p className="mt-1 text-sm leading-snug text-foreground/75">{body}</p>
    </div>
  )
}

function List({ title, items, tone }: { title: string; items: string[]; tone: "gain" | "neutral" }) {
  if (!items.length) return null
  return (
    <div className={tone === "gain" ? "rounded-md border border-gain/25 bg-gain-soft/50 p-4" : "rounded-md border border-rule bg-card p-4"}>
      <div className="mb-2 text-xs font-semibold tracking-wide uppercase">{title}</div>
      <ul className="list-disc space-y-1.5 pl-5 text-sm leading-snug">
        {items.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
    </div>
  )
}
