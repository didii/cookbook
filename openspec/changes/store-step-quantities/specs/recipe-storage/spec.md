# Spec Delta

## ADDED Requirements

### Requirement: A step stores the amounts in its text
The system SHALL store for a step the amounts in its text that scale with the servings, each with where it sits in the text (start and end of the number), a quantity value greater than zero and an optional quantity unit, SHALL return them in the order they appear in the text, and SHALL remove them with their step.

#### Scenario: Amounts keep their text order
- **WHEN** a step's amounts are read
- **THEN** they come back ordered by where they start in the text

#### Scenario: Amount with place, value and unit
- **WHEN** an amount is stored for the text "Meng 200 g bloem" at 5 to 8 with value 200 and unit "g"
- **THEN** place, value and unit are returned as stored

#### Scenario: Non-positive amount in text refused
- **WHEN** an amount is stored with a value of zero or less
- **THEN** the insert fails

#### Scenario: Amount must end after it starts
- **WHEN** an amount is stored whose end is not after its start
- **THEN** the insert fails

#### Scenario: Two amounts cannot start at the same place
- **WHEN** a step gets two amounts with the same start
- **THEN** the second insert fails

#### Scenario: Amounts are removed with their step
- **WHEN** a step with amounts is deleted
- **THEN** none of its amounts remain

### Requirement: Amounts in a step's text are found on save
The system SHALL find, when a recipe is saved from the editor, the amounts in each step's text that are followed by a unit of the recognition rules or written right before the name of one of the recipe's ingredients, from the text as stored, and SHALL NOT trust amounts sent by the browser. Durations, temperatures and ranges SHALL NOT be stored.

#### Scenario: Amount before a unit and before an ingredient
- **WHEN** a step "Meng 200 g bloem met 2 eieren" is saved for a recipe with the ingredients "bloem" and "ei"
- **THEN** the amounts are 200 with unit "g" at the number "200", and 2 without a unit at the number "2"

#### Scenario: Places refer to the stored text
- **WHEN** a step is posted with line breaks and spaces around its text
- **THEN** each stored place points at its number in the cleaned text as stored

#### Scenario: Durations, temperatures and ranges are not stored
- **WHEN** a step "Bak 20 minuten op 180 graden, daarna 2-3 el olie" is saved
- **THEN** no amount is stored for it

#### Scenario: Saving again replaces the amounts
- **WHEN** a recipe is saved again with a changed step text
- **THEN** the step's amounts match the new text and none of the old ones remain
