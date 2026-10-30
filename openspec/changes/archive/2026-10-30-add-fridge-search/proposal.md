# Proposal

## Why

Standing at the fridge, a family member knows what is in the house but not which recipe uses it. The home page searches on title, author and tags, not on ingredients, so "what can I cook with what I have?" cannot be asked.

## What Changes

- New page `/koelkast` ("Wat zit er in de koelkast?"), built after the approved mockup `docs/design/koelkast.html`.
- Two lists at the top of the page: "Heb ik" and "Liever niet". Each has its own input with a button (+ / −). Enter or the button adds the word as a removable chip, clears the input and keeps it focused. The lists live in the page address (`heb`, `zonder`, `sort`).
- The recipes are narrowed and ordered by the lists: no recipe that has a "Liever niet" ingredient, and, once "Heb ik" has entries, only recipes that use at least one of them, the ones that use more first. Same idea as the tag filter on home.
- Matching is on whole words of the ingredient name, ignoring case and accents.
- Each card has the home card on top (the only part that opens the recipe), a separator, and a plain part below with "N/M in huis", the ingredients that are missing ("Ontbreekt", each with a quiet + and − button that adds it to a list) and the "Heb je" items the recipe does not use, struck through.
- Common staples (zout, peper, boter...) are never listed as missing. Admins manage that list in a new category "Basisproducten" on the existing rules page ("Herkenning"), saved with its other lists.
- A menu link "Koelkast" for every member.
- The recipe card moves from the home route to `shared/`, since a second route now uses it. No change in how it looks or works.

## Capabilities

### New Capabilities

- `fridge-search`: the fridge page: the "Heb ik" and "Liever niet" lists, narrowing and ordering of recipes by ingredient, the count of used ingredients, the missing and unused ingredients on each card, and the buttons that move an ingredient between lists.
- `staple-management`: the admin-managed list of staples that are left out of "Ontbreekt", with its defaults and its category on the rules page.

### Modified Capabilities

- `site-menu`: the sidebar gets "Koelkast" for everyone.
- `parsing-rules`: the rules page gets the category "Basisproducten"; restoring the defaults also restores the staples.

## Impact

- New route `routes/fridge/` (page, filters, card extras, matching), `routes/admin-rules/` (form, action), new `shared/staples.server.ts`, a recipe ingredient query in `shared/recipes.server.ts`, `routes.ts`, `SiteMenu.tsx`.
- `RecipeCard` and its test move from `routes/home/lib/` to `shared/components/`; home imports it from there.
- Staples are stored in the existing `settings` table: no migration.
- Not changed: the home page (including its hover raise, which is a separate change), the recipe page, the tag filter.
- Known ceiling: whole-word matching misses Dutch plurals and compounds ("ei" vs "eieren", "kip" vs "kipfilet"). Normalizing them is a later change.
