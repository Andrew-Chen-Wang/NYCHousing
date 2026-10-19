import { Callout, Cite, Page, PageHeader, Section, Table } from "@site/components/site/ui"
import { LINES, pct, usd } from "@site/content/model"
import { ASSUMPTION_INFO, BASE_PRE_MONTHS, DEFAULT_ASSUMPTIONS, PROTOTYPES, TAX_SHARE } from "@site/content/project"
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = { title: "Method & assumptions", description: "How the calculator turns regulations into development cost and rent." }

export default function MethodPage() {
  return (
    <Page>
      <PageHeader
        eyebrow="Method"
        title="How the numbers are built"
        lede="The calculator prices three building types in any neighborhood under current law, then applies each regulation's effect, scaled by your choice. Everything is computed in your browser from the inputs on this page."
      />
      <Section id="buildings" title="1. Three building types">
        <Table>
          <thead>
            <tr>
              <th>Building</th>
              <th className="text-right">Gross sq ft</th>
              <th className="text-right">Hard cost / sq ft</th>
              <th className="text-right">Construction</th>
              <th className="text-right">Parking P2 / P3 / LDGMA</th>
            </tr>
          </thead>
          <tbody>
            {PROTOTYPES.map((p) => (
              <tr key={p.id}>
                <td>
                  <div className="font-medium">{p.label}</div>
                  <div className="text-xs text-foreground/70">{p.description}</div>
                </td>
                <td className="num text-right">{p.gsf.toLocaleString()}</td>
                <td className="num text-right">${p.hardPsf}</td>
                <td className="num text-right">{p.buildMonths} mo</td>
                <td className="num text-right">
                  {p.parkingPerUnit[2]} / {p.parkingPerUnit[3]} / {p.ldgmaParkingPerUnit} per unit at {usd(p.costPerSpace)}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        <p className="mt-3 text-sm text-muted-foreground">
          Hard costs are current-law costs in Brooklyn, scaled by borough. They sit below
          Turner &amp; Townsend's all-building-type average for New York
          <Cite ids={["nrca-tt-2026"]} /> because these are mostly open-shop residential buildings
          <Cite ids={["trd-unions"]} />.
        </p>
      </Section>
      <Section id="budget" title="2. The budget">
        <Table>
          <thead>
            <tr>
              <th>Line</th>
              <th>Formula</th>
            </tr>
          </thead>
          <tbody>
            {LINES.map((l) => (
              <tr key={l.id}>
                <td className="font-medium whitespace-nowrap">
                  <Link href={`/costs/${l.id}`} className="hover:underline">{l.label}</Link>
                </td>
                <td className="text-sm">{l.how}</td>
              </tr>
            ))}
          </tbody>
        </Table>
        <p className="mt-3 text-sm">
          Months before construction start at {BASE_PRE_MONTHS} (design, financing, closing) plus
          every month a regulation adds: permits, utility connections, and for rezonings ULURP,
          environmental review and E-designations, and landmarks review in historic districts.
        </p>
      </Section>
      <Section id="regulations" title="3. Regulations">
        <p className="max-w-3xl leading-relaxed">
          Each regulation states what fully removing it would save: a share of one or more budget
          lines, months of delay, more floor area per lot (less land per building), more homes from
          the same floor area, a change in property tax, an operating cost, or an
          income-restriction requirement. “Remove” applies the whole effect, “Reform” applies the
          stated share, and “Keep” applies none. Shares of the same line multiply rather than add,
          so removing many rules can never push a line below zero. A rule only applies when its
          conditions hold: borough, neighborhood zone, building size, tax path and site.
        </p>
      </Section>
      <Section id="rent" title="4. From cost to rent">
        <ol className="max-w-3xl list-decimal space-y-2 pl-5 leading-relaxed">
          <li>Required net operating income = total development cost × required yield on cost.</li>
          <li>
            Effective gross income = (net operating income + operating costs) ÷ (1 − property tax
            share). Property tax is {pct(TAX_SHARE.full)} of income for a fully taxed building
            <Cite ids={["cbc-421a-2022"]} /> and {pct(TAX_SHARE.exempt485x)} under 485-x, which
            leaves the land taxed.
          </li>
          <li>Gross rent = effective gross income ÷ (1 − vacancy), divided by homes and 12 months.</li>
          <li>
            Income-restricted homes (MIH: 25% at 60% AMI; 485-x: 20–25% at 80% AMI) pay their capped
            rents; market-rate homes cover the rest. That market-rate figure is the break-even rent.
          </li>
          <li>
            A project pencils when break-even rent is at or below the neighborhood&apos;s average
            asking rent plus a new-building premium.
          </li>
        </ol>
        <Callout tone="caution" title="What break-even rent is, and isn't">
          It is the rent a new building needs to get built, not a prediction of what existing
          tenants will pay. Lower development costs bring down rents mainly by letting more
          buildings pencil, adding supply, rather than by lowering the rent on any one lease.
        </Callout>
      </Section>
      <Section id="assumptions" title="5. Assumptions you can change">
        <Table>
          <thead>
            <tr>
              <th>Input</th>
              <th className="text-right">Default</th>
              <th>Why</th>
            </tr>
          </thead>
          <tbody>
            {(Object.keys(ASSUMPTION_INFO) as (keyof typeof ASSUMPTION_INFO)[]).map((k) => (
              <tr key={k}>
                <td className="font-medium">{ASSUMPTION_INFO[k].label}</td>
                <td className="num text-right">
                  {ASSUMPTION_INFO[k].unit === "%" ? pct(DEFAULT_ASSUMPTIONS[k], 2) : usd(DEFAULT_ASSUMPTIONS[k])}
                </td>
                <td className="text-sm">
                  {ASSUMPTION_INFO[k].why}
                  <Cite ids={ASSUMPTION_INFO[k].sources} />
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Section>
      <Section id="limits" title="6. Limits">
        <ul className="max-w-3xl list-disc space-y-2 pl-5 leading-relaxed">
          <li>
            Many regulatory costs have never been measured. Where we found a published figure we use
            it; otherwise each regulation page says the number is our estimate and gives its
            confidence.
          </li>
          <li>
            Neighborhood flags describe most of a neighborhood, not every lot. Land price is a
            borough average scaled by relative rent, not a site appraisal.
          </li>
          <li>
            The prototypes are privately financed. Subsidized affordable projects face extra rules
            (prevailing wage, HPD design guidelines, M/WBE goals) that are listed but not priced.
          </li>
          <li>
            The model does not estimate how many more homes would be built or how much
            neighborhood rents would fall in response; the count of neighborhoods where a project
            pencils is a rough guide to that.
          </li>
        </ul>
      </Section>
    </Page>
  )
}
