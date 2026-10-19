import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createWakeLock, initialCook, observe, setByHand, switchText, wantsCookMode, type LockState } from './cookMode';

const VH = 800;
/** A first item well below the middle of the screen, one above it. */
const below = { firstItemTop: 700, viewportHeight: VH, ticked: 0 };
const above = { firstItemTop: 300, viewportHeight: VH, ticked: 0 };

test('cook-mode › Off on arrival', () => {
  assert.equal(wantsCookMode(observe(initialCook, below), true), false);
});

test('cook-mode › Starts at the ingredients', () => {
  // The first ingredient is the first item of the open tab.
  assert.equal(wantsCookMode(observe(initialCook, { ...below, firstItemTop: VH / 2 }), true), false);
  assert.equal(wantsCookMode(observe(initialCook, { ...below, firstItemTop: VH / 2 - 1 }), true), true);
});

test('cook-mode › Starts at the steps', () => {
  // Same rule with the first step as the first item.
  assert.equal(wantsCookMode(observe(initialCook, above), true), true);
});

test('cook-mode › Starts by ticking', () => {
  assert.equal(wantsCookMode(observe(initialCook, { ...below, ticked: 1 }), true), true);
});

test('cook-mode › Switching tabs keeps cook mode on', () => {
  const reading = observe(initialCook, above);
  // The other tab opens with its first item further down: still on.
  assert.equal(wantsCookMode(observe(reading, below), true), true);
});

test('cook-mode › Turned off by hand', () => {
  const off = setByHand(observe(initialCook, above), false);
  assert.equal(wantsCookMode(off, true), false);
  // Scrolling on, switching tab or ticking does not bring it back.
  assert.equal(wantsCookMode(observe(off, { ...above, ticked: 3 }), true), false);
});

test('cook-mode › Turned on by hand', () => {
  const on = setByHand(initialCook, true);
  assert.equal(wantsCookMode(on, true), true);
  assert.equal(wantsCookMode(observe(on, below), true), true);
});

test('there is no cook mode on a wide screen', () => {
  assert.equal(wantsCookMode(setByHand(observe(initialCook, above), true), false), false);
});

type Fake = ReturnType<typeof fakeWakeLock>;
function fakeWakeLock(request?: () => Promise<unknown>) {
  const calls = { requested: 0, released: 0 };
  let onRelease: (() => void) | undefined;
  const states: LockState[] = [];
  const nav = {
    wakeLock: {
      async request() {
        calls.requested++;
        await request?.();
        return {
          async release() {
            calls.released++;
          },
          addEventListener(_: 'release', listener: () => void) {
            onRelease = listener;
          },
        };
      },
    },
  };
  return { nav, calls, states, onState: (s: LockState) => states.push(s), dropByBrowser: () => onRelease?.() };
}
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

test('cook-mode › Not supported or refused', async () => {
  const none: LockState[] = [];
  const unsupported = createWakeLock({}, (s) => none.push(s));
  await unsupported.setWanted(true);
  assert.equal(none.at(-1), 'unsupported');
  assert.equal(switchText(true, 'unsupported', undefined).title, 'Scherm kan niet wakker blijven');

  const refusing = fakeWakeLock(() => Promise.reject(new Error('NotAllowedError')));
  await createWakeLock(refusing.nav, refusing.onState).setWanted(true);
  assert.equal(refusing.states.at(-1), 'refused');
  assert.equal(switchText(true, 'refused', undefined).title, 'Scherm kan niet wakker blijven');
  // Only a granted lock says the screen stays on.
  assert.equal(switchText(true, 'on', undefined).title, 'Scherm blijft aan');
  assert.equal(switchText(true, 'off', undefined).title, 'Scherm mag slapen');
});

test('cook-mode › Page hidden and shown again', async () => {
  const fake: Fake = fakeWakeLock();
  const lock = createWakeLock(fake.nav, fake.onState);
  await lock.setWanted(true);
  assert.deepEqual([fake.calls.requested, fake.states.at(-1)], [1, 'on']);
  // The browser drops the lock while the page is hidden; coming back asks again.
  fake.dropByBrowser();
  assert.equal(fake.states.at(-1), 'off');
  await lock.shown();
  await settle();
  assert.deepEqual([fake.calls.requested, fake.states.at(-1)], [2, 'on']);
  // Nothing is requested when it is held or not wanted.
  await lock.shown();
  assert.equal(fake.calls.requested, 2);
});

test('cook-mode › Page is left', async () => {
  const fake = fakeWakeLock();
  const lock = createWakeLock(fake.nav, fake.onState);
  await lock.setWanted(true);
  await lock.dispose();
  assert.deepEqual([fake.calls.released, fake.states.at(-1)], [1, 'off']);
  // A request that was granted after the page was left is let go at once.
  const late = fakeWakeLock(settle);
  const pending = createWakeLock(late.nav, late.onState);
  const asking = pending.setWanted(true);
  await pending.dispose();
  await asking;
  assert.equal(late.calls.released, 1);
});

test('the switch text says what is, with a sub-line for the mode', () => {
  assert.deepEqual(switchText(false, 'off', undefined), { title: 'Scherm mag slapen', sub: 'Gaat vanzelf aan zodra je begint' });
  assert.deepEqual(switchText(true, 'on', undefined), { title: 'Scherm blijft aan', sub: 'Automatisch, tik om uit te zetten' });
  assert.equal(switchText(true, 'on', true).sub, 'Handmatig');
  assert.equal(switchText(false, 'off', false).sub, 'Handmatig');
});
