"use client"

import type { SideGroup, SidePart } from "@site/content/navigation"
import { useCurrentPath } from "@site/lib/use-current-path"
import { cn } from "@site/lib/utils"
import Link from "next/link"
import { useEffect, useState } from "react"

const isIn = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`)

function Group({
  group,
  pathname,
  onNavigate,
}: {
  group: SideGroup
  pathname: string
  onNavigate?: () => void
}) {
  const active = group.items.some((i) => isIn(pathname, i.href))
  const [open, setOpen] = useState(active)
  useEffect(() => {
    if (active) setOpen(true)
  }, [active])
  return (
    <li>
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o)
        }}
        aria-expanded={open}
        className={cn(
          "flex w-full items-start gap-1.5 rounded-sm px-2 py-1 text-left text-[13px] font-medium",
          active ? "text-primary" : "text-foreground/80 hover:text-foreground",
        )}
      >
        <span className={cn("mt-[3px] inline-block text-[10px] transition-transform", open && "rotate-90")}>
          ▶
        </span>
        <span>{group.title}</span>
        <span className="ml-auto pl-2 text-[11px] font-normal text-muted-foreground">
          {group.items.length}
        </span>
      </button>
      {open && (
        <ul className="mt-0.5 mb-1 ml-3 space-y-0.5 border-l border-rule pl-2">
          {group.items.map((item) => {
            const here = isIn(pathname, item.href)
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "block rounded-sm px-1.5 py-0.5 text-[13px] leading-snug",
                    here
                      ? "bg-accent font-medium text-accent-foreground"
                      : "text-foreground/70 hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </li>
  )
}

const TOP_LINKS = [
  { href: "/", label: "Overview" },
  { href: "/calculator", label: "Cost & rent calculator" },
  { href: "/neighborhoods", label: "Every neighborhood" },
]

function Tree({ parts, onNavigate }: { parts: SidePart[]; onNavigate?: () => void }) {
  const pathname = useCurrentPath()
  return (
    <nav className="space-y-6">
      <ul className="space-y-0.5">
        {TOP_LINKS.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              onClick={onNavigate}
              aria-current={pathname === l.href ? "page" : undefined}
              className={cn(
                "block rounded-sm px-2 py-1 text-sm",
                pathname === l.href
                  ? "bg-accent font-medium text-accent-foreground"
                  : "text-foreground/80 hover:text-foreground",
              )}
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
      {parts.map((part) => (
        <div key={part.id}>
          <Link
            href={part.href}
            onClick={onNavigate}
            className={cn(
              "mb-1 block px-2 text-[11px] font-semibold tracking-[0.12em] uppercase",
              pathname === part.href ? "text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {part.title}
          </Link>
          <ul className="space-y-0.5">
            {part.groups.map((g) => (
              <Group key={g.id} group={g} pathname={pathname} onNavigate={onNavigate} />
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}

export function Sidebar({ parts }: { parts: SidePart[] }) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-80 shrink-0 overflow-y-auto border-r border-rule px-3 py-6 lg:block">
      <div className="mb-6 px-2">
        <Link href="/" className="block">
          <div className="font-serif text-xl leading-tight font-semibold text-ink">NYC Housing Costs</div>
        </Link>
        <div className="mt-1 text-xs text-muted-foreground">
          Every cost of building housing in New York City, the rules behind them, and what changing
          them would do to rent
        </div>
      </div>
      <Tree parts={parts} />
    </aside>
  )
}

/** Mobile: a slim top bar; the menu is a full-screen drawer that only exists while open. */
export function MobileNav({ parts }: { parts: SidePart[] }) {
  const [open, setOpen] = useState(false)
  const pathname = useCurrentPath()
  useEffect(() => {
    setOpen(false)
  }, [pathname])
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])
  return (
    <>
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-rule bg-background/95 px-4 py-2 backdrop-blur lg:hidden">
        <Link href="/" className="block font-serif text-lg leading-tight font-semibold">
          NYC Housing Costs
        </Link>
        <button
          type="button"
          onClick={() => {
            setOpen(true)
          }}
          aria-expanded={open}
          aria-controls="mobile-menu"
          className="rounded-sm border border-rule px-3 py-1 text-sm"
        >
          Menu
        </button>
      </div>
      {open && (
        <div id="mobile-menu" className="fixed inset-0 z-40 flex flex-col bg-background lg:hidden" aria-label="Site menu">
          <div className="flex items-center justify-between border-b border-rule px-4 py-2">
            <span className="font-serif text-lg font-semibold">Menu</span>
            <button
              type="button"
              onClick={() => {
                setOpen(false)
              }}
              className="rounded-sm border border-rule px-3 py-1 text-sm"
            >
              Close
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-2 py-4">
            <Tree
              parts={parts}
              onNavigate={() => {
                setOpen(false)
              }}
            />
          </div>
        </div>
      )}
    </>
  )
}
