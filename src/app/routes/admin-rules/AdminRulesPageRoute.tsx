import { data } from 'react-router';
import { envContext, userEmailContext } from '~app/shared/context.server';
import { getRules, resetRules, saveRules, toRows, type RulesRows } from '~app/shared/rules.server';
import { requireAdmin } from '~app/shared/users.server';
import type { Route } from './+types/AdminRulesPageRoute';

const isStrings = (v: unknown): v is string[] => Array.isArray(v) && v.every((w) => typeof w === 'string');
const isRows = (v: unknown): v is RulesRows => {
  const r = v as RulesRows | null;
  return (
    typeof r === 'object' &&
    r !== null &&
    isStrings(r.units) &&
    isStrings(r.looseUnits) &&
    isStrings(r.degreeWords) &&
    Array.isArray(r.durations) &&
    r.durations.every((d) => typeof d === 'object' && d !== null && typeof d.word === 'string' && typeof d.fixed === 'boolean')
  );
};

/** Both the page and every change are for admins only; this is the protection, the menu link is only a convenience. */
export async function loader({ context }: Route.LoaderArgs) {
  const db = context.get(envContext).DB;
  await requireAdmin(db, context.get(userEmailContext));
  return { rows: toRows(await getRules(db)) };
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
  let rows: unknown;
  try {
    rows = JSON.parse(String(form.get('rules')));
  } catch {
    throw data('Onleesbare regels.', { status: 400 });
  }
  if (!isRows(rows)) throw data('Onleesbare regels.', { status: 400 });
  const { errors } = await saveRules(db, rows);
  if (errors) return data({ errors, rows }, { status: 400 });
  return data({ saved: true as const });
}

export function meta() {
  return [{ title: 'Herkenning · Familiekookboek' }];
}

export default function AdminRulesPage({ loaderData }: Route.ComponentProps) {
  return <main id="main">{loaderData.rows.units.length}</main>;
}
