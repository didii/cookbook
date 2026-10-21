## Why

The words the cookbook recognises in recipe text (units like "g" and "el", "minuten" and "uur" for timers, "graden" for the oven) are hard-coded: fixed word lists inside `ingredients.ts` and regexes in `stepParsers.ts`. Adding "kopje" or "mins" means a code change. The code already has a TODO to move these into the database. Card #40: an admin configures them.

## What Changes

- The recognition rules live in the database as one JSON setting, overridden as a whole on save. Without a saved setting the app uses today's words, defined in code: units, words for minutes, words for hours, words for degrees, and spoken durations ("een kwartier" = 15 minutes).
- Rules are plain words, not regexes. The admin writes one word per line; the app escapes them and builds its own patterns. Spoken durations are written `een kwartier = 15`.
- New admin page `/beheer/herkenning` to view and change the rules, with a button that restores the defaults.
- The sidebar gets a link "Herkenning" to that page, shown only to an `admin` or `superadmin`. A `superadmin` also gets a link "Gebruikers" (added by `add-user-management`). `SiteMenu` takes one `role` prop and decides per link.
- The page's server requests (the loader and the form post) are refused with HTTP 403 for anyone who is not an `admin` or `superadmin`. Hiding the link is not the protection.
- Ingredient parsing, step chips (timer, oven) and servings scaling use the stored rules instead of the fixed lists.
- Words are lowercased on save. `gr` is both a unit and a degree word by default, so units may overlap degree words; the minute, hour and degree lists may not overlap each other. Degree words include `°c` and `°` ("180°", "180 °C").
- Out of scope: the plausible oven range (50 to 300), number formats, ingredient-name matching (plurals), a screen to change roles, rule history or undo.

## Capabilities

### New Capabilities

- `parsing-rules`: the stored recognition words, the admin page to change them, the admin-only access, and recognition following them.

### Modified Capabilities

- `site-menu`: the menu lists "Herkenning" for admins and "Gebruikers" for superadmins.
- `users`: the rules page checks roles, so "no page checks roles" no longer holds.

The existing `recipe-step-chips` requirements stay true for the default rules; the new capability states that recognition follows the stored rules.

## Impact

- New migration `packages/web/migrations/0007_settings.sql`: generic table `settings` (key, JSON value), no data.
- New `packages/web/app/lib/rules.ts` (`Rules` type, `defaultRules`) and `.server/rules.ts` (read, save, reset).
- `packages/web/app/lib/ingredients.ts`, `stepParsers.ts`, `chips.ts`, `draft.ts`, `scale.ts`, `shared/recipeValidation.ts`, `shared/recipeEditor/IngredientItem.tsx`: take `rules` as a parameter instead of reading module constants.
- `.server/users.ts`: `requireAdmin`. `root.tsx` loader does one `getUser` and returns the role and the rules. `routes/layout/route.tsx` passes `role` to `Header`, which passes it to `shared/SiteMenu.tsx`. New route `routes/admin-rules/route.tsx`, `routes.ts`.
- Tests next to each changed file, plus the scenario tests.
