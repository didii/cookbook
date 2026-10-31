## Context

The clock app hand-over is an Android-only `intent:` link, with a note and a browser setting around it. It is contained in `routes/recipe/lib/timers/`, plus one `<ClockSetting />` in `RecipeView.tsx`.

## Goals / Non-Goals

**Goals:** delete the hand-over feature and all code only it used.

**Non-Goals:** no replacement (no notifications, no wake lock); timers stay as they are.

## Decisions

- **Delete, do not hide.** No feature flag; git history keeps the code.
- **Stored timers.** Timers are kept per tab in session storage. A stored timer with the old `handedOver` field was a note, not counted on the page, and is dropped on restore; any other stored timer loads as before.
- **Leftover setting.** The `clock-app-for-all-timers` value in `localStorage` is left alone; it is harmless and not worth a cleanup path.
- **Specs.** Remove the requirement "A timer can be handed to the clock app" and its four scenarios; drop the clock app control from the card requirement. Their tests (`step-timers › Hand over a running timer`, `Handover is undone`, `Timers handed over automatically`, `Clock app not available`) go with them.

## Risks / Trade-offs

- A family member on Android loses the (flaky) hand-over → accepted, that is the request.
