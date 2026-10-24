import { data, Form, redirect } from 'react-router';
import { Button, Fret, Plaid, TileBand } from '~app/shared/components';
import { envContext, userEmailContext } from '~app/shared/context.server';
import { safeReturnUrl } from '~app/shared/returnUrl';
import { tiles } from '~app/shared/tile';
import { createUser, getUser } from '~app/shared/users.server';
import type { Route } from './+types/WelcomePageRoute';

const maxNameLength = 40;

export async function loader({ request, context }: Route.LoaderArgs) {
  const returnUrl = safeReturnUrl(new URL(request.url).searchParams.get('returnUrl'));
  if (await getUser(context.get(envContext).DB, context.get(userEmailContext))) throw redirect(returnUrl);
  return { returnUrl, tile: Math.floor(Math.random() * tiles.length) };
}

/** The calling name without surrounding spaces, or why it is refused. */
function checkName(value: FormDataEntryValue | null): { name: string; error?: string } {
  const name = typeof value === 'string' ? value.trim() : '';
  if (!name) return { name, error: 'Vul in hoe we je noemen.' };
  if (name.length > maxNameLength) return { name, error: `Maximaal ${maxNameLength} tekens.` };
  return { name };
}

export async function action({ request, context }: Route.ActionArgs) {
  const form = await request.formData();
  const { name, error } = checkName(form.get('callingName'));
  if (error) return data({ error, name }, { status: 400 });
  // Idempotent: a second submit (another tab) changes nothing and keeps the first name.
  const env = context.get(envContext);
  await createUser(env.DB, context.get(userEmailContext), name, env.SUPERADMIN_EMAIL);
  return redirect(safeReturnUrl(form.get('returnUrl') as string | null));
}

export function meta() {
  return [{ title: 'Welkom · Familiekookboek' }];
}

export default function WelcomePage({ loaderData, actionData }: Route.ComponentProps) {
  return (
    <main id="main" className="@container mx-auto max-w-3xl px-[max(1rem,4vw)] pt-8 pb-16 md:pt-16">
      <div data-testid="WelcomePage-card" className="relative overflow-hidden rounded-xl border-3 border-ink bg-white">
        <Plaid className="h-8" />
        <Fret size={14} className="text-red" />
        <Form method="post" className="p-6">
          <h1 className="text-[clamp(2rem,6vw,3rem)] leading-[1.05] font-black tracking-[-0.03em] text-balance">Welkom in het Familiekookboek</h1>
          <p className="mt-2 text-lg text-pretty text-muted">Alle familierecepten op één plek. Eén ding nog voordat je begint.</p>
          <input type="hidden" name="returnUrl" value={loaderData.returnUrl} />
          <label htmlFor="callingName" data-testid="WelcomePage-label" className="mt-6 block font-extrabold">
            Hoe noemen we je?
          </label>
          <input
            id="callingName"
            data-testid="WelcomePage-name"
            name="callingName"
            type="text"
            autoComplete="off"
            maxLength={maxNameLength}
            required
            defaultValue={actionData?.name}
            aria-invalid={actionData?.error ? true : undefined}
            aria-describedby={actionData?.error ? 'callingName-error' : undefined}
            className="mt-1 block min-h-13 w-full rounded-[0.625rem] border-3 border-ink bg-white px-3 text-lg text-ink hover:not-focus:bg-[color-mix(in_srgb,var(--color-ink)_5%,white)] focus:shadow-focus focus:outline-transparent aria-invalid:border-red"
          />
          {actionData?.error && (
            <p id="callingName-error" data-testid="WelcomePage-error" role="alert" className="mt-1 font-bold text-red">
              {actionData.error}
            </p>
          )}
          <Button main type="submit" className="mt-6 w-full">
            Aan de slag
          </Button>
        </Form>
        <TileBand first={loaderData.tile} responsive className="border-t-3" />
      </div>
    </main>
  );
}
