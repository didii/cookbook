import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { fireEvent, render, screen } from '~testing/dom';
import { proposals, reconcile, setMode } from './chips';
import { ChipsHarness, noRows, stepOf } from './chipsHarness';
import { OpenProposals } from './OpenProposals';

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

describe('recipe-step-chips › Suggestions are counted in the save bar', () => {
  test('the link counts the open suggestions', () => {
    show();
    assert.equal(link().textContent, '2 voorstellen open');
  });

  test('taking one over leaves one', () => {
    show();
    fireEvent.click(accepts()[0]);
    assert.equal(link().textContent, '1 voorstel open');
  });

  test('nothing is said about proposals while there are none', () => {
    show();
    fireEvent.click(accepts()[0]);
    fireEvent.click(accepts()[0]);
    assert.equal(screen.queryByTestId('OpenProposals-link'), null);
  });
});

describe('recipe-step-chips › The count jumps to the next suggestion', () => {
  // The link moves focus to the accept button of the first open proposal, then to the next on each use, and round again.
  test('the first use focuses the first proposal', () => {
    show();
    const [first] = accepts();
    fireEvent.click(link());
    assert.ok(document.activeElement === first);
  });

  test('the second use focuses the second proposal', () => {
    show();
    const [, second] = accepts();
    fireEvent.click(link());
    fireEvent.click(link());
    assert.ok(document.activeElement === second);
  });

  test('the third use goes round to the first again', () => {
    show();
    const [first] = accepts();
    fireEvent.click(link());
    fireEvent.click(link());
    fireEvent.click(link());
    assert.ok(document.activeElement === first);
  });
});
