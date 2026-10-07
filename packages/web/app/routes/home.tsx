import { env } from "cloudflare:workers";

import type { Route } from "./+types/home";
import { userEmailContext } from "../context";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Cookbook" }];
}

export async function loader({ context }: Route.LoaderArgs) {
  const db = await env.DB.prepare("SELECT 1 AS ok").first<{ ok: number }>();
  return { email: context.get(userEmailContext), dbOk: db?.ok === 1 };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>Cookbook</h1>
      <p>Signed in as {loaderData.email}</p>
      <p>Database: {loaderData.dbOk ? "ok" : "unavailable"}</p>
    </main>
  );
}
