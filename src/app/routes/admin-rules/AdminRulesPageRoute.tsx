import { data } from 'react-router';
import { envContext, userEmailContext } from '~app/shared/context.server';
import { getRules, readRules, resetRules, saveRules, toRows, type RulesErrors, type RulesRows } from '~app/shared/rules.server';
import { getStaples, readStaples, resetStaples, saveStaples } from '~app/shared/staples.server';
import { requireAdmin } from '~app/shared/users.server';
import type { Route } from './+types/AdminRulesPageRoute';
import { RulesForm } from './lib/RulesForm';

const isStrings = (v: unknown): v is string[] => Array.isArray(v) && v.every((w) => typeof w === 'string');
const isRows = (v: unknown): v is RulesRows => {
  const r = v as RulesRows | null;
  return (
    typeof r === 'object' &&
    r !== null &&
    isStrings(r.units) &&
    isStrings(r.looseUnits) &&
    isStrings(r.degreeWords) &&
    isStrings(r.staples) &&
    Array.isArray(r.durations) &&
    r.durations.every((d) => typeof d === 'object' && d !== null && typeof d.word === 'string' && typeof d.fixed === 'boolean')
  );
};

/** Both the page and every change are for admins only; this is the protection, the menu link is only a convenience. */
export async function loader({ context }: Route.LoaderArgs) {
  const db = context.get(envContext).DB;
  await requireAdmin(db, context.get(userEmailContext));
  return { rows: toRows(await getRules(db), await getStaples(db)) };
}

export async function action({ request, context }: Route.ActionArgs) {
  const db = context.get(envContext).DB;
  await requireAdmin(db, context.get(userEmailContext));
  const form = await request.formData();
  const intent = form.get('intent');
  if (intent === 'reset') {
    await resetRules(db);
    await resetStaples(db);
    return data({ saved: true as const, nonce: crypto.randomUUID() });
  }
  if (intent !== 'save') throw data('Onbekende actie.', { status: 400 });
  let rows: unknown;
  try {
    rows = JSON.parse(String(form.get('rules')));
  } catch {
    throw data('Onleesbare regels.', { status: 400 });
  }
  if (!isRows(rows)) throw data('Onleesbare regels.', { status: 400 });
  // Every list is checked before anything is stored, so a fault in one keeps the others out too.
  const readRule = readRules(rows);
  const readStaple = readStaples(rows.staples);
  const errors: RulesErrors = { ...('errors' in readRule && readRule.errors), ...('errors' in readStaple && { staples: readStaple.errors }) };
  if (Object.keys(errors).length) return data({ errors, rows, nonce: crypto.randomUUID() }, { status: 400 });
  await saveRules(db, rows);
  if ('staples' in readStaple) await saveStaples(db, readStaple.staples);
  return data({ saved: true as const, nonce: crypto.randomUUID() });
}

export function meta() {
  return [{ title: 'Herkenning · Familiekookboek' }];
}

export default function AdminRulesPage({ loaderData, actionData }: Route.ComponentProps) {
  const refused = actionData && 'errors' in actionData ? actionData : undefined;
  const saved = actionData && 'saved' in actionData;
  return (
    <div>
      <h1 className="text-[clamp(2rem,6vw,3rem)] leading-[1.05] font-black tracking-[-0.03em]">Herkenning</h1>
      <p className="mt-2 text-lg text-muted">De woorden die het kookboek herkent in recepten. Hoofdletters maken niet uit.</p>
      {saved && (
        <output data-testid="AdminRulesPage-saved" className="mt-4 block font-extrabold text-blu">
          Opgeslagen.
        </output>
      )}
      {/* Keyed on the stored rules and on every answer, so each answer shows its own rows: the stored rules after a save or a restore (also when they did not change), the posted rows with their messages after a refusal. */}
      <RulesForm key={`${actionData?.nonce}${JSON.stringify(loaderData.rows)}`} initial={refused?.rows ?? loaderData.rows} errors={refused?.errors} />
    </div>
  );
}
