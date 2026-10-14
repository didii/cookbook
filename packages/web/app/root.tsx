import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import { userEmailContext } from "~/lib/context";
import { Header } from "~/shared/Header";
import { SkipLink } from "~/shared/SkipLink";
import { TileDefs } from "~/shared/TileDefs";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Mulish:wght@400;500;700;800;900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <TileDefs />
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export function loader({ context }: Route.LoaderArgs) {
  return { email: context.get(userEmailContext) };
}

export default function App({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <SkipLink />
      <Header email={loaderData.email} />
      <Outlet />
    </>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oeps!";
  let details = "Er ging iets mis.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Fout";
    details =
      error.status === 404
        ? "Deze pagina bestaat niet."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="mx-auto max-w-272 px-[max(1rem,4vw)] pt-8 pb-16">
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
