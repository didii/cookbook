# recipe-limits Specification

## Purpose
TBD - created by archiving change limit-field-sizes. Update Purpose after archive.

## Requirements

### Requirement: Recipe text fields have a maximum length
The system SHALL limit the text of a recipe to these lengths, counted in characters after leading and trailing whitespace is removed:

| Field | Maximum characters |
| --- | --- |
| Title | 200 |
| Author | 100 |
| Time | 100 |
| Intro | 5000 |
| One ingredient line | 200 |
| One step text | 2000 |
| A step's timer name | 100 |
| A step ingredient chip: quantity text | 50 |
| A step ingredient chip: name | 200 |

A value of exactly the maximum SHALL be accepted. A longer value SHALL be refused on both create and edit: nothing is stored, the editor is shown again with everything that was entered, and a message at the field (on the row, for an ingredient line or a step) states the maximum. The editor SHALL stop accepting typed or pasted characters in the title, author, time, intro, ingredient and step fields at the maximum.

#### Scenario: Title at the limit is accepted
- **WHEN** a recipe is saved with a title of exactly 200 characters
- **THEN** the recipe is stored with that title

#### Scenario: Title over the limit is refused
- **WHEN** a recipe is saved with a title of 201 characters
- **THEN** nothing is stored and the editor shows the entered values with a message at the title that states 200

#### Scenario: Each other text field is refused over its limit
- **WHEN** a save has an author of 101, a time of 101 or an intro of 5001 characters
- **THEN** each is refused with a message at its field that states its maximum, and nothing is stored

#### Scenario: Whitespace does not count
- **WHEN** a save has a title of 200 characters surrounded by 10 spaces on each side
- **THEN** the recipe is stored with the 200-character title

#### Scenario: An ingredient line over the limit is refused on its row
- **WHEN** a save has three ingredient lines and the second has 201 characters
- **THEN** nothing is stored and a message that states 200 appears on the second row only

#### Scenario: A step over the limit is refused on its row
- **WHEN** a save has two steps and the first has 2001 characters
- **THEN** nothing is stored and a message that states 2000 appears on the first step only

#### Scenario: A step's timer name and chips are limited
- **WHEN** a step is saved with a timer name of 101 characters, a chip quantity text of 51 characters or a chip name of 201 characters
- **THEN** nothing is stored and a message that states the maximum of that field appears on that step

#### Scenario: Editing is limited the same way
- **WHEN** a stored recipe is saved with its title changed to 201 characters
- **THEN** the stored recipe is unchanged and the editor shows a message at the title that states 200

#### Scenario: Typing stops at the limit
- **WHEN** a family member types or pastes 250 characters in the title field
- **THEN** the field holds the first 200

### Requirement: Recipe lists have a maximum size
The system SHALL accept at most 100 ingredient lines (blank lines not counted), at most 100 steps (blank steps not counted), at most 100 ingredient chips in one step, and at most 50 tags in one recipe. A list at exactly the maximum SHALL be accepted. A longer list SHALL be refused on create and edit: nothing is stored, the editor is shown again with everything that was entered, and a message that states the maximum appears at the tags field, on the first ingredient line or step over the limit, or on the step with too many chips.

#### Scenario: 100 ingredients are accepted
- **WHEN** a recipe is saved with 100 ingredient lines
- **THEN** all 100 are stored

#### Scenario: 101 ingredients are refused
- **WHEN** a recipe is saved with 101 ingredient lines
- **THEN** nothing is stored and a message that states 100 appears on the 101st row

#### Scenario: Blank lines do not count
- **WHEN** a recipe is saved with 100 ingredient lines and 20 blank lines between them
- **THEN** the recipe is stored with 100 ingredients

#### Scenario: 101 steps are refused
- **WHEN** a recipe is saved with 101 steps
- **THEN** nothing is stored and a message that states 100 appears on the 101st step

#### Scenario: 101 chips in one step are refused
- **WHEN** a step is saved with 101 ingredient chips
- **THEN** nothing is stored and a message that states 100 appears on that step

#### Scenario: 50 tags are accepted
- **WHEN** a recipe is saved with 50 tags
- **THEN** all 50 are stored

#### Scenario: 51 tags are refused
- **WHEN** a recipe is saved with 51 tags
- **THEN** nothing is stored and a message that states 50 appears at the tags field

### Requirement: Servings have an upper bound
The system SHALL refuse servings above 999 like other invalid servings: nothing is stored and a message at the servings field states the allowed range, 1 to 999.

#### Scenario: 999 servings are accepted
- **WHEN** a recipe is saved with servings 999
- **THEN** the recipe is stored with 999 servings

#### Scenario: 1000 servings are refused
- **WHEN** a recipe is saved with servings 1000, or with 400 digits
- **THEN** nothing is stored and the servings field shows a message that states 999

#### Scenario: Zero and non-numbers keep being refused
- **WHEN** a recipe is saved with servings 0, -1, 2.5 or "veel"
- **THEN** nothing is stored and the servings field shows a message that states the range

### Requirement: The database enforces the same limits
The system SHALL have the database refuse any insert or update that breaks a limit of this capability, whatever code sends it: a recipe with a title over 200, an author or time over 100, an intro over 5000 characters or servings above 999; an ingredient with a name or quantity text over 200 characters; a step with a body over 2000 or a timer name over 100 characters; a chip with a quantity text over 50 or a name over 200 characters. The number of rows is limited by the application only. Values at the limit SHALL be accepted. Applying the change SHALL keep every stored row, id and link.

#### Scenario: Recipe columns are limited
- **WHEN** a recipe is inserted with a title of 201 characters, and another with a title of 200
- **THEN** the first insert fails and the second succeeds

#### Scenario: Recipe update is limited
- **WHEN** the intro of a stored recipe is updated to 5001 characters, or its servings to 1000
- **THEN** each update fails and the row is unchanged

#### Scenario: Other recipe text columns are limited
- **WHEN** a recipe is inserted with an author of 101 characters, a time of 101 characters, an intro of 5001 characters or servings 1000
- **THEN** each insert fails

#### Scenario: Ingredient columns are limited
- **WHEN** an ingredient is inserted with a name of 201 characters, or a quantity text of 201 characters
- **THEN** each insert fails

#### Scenario: Step and chip columns are limited
- **WHEN** a step is inserted with a body of 2001 characters or a timer name of 101 characters, or a chip with a quantity text of 51 or a name of 201 characters
- **THEN** each insert fails
