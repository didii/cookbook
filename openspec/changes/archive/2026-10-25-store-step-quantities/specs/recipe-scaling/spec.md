# Spec Delta

## ADDED Requirements

### Requirement: Every quantity scales from its stored value
The system SHALL multiply by the factor (chosen servings divided by the recipe's servings, or the multiplier) the stored quantity value of every ingredient in the ingredient list and of every ingredient chip of a step, each shown with its stored quantity unit, and every amount stored with a step's text, replacing the number in that text. An ingredient, chip or amount without a stored quantity value SHALL be shown as written.

#### Scenario: Ingredient list scales
- **WHEN** a recipe for 4 with "200 g bloem" (quantity value 200, unit "g") is scaled to 6 servings
- **THEN** the ingredient shows "300 g bloem"

#### Scenario: Step chips scale
- **WHEN** a step has the chip "200 g bloem" (quantity value 200, unit "g") and the recipe is scaled from 4 to 6 servings
- **THEN** the chip shows "300 g bloem"

#### Scenario: Amounts in step text scale
- **WHEN** a step reads "Meng 200 g bloem met 2 eieren" with stored amounts 200 and 2 and the recipe is doubled
- **THEN** it reads "Meng 400 g bloem met 4 eieren"

#### Scenario: Scaled ingredient keeps its unit
- **WHEN** an ingredient "½ tl zout" (quantity value 0,5, unit "tl") is scaled to 3 times
- **THEN** the ingredient shows "1,5 tl zout"

#### Scenario: Chip keeps its own unit
- **WHEN** a step has the chip "1 klontje boter" (quantity value 1, unit "klontje") and the recipe is doubled
- **THEN** the chip shows "2 klontje boter"

#### Scenario: Text without stored amounts stays as written
- **WHEN** a step has a number that is no stored amount and the recipe is doubled
- **THEN** that number is unchanged

## REMOVED Requirements

### Requirement: Ingredient quantities scale from stored values
**Reason**: Restated together with chips and step text as "Every quantity scales from its stored value".
**Migration**: Replaced by "Every quantity scales from its stored value", which keeps its scenarios.

### Requirement: Chip quantities scale from stored values
**Reason**: Restated together with the list and step text as "Every quantity scales from its stored value".
**Migration**: Replaced by "Every quantity scales from its stored value", which keeps its scenarios.
