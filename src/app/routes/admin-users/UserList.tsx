import { NavLink } from 'react-router';
import type { UserListItem } from '~app/.server/users';

type Props = { users: UserListItem[]; capped: boolean; limit: number };

/** The users, one link each to its detail; the selected one is marked by `aria-current` (the URL is the selection). */
export function UserList({ users, capped, limit }: Props) {
  return (
    <>
      <ul className="mt-4 grid gap-2">
        {users.map((user) => (
          <li key={user.id}>
            <NavLink
              to={String(user.id)}
              data-testid="UserList-user"
              className="flex min-h-11 flex-col rounded-[0.625rem] border-3 border-ink bg-white px-3 py-1 no-underline hover:bg-yel aria-[current=page]:bg-yel aria-[current=page]:shadow-hard"
            >
              <span className="font-black">{user.callingName}</span>
              <span className="text-muted">{user.email}</span>
            </NavLink>
          </li>
        ))}
      </ul>
      {capped && (
        <p data-testid="UserList-capped" className="mt-3 font-bold">
          Er zijn meer dan {limit} gebruikers; alleen de eerste {limit} worden getoond.
        </p>
      )}
    </>
  );
}
