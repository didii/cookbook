# Spec Delta

## MODIFIED Requirements

### Requirement: A step has ingredient chips of its own
The system SHALL store for a step any number of ingredient chips, each with free text for the quantity (which may be empty), an optional numeric quantity value (greater than zero), an optional quantity unit and a name, in order, independent of the recipe's ingredient rows, SHALL return all of them when the recipe is read, and SHALL remove them with their step.

#### Scenario: Chips keep their order
- **WHEN** a step's ingredient chips are read ordered by position
- **THEN** they come back in the order they were stored

#### Scenario: Chip without a quantity
- **WHEN** a chip such as "boter" is stored with an empty quantity text
- **THEN** it is accepted and returned with an empty quantity

#### Scenario: Chip needs a name and a step
- **WHEN** a chip is stored with an empty name, or for a step that does not exist
- **THEN** the insert fails

#### Scenario: Chips are removed with their step
- **WHEN** a step with ingredient chips is deleted
- **THEN** none of its chips remain

#### Scenario: Chip with value and unit
- **WHEN** a chip is stored with text "200 g", quantity value 200 and quantity unit "g"
- **THEN** all three are returned as stored

#### Scenario: Non-positive chip value refused
- **WHEN** a chip is stored with a quantity value of zero or less
- **THEN** the insert fails

#### Scenario: Chip quantity is read from its text on save
- **WHEN** a step with the chip "½ tl zout" is saved from the editor, or the chip "1 klontje boter"
- **THEN** the stored chips have quantity value 0,5 and unit "tl", and value 1 and unit "klontje"
