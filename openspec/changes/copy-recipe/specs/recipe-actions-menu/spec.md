# Spec Delta

## REMOVED Requirements

### Requirement: Kopieer is not available yet
**Reason**: "Kopieer" now opens the new-recipe form filled in with the recipe (see `recipe-creation`).
**Migration**: None; the item is enabled and links to `/recepten/nieuw?kopie=<slug>`.

## ADDED Requirements

### Requirement: Kopieer starts a copy
The system SHALL make the menu item "Kopieer" a link to `/recepten/nieuw?kopie=<slug>` of the recipe.

#### Scenario: Kopieer links to the copy form
- **WHEN** a family member opens the menu on the page of a stored recipe
- **THEN** "Kopieer" links to `/recepten/nieuw?kopie=<slug>` and is not disabled
