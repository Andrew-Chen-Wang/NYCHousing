import { Page, PageHeader, Section } from "@site/components/site/ui"
import { SOURCES } from "@site/content/sources"
import type { Source } from "@site/content/types"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Sources", description: "Every source cited on the site." }

const KIND_LABEL: Record<Source["kind"], string> = {
  law: "Laws, bills and code text",
  government: "Government reports and agency pages",
  hearing: "Hearings and testimony",
  research: "Research and analysis",
  news: "News reports",
  industry: "Industry and law-firm analysis",
  advocacy: "Advocacy groups",
  data: "Data",
}

export default function SourcesPage() {
  const kinds = Object.keys(KIND_LABEL) as Source["kind"][]
  return (
    <Page>
      <PageHeader
        eyebrow="Sources"
        title={`${SOURCES.length} sources`}
        lede="Grouped by type so you can weigh them: industry and advocacy sources have a stake in the outcome, and we say so where we use them."
      />
      {kinds.map((k) => {
        const list = SOURCES.filter((s) => s.kind === k).sort((a, b) => b.year - a.year)
        if (!list.length) return null
        return (
          <Section key={k} id={k} title={KIND_LABEL[k]}>
            <ol className="space-y-2.5 text-sm">
              {list.map((s) => (
                <li key={s.id} id={s.id} className="leading-snug">
                  <a href={s.url} target="_blank" rel="noreferrer" className="font-medium underline decoration-rule underline-offset-2 hover:decoration-primary">
                    {s.title}
                  </a>
                  <span className="text-muted-foreground"> · {s.org}, {s.year}</span>
                  {s.note && <div className="text-xs text-muted-foreground">{s.note}</div>}
                </li>
              ))}
            </ol>
          </Section>
        )
      })}
    </Page>
  )
}
