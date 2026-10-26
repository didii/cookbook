import { useEffect, useId, useState, type FormEvent } from 'react';
import { useFetcher } from 'react-router';
import { Button } from '~app/shared/components';
import { Plus } from '~app/shared/icons';
import { errorOf, type ActionResult } from './actionResult';

interface AddTagFormProps {
  /** The tag was added: the answer's confirmation. Must keep its identity between renders. */
  onDone: (message: string) => void;
}

/** The field "Nieuwe tag" and its button. A refused name shows a message at the field and keeps what was typed. */
export function AddTagForm({ onDone }: AddTagFormProps) {
  const fetcher = useFetcher<ActionResult>();
  const id = useId();
  const [name, setName] = useState('');
  // The text that was sent, so the message goes away when the field changes.
  const [sent, setSent] = useState<string | null>(null);
  const result = fetcher.data;
  const error = errorOf(result)?.intent === 'add' && sent === name ? errorOf(result)?.error : undefined;

  // An added tag empties the field: reset while rendering the answer, not in an effect.
  const [seen, setSeen] = useState(result);
  if (result !== seen) {
    setSeen(result);
    if (result && 'done' in result) setName('');
  }

  useEffect(() => {
    if (result && 'done' in result) onDone(result.done);
  }, [result, onDone]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (fetcher.state !== 'idle') return;
    setSent(name);
    void fetcher.submit({ intent: 'add', name }, { method: 'post' });
  };

  return (
    <form onSubmit={submit} noValidate className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-2">
      <label htmlFor={id} className="col-span-2 mb-1 block text-[0.9375rem] font-black">
        Nieuwe tag
      </label>
      <div>
        <input
          id={id}
          name="name"
          data-testid="AddTagForm-name"
          value={name}
          placeholder="bv. Kerst"
          autoComplete="off"
          onChange={(e) => setName(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="block min-h-12 w-full rounded-[0.625rem] border-3 border-ink bg-white px-3 text-base font-bold text-ink placeholder:font-medium placeholder:text-muted focus:shadow-focus focus:outline-transparent aria-invalid:border-red"
        />
        {error && (
          <p id={`${id}-error`} data-testid="AddTagForm-error" role="alert" className="mt-1.5 font-extrabold text-red">
            {error}
          </p>
        )}
      </div>
      <Button
        type="submit"
        main
        data-testid="AddTagForm-submit"
        disabled={fetcher.state !== 'idle'}
        className="flex min-h-12 flex-none items-center justify-center gap-1.5 px-4 text-base"
      >
        <Plus />
        Toevoegen
      </Button>
    </form>
  );
}
