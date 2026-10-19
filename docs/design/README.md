# Design mockups

## `recipe-editor.html`

Static, self-contained mockup of the recipe create/edit screen (the Appeltaart as example), approved as the design reference for the `edit-recipe-*` OpenSpec changes. Open it in a browser; it needs no build. Fonts load from Google Fonts, the photo and tile band from `packages/web/public/img`.

It is a visual and keyboard-behaviour reference, not production code: there is no editing logic. What it does demonstrate:

- The layout (main column plus right rail, sticky save bar), ingredient rows with the quantity coloured inside the field, steps with underlined anchor words, and every chip state: following (link icon), pinned (pin icon), proposed change, proposed removal, a ghost in the add row, and an open popup.
- The keyboard toolbars. The bar at the top switches between **Voor** (separate buttons) and **Na (toolbar)**, the chosen design, and can number the Tab stops. In "Na", Tab reaches each toolbar once and the arrow keys move inside it.
- Append `#before` to the address to start on "Voor", and `#stops` to start with the Tab stops numbered.

The dark bar at the top belongs to the mockup, not to the app. Colours, fonts and spacing follow the tokens in `packages/web/app/app.css`; if those change, update the mockup or treat the app as the truth.
