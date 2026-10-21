/** The press effect of every button with a hard shadow: it sinks by the shadow's offset and loses the shadow while held. See design.md. */
export const press =
  'shadow-hard-sm transition-[translate,box-shadow] duration-80 active:not-disabled:[translate:3px_3px] active:not-disabled:shadow-none motion-reduce:transition-none';
