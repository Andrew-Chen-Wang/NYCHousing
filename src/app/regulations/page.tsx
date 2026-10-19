import { Page, PageHeader, Pill, Section, StanceTag, Table } from "@site/components/site/ui"
import { boroughTypical, ctxWhereApplies } from "@site/content/illustrate"
import { money, standalone } from "@site/content/model"
import { PROTOTYPE_BY_ID } from "@site/content/project"
import { CATEGORIES, REGULATIONS } from "@site/content/regulations"
import { slug } from "@site/content/neighborhoods"
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Regulations",
  description: "Every law and rule that adds to the cost of building housing in New York City, with history, citations and estimated cost.",
}

export default function RegulationsPage() {
  const nb = boroughTypical("Brooklyn")
  const proto = PROTOTYPE_BY_ID.mid
  return (
    <Page>
      <PageHeader
        eyebrow="Regulations"
        title={`${REGULATIONS.length} rules that shape what housing costs`}
        lede="City zoning and codes, state tax and labor law, utility rules and federal tariffs. Each entry says when and why it was adopted, what it costs, where in the city it applies, and whether the calculator suggests keeping, reforming or removing it."
      >
        <p className="mt-4 text-sm text-muted-foreground">
          “Per home” is what removing the rule alone would save on a {proto.short} building in a
          typical Brooklyn neighborhood, with the site conditions the rule needs (a rezoning,
          historic district or floodplain) switched on.
        </p>
      </PageHeader>
      {CATEGORIES.map((cat) => (
        <Section key={cat} id={slug(cat)} title={cat}>
          <Table>
            <thead>
              <tr>
                <th>Rule</th>
                <th>Level · since</th>
                <th className="text-right">Per home</th>
                <th>Suggested</th>
              </tr>
            </thead>
            <tbody>
              {REGULATIONS.filter((r) => r.category === cat).map((r) => {
                const ctx = r.modeled ? ctxWhereApplies(r, proto, nb) : null
                const s = ctx ? standalone(ctx, r.id, "remove") : null
                return (
                  <tr key={r.id}>
                    <td className="max-w-md">
                      <Link href={`/regulations/${r.id}`} className="font-medium hover:text-primary hover:underline">
                        {r.title}
                      </Link>
                      <div className="text-xs leading-snug text-foreground/70">{r.short}</div>
                    </td>
                    <td className="text-xs whitespace-nowrap text-muted-foreground">
                      {r.level}
                      <br />
                      {r.enacted.split(";")[0]}
                    </td>
                    <td className="num text-right whitespace-nowrap">
                      {s ? money(s.perUnit) : r.modeled ? "n/a here" : <Pill>not in budget</Pill>}
                      {s && s.perUnit < 1 && s.rent > 0.5 && (
                        <div className="text-xs text-muted-foreground">rent effect</div>
                      )}
                    </td>
                    <td>
                      <StanceTag stance={r.stance} prefix="" />
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
