/** The press effect of every button with a hard shadow: it sinks by the shadow's offset and loses the shadow while held. See design.md. */
export const press =
  'shadow-hard-sm transition-[translate,box-shadow] duration-80 active:not-disabled:[translate:3px_3px] active:not-disabled:shadow-none motion-reduce:transition-none';

const base = 'transition-[translate,box-shadow] duration-80 active:not-disabled:shadow-none motion-reduce:transition-none';

// Full class names on purpose: Tailwind only generates classes it finds as complete strings in the source.
const sizes = {
  xs: 'shadow-hard-xs active:not-disabled:[translate:2px_2px]',
  sm: 'shadow-hard-sm active:not-disabled:[translate:3px_3px]',
  md: 'shadow-hard active:not-disabled:[translate:5px_5px]',
  lg: 'shadow-hard-lg active:not-disabled:[translate:7px_7px]',
};

export function pressCss(size: keyof typeof sizes = 'md') {
  return `${sizes[size]} ${base}`;
}
