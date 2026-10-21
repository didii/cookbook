import { Outlet, useRouteLoaderData } from 'react-router';
import type { Role } from '~/.server/users';
import { Header } from '~/shared/Header';

/** Pages with the site header; the welcome screen sits outside it. */
export default function Layout() {
  const root = useRouteLoaderData<{ email: string; role: Role }>('root');
  return (
    <>
      <Header email={root?.email ?? ''} role={root?.role ?? 'user'} />
      <Outlet />
    </>
  );
}
