import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fireEvent, render, screen } from '~testing/dom';
import { proposals, reconcile, setMode } from '~/lib/chips';
import { OpenProposals } from './OpenProposals';
import { ChipsHarness, noRows, stepOf } from './StepChips.test';

const following = stepOf({ body: 'Bak 30 minuten op 180 graden.', ingredients: [], ovenTemperature: 180, timer: { minutes: 30 } });
/** Both chips pinned, then the words changed: each pinned chip now has a proposal. */
const withProposals = reconcile(
  { ...following.chips.reduce((s, c) => setMode(s, c.id, 'manual', noRows), following), body: 'Bak 40 minuten op 200 graden.' },
  noRows,
);

const show = (initial = withProposals) =>
  render(<ChipsHarness initial={initial} extra={(step) => <OpenProposals count={proposals(step, noRows).length} />} />);
const link = () => screen.getByTestId('OpenProposals-link');
const accepts = () => screen.getAllByTestId('StepChips-accept').filter((b) => b.getAttribute('aria-label') === 'Wijziging overnemen');

test('recipe-step-chips › Suggestions are counted in the save bar', () => {
  assert.equal(proposals(withProposals, noRows).length, 2);
  show();
  assert.equal(link().textContent, '2 voorstellen open');
  // Taking one over leaves one; and nothing is said about proposals while there are none.
  fireEvent.click(accepts()[0]);
  assert.equal(link().textContent, '1 voorstel open');
  fireEvent.click(accepts()[0]);
  assert.equal(screen.queryByTestId('OpenProposals-link'), null);
});

test('recipe-step-chips › The count jumps to the next suggestion', () => {
  show();
  const [first, second] = accepts();
  assert.equal(accepts().length, 2);
  // The link moves focus to the accept button of the first open proposal, then to the next on each use, and round again.
  fireEvent.click(link());
  assert.ok(document.activeElement === first, 'first');
  fireEvent.click(link());
  assert.ok(document.activeElement === second, 'second');
  fireEvent.click(link());
  assert.ok(document.activeElement === first, 'first again');
});
