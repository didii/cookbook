import { Link } from 'react-router';
import { envContext } from '~/.server/context';
import { listRecipes } from '~/.server/recipes';
import { tileFor } from '~/lib/tile';
import type { Route } from './+types/route';
import { RecipeCard } from './RecipeCard';

export async function loader({ context }: Route.LoaderArgs) {
  return { recipes: await listRecipes(context.get(envContext).DB) };
}

export function meta() {
  return [{ title: 'Familiekookboek' }];
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { recipes } = loaderData;
  return (
    <main id="main" className="mx-auto max-w-272 px-[max(1rem,4vw)] pt-8 pb-16">
      <h1 className="text-[clamp(2rem,6vw,3.5rem)] leading-[1.05] font-black tracking-[-0.03em] text-balance">Wat eten we vandaag?</h1>
      {recipes.length === 0 ? (
        <p className="mt-2 max-w-[60ch] text-lg text-muted">
          Er zijn nog geen recepten. <Link to="/recepten/nieuw">Voeg het eerste recept toe.</Link>
        </p>
      ) : (
        <>
          <p className="mt-2 max-w-[60ch] text-lg text-muted">{recipes.length} recepten van de familie.</p>
          <ul className="mt-8 grid list-none grid-cols-[repeat(auto-fill,minmax(min(100%,17rem),1fr))] gap-6 p-0">
            {recipes.map((r, i) => (
              <li key={r.slug}>
                <RecipeCard recipe={r} tile={tileFor(i)} eager={i < 3} />
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
