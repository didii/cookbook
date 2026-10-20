# Spec Delta

## ADDED Requirements

### Requirement: A step may have an oven temperature and a timer
The system SHALL allow a step to have an oven temperature in degrees Celsius and a timer in minutes with an optional name, each greater than zero, SHALL refuse a timer name without minutes, and SHALL accept steps without them.

#### Scenario: Step with oven temperature and timer
- **WHEN** a step is stored with an oven temperature of 180 and a timer of 50 minutes named "Bakken"
- **THEN** all three are returned as stored

#### Scenario: Step without oven or timer
- **WHEN** a step is stored without an oven temperature and without a timer
- **THEN** it is accepted and returned without them

#### Scenario: Non-positive oven temperature or timer refused
- **WHEN** a step is stored with an oven temperature or timer minutes of zero or less
- **THEN** the insert fails

#### Scenario: Timer name needs minutes
- **WHEN** a step is stored with a timer name but no timer minutes
- **THEN** the insert fails

### Requirement: A step has ingredient chips of its own
The system SHALL store for a step any number of ingredient chips, each with free text for the quantity (which may be empty) and a name, in order, independent of the recipe's ingredient rows, and SHALL remove them with their step.

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
