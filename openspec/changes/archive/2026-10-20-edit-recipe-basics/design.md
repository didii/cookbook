# Design

## Context

**Design reference:** the approved mockup is `docs/design/recipe-editor.html` (static, open it in a browser; see `docs/design/README.md`). It shows the layout, every chip state and the keyboard toolbars; the app's own tokens in `packages/web/app/app.css` win where the two differ.

`shared/RecipeForm.tsx` renders every field in one `max-w-xl` column with a single submit `Button`, posting a plain `<Form method="post">` to the current route; both routes' actions validate with `shared/recipeValidation.ts` and answer 400 with `{errors, values}`. The approved mockup (`docs/design/recipe-editor.html`) fixes the look: the existing world (rice paper, `border-3 border-ink`, hard shadows, Mulish, red/jade/blu/yel), a large inline title, a main column plus a 20rem sticky rail, a sticky bottom bar. This change builds the shell and the base fields. The other five changes add sections to it and must not need to restructure it: see "Seams" below.

## Goals / Non-Goals

**Goals:**
- One `RecipeEditor` for both routes; the shell (layout, save bar, reset, dirty flag, leave guard) is final here.
- Seams for the later sections, so each later change adds a section without touching the shell.

**Non-Goals:**
- The photo, ingredients, steps, chips and local drafts (own changes).
- Server autosave. The recipe is stored only by Opslaan.
- Deleting a recipe.

## Decisions

- **Folder and names.** `app/shared/recipeEditor/` holds `RecipeEditor.tsx` (the page), `SaveBar.tsx`, and later the section components. `RecipeForm.tsx` is deleted; `AuthorInput`, `ImagePreview` and `recipeValidation` stay in `shared/` for now (`ImagePreview` goes away in `edit-recipe-picture`). Both routes pass `values`, `errors`, `authors`, `tile`, `cancelTo` and the page heading as props, as `RecipeForm` takes them today.
- **State: one draft object in the editor.** `lib/draft.ts` exports `Draft` (today the same keys as `Values`: title, author, servings, time, intro, image), `isDirty(initial, current)` (compares trimmed values, so typing and deleting a space is not a change) and nothing UI-related, so server and tests can import it. The editor keeps `current` in `useState`. Later changes add keys to `Draft` (`ingredients`, `steps`) and a section component each, which receives its slice and an `onChange`. Reset sets `current` back to `initial`; because every section is controlled from `current`, nothing else needs to be re-keyed.
- **Submitting stays a native form post.** Flat fields keep their `name`, so the page works as a plain form and the route actions stay as they are. Later list sections post their slice as one hidden JSON input (`ingredients`, `steps`) that the action parses and validates with the same shared code. Chosen over `fetcher.submit` of a JSON body because the existing 400 re-render, focus-first-error and redirect flows keep working unchanged.
- **Layout.** A CSS grid `lg:grid-cols-[minmax(0,1fr)_20rem]` (breakpoint 60rem in the mockup, aligned to a Tailwind step during build) with the rail `sticky top-4`; below the breakpoint the rail is placed first with `order-first`. The main column holds the title input (`clamp(2.25rem, 6vw, 3.75rem)`, 900 weight, dashed underline that turns solid blue on focus) and the intro textarea.
- **Accessible names stay.** The mockup's title field has no visible label, but `recipe-creation` requires the asterisk and the explanation on the labels. So the title gets a small visible label "Titel *" above the large input, the author keeps "Van wie is het recept? *", the line "Velden met een * zijn verplicht." stays above the form, and a visually hidden `h1` ("Nieuw recept" / "Recept bewerken") names the page. The "Terug naar het recept" link row above the title is the visible way back (same target as Annuleren).
- **Save bar.** `position: fixed` at the bottom with `padding-bottom: env(safe-area-inset-bottom)`, the main content gets matching bottom padding so nothing hides behind it, and focused fields use `scroll-padding-bottom` so the on-screen keyboard and the bar do not cover the caret. Left: status (`Niet opgeslagen` dot while dirty; a slot for later status such as "2 voorstellen open"), then `Herstel` (only when dirty), `Annuleren` (a `Link` to `cancelTo`), `Opslaan` (primary, `bg-blu`). While `useNavigation().state !== 'idle'` the button is disabled.
- **Reset.** `Herstel` toggles the bar into the question "Alles terugzetten?" with `Ja` and `Nee` buttons; focus moves to `Nee` (the safe answer) and `Esc` declines. No dialog: a modal is not needed for a reversible-in-spirit confirmation, and the bar is already where the eye is.
- **Dirty flag and leave guard.** `dirty = isDirty(initial, current)`. `useBlocker(dirty && !submitting)` shows a native `window.confirm("Je wijzigingen zijn nog niet bewaard. Toch weggaan?")` for in-app navigation, and a `beforeunload` listener covers closing and reloading. A native confirm over a custom dialog: the guard is rare, must work on every browser, and cannot be styled away. `edit-recipe-local-save` later narrows this guard to the case where the draft could not be stored locally.
- **Cancel** is a plain link, not a form action: nothing was stored, so there is nothing to undo server-side.

## Seams for the later changes

- `Draft` gains keys; `isDirty` compares them generically (JSON of the trimmed draft), so it needs no change.
- The save bar renders `children` in its status slot.
- Each section is `({value, onChange, errors}) => JSX`; sections never read the form directly.
- The server `updateRecipe` / `createRecipe` accept a growing set of lists; each later change extends them and their tests.

## Risks / Trade-offs

- A fixed bar on mobile competes with the keyboard → `env(safe-area-inset-bottom)`, `scroll-padding-bottom`, and a check on a real phone in the apply phase.
- `window.confirm` is blunt → accepted, see above.
- The mockup was only checked in a desktop browser; a phone-width check is part of the tasks.
