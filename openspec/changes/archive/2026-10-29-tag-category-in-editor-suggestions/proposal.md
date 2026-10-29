# Proposal

## Why

When a family member picks a tag in the recipe editor, the suggestion list only shows names. With categories (`tag-manager`) a name like "Winter" can be ambiguous or easy to confuse with another; the category tells at a glance what kind of tag it is. Board card: none yet.

## What Changes

- In the tag field of the recipe editor, each stored tag in the suggestion popup shows its category as a small pill (the yellow `category` variant of the shared `Pill`) next to the name, when the tag has one. A tag without a category shows no pill. The "Toevoegen: …" offer for a new tag shows none.
- The pill is only in the popup: picked tags in the input stay as they are.
- The editor loaders also pass each tag's category to the field.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `recipe-form`: the tag suggestions show the category of a tag.

## Impact

- `routes/edit-recipe/`: `EditRecipePageRoute.tsx` and `NewRecipePageRoute.tsx` loaders, `lib/RecipeEditor.tsx` and `lib/TagInput.tsx` (props change from `tags: string[]` to tags with an optional category) and their tests.
- Depends on `tag-manager` (not yet merged): it adds the `categories` table, `tags.category_id`, `shared/components/Pill.tsx` with the `category` variant and `listManagedTags`. Implement after it.
- Depends on `add-recipe-tags` for the tag field; its delta specs are not synced into the main specs, so this change ADDS a requirement to `recipe-form`.
- Out of scope: showing the category on picked tags, searching suggestions by category, picking a category in the editor.
