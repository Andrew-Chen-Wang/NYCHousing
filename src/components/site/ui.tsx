import { SOURCE_BY_ID } from "@site/content/sources"
import type { Stance } from "@site/content/types"
import { cn } from "@site/lib/utils"
import Link from "next/link"
import type { ReactNode } from "react"

export function Page({ children, wide }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className={cn("mx-auto w-full px-4 py-10 sm:px-8 lg:py-14", wide ? "max-w-7xl" : "max-w-5xl")}>
      {children}
    </div>
  )
}

export function PageHeader({
  eyebrow,
  title,
  lede,
  children,
}: {
  eyebrow?: ReactNode
  title: string
  lede?: ReactNode
  children?: ReactNode
}) {
  return (
    <header className="mb-10 border-b border-rule pb-8">
      {eyebrow && (
        <div className="mb-3 text-xs font-semibold tracking-[0.14em] text-primary uppercase">
          {eyebrow}
        </div>
      )}
      <h1 className="text-3xl leading-tight font-semibold sm:text-4xl">{title}</h1>
      {lede && <p className="mt-4 max-w-3xl text-lg leading-relaxed text-foreground/80">{lede}</p>}
      {children}
    </header>
  )
}

export function Section({
  id,
  title,
  intro,
  children,
  className,
}: {
  id?: string
  title?: string
  intro?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section id={id} className={cn("mb-14", className)}>
      {title && (
        <h2 className="mb-3 text-2xl font-semibold">
          {id ? (
            <a href={`#${id}`} className="hover:underline">
              {title}
            </a>
          ) : (
            title
          )}
        </h2>
      )}
      {intro && <div className="mb-5 max-w-3xl leading-relaxed text-foreground/80">{intro}</div>}
      {children}
    </section>
  )
}

export function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string
  value: ReactNode
  sub?: ReactNode
  tone?: "gain" | "loss" | "neutral"
}) {
  return (
    <div className="rounded-md border border-rule bg-card p-4">
      <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</div>
      <div
        className={cn(
          "num mt-1 text-2xl font-semibold",
          tone === "gain" && "text-gain",
          tone === "loss" && "text-loss",
        )}
      >
        {value}
      </div>
      {sub && <div className="mt-1 text-xs leading-snug text-muted-foreground">{sub}</div>}
    </div>
  )
}

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("-mx-4 overflow-x-auto sm:mx-0", className)}>
      <table className="w-full min-w-[36rem] border-collapse text-sm [&_td]:border-b [&_td]:border-rule [&_td]:px-3 [&_td]:py-2 [&_td]:align-top [&_th]:border-b-2 [&_th]:border-ink/70 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:text-xs [&_th]:font-semibold [&_th]:tracking-wide [&_th]:text-muted-foreground [&_th]:uppercase [&_tfoot_td]:border-t-2 [&_tfoot_td]:border-b-0 [&_tfoot_td]:border-ink/70 [&_tfoot_td]:font-semibold">
        {children}
      </table>
    </div>
  )
}

export function Callout({
  tone = "note",
  title,
  children,
}: {
  tone?: "note" | "caution" | "loss" | "gain"
  title?: string
  children: ReactNode
}) {
  const styles = {
    note: "border-primary/40 bg-accent/60",
    caution: "border-caution/40 bg-caution-soft",
    loss: "border-loss/40 bg-loss-soft",
    gain: "border-gain/40 bg-gain-soft",
  }[tone]
  return (
    <div className={cn("my-6 rounded-md border-l-4 px-5 py-4 leading-relaxed", styles)}>
      {title && <div className="mb-1 font-semibold">{title}</div>}
      <div className="text-foreground/85">{children}</div>
    </div>
  )
}

export function Pill({
  children,
  tone = "neutral",
}: {
  children: ReactNode
  tone?: "neutral" | "gain" | "loss" | "caution" | "primary"
}) {
  const styles = {
    neutral: "bg-secondary text-foreground/75",
    gain: "bg-gain-soft text-gain",
    loss: "bg-loss-soft text-loss",
    caution: "bg-caution-soft text-caution",
    primary: "bg-accent text-accent-foreground",
  }[tone]
  return (
    <span className={cn("inline-block rounded-sm px-2 py-0.5 text-xs font-medium whitespace-nowrap", styles)}>
      {children}
    </span>
  )
}

export const STANCE_LABEL: Record<Stance, string> = {
  keep: "Keep",
  reform: "Reform",
  remove: "Remove",
}

export function StanceTag({ stance, prefix = "Default: " }: { stance: Stance; prefix?: string }) {
  const tone = stance === "remove" ? "gain" : stance === "reform" ? "caution" : "neutral"
  return (
    <Pill tone={tone}>
      {prefix}
      {STANCE_LABEL[stance]}
    </Pill>
  )
}

export function ConfidenceTag({ level }: { level: "high" | "medium" | "low" }) {
  const tone = level === "high" ? "gain" : level === "medium" ? "caution" : "loss"
  return <Pill tone={tone}>{level} confidence</Pill>
}

/** Inline citation links: "Org (year)". */
export function Cite({ ids }: { ids: string[] }) {
  const known = ids.filter((id) => SOURCE_BY_ID[id])
  if (known.length === 0) return null
  return (
    <span className="text-xs text-muted-foreground">
      {" "}
      [
      {known.map((id, i) => (
        <span key={id}>
          {i > 0 && "; "}
          <a
            href={SOURCE_BY_ID[id].url}
            target="_blank"
            rel="noreferrer"
            title={SOURCE_BY_ID[id].title}
            className="underline decoration-rule underline-offset-2 hover:text-foreground"
          >
            {SOURCE_BY_ID[id].org} {SOURCE_BY_ID[id].year}
          </a>
        </span>
      ))}
      ]
    </span>
  )
}

export function SourceList({ ids }: { ids: string[] }) {
  const known = [...new Set(ids)].filter((id) => SOURCE_BY_ID[id])
  if (known.length === 0) return null
  return (
    <ol className="space-y-2 text-sm">
      {known.map((id) => {
        const s = SOURCE_BY_ID[id]
        return (
          <li key={id} className="leading-snug">
            <a href={s.url} target="_blank" rel="noreferrer" className="font-medium underline decoration-rule underline-offset-2 hover:decoration-primary">
              {s.title}
            </a>
            <span className="text-muted-foreground">
              {" "}
              · {s.org}, {s.year} · {s.kind}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

export function NextLinks({ links }: { links: { href: string; label: string }[] }) {
  return (
    <div className="mt-16 grid gap-3 border-t border-rule pt-8 sm:grid-cols-2">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="group rounded-md border border-rule bg-card px-4 py-3 hover:border-primary"
        >
          <div className="text-xs text-muted-foreground">Continue</div>
          <div className="font-medium group-hover:text-primary">{l.label} →</div>
        </Link>
      ))}
    </div>
  )
}

/** A horizontal stacked bar of budget shares. */
export function StackBar({
  parts,
  total,
}: {
  parts: { label: string; v: number; className: string }[]
  total: number
}) {
  return (
    <div className="flex h-4 w-full overflow-hidden rounded-sm bg-rule" role="img" aria-label={parts.map((p) => `${p.label} ${Math.round((p.v / total) * 100)}%`).join(", ")}>
      {parts.map((p) => (
        <div key={p.label} className={p.className} style={{ width: `${(p.v / total) * 100}%` }} title={`${p.label}: ${Math.round((p.v / total) * 100)}%`} />
      ))}
    </div>
  )
}
