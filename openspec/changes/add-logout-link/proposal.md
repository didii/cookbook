# Proposal

## Why

Card #46 "Add logout": a family member has no way to sign out. On a shared device the next person keeps their session.

## What Changes

- Add a "Uitloggen" item as the last item of the sidebar menu, for every role. It signs the member out of Cloudflare Access and ends their session on this device.

## Capabilities

### New Capabilities

### Modified Capabilities
- `site-menu`: the sidebar gets a last item "Uitloggen" for every role; the "no others" link lists in the scenarios change.

## Impact

- `src/app/routes/layout/lib/SiteMenu.tsx` and its test.
- Specs: `openspec/specs/site-menu`.
- No new routes, no dependencies. The Access logout endpoint is served by Cloudflare on the same host.
