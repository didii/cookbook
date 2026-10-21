import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fireEvent, render, screen } from '~testing/dom';
import { ChipsHarness, noRows, stepOf } from '~testing/stepChips';
import { proposals, reconcile, setMode } from '~/lib/chips';
import { OpenProposals } from './OpenProposals';

const following = stepOf({ body: 'Bak 30 minuten op 180 graden.', ingredients: [], ovenTemperature: 180, timer: { minutes: 30 } });
/** Both chips pinned, then the words changed: each pinned chip now has a proposal. */
const withProposals = reconcile(
  { ...following.chips.reduce((s, c) => setMode(s, c.id, 'manual', noRows), following), body: 'Bak 40 minuten op 200 graden.' },
  noRows,
);

const show = (initial = withProposals) =>
  render(<ChipsHarness initial={initial} extra={(step) => <OpenProposals count={proposals(step, noRows).length} />} />);
const link = () => screen.getByRole('button', { name: /voorstel/ });
const accepts = () => [...document.querySelectorAll<HTMLElement>('[data-proposal]')];

test('recipe-step-chips › Suggestions are counted in the save bar', () => {
  assert.equal(proposals(withProposals, noRows).length, 2);
  show();
  assert.equal(link().textContent, '2 voorstellen open');
  // Taking one over leaves one; and nothing is said about proposals while there are none.
  fireEvent.click(screen.getAllByRole('button', { name: 'Wijziging overnemen' })[0]);
  assert.equal(link().textContent, '1 voorstel open');
  fireEvent.click(screen.getByRole('button', { name: 'Wijziging overnemen' }));
  assert.equal(screen.queryByText(/voorstel/), null);
});

test('recipe-step-chips › The count jumps to the next suggestion', () => {
  show();
  assert.equal(accepts().length, 2);
  const [first, second] = accepts();
  // The link moves focus to the accept button of the first open proposal, then to the next on each use, and round again.
  fireEvent.click(link());
  assert.ok(document.activeElement === first, 'first');
  fireEvent.click(link());
  assert.ok(document.activeElement === second, 'second');
  fireEvent.click(link());
  assert.ok(document.activeElement === first, 'first again');
});
