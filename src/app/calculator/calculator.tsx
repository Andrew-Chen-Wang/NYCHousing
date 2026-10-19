"use client"
/** The cost and rent calculator. Picks and inputs live in this browser's localStorage. */
import { Button } from "@site/components/ui/button"
import { compute, feasibility, LINES, money, pct, standalone, usd } from "@site/content/model"
import { NEIGHBORHOOD_BY_SLUG, NEIGHBORHOODS } from "@site/content/neighborhoods"
import {
  ASSUMPTION_INFO,
  type Assumptions,
  type Ctx,
  DEFAULT_ASSUMPTIONS,
  defaultSite,
  PROTOTYPE_BY_ID,
  PROTOTYPES,
  type Prototype,
  type Site,
  type TaxPath,
} from "@site/content/project"
import {
  appliesTo,
  CATEGORIES,
  type Choices,
  DEFAULT_CHOICES,
  KEEP_ALL,
  REGULATIONS,
} from "@site/content/regulations"
import { BOROUGHS, type Stance } from "@site/content/types"
import { cn } from "@site/lib/utils"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

const STORAGE_KEY = "nychousing:calculator:v1"
const MODELED = REGULATIONS.filter((r) => r.modeled)
const REMOVE_ALL: Choices = Object.fromEntries(REGULATIONS.map((r) => [r.id, "remove" as Stance]))

type Saved = {
  nb: string
  proto: Prototype["id"]
  tax: TaxPath
  site: Site
  choices: Choices
  a: Assumptions
}

function load(): Partial<Saved> | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Partial<Saved>) : null
  } catch {
    return null
  }
}

function save(s: Saved) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
  } catch {
    // Storage can be blocked; the calculator still works for this visit.
  }
}

const DEFAULT_NB = "bedford-stuyvesant"

export function Calculator() {
  const [nbSlug, setNbSlug] = useState(DEFAULT_NB)
  const [protoId, setProtoId] = useState<Prototype["id"]>("mid")
  const [tax, setTax] = useState<TaxPath>("485x")
  const [site, setSite] = useState<Site>(defaultSite(NEIGHBORHOOD_BY_SLUG[DEFAULT_NB]))
  const [choices, setChoices] = useState<Choices>(DEFAULT_CHOICES)
  const [a, setA] = useState<Assumptions>(DEFAULT_ASSUMPTIONS)
  const [ready, setReady] = useState(false)

  // Restore from storage, or from ?n=<neighborhood> when linked from a neighborhood page.
  useEffect(() => {
    const s = load()
    const fromUrl = new URLSearchParams(window.location.search).get("n")
    if (s) {
      if (s.nb && NEIGHBORHOOD_BY_SLUG[s.nb]) setNbSlug(s.nb)
      if (s.proto && PROTOTYPE_BY_ID[s.proto]) setProtoId(s.proto)
      if (s.tax) setTax(s.tax)
      if (s.site) setSite(s.site)
      if (s.choices) setChoices({ ...DEFAULT_CHOICES, ...s.choices })
      if (s.a) setA({ ...DEFAULT_ASSUMPTIONS, ...s.a })
    }
    if (fromUrl && NEIGHBORHOOD_BY_SLUG[fromUrl]) {
      setNbSlug(fromUrl)
      setSite((cur) => ({ ...defaultSite(NEIGHBORHOOD_BY_SLUG[fromUrl]), rezoning: cur.rezoning }))
    }
    setReady(true)
  }, [])

  useEffect(() => {
    if (ready) save({ nb: nbSlug, proto: protoId, tax, site, choices, a })
  }, [ready, nbSlug, protoId, tax, site, choices, a])

  const nb = NEIGHBORHOOD_BY_SLUG[nbSlug]
  const proto = PROTOTYPE_BY_ID[protoId]
  const ctx: Ctx = { proto, nb, site, tax }
  const base = compute(ctx, KEEP_ALL, a)
  const scen = compute(ctx, choices, a)

  const feas = useMemo(
    () => feasibility(proto, tax, site.rezoning, choices, NEIGHBORHOODS, a),
    [proto, tax, site.rezoning, choices, a],
  )
  const feasBase = feas.filter((f) => f.base.pencils).length
  const feasScen = feas.filter((f) => f.scen.pencils).length

  const saved = base.tdc - scen.tdc
  const savedPerUnit = base.perUnit - scen.perUnit
  const rentDrop = base.marketRent - scen.marketRent
  const monthsSaved = base.preMonths + base.buildMonths - scen.preMonths - scen.buildMonths

  const pickNb = (s: string) => {
    setNbSlug(s)
    setSite((cur) => ({ ...defaultSite(NEIGHBORHOOD_BY_SLUG[s]), rezoning: cur.rezoning }))
  }
  const setChoice = (id: string, s: Stance) => {
    setChoices((c) => ({ ...c, [id]: s }))
  }

  return (
    <div className="pb-20 lg:pb-0">
      {/* Project inputs */}
      <section className="mb-8 rounded-md border border-rule bg-card p-5" aria-label="Project">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Neighborhood</span>
            <select
              value={nbSlug}
              onChange={(e) => {
                pickNb(e.target.value)
              }}
              className="h-10 w-full rounded-md border border-rule bg-background px-2"
            >
              {BOROUGHS.map((b) => (
                <optgroup key={b} label={b}>
                  {NEIGHBORHOODS.filter((n) => n.borough === b).map((n) => (
                    <option key={n.slug} value={n.slug}>
                      {n.boroughWide ? `${n.name} (borough-wide)` : n.name} · {usd(n.rent)}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <Link href={`/neighborhoods/${nb.slug}`} className="mt-1 inline-block text-xs underline">
              About {nb.name}
            </Link>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Building</span>
            <select
              value={protoId}
              onChange={(e) => {
                setProtoId(e.target.value as Prototype["id"])
              }}
              className="h-10 w-full rounded-md border border-rule bg-background px-2"
            >
              {PROTOTYPES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs text-muted-foreground">
              {proto.gsf.toLocaleString()} gross sq ft
            </span>
          </label>
          <fieldset className="text-sm">
            <legend className="mb-1 font-medium">Property tax</legend>
            {(
              [
                ["485x", "485-x exemption (with affordability and wage rules)"],
                ["full", "Full property tax, no set-aside"],
              ] as const
            ).map(([v, label]) => (
              <label key={v} className="flex items-start gap-2 py-0.5">
                <input
                  type="radio"
                  name="tax"
                  checked={tax === v}
                  onChange={() => {
                    setTax(v)
                  }}
                  className="mt-1"
                />
                <span>{label}</span>
              </label>
            ))}
          </fieldset>
          <fieldset className="text-sm">
            <legend className="mb-1 font-medium">Site</legend>
            {(
              [
                ["rezoning", "Needs a rezoning (ULURP)"],
                ["historic", "In a historic district"],
                ["flood", "In the floodplain"],
              ] as const
            ).map(([k, label]) => (
              <label key={k} className="flex items-start gap-2 py-0.5">
                <input
                  type="checkbox"
                  checked={site[k]}
                  onChange={(e) => {
                    setSite((s) => ({ ...s, [k]: e.target.checked }))
                  }}
                  className="mt-1"
                />
                <span>{label}</span>
              </label>
            ))}
          </fieldset>
        </div>
        <NeighborhoodRules ctx={ctx} />
      </section>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Start from:</span>
        <Button
          variant="outline"
          className="h-10"
          onClick={() => {
            setChoices(DEFAULT_CHOICES)
          }}
        >
          Suggested changes
        </Button>
        <Button
          variant="outline"
          className="h-10"
          onClick={() => {
            setChoices(KEEP_ALL)
          }}
        >
          Current law (keep everything)
        </Button>
        <Button
          variant="outline"
          className="h-10"
          onClick={() => {
            setChoices(REMOVE_ALL)
          }}
        >
          Remove everything
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-10">
          {CATEGORIES.map((cat) => {
            const regs = MODELED.filter((r) => r.category === cat)
            if (!regs.length) return null
            return (
              <section key={cat}>
                <h2 className="mb-2 text-lg font-semibold">{cat}</h2>
                <ul className="divide-y divide-rule border-y border-rule">
                  {regs.map((r) => {
                    const on = appliesTo(r, ctx)
                    const c = choices[r.id] ?? "keep"
                    const effect = on ? standalone(ctx, r.id, c === "keep" ? "remove" : c, a) : null
                    return (
                      <li key={r.id} className={cn("py-3", !on && "opacity-55")}>
                        <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:gap-3">
                          <div className="min-w-0 flex-1">
                            <Link
                              href={`/regulations/${r.id}`}
                              className="font-medium hover:text-primary hover:underline"
                            >
                              {r.title}
                            </Link>
                            <span className="ml-2 text-xs text-muted-foreground">
                              {r.level} · {r.enacted}
                            </span>
                            <p className="mt-0.5 text-sm leading-snug text-foreground/75">{r.short}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {!on ? (
                                <>Doesn&apos;t apply here: {r.appliesNote}</>
                              ) : c === "keep" ? (
                                <>
                                  Kept. Removing it would save{" "}
                                  <span className="num">{money(effect?.perUnit ?? 0)}</span> per home
                                  {effect && effect.rent > 0.5 && (
                                    <>
                                      {" "}
                                      and <span className="num">{usd(effect.rent)}</span>/month in rent
                                    </>
                                  )}
                                  .
                                </>
                              ) : (
                                <>
                                  {c === "reform" ? r.reform?.label : r.removeLabel}:{" "}
                                  <span className="num font-medium text-gain">
                                    {money(effect?.perUnit ?? 0)}
                                  </span>{" "}
                                  per home
                                  {effect && effect.rent > 0.5 && (
                                    <>
                                      ,{" "}
                                      <span className="num font-medium text-gain">
                                        −{usd(effect.rent)}
                                      </span>
                                      /month rent
                                    </>
                                  )}
                                  {effect && effect.months > 0.05 && (
                                    <>, {effect.months.toFixed(1)} months faster</>
                                  )}
                                </>
                              )}
                            </p>
                          </div>
                          <div className="seg" role="group" aria-label={`${r.title}: keep, reform or remove`}>
                            {(["keep", "reform", "remove"] as Stance[]).map((s) => {
                              const disabled = s === "reform" && !r.reform
                              return (
                                <button
                                  key={s}
                                  type="button"
                                  data-v={s}
                                  aria-pressed={c === s}
                                  disabled={disabled}
                                  title={
                                    s === "reform"
                                      ? (r.reform?.label ?? "No partial reform modeled")
                                      : s === "remove"
                                        ? r.removeLabel
                                        : "Keep current law"
                                  }
                                  onClick={() => {
                                    setChoice(r.id, s)
                                  }}
                                  className="disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  {s === "keep" ? "Keep" : s === "reform" ? "Reform" : "Remove"}
                                  {r.stance === s && <span className="sr-only"> (suggested)</span>}
                                  {r.stance === s && (
                                    <span aria-hidden="true" className="ml-0.5 align-super text-[9px]">
                                      ●
                                    </span>
                                  )}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </section>
            )
          })}
          <p className="text-xs text-muted-foreground">
            ● marks the suggested stance. Savings on each row are that change alone from current
            law; changes interact (cheaper land makes delays cheaper, for instance), so the total can
            differ from the sum. Rules that don&apos;t change a single project&apos;s budget (the SRO
            ban, manufacturing zoning, rent stabilization) are on the{" "}
            <Link href="/regulations" className="underline">
              regulations page
            </Link>
            .
          </p>
          <Advanced a={a} setA={setA} />
        </div>

        <aside id="summary" aria-label="Results" className="lg:sticky lg:top-4 lg:self-start">
          <div className="space-y-5 rounded-md border border-rule bg-card p-5 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
            <div>
              <h2 className="text-lg font-semibold">Your project</h2>
              <p className="text-xs text-muted-foreground">
                {proto.short} in {nb.name}
                {tax === "485x" ? ", 485-x" : ", fully taxed"}
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-3 text-sm">
              <Kpi label="Total development cost" now={money(scen.tdc)} was={money(base.tdc)} />
              <Kpi label="Per home" now={money(scen.perUnit)} was={money(base.perUnit)} />
              <Kpi
                label="Savings"
                now={money(saved)}
                was={`${pct(saved / base.tdc, 1)} of cost`}
                tone={saved > 0 ? "gain" : undefined}
              />
              <Kpi
                label="Per home saved"
                now={money(savedPerUnit)}
                was={`${monthsSaved.toFixed(1)} months faster`}
                tone={savedPerUnit > 0 ? "gain" : undefined}
              />
              <Kpi
                label="Homes"
                now={String(Math.round(scen.units))}
                was={`${proto.units} under current law (same floor area)`}
              />
              <Kpi
                label="Time to open"
                now={`${(scen.preMonths + scen.buildMonths).toFixed(0)} mo`}
                was={`${(base.preMonths + base.buildMonths).toFixed(0)} mo now`}
              />
            </dl>

            <div className="border-t border-rule pt-4">
              <h3 className="mb-2 text-sm font-semibold">Rent</h3>
              <dl className="space-y-2 text-sm">
                <Row
                  label="Break-even rent, market-rate home"
                  v={
                    <>
                      <span className="num font-semibold">{usd(scen.marketRent)}</span>
                      <span className="num ml-1 text-xs text-muted-foreground line-through">
                        {usd(base.marketRent)}
                      </span>
                    </>
                  }
                />
                <Row
                  label="Change"
                  v={
                    <span className={cn("num font-medium", rentDrop > 0 ? "text-gain" : "text-loss")}>
                      {rentDrop > 0 ? "−" : "+"}
                      {usd(Math.abs(rentDrop))} ({pct(rentDrop / base.marketRent, 0)})
                    </span>
                  }
                />
                <Row
                  label="Break-even, average of all homes"
                  v={<span className="num">{usd(scen.avgRent)}</span>}
                />
                <Row
                  label={`${nb.name} average asking rent`}
                  v={<span className="num">{usd(nb.rent)}</span>}
                />
                <Row
                  label={`What a new building can charge (+${pct(a.newBuildPremium)})`}
                  v={<span className="num">{usd(scen.bar)}</span>}
                />
                {(scen.share60 > 0 || scen.share80 > 0) && (
                  <Row
                    label="Income-restricted homes"
                    v={
                      <span className="num">
                        {pct(scen.share60 + scen.share80)}
                        {scen.share60 > 0 && " (60% AMI)"}
                        {scen.share80 > 0 && scen.share60 === 0 && " (80% AMI)"}
                      </span>
                    }
                  />
                )}
              </dl>
              <div
                className={cn(
                  "mt-3 rounded-md px-3 py-2 text-sm",
                  scen.pencils ? "bg-gain-soft text-gain" : "bg-loss-soft text-loss",
                )}
              >
                {scen.pencils ? "Pencils: " : "Doesn't pencil: "}
                {scen.pencils
                  ? "break-even rent is at or below what a new building here can charge."
                  : `needs ${usd(scen.marketRent - scen.bar)}/month more than the market supports.`}
                {base.pencils !== scen.pencils && (
                  <span className="block text-xs">
                    Under current law it {base.pencils ? "pencils" : "doesn't"}.
                  </span>
                )}
              </div>
            </div>

            <div className="border-t border-rule pt-4">
              <h3 className="mb-1 text-sm font-semibold">Across the city</h3>
              <p className="text-sm">
                This building pencils in{" "}
                <span className="num font-semibold">{feasScen}</span> of{" "}
                <span className="num">{feas.length}</span> neighborhoods with your picks, against{" "}
                <span className="num">{feasBase}</span> under current law.
              </p>
              <Link href="/neighborhoods" className="text-xs underline">
                See every neighborhood
              </Link>
            </div>

            <div className="border-t border-rule pt-4">
              <h3 className="mb-2 text-sm font-semibold">Cost stack per home</h3>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted-foreground">
                    <th className="text-left font-medium">Line</th>
                    <th className="text-right font-medium">Now</th>
                    <th className="text-right font-medium">Yours</th>
                  </tr>
                </thead>
                <tbody>
                  {LINES.map((l) => {
                    const was = base.lines[l.id] / base.units
                    const now = scen.lines[l.id] / scen.units
                    if (was < 1 && now < 1) return null
                    return (
                      <tr key={l.id} className="border-t border-rule">
                        <td className="py-1 pr-2">
                          <Link href={`/costs/${l.id}`} className="hover:underline">
                            {l.label}
                          </Link>
                        </td>
                        <td className="num py-1 text-right text-muted-foreground">{money(was)}</td>
                        <td className={cn("num py-1 text-right", now < was - 1 && "text-gain")}>
                          {money(now)}
                        </td>
                      </tr>
                    )
                  })}
                  <tr className="border-t-2 border-ink/70 font-semibold">
                    <td className="py-1">Total</td>
                    <td className="num py-1 text-right">{money(base.perUnit)}</td>
                    <td className="num py-1 text-right">{money(scen.perUnit)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile: results stay in view while choosing. */}
      <a
        href="#summary"
        className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-between gap-3 border-t border-rule bg-card/95 px-4 py-2.5 text-sm backdrop-blur lg:hidden"
      >
        <span>
          <span className="num font-semibold">{money(scen.perUnit)}</span>
          <span className="text-muted-foreground">/home · </span>
          <span className="num font-semibold">{usd(scen.marketRent)}</span>
          <span className="text-muted-foreground">/mo</span>
        </span>
        <span className={cn("num text-xs", rentDrop > 0 ? "text-gain" : "text-muted-foreground")}>
          {rentDrop > 0 ? `−${usd(rentDrop)}/mo` : "current law"} · Results ↓
        </span>
      </a>
    </div>
  )
}

function Kpi({
  label,
  now,
  was,
  tone,
}: {
  label: string
  now: string
  was: string
  tone?: "gain"
}) {
  return (
    <div>
      <dt className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd className={cn("num text-lg font-semibold", tone === "gain" && "text-gain")}>{now}</dd>
      <dd className="text-xs text-muted-foreground">{was}</dd>
    </div>
  )
}

function Row({ label, v }: { label: string; v: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-foreground/75">{label}</dt>
      <dd className="text-right whitespace-nowrap">{v}</dd>
    </div>
  )
}

/** The neighborhood-specific rules that are switched on for this project. */
function NeighborhoodRules({ ctx }: { ctx: Ctx }) {
  const { nb } = ctx
  const items = [
    `Parking zone ${nb.parkingZone}${nb.parkingZone === 1 ? " (no parking mandate)" : nb.parkingZone === 2 ? " (reduced mandate)" : " (mandate kept)"}`,
    `485-x wage zone ${nb.zone485x}`,
    nb.ldgma && "Lower Density Growth Management Area",
    nb.mih && "Mandatory Inclusionary Housing mapped",
    nb.historic !== "none" && `Historic districts: ${nb.historic === "high" ? "most lots" : "some lots"}`,
    nb.flood && "Floodplain on much of the area",
  ].filter(Boolean) as string[]
  return (
    <div className="mt-4 border-t border-rule pt-3 text-xs text-muted-foreground">
      <span className="font-medium text-foreground/80">Rules in {nb.name}: </span>
      {items.join(" · ")}
      {nb.note && <span className="block pt-1">{nb.note}</span>}
    </div>
  )
}

function Advanced({ a, setA }: { a: Assumptions; setA: (a: Assumptions) => void }) {
  return (
    <details className="rounded-md border border-rule bg-card p-4">
      <summary className="font-medium">Assumptions (change the finance and operating inputs)</summary>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {(Object.keys(ASSUMPTION_INFO) as (keyof Assumptions)[]).map((k) => {
          const info = ASSUMPTION_INFO[k]
          const shown = info.unit === "%" ? +(a[k] * 100).toFixed(2) : a[k]
          return (
            <label key={k} className="block text-sm">
              <span className="block font-medium">{info.label}</span>
              <span className="flex items-center gap-1">
                {info.unit === "$" && <span>$</span>}
                <input
                  type="number"
                  step={info.unit === "%" ? 0.25 : 100}
                  value={shown}
                  onChange={(e) => {
                    const v = Number(e.target.value)
                    if (!Number.isFinite(v)) return
                    setA({ ...a, [k]: info.unit === "%" ? v / 100 : v })
                  }}
                  className="h-9 w-28 rounded-md border border-rule bg-background px-2"
                />
                {info.unit === "%" && <span>%</span>}
              </span>
              <span className="mt-1 block text-xs leading-snug text-muted-foreground">{info.why}</span>
            </label>
          )
        })}
      </div>
      <Button
        variant="ghost"
        className="mt-3"
        onClick={() => {
          setA(DEFAULT_ASSUMPTIONS)
        }}
      >
        Reset assumptions
      </Button>
    </details>
  )
}
