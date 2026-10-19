import { Callout, Cite, Page, PageHeader, Pill, Section, StackBar, StanceTag, Stat, Table } from "@site/components/site/ui"
import { summary } from "@site/content/illustrate"
import { feasibility, LINES, money, pct, standalone, usd } from "@site/content/model"
import { NEIGHBORHOOD_BY_SLUG, NEIGHBORHOODS, CITY_RENT } from "@site/content/neighborhoods"
import { PROTOTYPE_BY_ID } from "@site/content/project"
import { appliesTo, CATEGORIES, DEFAULT_CHOICES, REGULATIONS } from "@site/content/regulations"
import { RENT_WINDOW } from "@site/content/rents.generated"
import Link from "next/link"

const GROUP_STYLE: Record<string, string> = {
  Land: "bg-caution/70",
  "Hard costs": "bg-ink/70",
  "Soft costs": "bg-primary/70",
  "Financing & time": "bg-loss/60",
}

export default function Home() {
  const nb = NEIGHBORHOOD_BY_SLUG["bedford-stuyvesant"]
  const proto = PROTOTYPE_BY_ID.mid
  const { ctx, base, def } = summary(nb, proto)
  const groups = ["Land", "Hard costs", "Soft costs", "Financing & time"].map((g) => ({
    label: g,
    v: LINES.filter((l) => l.group === g).reduce((s, l) => s + base.lines[l.id], 0),
    className: GROUP_STYLE[g],
  }))
  const feas = feasibility(proto, "485x", false, DEFAULT_CHOICES, NEIGHBORHOODS)
  const top = REGULATIONS.filter((r) => r.modeled && appliesTo(r, ctx))
    .map((r) => ({ r, s: standalone(ctx, r.id, "remove") }))
    .sort((x, y) => y.s.perUnit - x.s.perUnit)
    .slice(0, 12)
  const counts = { keep: 0, reform: 0, remove: 0 }
  for (const r of REGULATIONS) counts[r.stance]++

  return (
    <Page>
      <PageHeader
        eyebrow="New York City · 2026"
        title="What it costs to build a home in New York, and which rules could go"
        lede={
          <>
            New York is the most expensive place in the world to build
            <Cite ids={["tt-2025", "nrca-tt-2026"]} />. This site lays out every cost in a typical
            apartment project, from land to the mortgage recording tax, and{" "}
            {REGULATIONS.length} laws and rules that add to them, each with its history and
            citations. Then a calculator lets you choose which to keep and see the change in total
            development cost and in the rent a new home has to charge.
          </>
        }
      >
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/calculator" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Open the calculator →
          </Link>
          <Link href="/regulations" className="rounded-md border border-rule bg-card px-4 py-2 text-sm font-medium hover:border-primary">
            Browse all {REGULATIONS.length} regulations
          </Link>
        </div>
      </PageHeader>

      <Section
        id="example"
        title={`A typical project: ${proto.short} in ${nb.name}`}
        intro={
          <>
            A six-story, 60-unit elevator building on a mid-block lot, using the 485-x tax
            exemption, as many Brooklyn projects do today. Every figure below comes from the same
            model as the calculator; change any of it there.
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Total development cost" value={money(base.tdc)} sub={`${money(base.perUnit)} per home under current law`} />
          <Stat label="Break-even rent" value={usd(base.marketRent)} sub={`per market-rate home; ${nb.name} averages ${usd(nb.rent)}`} tone="loss" />
          <Stat label="With suggested changes" value={money(def.perUnit)} sub={`per home: ${pct((base.perUnit - def.perUnit) / base.perUnit)} less`} tone="gain" />
          <Stat label="Break-even rent after" value={usd(def.marketRent)} sub={`${usd(base.marketRent - def.marketRent)} a month less`} tone="gain" />
        </div>
        <div className="mt-6">
          <StackBar parts={groups} total={base.tdc} />
          <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
            {groups.map((g) => (
              <span key={g.label} className="flex items-center gap-1.5">
                <span className={`inline-block h-2 w-4 rounded-sm ${g.className}`} /> {g.label}{" "}
                {pct(g.v / base.tdc)}
              </span>
            ))}
          </div>
        </div>
        <Callout title="Why so few projects pencil">
          A new market-rate home here must rent for about {usd(base.marketRent)} a month to earn
          the {pct(0.055, 1)} return lenders and investors require, while a new building in{" "}
          {nb.name} can charge roughly {usd(base.bar)}. Across the city this building pencils in{" "}
          {feas.filter((f) => f.base.pencils).length} of {feas.length} neighborhoods under current
          law and {feas.filter((f) => f.scen.pencils).length} with the suggested changes. That gap
          is why the city's vacancy rate is 1.4%, the lowest since 1968
          <Cite ids={["vitalcity-campion-2025"]} />.
        </Callout>
      </Section>

      <Section
        id="biggest"
        title="The biggest regulatory costs in this project"
        intro="What removing each rule alone would save per home, starting from current law. Some are worth keeping anyway."
      >
        <Table>
          <thead>
            <tr>
              <th>Regulation</th>
              <th className="text-right">Per home</th>
              <th className="text-right">Rent / month</th>
              <th>Suggested</th>
            </tr>
          </thead>
          <tbody>
            {top.map(({ r, s }) => (
              <tr key={r.id}>
                <td>
                  <Link href={`/regulations/${r.id}`} className="font-medium hover:text-primary hover:underline">
                    {r.title}
                  </Link>
                  <div className="text-xs text-muted-foreground">{r.category}</div>
                </td>
                <td className="num text-right">{money(s.perUnit)}</td>
                <td className="num text-right">{s.rent > 0.5 ? `−${usd(s.rent)}` : "–"}</td>
                <td>
                  <StanceTag stance={r.stance} prefix="" />
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Section>

      <Section
        id="defaults"
        title="Suggested starting point"
        intro={
          <>
            Not everything should go. Of {REGULATIONS.length} rules, the calculator starts with{" "}
            {counts.remove} removed, {counts.reform} reformed and {counts.keep} kept. Removal is
            suggested where evidence says the rule adds cost without matching benefit (the Scaffold
            Law's absolute liability, the two-stair rule, parking mandates); reform where the goal
            is right but the method is costly (ULURP's member deference, landmarks review of new
            buildings); and keep where the protection is worth it (sprinklers, flood-resistant
            construction, accessibility, all-electric buildings).
          </>
        }
      >
        <div className="grid gap-4 md:grid-cols-3">
          {(["remove", "reform", "keep"] as const).map((s) => (
            <div key={s} className="rounded-md border border-rule bg-card p-4">
              <div className="mb-2">
                <StanceTag stance={s} prefix="" /> <span className="text-sm text-muted-foreground">{counts[s]} rules</span>
              </div>
              <ul className="space-y-1 text-sm">
                {REGULATIONS.filter((r) => r.stance === s).map((r) => (
                  <li key={r.id}>
                    <Link href={`/regulations/${r.id}`} className="hover:text-primary hover:underline">
                      {r.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section id="map" title="How the site is organized">
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            ["/costs", "Where the money goes", "Each budget line in a New York apartment project, how it's estimated, and which rules move it."],
            ["/regulations", "Regulations", `${REGULATIONS.length} laws and rules in ${CATEGORIES.length} categories, each with history from news reports, hearings and studies.`],
            ["/boroughs", "Boroughs & neighborhoods", `Rules that differ by borough and neighborhood, with average asking rents for ${NEIGHBORHOODS.length} areas (citywide ${usd(CITY_RENT)}).`],
            ["/calculator", "Calculator", "Choose keep, reform or remove for each rule and see development cost, savings and break-even rent."],
          ].map(([href, title, body]) => (
            <Link key={href} href={href} className="group rounded-md border border-rule bg-card p-4 hover:border-primary">
              <div className="font-semibold group-hover:text-primary">{title} →</div>
              <p className="mt-1 text-sm text-foreground/75">{body}</p>
            </Link>
          ))}
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          Rents: StreetEasy median asking rents, averaged {RENT_WINDOW.from} to {RENT_WINDOW.to}
          <Cite ids={["streeteasy-data"]} />. Recent law reflected: City of Yes (Dec. 2024), 485-x
          (2024), Charter Proposals 2–4 (Nov. 2025), the state SEQRA exemption (May 2026) and the
          2026 rent freeze. <Pill tone="caution">Estimates</Pill> Many regulatory costs have never
          been measured; each page says how its number was built and how confident we are.
        </p>
      </Section>
    </Page>
  )
}
