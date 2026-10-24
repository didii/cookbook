# Spec Delta

## MODIFIED Requirements

### Requirement: All quantities scale
The system SHALL multiply by the factor (chosen servings divided by the recipe's servings, or the multiplier) the stored quantity value of every ingredient in the ingredient list, shown with its stored quantity unit, the quantity of every ingredient chip of a step, and every amount in a step's text that is followed by an ingredient unit or written right before the name of one of the recipe's ingredients. Both ends of a range in a chip or in a step's text SHALL scale. An ingredient without a quantity value, such as a range, SHALL be shown as written.

#### Scenario: Ingredient list scales
- **WHEN** a recipe for 4 with "200 g bloem" (quantity value 200, unit "g") is scaled to 6 servings
- **THEN** the ingredient shows "300 g bloem"

#### Scenario: Step chips scale
- **WHEN** a step has the chip "200 g bloem" and the recipe is scaled from 4 to 6 servings
- **THEN** the chip shows "300 g bloem"

#### Scenario: Amounts in step text scale
- **WHEN** a step reads "Meng 200 g bloem met 2 eieren" and the recipe is doubled
- **THEN** it reads "Meng 400 g bloem met 4 eieren"

#### Scenario: Ranges scale
- **WHEN** a step reads "Voeg 2-3 el olie toe" and the recipe is doubled
- **THEN** it reads "Voeg 4-6 el olie toe"

#### Scenario: Ingredient range stays as written
- **WHEN** an ingredient reads "2-3 el olie" and the recipe is doubled
- **THEN** the ingredient still shows "2-3 el olie"

#### Scenario: Scaled ingredient keeps its unit
- **WHEN** an ingredient "½ tl zout" (quantity value 0,5, unit "tl") is scaled to 3 times
- **THEN** the ingredient shows "1,5 tl zout"
