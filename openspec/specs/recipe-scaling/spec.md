# recipe-scaling Specification

## Purpose
Lets a family member cook a recipe for more or fewer people by scaling every quantity on the recipe page, without changing the stored recipe.

## Requirements

### Requirement: Servings can be changed on the recipe page
The system SHALL show on a recipe page that has servings a control with a minus button, a plus button and a number field holding the servings, starting at the recipe's own servings, with a label "Porties" above the buttons and the field. The control SHALL be placed directly above the ingredients and the steps, so a change is visible next to the amounts. The buttons SHALL be at least 44 px high and wide. Minus steps down by one serving, plus up by one, and the amount never goes below 1. A typed number SHALL be taken over when it is a whole number of 1 or more; anything else SHALL restore the last valid amount.

#### Scenario: Control starts at the stored servings
- **WHEN** a family member opens a recipe with 4 servings
- **THEN** the control shows 4 and the details line under the title shows "4 porties", the recipe's own servings

#### Scenario: Control sits above the lists
- **WHEN** a family member opens a recipe
- **THEN** the control comes before the ingredients and the steps

#### Scenario: Plus and minus change by one serving
- **WHEN** a family member presses plus, then minus twice
- **THEN** the field shows 5, then 4, then 3

#### Scenario: Servings do not go below one
- **WHEN** the field shows 1 and the family member presses minus
- **THEN** it still shows 1

#### Scenario: A typed number is taken over
- **WHEN** a family member types 6 in the field
- **THEN** the page scales to 6 servings

#### Scenario: Invalid typing is undone
- **WHEN** a family member types 0, a negative number or text and leaves the field
- **THEN** the field shows the last valid amount again

### Requirement: Without servings a multiplier is used
The system SHALL show on a recipe page without servings a multiplier control, starting at ×1, with the same buttons and number field. The buttons SHALL step through 1/10, 1/8, 1/6, 1/4, 1/3, 1/2, 1, 1.5, 2, 3, 4 and then by one (5, 6, …): plus goes to the next value above the current one, minus to the next value below it, and minus stops at 1/10. A typed multiplier SHALL accept a decimal number (comma or point) or a fraction such as 1/3, and SHALL be greater than 0.

#### Scenario: Multiplier starts at one
- **WHEN** a family member opens a recipe without servings
- **THEN** a multiplier control shows ×1

#### Scenario: Buttons walk the steps
- **WHEN** a family member presses minus repeatedly from ×1, and plus repeatedly from ×1
- **THEN** the multiplier goes 1/2, 1/3, 1/4, 1/6, 1/8, 1/10 and stays there; and goes 1,5, 2, 3, 4, 5, 6

#### Scenario: Typed multiplier between steps
- **WHEN** a family member types 2,5 and presses plus, or types 2,5 and presses minus
- **THEN** the multiplier becomes 3, or 2

#### Scenario: Typed fraction
- **WHEN** a family member types 1/3 as the multiplier
- **THEN** the page scales to a third

### Requirement: Other text stays as written
The system SHALL leave a quantity without a number, a duration, an oven temperature, units and names as written when scaling. At factor 1 all texts SHALL be shown exactly as stored.

#### Scenario: Times and temperatures do not scale
- **WHEN** a step reads "Bak 20 minuten op 180 graden", has a timer and an oven chip, and the recipe is doubled
- **THEN** the text, the timer and the oven chip are unchanged

#### Scenario: Quantity without a number
- **WHEN** an ingredient has no number ("snufje zout") and the recipe is scaled
- **THEN** it is shown unchanged

#### Scenario: Original at factor one
- **WHEN** a recipe with "1 ½ el suiker" is scaled and then returned to its own servings
- **THEN** the ingredient shows "1 ½ el suiker" as stored

### Requirement: Scaled numbers are short
The system SHALL show a scaled number with at most 3 significant digits, rounded, and SHALL NOT drop digits before the decimal comma. The decimal separator SHALL be a comma and trailing zeros SHALL be left out.

#### Scenario: Long numbers are rounded
- **WHEN** quantities scale to 133,3333, 13,3333, 1,33333, 0,333333 and 1234,5
- **THEN** they are shown as 133, 13,3, 1,33, 0,333 and 1235

#### Scenario: Round numbers stay round
- **WHEN** a quantity scales to 2,50 or 300
- **THEN** it is shown as 2,5 or 300

### Requirement: The chosen amount is not kept
The system SHALL start every visit to a recipe at the recipe's own servings (or ×1), and SHALL NOT store the chosen amount.

#### Scenario: Reload resets
- **WHEN** a family member scales a recipe and reloads the page
- **THEN** the control shows the recipe's own servings again

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
