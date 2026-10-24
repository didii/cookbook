# Spec Delta

## ADDED Requirements

### Requirement: Every quantity scales from its stored value
The system SHALL multiply by the factor (chosen servings divided by the recipe's servings, or the multiplier) the stored quantity value of every ingredient in the ingredient list and of every ingredient chip of a step, each shown with its stored quantity unit, and every amount stored with a step's text, replacing the number in that text. An ingredient, chip or amount without a stored quantity value, such as a range, SHALL be shown as written.

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

#### Scenario: Ingredient range stays as written
- **WHEN** an ingredient reads "2-3 el olie" and the recipe is doubled
- **THEN** the ingredient still shows "2-3 el olie"

#### Scenario: Chip range stays as written
- **WHEN** a step has the chip "2-3 el olie" and the recipe is doubled
- **THEN** the chip still shows "2-3 el olie"

#### Scenario: Chip keeps its own unit
- **WHEN** a step has the chip "1 klontje boter" (quantity value 1, unit "klontje") and the recipe is doubled
- **THEN** the chip shows "2 klontje boter"

#### Scenario: Range in step text stays as written
- **WHEN** a step reads "Voeg 2-3 el olie toe" and the recipe is doubled
- **THEN** it still reads "Voeg 2-3 el olie toe"

#### Scenario: Text without stored amounts stays as written
- **WHEN** a step has a number that is no stored amount and the recipe is doubled
- **THEN** that number is unchanged

## REMOVED Requirements

### Requirement: All quantities scale
**Reason**: Step text is no longer scanned for amounts when the page scales; the amounts are stored when the step is saved. Ranges no longer scale because a range has no single stored value (see board card #44).
**Migration**: Replaced by "Every quantity scales from its stored value", which keeps the scenarios for the list, chips and step text and adds those for ranges.
