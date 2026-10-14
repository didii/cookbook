import { twMerge } from "tailwind-merge";

/** Join class names; later Tailwind utilities override earlier conflicting ones. */
export const cn = (...classes: (string | false | null | undefined)[]) => twMerge(classes);
