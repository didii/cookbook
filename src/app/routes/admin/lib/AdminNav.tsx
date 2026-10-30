import { NavLink } from 'react-router';
import { hoverTint } from '~app/shared/hover';
import type { Role } from '~app/shared/role';

const links = [
  { to: '/beheer/herkenning', label: 'Herkenning' },
  { to: '/beheer/fotos', label: "Foto's" },
  { to: '/beheer/gebruikers', label: 'Gebruikers', superadmin: true },
];

/** The navigation of the admin area: only the pages the role may use. The current page is marked by `aria-current`, which `NavLink` sets (also on a user's detail). */
export function AdminNav({ role }: { role: Role }) {
  return (
    <nav aria-label="Beheer" data-testid="AdminNav-nav" className="lg:sticky lg:top-4 lg:self-start">
      <ul data-testid="AdminNav-list" className="grid gap-1">
        {links
          .filter((l) => !l.superadmin || role === 'superadmin')
          .map(({ to, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                data-testid="AdminNav-link"
                className={`flex min-h-11 items-center rounded-[0.625rem] border-3 border-transparent px-3 text-lg font-black no-underline aria-[current=page]:border-ink aria-[current=page]:bg-yel aria-[current=page]:shadow-hard-xs ${hoverTint}`}
              >
                {label}
              </NavLink>
            </li>
          ))}
      </ul>
    </nav>
  );
}
