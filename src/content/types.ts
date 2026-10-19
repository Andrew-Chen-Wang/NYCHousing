export type Borough = "Manhattan" | "Brooklyn" | "Queens" | "Bronx" | "Staten Island"
export const BOROUGHS: Borough[] = ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"]

export type Confidence = "high" | "medium" | "low"

/** A citation. `kind` says what sort of evidence it is, so readers can weigh it. */
export type Source = {
  id: string
  title: string
  org: string
  year: number
  url: string
  kind: "law" | "government" | "hearing" | "news" | "research" | "advocacy" | "industry" | "data"
  note?: string
}

/** Where a regulation's stance defaults in the calculator. */
export type Stance = "keep" | "reform" | "remove"

/**
 * The cost lines of a development budget. Every regulation's effect is stated against
 * one of these, so the calculator can show exactly which line each rule moves.
 */
export type LineId =
  | "land"
  | "closing"
  | "parking"
  | "hard"
  | "design"
  | "permits"
  | "legal"
  | "insurance"
  | "devfee"
  | "marketing"
  | "interest"
  | "mrt"
  | "carry"
