# Spec Delta

## ADDED Requirements

### Requirement: Recognition follows the stored rules on save
The system SHALL use the stored rules, not fixed lists, when it splits an ingredient line into amount, unit and name, when it finds a timer or an oven temperature in a step, and when it finds the amounts in a step to store them on save, and SHALL pick up a saved change without the member reloading the page. A unit saved after a step was saved SHALL apply to that step only once the step is saved again.

#### Scenario: New unit is recognised
- **WHEN** "kopje" is a stored unit and a member types the ingredient "2 kopje rijst"
- **THEN** its unit is "kopje" and its name is "rijst"

#### Scenario: New minute word makes a timer
- **WHEN** "mins" is a stored minute word and a step's text contains "20 mins"
- **THEN** the step gets a timer of 20 minutes tied to those words

#### Scenario: New spoken duration makes a timer
- **WHEN** "drie kwartier = 45" is a stored spoken duration and a step's text contains "drie kwartier"
- **THEN** the step gets a timer of 45 minutes

#### Scenario: Removed word is not recognised
- **WHEN** "graden" is not a stored degree word and a step's text contains "180 graden"
- **THEN** the step gets no oven temperature

#### Scenario: Saving uses the stored units
- **WHEN** "kopje" is a stored unit and a step "doe 2 kopje rijst erbij" is saved
- **THEN** the amount 2 with unit "kopje" is stored for the step

#### Scenario: Saved change applies at once
- **WHEN** an admin saves a new unit and then opens the recipe form
- **THEN** the form already recognises that unit

## REMOVED Requirements

### Requirement: Recognition follows the stored rules
**Reason**: The rules are no longer applied when the recipe page scales, but when a step is saved, so the requirement and its scaling scenario are restated as "Recognition follows the stored rules on save". A MODIFIED block cannot drop the scenario "Scaling uses the stored units".
**Migration**: Replaced by "Recognition follows the stored rules on save", which keeps the other scenarios unchanged and turns "Scaling uses the stored units" into "Saving uses the stored units".
