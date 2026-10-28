/** The address and link text of a source that is a web address (`http://` or `https://`, no whitespace); undefined for any other source, which is shown as text. The text is the host without a leading `www.`. */
export function sourceLink(source: string): { href: string; text: string } | undefined {
  const href = source.trim();
  if (!/^https?:\/\/\S+$/i.test(href)) return undefined;
  try {
    return { href, text: new URL(href).host.replace(/^www\./, '') };
  } catch {
    return undefined;
  }
}
