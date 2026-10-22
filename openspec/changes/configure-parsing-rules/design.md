# Design

## Context

Today's behaviour (observed): `ingredients.ts` has a fixed `units` array and builds regexes from it for number and unit matching. `stepParsers.ts` builds two regexes from fixed words (`minuten|minuut|min|uren|uur|u`, spoken amounts, `graden|gr|°C`). Both modules run in the browser (the editor reconciles chips as the user types) and on the server (validation, loaders), and `scale.ts` reuses `units`. A TODO in `ingredients.ts` already says these become configurable in the DB. Roles exist (`users.role`) but nothing checks them yet. See proposal.md.

## Goals / Non-Goals

**Goals:**
- Rules are data in D1, editable by an admin. Without saved rules the app uses today's words from code, so nothing changes until someone edits and no seed data is needed.
- Plain words, never regex.
- Server refuses non-admins; the UI hides the link.

**Non-Goals:** see proposal.md (oven range, plural matching, role screen, history).

## Decisions

**Plain words, not regex.** Answer to "regex or plain text": the code uses regexes, but only as an implementation detail over fixed words. The stored form is words. A regex typed by an admin can break all parsing (or hang it) for everyone, and the admin does not need that power: every current rule is "one of these words". The parser escapes each word and builds its alternation (longest first, so `minuten` wins over `min`). Spoken phrases win over hour words (the spoken alternative is tried first). The degree pattern is a number, an optional space, then a degree word, so with `°c` and `°` in the degree words it matches "180°" and "180 °C". Characters like `+` or `(` in a word are literal.

**A generic settings table with JSON values.** `settings(key TEXT PRIMARY KEY, value TEXT NOT NULL CHECK (json_valid(value)))`. The rules are one row, key `parsing-rules`, whose value is the `Rules` object. A setting is only ever overridden as a whole (`INSERT ... ON CONFLICT (key) DO UPDATE`), never patched, so a save is one atomic statement, and a new kind of configuration later is a new key without a migration. Words are stored lowercase; matching is case-insensitive as today. The database cannot check the shape of the JSON, so the app does, on write and on read.

**No seed; code defaults fill the gap.** The migration creates the table and inserts nothing, so a fresh or test database needs no setup and nothing to clean. `getRules(db)` returns `defaultRules` (in `lib/rules.ts`) when the row is missing, and when the stored value is not valid JSON or has the wrong shape (never throws: a broken setting must not take the editor down). A field missing from an older stored object takes its default, so a field added to `Rules` later needs no migration. Defaults stay in code, so repairing a bad setting is the reset button.

**Reset deletes the row.** A button "Standaardwaarden herstellen" on the page deletes the `parsing-rules` row, which gives the same rules as writing the defaults. Side effect: an install that never overrode the rules follows new code defaults after a deploy.

**Saving overrides the whole setting.** The page posts the whole form (five textareas, one word per line, spoken as `een kwartier = 15`). The action validates everything first, then upserts the one row, so a bad line saves nothing. Two admins saving at once: the last save wins. Validation: blank lines and repeats are dropped; a word is letters, `°` and spaces (a unit only letters, as it matches as one word); a spoken minutes value is a whole number from 1 to 1440; a kind with no words left is refused (no unit list means no ingredient parsing); a word may not be in two of the lists (units, minute, hour and degree words; `gr` is a unit only). Words are lowercased on save. Saving the unchanged defaults succeeds.

**`Rules` is a plain object passed as a parameter.** `lib/rules.ts` exports `type Rules = { units: string[]; minuteWords: string[]; hourWords: string[]; degreeWords: string[]; spoken: Record<string, number> }` and `defaultRules`. `parseIngredient(text, rules)`, `findTimer(text, rules)`, `findOven(text, rules)`, `scaleBody(body, factor, rows, rules)` and the chip `Context` (`{ rows, rules }`) take it as input. No module-level state or React context: the contract of each function stays its parameters. Patterns are built per call from the rules; a `WeakMap<Rules, patterns>` cache keeps typing smooth.

**Where rules come from.** The root loader does one `getUser` (also used for the welcome redirect) and returns `{ email, role, rules }`; routes read it with `useRouteLoaderData('root')` and pass it down to the editor and recipe page. Server actions that parse (`readIngredients`, `readSteps`) read rules from D1 themselves. After an admin saves, loaders revalidate, so the browser gets the new rules without a reload.

**Admin check in one place.** `requireAdmin(db, email)` in `.server/users.ts` throws a 403 response unless the user's role is `admin` or `superadmin`. The admin route calls it first in both `loader` and `action`. It does not rely on the layout or the menu. The root loader's `role` only drives the link. `userEmailContext` is verified by the Worker, so the check cannot be spoofed by a request body.

**Admin route and menu link.** Route `beheer/herkenning`, title "Herkenning". `SiteMenu` takes one prop `role: Role`. `routes/layout/route.tsx` reads `role` from the root data and passes it to `Header`, which passes it to `SiteMenu`. Links in order: Nieuw recept, Instellingen, Over, Herkenning (admin and superadmin). `add-user-management` adds Gebruikers (superadmin) after these.

## Risks / Trade-offs

- Content of the JSON is not enforced by the database; a hand-edited bad row falls back to the defaults on read.
- An admin removes a word that existing steps rely on (e.g. "minuten"). Stored recipes keep their stored chips; when such a recipe is opened, a chip whose words are no longer recognised becomes a pinned chip, which the editor already handles. No migration of recipes.
- Rules in the root loader cost one small query per navigation. Acceptable at this size; revisit if it gets slow.

## Open Questions

None. Assumed: route name and Dutch labels as above; admin and superadmin have equal rights here.
