import { data } from 'react-router';
import { envContext, userEmailContext } from '~app/shared/context.server';
import { requireAdmin } from '~app/shared/users.server';
import type { Route } from './+types/AdminPhotosPageRoute';
import { deletePhotos, findPhotos } from './lib/orphans.server';
import { PhotoList } from './lib/PhotoList';
import { readFilters } from './lib/photos';

/** Both the page and every delete are for admins only; this is the protection, the menu link is only a convenience. */
export async function loader({ request, context }: Route.LoaderArgs) {
  const { DB, PHOTOS } = context.get(envContext);
  await requireAdmin(DB, context.get(userEmailContext));
  const filters = readFilters(new URL(request.url).searchParams);
  return { ...(await findPhotos(DB, PHOTOS, filters, new Date())), filters };
}

/** Deletes the named photos that no recipe uses (checked again here) and answers how many went and which were kept. */
export async function action({ request, context }: Route.ActionArgs) {
  const { DB, PHOTOS } = context.get(envContext);
  await requireAdmin(DB, context.get(userEmailContext));
  const form = await request.formData();
  return data(await deletePhotos(DB, PHOTOS, form.getAll('naam').map(String)));
}

export function meta() {
  return [{ title: "Foto's · Familiekookboek" }];
}

export default function AdminPhotosPage({ loaderData }: Route.ComponentProps) {
  return (
    <main id="main" className="mx-auto max-w-3xl px-[max(1rem,4vw)] pt-6">
      <h1 className="text-[clamp(2rem,6vw,3rem)] leading-[1.05] font-black tracking-[-0.03em]">Foto&apos;s</h1>
      <p className="mt-2 text-lg text-muted">De foto&apos;s in de opslag.</p>
      <PhotoList photos={loaderData.photos} matches={loaderData.matches} filters={loaderData.filters} />
    </main>
  );
}
