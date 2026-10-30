import { Outlet } from 'react-router';
import { envContext, userEmailContext } from '~app/shared/context.server';
import { listUsers, requireSuperadmin, userLimit } from '~app/shared/users.server';
import type { Route } from './+types/AdminUsersPageRoute';
import { UserList } from './lib/UserList';

/** Superadmins only; this is the protection, the menu link is only a convenience. */
export async function loader({ context }: Route.LoaderArgs) {
  const db = context.get(envContext).DB;
  await requireSuperadmin(db, context.get(userEmailContext));
  return { ...(await listUsers(db)), limit: userLimit };
}

export function meta() {
  return [{ title: 'Gebruikers · Familiekookboek' }];
}

/** Master: the list on top; the selected user's detail (a child route) renders below it. */
export default function AdminUsersPage({ loaderData }: Route.ComponentProps) {
  return (
    <div className="pb-16">
      <h1 className="text-[clamp(2rem,6vw,3rem)] leading-[1.05] font-black tracking-[-0.03em]">Gebruikers</h1>
      <UserList users={loaderData.users} capped={loaderData.capped} limit={loaderData.limit} />
      <Outlet />
    </div>
  );
}
