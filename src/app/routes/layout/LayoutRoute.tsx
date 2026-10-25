import { Outlet, useRouteLoaderData } from 'react-router';
import type { Role } from '~app/shared/role';
import { Header } from './lib/Header';

/** Pages with the site header; the welcome screen sits outside it. */
export default function Layout() {
  const root = useRouteLoaderData<{ email: string; role: Role }>('root');
  return (
    <>
      <Header email={root?.email ?? ''} userRole={root?.role ?? 'user'} />
      <Outlet />
    </>
  );
}
