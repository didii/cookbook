## 1. Remove the hand-over

- [x] 1.1 Delete `timers/clock.ts`, `ClockSetting.tsx` and their tests, remove `<ClockSetting />` from `RecipeView.tsx` and the `clock` export from `timers/index.ts`. Verify: `pnpm test:ai` passes and no file imports them.
- [ ] 1.2 Strip hand-over from `timers.ts`, `timersContext.ts` and `useTimers.ts` (hand over, take back, `auto`, `available`, the stored hand-over field); on load, ignore the field and drop a timer that was only a note. Verify: `timers.test.ts` and `useTimers` tests cover a stored timer with the old field and a note-only timer.
- [ ] 1.3 Remove the "App" control, the note and its two buttons from `TimerCard.tsx`, and the matching cases in `TimerCard.test.tsx` and `TimerChip.test.tsx`. Verify: `pnpm test:ai` passes.

## 2. Finish

- [ ] 2.1 Run `pnpm test:spec remove-app-timers`, `pnpm format:fix`, `pnpm lint:fix`, then `pnpm format:check`, `pnpm lint:check` and `pnpm test:ai`. Verify: all pass; no test names a removed scenario.
