import { useEffect, useState } from 'react';
import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router';
import type { Route } from './+types/root';
import './app.css';
import { ServiceWorker, SkipLink, ThemeColor } from './shared/components';
import { envContext, publicRequestContext, userEmailContext } from './shared/context.server';
import { isSessionExpired } from './shared/isSessionExpired';
import { getRules } from './shared/rules.server';
import { getUser } from './shared/users.server';
import { redirectToWelcome } from './shared/welcome.server';

export const links: Route.LinksFunction = () => [
  // With credentials, or Cloudflare Access redirects the manifest request to its sign-in page.
  { rel: 'manifest', href: '/manifest.webmanifest', crossOrigin: 'use-credentials' },
  { rel: 'apple-touch-icon', href: '/icons/apple-touch-icon.png' },
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Mulish:wght@400;500;700;800;900&display=swap',
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content" />
        <ThemeColor />
        <Meta />
        {/* Links need no nonce (style-src and script-src allow 'self'). The empty value keeps the server's nonce off them: browsers hide it from the DOM, so hydration would warn about a mismatch. */}
        <Links nonce="" />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export async function loader({ request, context }: Route.LoaderArgs) {
  // A public request has no member: no lookup, no welcome screen.
  if (context.get(publicRequestContext)) return { email: '', role: 'user' as const };
  const email = context.get(userEmailContext);
  // A member without a user row is welcomed first and sent on to the page they asked for.
  const db = context.get(envContext).DB;
  const user = await getUser(db, email);
  const welcome = redirectToWelcome(user, new URL(request.url));
  if (welcome) throw welcome;
  // `role` drives the menu links only; the pages that need a role check it themselves. Without a user row (the welcome screen) there is no menu.
  return { email, role: user?.role ?? 'user', rules: await getRules(db) };
}

export default function App() {
  return (
    <>
      <SkipLink />
      <ServiceWorker />
      <Outlet />
    </>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  // A failed `fetch` (TypeError) may be an expired Access session: reload so Access shows its sign-in.
  const maybeExpired = error instanceof TypeError;
  const [checking, setChecking] = useState(maybeExpired);
  useEffect(() => {
    if (!maybeExpired) return;
    let cancelled = false;
    void isSessionExpired(location.href).then((expired) => {
      if (cancelled) return;
      if (expired) location.reload();
      else setChecking(false);
    });
    return () => {
      cancelled = true;
    };
  }, [maybeExpired]);
  if (checking) return <p data-testid="ErrorBoundary-signin">Opnieuw inloggen…</p>;

  let message = 'Oeps!';
  let details = 'Er ging iets mis.';
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : 'Fout';
    details = error.status === 404 ? 'Deze pagina bestaat niet.' : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main data-testid="ErrorBoundary-error" className="mx-auto max-w-272 px-[max(1rem,4vw)] pt-8 pb-16">
      <h1 className="text-5xl font-black">{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
