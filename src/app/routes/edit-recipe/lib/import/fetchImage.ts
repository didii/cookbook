/** The image at a web address, fetched through the Worker (the browser may not read other sites), or undefined when it could not be fetched. */
export async function fetchImage(url: string): Promise<Blob | undefined> {
  try {
    const response = await fetch('/importeren/foto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    return response.ok ? await response.blob() : undefined;
  } catch {
    return undefined;
  }
}
