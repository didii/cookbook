const key = (email: string, slug: string) => `cookbook:note:${email.trim().toLowerCase()}:${slug}`;

/** A note text that could not be saved, and the stored text it was typed on (`base`): the text is only restored while the stored note is still that one. */
export type KeptNote = { text: string; base: string };

/** Keeps a note text that could not be saved. A storage that throws (blocked, full) is ignored. */
export function keepNote(email: string, slug: string, kept: KeptNote) {
  try {
    window.localStorage.setItem(key(email, slug), JSON.stringify(kept));
  } catch {
    // Nothing to do: the note is lost as before.
  }
}

/** The kept note, removed from the storage; undefined when there is none or it cannot be read. */
export function takeNote(email: string, slug: string): KeptNote | undefined {
  try {
    const k = key(email, slug);
    const raw = window.localStorage.getItem(k);
    if (raw === null) return undefined;
    window.localStorage.removeItem(k);
    const kept = JSON.parse(raw) as Partial<KeptNote>;
    return typeof kept.text === 'string' && typeof kept.base === 'string' ? { text: kept.text, base: kept.base } : undefined;
  } catch {
    return undefined;
  }
}
