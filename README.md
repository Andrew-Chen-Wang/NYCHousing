# NYC Housing Costs

A website that lays out every cost of developing housing in New York City, the laws and
regulations that add to those costs (with their history and citations), and a calculator for
total development cost, savings and break-even rent by neighborhood.

Live site: https://andrew-chen-wang.github.io/NYCHousing/

## What's on the site

- **Where the money goes** (`/costs`): each line of a development budget (land, transfer taxes,
  parking, construction, design, permits, insurance, financing, the mortgage recording tax and
  the cost of waiting) by borough and building type, and which rules move it.
- **Regulations** (`/regulations`): 46 city, state, utility and federal rules, each with how it
  came about (news reports, hearings, studies), what it costs, where in the city it applies,
  the case for keeping and for changing it, and a suggested stance: keep, reform or remove.
- **Boroughs & neighborhoods** (`/boroughs`, `/neighborhoods`): rules that differ by place
  (City of Yes parking zones, 485-x wage zones, LDGMA, MIH rezonings, historic districts,
  floodplain) and average asking rents for 170 areas.
- **Calculator** (`/calculator`): pick a neighborhood, building type, tax path and site
  conditions, choose keep / reform / remove for each rule, and see total development cost,
  savings, time saved, break-even rent, and in how many neighborhoods the building pencils.

## How the numbers work

All content is typed TypeScript in `src/content/`; nothing is stored in a database.

- `sources.ts`: every citation.
- `regulations.ts`: the regulation catalog. Each rule's `effect` says what fully removing it
  saves (a share of budget lines, months of delay, more floor area per lot, more homes from the
  same floor area, property tax, operating cost, or an income-restriction requirement).
- `project.ts`: building prototypes, land prices, borough factors and finance assumptions.
- `neighborhoods.ts`: neighborhood flags; rents come from `rents.generated.ts`.
- `model.ts`: the budget and break-even rent arithmetic shared by every page.

Rents come from StreetEasy's median asking rent data. To refresh them, download
`medianAskingRent_All.zip` from the StreetEasy Data Dashboard, unzip it to
`data/streeteasy-median-asking-rent-all.csv`, and run:

```shell
python3 -I scripts/build-rents.py data/streeteasy-median-asking-rent-all.csv
```

## Development

```shell
pnpm install
pnpm run dev          # http://localhost:3000
pnpm test             # data integrity and model checks
pnpm run build:pages  # static export to out/ with the /NYCHousing base path
```

`deploy/workflows/` holds two GitHub Actions workflows (`pages.yml` builds the site and
publishes it to the `gh-pages` branch on every push to `main`; `ci.yml` typechecks, tests and
builds pull requests). Copy them into `.github/workflows/` to turn them on; they weren't added
there directly because the tool that created this repo lacks GitHub's `workflow` permission.
In the repository settings, set Pages to deploy from the `gh-pages` branch, root folder.
