const key = (email: string, slug: string) => `cookbook:note:${email.trim().toLowerCase()}:${slug}`;

/** Keeps a note text that could not be saved. A storage that throws (blocked, full) is ignored. */
export function keepNote(email: string, slug: string, text: string) {
  try {
    window.localStorage.setItem(key(email, slug), text);
  } catch {
    // Nothing to do: the note is lost as before.
  }
}

/** The kept note text, removed from the storage; undefined when there is none. */
export function takeNote(email: string, slug: string): string | undefined {
  try {
    const k = key(email, slug);
    const text = window.localStorage.getItem(k) ?? undefined;
    if (text !== undefined) window.localStorage.removeItem(k);
    return text;
  } catch {
    return undefined;
  }
}
