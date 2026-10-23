import { data, redirect } from 'react-router';
import { envContext, userEmailContext } from '~app/.server/context';
import { deleteUser, getUserById, isLastSuperadmin, requireSuperadmin, updateUser } from '~app/.server/users';
import { roles, type Role } from '~app/lib/role';
import type { Route } from './user/+types/route';
import { UserForm } from './lib/UserForm';

/** The role check comes first, so a non-superadmin gets 403 for any id and cannot tell which users exist. */
async function target(context: Route.LoaderArgs['context'], idParam: string) {
  const db = context.get(envContext).DB;
  const me = await requireSuperadmin(db, context.get(userEmailContext));
  const user = /^\d{1,9}$/.test(idParam) ? await getUserById(db, Number(idParam)) : undefined;
  if (!user) throw data('Gebruiker niet gevonden', { status: 404 });
  return { db, me, user };
}

export async function loader({ params, context }: Route.LoaderArgs) {
  const { db, me, user } = await target(context, params.id);
  return {
    user: { id: user.id, email: user.email, callingName: user.callingName, role: user.role },
    lastSuperadmin: await isLastSuperadmin(db, user),
    isSelf: me.id === user.id,
    accessUrl: context.get(envContext).CLOUDFLARE_ACCESS_URL,
  };
}

export async function action({ request, params, context }: Route.ActionArgs) {
  const { db, me, user } = await target(context, params.id);
  const form = await request.formData();
  const isSelf = me.id === user.id;
  if (form.get('intent') === 'delete') {
    if (!(await deleteUser(db, user.id))) {
      await target(context, params.id); // 404 when the user vanished meanwhile (e.g. a double submit)
      return data({ refused: 'De enige superadmin kan niet worden verwijderd.' }, { status: 400 });
    }
    // Without a user row the member is welcomed again, so a self-delete goes home (the page would answer 403).
    return redirect(isSelf ? '/' : '/beheer/gebruikers');
  }
  const callingName = String(form.get('callingName') ?? '').trim();
  if (!callingName) return data({ error: 'Vul een roepnaam in.' }, { status: 400 });
  // A disabled field is not submitted, so a missing role means unchanged.
  const roleValue = form.get('role');
  if (roleValue !== null && !roles.includes(roleValue as Role)) return data({ refused: 'Onbekende rol.' }, { status: 400 });
  const role = roleValue === null ? undefined : (roleValue as Role);
  if (!(await updateUser(db, user.id, { callingName, role }))) {
    await target(context, params.id); // 404 when the user vanished meanwhile
    return data({ refused: 'De rol van de enige superadmin kan niet worden gewijzigd.' }, { status: 400 });
  }
  // Demoting yourself ends your access to this page, so go home.
  if (isSelf && role && role !== 'superadmin') return redirect('/');
  return data({ saved: true as const });
}

export default function AdminUserPage({ loaderData, actionData }: Route.ComponentProps) {
  const { user, lastSuperadmin, isSelf, accessUrl } = loaderData;
  const error = actionData && 'error' in actionData ? actionData.error : undefined;
  const refused = actionData && 'refused' in actionData ? actionData.refused : undefined;
  const saved = !!actionData && 'saved' in actionData;
  return (
    <UserForm
      key={user.id}
      user={user}
      lastSuperadmin={lastSuperadmin}
      isSelf={isSelf}
      accessUrl={accessUrl}
      error={error}
      refused={refused}
      saved={saved}
    />
  );
}
