# Proposal

## Why

The only way home is the site name in the header. Once the sidebar is open, a family member expects the home page to be one of its items too.

## What Changes

- Add a "Home" item at the top of the sidebar menu, for every role. It goes to the home page (`/`), exactly like the site name in the header.
- Following it closes the sidebar, like every other menu link.

## Capabilities

### New Capabilities

### Modified Capabilities
- `site-menu`: the sidebar's list of links starts with "Home". The three "Menu lists the links" scenarios gain it; a new scenario covers following it.

## Impact

- `src/app/routes/layout/lib/SiteMenu.tsx` (links list) and `SiteMenu.test.tsx`.
- The `site-menu` delta is written on top of the unarchived `import-recipe-from-url` delta (which adds "Recept importeren" and "Tags", already in the code). Archive that change first, or merge the two deltas by hand.
