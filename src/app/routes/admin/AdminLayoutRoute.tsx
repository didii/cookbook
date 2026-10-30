import { Outlet, useRouteLoaderData } from 'react-router';
import { shellColumns, shellContent, shellFrame } from '~app/shared/adminShell';
import { cn } from '~app/shared/cn';
import type { Role } from '~app/shared/role';
import { AdminNav } from './lib/AdminNav';

/** The admin area: the navigation next to (wide) or above (narrow) the page. Who may open a page is checked by the page itself. */
export default function AdminLayout() {
  const root = useRouteLoaderData<{ role: Role }>('root');
  return (
    <div className={cn(shellFrame, shellColumns, 'pt-6')}>
      <AdminNav role={root?.role ?? 'user'} />
      <main id="main" data-testid="AdminLayout-main" className={shellContent}>
        <Outlet />
      </main>
    </div>
  );
}
