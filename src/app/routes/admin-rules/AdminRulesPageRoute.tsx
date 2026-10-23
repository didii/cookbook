import { data, Form } from 'react-router';
import { envContext, userEmailContext } from '~app/.server/context';
import { getRules, resetRules, saveRules, toFields, type RulesFields } from '~app/.server/rules';
import { requireAdmin } from '~app/.server/users';
import { Button } from '~app/shared/Button';
import type { Route } from './+types/route';

const fields = [
  { name: 'units', label: 'Eenheden', help: 'Woorden die na een getal een eenheid zijn, zoals "g" of "el".' },
  { name: 'minuteWords', label: 'Minuutwoorden', help: 'Woorden voor minuten, zoals "minuten".' },
  { name: 'hourWords', label: 'Uurwoorden', help: 'Woorden voor uren, zoals "uur".' },
  { name: 'degreeWords', label: 'Graadwoorden', help: 'Woorden na een oventemperatuur, zoals "graden" of "°C".' },
  { name: 'spoken', label: 'Uitgesproken duur', help: 'Eén per regel als "een kwartier = 15" (minuten).' },
] as const satisfies { name: keyof RulesFields; label: string; help: string }[];

/** Both the page and every change are for admins only; this is the protection, the menu link is only a convenience. */
export async function loader({ context }: Route.LoaderArgs) {
  const db = context.get(envContext).DB;
  await requireAdmin(db, context.get(userEmailContext));
  return { values: toFields(await getRules(db)) };
}

export async function action({ request, context }: Route.ActionArgs) {
  const db = context.get(envContext).DB;
  await requireAdmin(db, context.get(userEmailContext));
  const form = await request.formData();
  const intent = form.get('intent');
  if (intent === 'reset') {
    await resetRules(db);
    return data({ saved: true as const });
  }
  if (intent !== 'save') throw data('Onbekende actie.', { status: 400 });
  const values = Object.fromEntries(fields.map(({ name }) => [name, String(form.get(name) ?? '')])) as RulesFields;
  const { errors } = await saveRules(db, values);
  if (errors) return data({ errors, values }, { status: 400 });
  return data({ saved: true as const });
}

export function meta() {
  return [{ title: 'Herkenning · Familiekookboek' }];
}

export default function AdminRulesPage({ loaderData, actionData }: Route.ComponentProps) {
  const errors = actionData && 'errors' in actionData ? actionData.errors : {};
  const values = actionData && 'values' in actionData ? actionData.values : loaderData.values;
  const saved = actionData && 'saved' in actionData;
  return (
    <main id="main" className="mx-auto max-w-3xl px-[max(1rem,4vw)] pt-6 pb-16">
      <h1 className="text-[clamp(2rem,6vw,3rem)] leading-[1.05] font-black tracking-[-0.03em]">Herkenning</h1>
      <p className="mt-2 text-lg text-muted">De woorden die het kookboek herkent in recepten. Eén woord per regel; hoofdletters maken niet uit.</p>
      {saved && (
        <output data-testid="AdminRules-saved" className="mt-4 block font-extrabold text-blu">
          Opgeslagen.
        </output>
      )}
      <Form method="post" className="mt-4 grid gap-5" noValidate>
        {fields.map(({ name, label, help }) => {
          const error = errors[name];
          return (
            <div key={name}>
              <label htmlFor={name} className="font-extrabold">
                {label}
              </label>
              <p className="text-muted">{help}</p>
              <textarea
                key={values[name]}
                id={name}
                name={name}
                data-testid="AdminRules-field"
                rows={Math.min(12, Math.max(3, values[name].split('\n').length))}
                defaultValue={values[name]}
                autoCapitalize="none"
                spellCheck={false}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? `${name}-error` : undefined}
                className="mt-1 block w-full rounded-[0.625rem] border-3 border-ink bg-white px-3 py-2 text-lg text-ink focus:shadow-focus focus:outline-transparent aria-invalid:border-red"
              />
              {error && (
                <p id={`${name}-error`} data-testid="AdminRules-error" role="alert" className="mt-1 font-bold text-red">
                  {error}
                </p>
              )}
            </div>
          );
        })}
        <div className="flex flex-wrap gap-3">
          <Button main type="submit" name="intent" value="save" data-testid="AdminRules-save">
            Opslaan
          </Button>
          <Button
            type="submit"
            name="intent"
            value="reset"
            data-testid="AdminRules-reset"
            onClick={(e) => {
              if (!confirm('Alle eigen woorden verwijderen en de standaardwaarden herstellen?')) e.preventDefault();
            }}
          >
            Standaardwaarden herstellen
          </Button>
        </div>
      </Form>
    </main>
  );
}
