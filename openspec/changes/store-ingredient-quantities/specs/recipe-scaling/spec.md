# Spec Delta

## ADDED Requirements

### Requirement: Ingredient quantities scale from stored values
The system SHALL multiply by the factor (chosen servings divided by the recipe's servings, or the multiplier) the stored quantity value of every ingredient in the ingredient list, shown with its stored quantity unit. An ingredient without a quantity value SHALL be shown as written.

#### Scenario: Ingredient list scales
- **WHEN** a recipe for 4 with "200 g bloem" (quantity value 200, unit "g") is scaled to 6 servings
- **THEN** the ingredient shows "300 g bloem"

#### Scenario: Scaled ingredient keeps its unit
- **WHEN** an ingredient "½ tl zout" (quantity value 0,5, unit "tl") is scaled to 3 times
- **THEN** the ingredient shows "1,5 tl zout"

## REMOVED Requirements

### Requirement: All quantities scale
**Reason**: Ingredient list quantities now scale from their stored value, so the requirement is restated per source of quantity (list, chips, step text); the old requirement also carried a range scenario, and ranges are out of scope because the syntax for what a range means is not defined (board card #44). A MODIFIED block cannot drop that scenario.
**Migration**: Replaced by "Ingredient quantities scale from stored values". The chip and step text scenarios return in `store-chip-quantities` and `store-step-quantities`.
