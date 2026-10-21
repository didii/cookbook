import { Outlet, useRouteLoaderData } from 'react-router';
import { Header } from '~/shared/Header';

/** Pages with the site header; the welcome screen sits outside it. */
export default function Layout() {
  const email = useRouteLoaderData<{ email: string }>('root')?.email ?? '';
  return (
    <>
      <Header email={email} />
      <Outlet />
    </>
  );
}
