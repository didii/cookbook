/** The one hover rule. A white control gets the faint tint (`--color-hover`), a coloured or selected one darkens, a plain text link underlines, an underlined one changes colour. Tailwind gates `hover:` behind `(hover: hover)`, so touch screens show none of it. */
export const hoverTint = 'hover:not-disabled:bg-hover';
/** A white text field: tinted until it has focus. */
export const hoverField = 'hover:not-focus:bg-hover';
export const hoverDarken = 'hover:not-disabled:brightness-95';
export const hoverUnderline = 'underline-offset-[0.25em] hover:underline';
export const hoverRecolor = 'hover:text-blu';
