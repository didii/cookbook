## Why

Handing a timer to the phone's clock app does not work reliably, and there is no simple way to make it work. Remove the feature instead of keeping a broken control.

## What Changes

- **BREAKING**: remove the "App" control on a running timer.
- Remove the note shown after a hand-over, with its "take back" (herstel) and remove buttons.
- Remove the setting "Timers altijd in je app starten" and its stored browser value.
- Remove the Android `intent:` link code and the hand-over state in the timer store.
- A running timer is shown with: add one minute, add five minutes, stop.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `step-timers`: drop the requirement "A timer can be handed to the clock app" and the clock app control from "A running timer is shown at its step".

## Impact

- `src/app/routes/recipe/lib/timers/`: delete `clock.ts`, `ClockSetting.tsx` and their tests; strip hand-over from `timers.ts`, `timersContext.ts`, `useTimers.ts`, `TimerCard.tsx`, `index.ts` and their tests.
- `src/app/routes/recipe/lib/RecipeView.tsx`: remove `<ClockSetting />`.
- Kanban card "Move timer app setting to user settings" (TODO #36) no longer applies.
