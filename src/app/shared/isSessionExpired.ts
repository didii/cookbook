/** Cloudflare Access answers an expired session with a redirect; a manual same-origin redirect gives `opaqueredirect`. A rejection (no connection) or a normal answer is not an expired session. */
export async function isSessionExpired(url: string, fetchFn: typeof fetch = fetch): Promise<boolean> {
  try {
    const response = await fetchFn(url, { method: 'HEAD', redirect: 'manual' });
    return response.type === 'opaqueredirect';
  } catch {
    return false;
  }
}
