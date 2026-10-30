# Design

## Context

Hover styles are written per component. The tint exists as `hover:not-focus:bg-[color-mix(in_srgb,var(--color-ink)_5%,white)]` (fields, ingredient rows, chip popup) and `hover:not-disabled:bg-ink/8` (`Button`); other controls use `hover:bg-yel`, `hover:bg-white/15`, or nothing. Text links use `hover:underline` in some places only. Tailwind v4 already gates `hover:` behind `@media (hover: hover)`, so touch screens are covered.

## Goals / Non-Goals

**Goals:**
- One tint and one underline rule, shared, no per-component colour maths.
- Every clickable thing reacts.

**Non-Goals:**
- Focus, active/press and selected styles stay as they are.
- Hover on dark surfaces (site menu, `hover:bg-white/15`) and the existing red/yellow hover of destructive and dialog buttons stay: they already recolor.
- No new hover on non-clickable things.

## Decisions

- **Token `--color-hover`** in `@theme`: `color-mix(in srgb, var(--color-ink) 5%, white)`. Components use `hover:bg-hover`; existing copies of the color-mix string are replaced. Alternative (a `hover` class string in a TS file) rejected: STRUCTURE.md wants colours as theme tokens.
- **Selected controls** (checked segment, expanded toggle, selected tab) keep their colour and get `hover:brightness-95`-style darkening, like `Button main` does today, instead of the tint (a tint over red/blue would barely show).
- **Cards**: drop `hover:-translate-0.5 hover:shadow-hard-lg` and the `transition-[transform,box-shadow]`; add `hover:bg-hover` on the article. The image keeps its own look; the text block shows the tint.
- **Text links**: `hover:underline underline-offset-[0.25em]` as in `RecipeView`. Applied to "Voeg het eerste recept toe", "Annuleren", the header title and any other bare link found.
- **Already underlined links** (source, DeleteUser access link, RulesBar/SelectionBar buttons): change colour, using `hover:text-blu` (existing ones use `hover:text-red`; keep those).
- **Tag pills on the recipe page**: `Pill` stays the card's small pill. `RecipeView` passes `className` to enlarge it (`text-base`, `min-h-9`, flex-centered, `bg-white`, `hover:bg-hover` via the link's `group`). The link gets the hover so the whole target reacts.
- **Helpers** in `shared/hover.ts`: `hoverTint` (white controls), `hoverDarken` (coloured or selected controls), `hoverField` (white text fields: `hover:not-focus:bg-hover`; chips fields use `hover:not-focus-within:bg-hover`), `hoverUnderline` (text links), `hoverRecolor` (underlined links). New clickable things use these, never a new colour. Fields use the opaque `bg-hover`, not `bg-ink/5`: a see-through tint shows the page behind it and looks different per page.
- **Links**: the base rule `a { color: inherit }` sits in `@layer base`; unlayered it would beat every `hover:text-*` utility.
- **Audit**: tasks list the known gaps; the last step greps `src/app` for `<button`, `<Link`, `<a`, `role=` and `cursor-pointer` to catch the rest.

## Risks / Trade-offs

- A tint on a white button over a white page is faint (5% ink). It matches fields today; raise the token if it proves too weak.
- Hovered pill `bg-hover` is greyish, not blue; the request called the ingredient hover "blue-ish". The token is the one ingredient rows use, so they match. Revisit the token if the colour is meant to be bluer.
