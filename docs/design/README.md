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

## `recipe-like-note-narrow.html` and `recipe-like-note-wide.html`

Static mockups of the recipe page with the heart (like) and the personal note, the design reference for the `like-and-note-recipe` OpenSpec change. Open them in a browser; they need no build. Fonts load from Google Fonts, the tile band from `public/img`. They have no behaviour: every state is drawn side by side.

- **Narrow** (a 390px phone, four states): closed with a note (marker on the floating button), the field open while typing (hint "Wordt vanzelf bewaard"), the field open and saved ("Bewaard" replaces the hint), and the field closed with the "Notitie bewaard" toast. The heart sits left of "Bewerk" in the top row, liked (red, filled) in the first three phones and not liked in the last.
- **Wide** (1280px, option A): the note panel sits under the ingredient list, always visible, with the "Bewaard" cue under the field. The page has no sticky column; everything scrolls with the page.
- Recipe, author and note texts are made-up samples, not real family content. The photo is a placeholder.
- Rejected: a note panel at the top of the wide page (option B), which only existed in the first review round.

Colours, fonts and spacing follow the tokens in `app/app.css`; if those change, update the mockup or treat the app as the truth. The same mockups live in a private Artifact: https://claude.ai/artifact/CMDsakVtQjhjYjiUiEKK8R
