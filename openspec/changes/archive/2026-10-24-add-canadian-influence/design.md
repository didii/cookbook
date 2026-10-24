# Design

## Context

See proposal.md for why. Current state:

- `LikeButton` renders lucide `Heart` from `shared/icons.tsx`; `Heart` is used nowhere else. All icons there share one wrapper (`size-5 shrink-0`).
- `SiteMenu` is a modal `<dialog>` (`bg-red`, `w-72`) whose panel is `h-full p-4` with the close button first. `Header` is a red bar with the menu button, then a `Fret` (14px, `mb-1.5`). Its height follows from its content, nothing names it.
- `WelcomePageRoute` is a `border-3 border-ink shadow-hard` card with a `Fret`, the form and a `TileBand`.
- Colours and shadows come from `@theme` tokens in `app.css`; component classes stay out of it (STRUCTURE.md). `Fret` is a decorative component with an inline-styled, `aria-hidden` div; plaid should follow that pattern.
- `maple-leaf.svg` sits untracked in the repo root: 14x14 viewBox, one filled path.

## Goals / Non-Goals

**Goals:**
- One shared plaid pattern, drawn from `--color-red` and `--color-ink`, with the ink strength and cell size as inputs.
- The sidebar's plaid section is exactly as tall as the header, without one file knowing the other's markup.

**Non-Goals:**
- No other Canadian motif (see proposal "Out of scope").
- No new colour token, image asset or dependency.
- No change to like behaviour, the like request or storage.

## Decisions

**1. `Plaid` is a decorative layer, not a wrapper.** `shared/components/Plaid.tsx` renders an `aria-hidden` div with the plaid background and props `{ strength?: number; cell?: number; className? }` (defaults 0.45 and 32px). The caller gives it its size or position through `className`: `absolute inset-0` behind content in the sidebar, `h-8` as a strip in the welcome card. Why: content inside an `aria-hidden` element would be hidden from assistive technology, and the sidebar's close button must stay reachable. Alternative: a wrapper element with the background, rejected because of that. The pattern is two crossing `repeating-linear-gradient`s of `var(--plaid-ink)` over `var(--color-red)`, where `--plaid-ink` is `color-mix(in srgb, var(--color-ink) <strength>%, transparent)` and `--plaid-cell` is the cell size. Both are set inline because strength and cell are parameters, as `Fret` does for its size.

**2. Header height becomes a named token.** `app.css` gets `--spacing-header` set to the header's height (`py-3` + 44px menu button + 14px fret = 5.125rem, without the margin below the header), and `Header` (`min-h-header`, with the `mb-1.5` on the header itself so the fret stays flush with its bottom) and the sidebar's plaid section both use it (`h-header`). Why: the spec says they are equally tall; a shared token keeps either file from depending on the other's markup. Alternative: copying a pixel value into both files, rejected because it drifts silently.

**3. Sidebar panel split in two.** The panel becomes a plaid top (`relative h-header`, `Plaid` behind it at `absolute inset-0`, the close button on top at `ml-2` in the 68px above a `Fret` of 14px along the bottom, like the header, no border) and a body below (`p-4`, the nav). The dialog stays `bg-red`, so the body is solid red. The close button keeps `iconButton` but is bare white: no border, no fill beyond the existing hover tint. The offset is `0.5rem`, the header's minimum left padding; at wider screens the sidebar covers the header, so no match is needed there.

**4. Welcome strip.** The card (`relative overflow-hidden rounded-xl border-3 border-ink bg-white`) starts with a `Plaid` strip (`h-8`), then the `Fret`, the form and the `TileBand`. `overflow-hidden` clips the strip and the `TileBand` to the card's corners. The `max-w-3xl` main and its `@container` stay, so `TileBand`'s responsive steps still read the card's width.

**5. `MapleLeaf` in `shared/icons.tsx`.** A custom SVG icon (path from `maple-leaf.svg`, `viewBox="0 0 14 14"`) with the same default class as the other icons. It draws with `currentColor`: outline `fill-none stroke-current stroke-[0.8]` with round joins when not liked, `fill-current` when liked. `LikeButton` passes `liked && 'fill-current'` as it does now, and its icon size becomes `size-7`. `Heart` and the lucide import are removed. Why a custom icon: lucide has no maple leaf. `maple-leaf.svg` is deleted afterwards, since the path now lives in code.

**6. Test id.** `LikeButton-heart` becomes `LikeButton-leaf`; scenario titles of `recipe-like` stay, so describe names do not change.

## Risks / Trade-offs

- White close cross over crossing ink bands may lose contrast → check in the browser; if poor, raise the ink strength of the sidebar's plaid or darken only the corner behind the cross.
- Measured header height may differ per font loading or text size → the token is the single source, and `Header` uses it as `min-h`, not a fixed height, so large text still grows it.
- The 0.8 stroke outline may look thin at 28px on a phone → look at it on a device; raise the stroke to 1 if needed.
- Plaid parameters are inline styles, so cell size is not responsive → fine for two fixed places; revisit only if a third appears.
