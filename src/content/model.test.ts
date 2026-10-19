import assert from "node:assert/strict"
import { test } from "node:test"
import { BOROUGH_NOTES } from "./boroughs"
import { compute, LINES, standalone } from "./model"
import { FLAGGED_NAMES, NEIGHBORHOODS } from "./neighborhoods"
import { type Ctx, defaultSite, PROTOTYPES, type TaxPath } from "./project"
import { DEFAULT_CHOICES, KEEP_ALL, REGULATIONS } from "./regulations"
import { RENTS } from "./rents.generated"
import { SOURCE_BY_ID } from "./sources"

const REMOVE_ALL = Object.fromEntries(REGULATIONS.map((r) => [r.id, "remove" as const]))

function* contexts(): Generator<Ctx> {
  for (const nb of NEIGHBORHOODS)
    for (const proto of PROTOTYPES)
      for (const tax of ["485x", "full"] as TaxPath[])
        for (const rezoning of [false, true])
          yield { nb, proto, tax, site: { ...defaultSite(nb), rezoning } }
}

test("every citation resolves to a source", () => {
  const cited = [
    ...REGULATIONS.flatMap((r) => [...r.history.flatMap((p) => p.sources), ...r.cost.sources]),
    ...Object.values(BOROUGH_NOTES).flatMap((b) => b.points.flatMap((p) => p.sources)),
  ]
  const missing = cited.filter((id) => !SOURCE_BY_ID[id])
  assert.deepEqual(missing, [])
})

test("every hand-set neighborhood flag matches a StreetEasy area", () => {
  const names = new Set(RENTS.map((r) => r.name))
  // Co-op City, Laconia and similar have too few listings some years; they may drop out.
  const unknown = FLAGGED_NAMES.filter((n) => !names.has(n))
  assert.ok(unknown.length <= 6, `unknown flag keys: ${unknown.join(", ")}`)
})

test("regulation ids are unique and stances are valid", () => {
  const ids = REGULATIONS.map((r) => r.id)
  assert.equal(new Set(ids).size, ids.length)
  for (const r of REGULATIONS) {
    if (r.stance === "reform") assert.ok(r.reform, `${r.id} defaults to reform without one`)
  }
})

test("removing rules never raises cost, rent or time, and lines stay non-negative", () => {
  for (const ctx of contexts()) {
    const base = compute(ctx, KEEP_ALL)
    for (const choices of [DEFAULT_CHOICES, REMOVE_ALL]) {
      const s = compute(ctx, choices)
      assert.ok(s.perUnit <= base.perUnit + 1e-6, `${ctx.nb.slug} ${ctx.proto.id}`)
      assert.ok(s.marketRent <= base.marketRent + 1e-6)
      assert.ok(s.preMonths + s.buildMonths <= base.preMonths + base.buildMonths + 1e-9)
      for (const l of LINES) assert.ok(s.lines[l.id] >= 0, `${l.id} negative`)
    }
  }
})

test("each modeled rule's standalone saving is non-negative where it applies", () => {
  const nb = NEIGHBORHOODS.find((n) => n.slug === "astoria")!
  for (const proto of PROTOTYPES) {
    const ctx: Ctx = { nb, proto, tax: "485x", site: { rezoning: true, historic: true, flood: true } }
    for (const r of REGULATIONS.filter((x) => x.modeled)) {
      const s = standalone(ctx, r.id, "remove")
      assert.ok(s.perUnit >= -1e-6 && s.rent >= -1e-6, r.id)
    }
  }
})
