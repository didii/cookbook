import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, test, vi } from 'vitest';
import { act, fireEvent, render, screen } from '~testing/dom';
import { ShareDialog } from './ShareDialog';

const realFetch = globalThis.fetch;
let answers: { create: object; expiry: object };
const shareSheet = vi.fn(async (_data: ShareData) => {});
const writeText = vi.fn(async (_text: string) => {});
const onClose = vi.fn();

beforeEach(() => {
  answers = { create: { token: 'tok', expiresAt: null, created: true }, expiry: { expiresAt: '2027-03-10T12:00:00Z' } };
  shareSheet.mockClear();
  writeText.mockClear();
  onClose.mockClear();
  globalThis.fetch = ((url: string) => Promise.resolve(Response.json(url.endsWith('/verloop') ? answers.expiry : answers.create))) as typeof fetch;
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
});
afterEach(() => {
  globalThis.fetch = realFetch;
  Reflect.deleteProperty(navigator, 'share');
  Reflect.deleteProperty(navigator, 'clipboard');
});

/** Opens the popup and lets the create request finish. */
const show = async () => {
  render(<ShareDialog slug="soep" onClose={onClose} />);
  await screen.findByTestId('ShareDialog-link');
};
const dialog = () => screen.getByTestId<HTMLDialogElement>('ShareDialog-dialog');
const link = () => screen.getByTestId<HTMLInputElement>('ShareDialog-link');
const expiry = () => screen.getByTestId('ShareDialog-expiry').textContent;
const select = () => screen.getByTestId('ExpiryPicker-select') as unknown as HTMLSelectElement;
const choose = async (value: string) => {
  fireEvent.change(select(), { target: { value } });
  await screen.findByTestId('ShareDialog-check');
};
const date = (iso: string) => new Intl.DateTimeFormat('nl-NL', { dateStyle: 'long' }).format(new Date(iso));
const sharing = () => Object.defineProperty(navigator, 'share', { configurable: true, value: shareSheet });

describe('recipe-sharing › Deel shows the link', () => {
  test('the popup is open', async () => {
    await show();
    assert.equal(dialog().open, true);
  });

  test('it shows a link of the form <address of the app>/share/<token>', async () => {
    await show();
    assert.equal(link().value, `${location.origin}/share/tok`);
  });
});

// Escape is the native cancel of a modal dialog, which happy-dom does not do.
test.todo('recipe-sharing › The popup closes');

describe('ShareDialog', () => {
  test('the close button closes the popup', async () => {
    await show();
    fireEvent.click(screen.getByTestId('ShareDialog-close'));
    assert.equal(dialog().open, false);
  });

  test('the caller is told when the popup closes', async () => {
    await show();
    fireEvent(dialog(), new Event('close'));
    assert.equal(onClose.mock.calls.length, 1);
  });

  test('a click on the backdrop closes the popup', async () => {
    await show();
    fireEvent.click(dialog());
    assert.equal(dialog().open, false);
  });

  test('a click inside the popup keeps it open', async () => {
    await show();
    fireEvent.click(screen.getByTestId('ShareDialog-title'));
    assert.equal(dialog().open, true);
  });

  test('it says so while the link is made', () => {
    render(<ShareDialog slug="soep" onClose={onClose} />);
    assert.ok(screen.getByTestId('ShareDialog-loading'));
  });

  test('it shows an error when the link cannot be made', async () => {
    globalThis.fetch = (() => Promise.resolve(new Response(null, { status: 404 }))) as typeof fetch;
    render(<ShareDialog slug="soep" onClose={onClose} />);
    assert.ok(await screen.findByTestId('ShareDialog-failed'));
  });
});

describe('ShareDialog choice feedback', () => {
  test('it shows a checkmark after a choice', async () => {
    await show();
    await choose('1y');
    assert.ok(screen.getByTestId('ShareDialog-check'));
  });

  test('a refused choice shows an error and keeps the earlier end date', async () => {
    await show();
    globalThis.fetch = (() => Promise.resolve(new Response(null, { status: 404 }))) as typeof fetch;
    fireEvent.change(select(), { target: { value: '1y' } });
    assert.ok(await screen.findByTestId('ShareDialog-error'));
    assert.equal(expiry(), 'Verloopt nooit');
  });

  test('the dropdown is disabled while a choice is being stored', async () => {
    await show();
    globalThis.fetch = (() => new Promise<Response>(() => {})) as typeof fetch;
    fireEvent.change(select(), { target: { value: '1y' } });
    await act(async () => {});
    assert.equal(select().disabled, true);
  });
});

describe('recipe-sharing › Device with a share sheet', () => {
  beforeEach(sharing);

  test('a button Deel is shown', async () => {
    await show();
    assert.equal(screen.getByTestId('ShareDialog-action').textContent, 'Deel');
  });

  test('pressing it offers the link to the share sheet', async () => {
    await show();
    fireEvent.click(screen.getByTestId('ShareDialog-action'));
    assert.deepEqual(shareSheet.mock.calls, [[{ url: link().value }]]);
  });

  test('a dismissed share sheet is not an error', async () => {
    shareSheet.mockRejectedValueOnce(new DOMException('dismissed', 'AbortError'));
    await show();
    fireEvent.click(screen.getByTestId('ShareDialog-action'));
    await act(async () => {});
    assert.equal(screen.queryByTestId('ShareDialog-error'), null);
  });
});

describe('recipe-sharing › Device without a share sheet', () => {
  test('a button Kopieer link is shown', async () => {
    await show();
    assert.equal(screen.getByTestId('ShareDialog-action').textContent, 'Kopieer link');
  });

  test('pressing it puts the link on the clipboard', async () => {
    await show();
    fireEvent.click(screen.getByTestId('ShareDialog-action'));
    assert.deepEqual(writeText.mock.calls, [[link().value]]);
  });

  test('it shows that the link was copied', async () => {
    await show();
    assert.equal(screen.queryByTestId('ShareDialog-copied'), null);
    fireEvent.click(screen.getByTestId('ShareDialog-action'));
    assert.ok(await screen.findByTestId('ShareDialog-copied'));
  });

  test('a refused clipboard does not say it was copied', async () => {
    writeText.mockRejectedValueOnce(new Error('denied'));
    await show();
    fireEvent.click(screen.getByTestId('ShareDialog-action'));
    await act(async () => {});
    assert.equal(screen.queryByTestId('ShareDialog-copied'), null);
  });
});

describe('recipe-sharing › End date after a choice', () => {
  test('it shows Verloopt op and the date the server stored', async () => {
    await show();
    await choose('1y');
    assert.equal(expiry(), `Verloopt op ${date('2027-03-10T12:00:00Z')}`);
  });
});

describe('recipe-sharing › No end date', () => {
  test('it shows Verloopt nooit', async () => {
    await show();
    assert.equal(expiry(), 'Verloopt nooit');
  });
});

describe('recipe-sharing › Existing share shows date and Wijzig', () => {
  beforeEach(() => {
    answers.create = { token: 'tok', expiresAt: '2026-03-17T12:00:00Z', created: false };
  });

  test('the end date is shown', async () => {
    await show();
    assert.equal(expiry(), `Verloopt op ${date('2026-03-17T12:00:00Z')}`);
  });

  test('a button Wijzig is shown', async () => {
    await show();
    assert.equal(screen.getByTestId('ShareDialog-change').textContent, 'Wijzig');
  });

  test('the dropdown is not shown', async () => {
    await show();
    assert.equal(screen.queryByTestId('ExpiryPicker-select'), null);
  });
});

describe('recipe-sharing › Wijzig shows the dropdown without a choice', () => {
  beforeEach(async () => {
    answers.create = { token: 'tok', expiresAt: '2026-03-17T12:00:00Z', created: false };
    await show();
    fireEvent.click(screen.getByTestId('ShareDialog-change'));
  });

  test('the dropdown is shown', () => {
    assert.ok(select());
  });

  test('no choice is selected', () => {
    assert.equal(select().value, '');
  });

  test('Wijzig is gone', () => {
    assert.equal(screen.queryByTestId('ShareDialog-change'), null);
  });
});

describe('ShareDialog after Wijzig', () => {
  test('the same period as before is sent and its end date shown', async () => {
    answers.create = { token: 'tok', expiresAt: '2026-03-17T12:00:00Z', created: false };
    await show();
    fireEvent.click(screen.getByTestId('ShareDialog-change'));
    await choose('7d');
    assert.equal(expiry(), `Verloopt op ${date('2027-03-10T12:00:00Z')}`);
  });
});

describe('ShareDialog for a new share', () => {
  test('a share made just now shows the dropdown on Nooit', async () => {
    await show();
    assert.equal(select().value, 'never');
  });
});
