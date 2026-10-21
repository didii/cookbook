import { Form } from 'react-router';
import type { Role, UserListItem } from '~/.server/users';
import { Button } from '~/shared/Button';

type Props = { user: UserListItem; lastSuperadmin: boolean; error?: string; refused?: string; saved?: boolean };

const roles: { value: Role; label: string }[] = [
  { value: 'user', label: 'Gebruiker' },
  { value: 'admin', label: 'Beheerder' },
  { value: 'superadmin', label: 'Superadmin' },
];
const field =
  'mt-1 block min-h-12 w-full rounded-[0.625rem] border-3 border-ink bg-white px-3 text-lg text-ink focus:shadow-focus focus:outline-transparent disabled:opacity-40 aria-invalid:border-red';

/** The edit form of one user. Fields are uncontrolled, so "Herstel" (`type="reset"`) puts the stored values back; the caller keys it by user id. */
export function UserForm({ user, lastSuperadmin, error, refused, saved }: Props) {
  return (
    <section aria-labelledby="user-title" className="mt-8 border-t-3 border-ink pt-6">
      <h2 id="user-title" data-testid="UserForm-title" className="text-2xl font-black">
        {user.callingName}
      </h2>
      <Form method="post" className="mt-4 grid gap-5" noValidate>
        <p>
          <span className="font-extrabold">E-mailadres</span>
          <br />
          <span data-testid="UserForm-email">{user.email}</span>
        </p>
        <div>
          <label htmlFor="callingName" className="font-extrabold">
            Roepnaam
          </label>
          <input
            id="callingName"
            name="callingName"
            data-testid="UserForm-name"
            defaultValue={user.callingName}
            autoComplete="off"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'callingName-error' : undefined}
            className={field}
          />
          {error && (
            <p id="callingName-error" data-testid="UserForm-error" role="alert" className="mt-1 font-bold text-red">
              {error}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="role" className="font-extrabold">
            Rol
          </label>
          <select
            id="role"
            name="role"
            data-testid="UserForm-role"
            defaultValue={user.role}
            disabled={lastSuperadmin}
            aria-describedby={lastSuperadmin ? 'role-reason' : undefined}
            className={field}
          >
            {roles.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {lastSuperadmin && (
            <p id="role-reason" data-testid="UserForm-reason" className="mt-1 text-muted">
              De rol van de enige superadmin kan niet worden gewijzigd
            </p>
          )}
        </div>
        {refused && (
          <p data-testid="UserForm-refused" role="alert" className="font-bold text-red">
            {refused}
          </p>
        )}
        {saved && (
          <output data-testid="UserForm-saved" className="block font-extrabold text-blu">
            Opgeslagen.
          </output>
        )}
        <div className="flex flex-wrap gap-3">
          <Button main type="submit" name="intent" value="save" data-testid="UserForm-save">
            Opslaan
          </Button>
          <Button type="reset" data-testid="UserForm-reset">
            Herstel
          </Button>
        </div>
      </Form>
    </section>
  );
}
