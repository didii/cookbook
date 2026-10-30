# Design mockups

## `recipe-editor.html`

Static, self-contained mockup of the recipe create/edit screen (the Appeltaart as example), approved as the design reference for the `edit-recipe-*` OpenSpec changes. Open it in a browser; it needs no build. Fonts load from Google Fonts, the photo and tile band from `public/img`.

It is a visual and keyboard-behaviour reference, not production code: there is no editing logic. What it does demonstrate:

- The layout (main column plus right rail, sticky save bar), ingredient rows with the quantity coloured inside the field, steps with underlined anchor words, and every chip state: following (link icon), pinned (pin icon), proposed change, proposed removal, a ghost in the add row, and an open popup.
- The keyboard toolbars. The bar at the top switches between **Voor** (separate buttons) and **Na (toolbar)**, the chosen design, and can number the Tab stops. In "Na", Tab reaches each toolbar once and the arrow keys move inside it.
- Append `#before` to the address to start on "Voor", and `#stops` to start with the Tab stops numbered.

The dark bar at the top belongs to the mockup, not to the app. Colours, fonts and spacing follow the tokens in `app/app.css`; if those change, update the mockup or treat the app as the truth.

## `home.html`

Static mockup of the home page, mobile first (use the browser's device toolbar at about 390px wide), the design reference for the `home-search-and-filter` OpenSpec change. Open it in a browser; it needs no build. Fonts load from Google Fonts, images, seals and tiles from `public/img`.

The only behaviour is the **Filter** button, which opens and closes the sheet with the author chips, the sort toggle and "Wis filters" (Esc closes it too). Search, chips and sort do not filter anything, and the count dot is fixed.

- Below 48rem the search bar is fixed to the bottom of the screen. The sheet grows upward from it, and the gray line between sheet and input keeps the input in place.
- From 48rem the same controls sit inline under the intro, and there is no Filter button.
- Images are a 5:2 strip on phones so two cards fit on a screen; the "Nieuw" label shows on the first two cards.
- A button pressed down (Filter, "Wis filters") shows the press effect: it moves 3px down and right and loses its shadow while held.

## `parsing-rules.html`

Static mockup of the admin rules page ("Herkenning"), the design reference for the parsing-rules form change. Open it in a browser; it needs no build. Fonts load from Google Fonts.

The rows work like the ingredient rows, only tighter and without up/down buttons (the cross sits right of the field): type in the free last row to start a new one, `Enter`/`↓`/`↑` move between rows, `Alt+↑`/`Alt+↓` move a row, `Backspace` in an empty field removes it. Saving and restoring do nothing. Words and minutes are examples.

- Three categories on one page: Eenheden (units and loose units side by side), Duur and Graden.
- Duur is one list. Each row has a word, its minutes and a "Vast" checkbox: unchecked, the word multiplies the number before it ("uur" = 60); checked, it stands alone ("een kwartier" = 15).
- Losse eenheden suggests the units that are not yet in the list; any other word may still be typed. While the list is open, `↑`/`↓` pick, `Enter` takes, `Esc` closes.
- "Opslaan" sits right in the bar at the bottom, "Standaardwaarden herstellen" is a link button on the left.
- Append `#error` for a faulty row, `#saved` for the saved message, `#suggest` to start with the suggestions open.

Colours, fonts and spacing follow the tokens in `app/app.css`; if those change, update the mockup or treat the app as the truth.

Differences in the built page (not compared side by side in a browser yet at 390px and 1000px):

- The suggestions open when an empty loose-unit row gets focus or when typing; on a filled row `↓`/`↑` move between rows, as the list is closed.
- Errors sit under the faulty row; a message about a whole list sits above the list.
- The dashed line under a Duur row on a phone is not drawn; "Vast" wraps to a second line below 40rem.

## `tag-manager.html`

Static mockup of the tag manager ("Tags"), the design reference for the tag manager OpenSpec change (board #47). Open it in a browser; it needs no build. Fonts load from Google Fonts.

It works on made-up tags and categories; nothing is saved. Below 48rem a tapped row opens a bottom sheet, from 48rem the same panel unfolds under the row.

- Top: add field (a taken name is refused), name filter, "Ongebruikt" (0 recipes) and "Zonder categorie" chips, "Selecteer" toggle, the count and a sort switch.
- Tags are drawn as the pill of the recipe card, everywhere (rows, form title, merge and delete texts). Categories are the same shape, filled yellow.
- Sort: "Naam" is one alphabetical list with a category pill per row. "Categorie" groups the rows under category pills as headings (alphabetical, names alphabetical inside); tags without a category come last under a dashed "Zonder categorie" pill.
- Row: name, recipe count (red at 0). Tap it to open the form: name and category (autocomplete, a new name creates it) with one "Opslaan". There is no close button: tap the row again, tap outside the sheet or press `Esc`. A taken name refuses the whole save and offers "Voeg samen met". Below the fields only the actions part changes: "Samenvoegen met…" shows the target picker and a preview of what happens, "Verwijderen" says how many recipes lose the tag.
- "Selecteer" adds checkboxes and a bottom bar to set one category on all ticked tags; "Alles selecteren" takes the filtered result.
- Append `#open`, `#taken`, `#merge`, `#delete`, `#select`, `#unused`, `#nocat` or `#bycat` to start in that state.

Colours, fonts and spacing follow the tokens in `app/app.css`; if those change, update the mockup or treat the app as the truth.

## `orphaned-photos.html`

Static mockup of the orphaned photos page ("Foto's"), the design reference for the `remove-orphaned-photos` OpenSpec change. Open it in a browser; it needs no build. Fonts load from Google Fonts, the thumbnails from `public/img`.

It works on made-up photos; nothing is deleted. Check it at 390px and at desktop width.

- Top: title, a one-line lead, and the result message after a delete.
- One line with the selection against the totals ("2/12 foto's", the selected size / the total size, "· 3 in gebruik" when used photos are listed) and "Alles selecteren" / "Niets" at its right. Under it two filter chips, "Ongebruikt" and "Ouder dan 1 dag", both on (yellow) by default; turning one off shows more photos and clears the selection. Then the 100-entry note when more match.
- Photos are square tiles, oldest first: 2 columns on a phone, 3 from 30rem, 4 from 40rem. The whole tile is the checkbox (blue when ticked); the date and size sit in the footer. A photo a recipe uses has no checkbox and a muted book icon at the bottom right of the footer, a link to the recipe (in the mockup it opens the editor mockup). A photo under a day old shows a yellow (warning) clock there instead, and can be selected. The book wins over the clock.
- A bar fixed to the bottom with one button, "Verwijder selectie" (disabled without a selection). There is no delete-all.
- The button opens a dialog in the middle of the screen: "Weet je het zeker?", "N foto's, size." and, only when the selection has a photo under a day old, the form warning. "Annuleer" has focus; `Esc` or a click outside also cancels. The button reads "Verwijder N foto's".
- After a delete, a green message at the top says how many were deleted and how many kept, with a link to the recipe of each kept photo. The photo of 14 mrt acts as one a recipe started to use: it is kept and turns into a used tile.
- With nothing to show: "Niets om op te ruimen" (or "Geen foto's" for an empty bucket), the filters stay and there is no bar.
- The dark bar at the top switches between states (mockup only). Append `#select`, `#confirm`, `#result`, `#nouse` (filter "Ongebruikt" off), `#all` (both filters off), `#cap` or `#empty` to start in that state.

Colours, fonts and spacing follow the tokens in `app/app.css`; if those change, update the mockup or treat the app as the truth.

## `recipe-like-note-narrow.html` and `recipe-like-note-wide.html`

Static mockups of the recipe page with the heart (like) and the personal note, the design reference for the `like-and-note-recipe` OpenSpec change. Open them in a browser; they need no build. Fonts load from Google Fonts, the tile band from `public/img`. They have no behaviour: every state is drawn side by side.

- **Narrow** (a 390px phone, four states): closed with a note (marker on the floating button), the field open while typing (hint "Wordt vanzelf bewaard"), the field open and saved ("Bewaard" replaces the hint), and the field closed with the "Notitie bewaard" toast. The heart sits left of "Bewerk" in the top row, liked (red, filled) in the first three phones and not liked in the last.
- **Wide** (1280px, option A): the note panel sits under the ingredient list, always visible, with the "Bewaard" cue under the field. The page has no sticky column; everything scrolls with the page.
- Recipe, author and note texts are made-up samples, not real family content. The photo is a placeholder.
- Rejected: a note panel at the top of the wide page (option B), which only existed in the first review round.

Colours, fonts and spacing follow the tokens in `app/app.css`; if those change, update the mockup or treat the app as the truth. The same mockups live in a private Artifact: https://claude.ai/artifact/CMDsakVtQjhjYjiUiEKK8R
