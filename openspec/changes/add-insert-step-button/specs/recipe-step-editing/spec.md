## MODIFIED Requirements

### Requirement: Steps can be operated from the keyboard
The system SHALL group the insert, up, down and delete buttons of a step's header into one toolbar that is a single Tab stop, with the left and right arrow keys moving between its buttons, and SHALL move the step up or down with Alt and the up or down arrow key while focus stays in its text, without taking over Tab or the plain arrow keys, which keep moving the cursor.

#### Scenario: Step buttons are one tab stop
- **WHEN** a family member tabs through a step
- **THEN** its header buttons are reached as one stop, the left and right arrow keys move between them, and the next Tab moves on to the step's text and then to what follows the step

#### Scenario: Alt and arrow move the step
- **WHEN** a family member presses Alt and the up or down arrow key in a step's text
- **THEN** the step moves up or down, focus stays in its text with the cursor where it was, and the move is announced

## ADDED Requirements

### Requirement: A step can be inserted above another
The system SHALL give each step with text an insert button in its toolbar that adds an empty step directly above it, renumbers the steps, and moves focus to the new step. The button SHALL be shown but inert on the empty last step.

#### Scenario: Insert above a step
- **WHEN** a family member uses the insert button of the second step
- **THEN** a new empty step is the second step, the former second step is third, and the new step has focus

#### Scenario: Insert before the first step
- **WHEN** a family member uses the insert button of the first step
- **THEN** a new empty step is the first step and has focus

#### Scenario: Insert is inert on the empty last step
- **WHEN** a family member looks at the empty last step
- **THEN** its insert button is shown but cannot be used
