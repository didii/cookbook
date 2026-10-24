# Spec Delta

## ADDED Requirements

### Requirement: Chip quantities scale from stored values
The system SHALL multiply by the factor (chosen servings divided by the recipe's servings, or the multiplier) the stored quantity value of every ingredient chip of a step, shown with its stored quantity unit. A chip without a quantity value SHALL be shown as written.

#### Scenario: Step chips scale
- **WHEN** a step has the chip "200 g bloem" (quantity value 200, unit "g") and the recipe is scaled from 4 to 6 servings
- **THEN** the chip shows "300 g bloem"

#### Scenario: Chip keeps its own unit
- **WHEN** a step has the chip "1 klontje boter" (quantity value 1, unit "klontje") and the recipe is doubled
- **THEN** the chip shows "2 klontje boter"
