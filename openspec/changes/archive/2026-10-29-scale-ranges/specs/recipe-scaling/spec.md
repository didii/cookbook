## MODIFIED Requirements

### Requirement: Every quantity scales from its stored value
The system SHALL multiply by the factor (chosen servings divided by the recipe's servings, or the multiplier) the stored quantity value, and the maximum quantity value when there is one, of every ingredient in the ingredient list and of every ingredient chip of a step, each shown with its stored quantity unit (a range as `<value>-<maximum> <unit>`), and every amount stored with a step's text, replacing the number or both numbers of a range in that text and leaving the words and the separator between them as written. An ingredient, chip or amount without a stored quantity value SHALL be shown as written.

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

#### Scenario: Ingredient range scales
- **WHEN** an ingredient "2-3 el olie" (quantity value 2, maximum 3, unit "el") is scaled to 3 times
- **THEN** the ingredient shows "6-9 el olie"

#### Scenario: Ingredient range is shown with a dash
- **WHEN** an ingredient "2 à 3 el olie" (quantity value 2, maximum 3, unit "el") is doubled
- **THEN** the ingredient shows "4-6 el olie"

#### Scenario: Chip range scales
- **WHEN** a step has the chip "1 tot 2 el olie" (quantity value 1, maximum 2, unit "el") and the recipe is doubled
- **THEN** the chip shows "2-4 el olie"

#### Scenario: Range in step text keeps its words
- **WHEN** a step reads "Voeg 2 à 3 el olie toe" with a stored range amount 2 and 3 and the recipe is doubled
- **THEN** it reads "Voeg 4 à 6 el olie toe"

#### Scenario: Reversed range scales both numbers
- **WHEN** an ingredient "3-2 el olie" (quantity value 3, maximum 2, unit "el") is doubled
- **THEN** the ingredient shows "6-4 el olie"

#### Scenario: Range numbers are short
- **WHEN** an ingredient range with values 1 and 2 is scaled to a third
- **THEN** both numbers are shown with at most 3 significant digits, "0,333-0,667"

#### Scenario: Range at factor one
- **WHEN** a recipe with "2 à 3 el olie" is scaled and then returned to its own servings
- **THEN** the ingredient shows "2 à 3 el olie" as stored
