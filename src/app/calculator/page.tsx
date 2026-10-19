import { Page, PageHeader } from "@site/components/site/ui"
import type { Metadata } from "next"
import Link from "next/link"
import { Calculator } from "./calculator"

export const metadata: Metadata = {
  title: "Cost & rent calculator",
  description:
    "Pick a neighborhood and building, choose which regulations to keep, reform or remove, and see total development cost, savings and break-even rent.",
}

export default function CalculatorPage() {
  return (
    <Page wide>
      <PageHeader
        eyebrow="Calculator"
        title="What would it cost to build, and what would it rent for?"
        lede={
          <>
            Pick a neighborhood and a building. Every rule that applies there is listed with its
            current-law cost; choose to keep, reform or remove each one and watch total development
            cost, savings, and the rent a new home must charge to break even. The suggested
            starting point removes or reforms rules we think could reasonably go and keeps the rest.
            See the <Link href="/method" className="underline">method</Link> for every formula.
          </>
        }
      />
      <Calculator />
    </Page>
  )
}
