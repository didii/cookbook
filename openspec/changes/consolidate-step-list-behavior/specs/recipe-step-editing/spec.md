## REMOVED Requirements

### Requirement: Steps are numbered text fields that grow with their text
**Reason**: Replaced by "Steps are numbered text fields", without the "Stap toevoegen" button.
**Migration**: Use the new requirement; the free step at the end replaces the button.

### Requirement: Enter continues with the next step
**Reason**: Enter no longer inserts a step; replaced by "Enter moves to the next step".
**Migration**: Type in the empty last step to add steps at the end.

## ADDED Requirements

### Requirement: Steps are numbered text fields
The system SHALL show the steps of a recipe in order, each with its number in a header and a text field that grows with its text instead of scrolling, and SHALL start a new recipe with one empty step.

#### Scenario: New recipe starts with one empty step
- **WHEN** a family member opens the editor of a new recipe
- **THEN** the steps section shows one empty step numbered 1

#### Scenario: Step field grows with its text
- **WHEN** a family member types a text longer than one line in a step
- **THEN** the field becomes taller to show all of it without an inner scrollbar

### Requirement: Enter moves to the next step
The system SHALL, when Enter is pressed in a step, move focus to the next step, wherever the cursor is, and SHALL NOT insert a line break or add a step. It SHALL turn line breaks in pasted text into spaces, and SHALL remove an empty step that is not the last, moving focus to the end of the step above, when Backspace is pressed in it.

#### Scenario: Enter moves to the next step
- **WHEN** a family member presses Enter in a step that is not the last
- **THEN** focus moves to the next step and no line break is inserted

#### Scenario: Enter in the last step changes nothing
- **WHEN** a family member presses Enter in the empty last step
- **THEN** no line break is inserted, no step is added and focus stays

#### Scenario: Pasted line breaks become spaces
- **WHEN** a family member pastes text with line breaks into a step
- **THEN** each line break appears as a space and the step stays one paragraph

#### Scenario: Backspace removes an empty step
- **WHEN** a family member presses Backspace in an empty step that is not the last
- **THEN** the step is removed and focus moves to the end of the step above

### Requirement: The step list always has a free step and is filled by typing
The system SHALL keep exactly one empty step at the end of the list, SHALL add a new empty step when the family member types in it, and SHALL show the buttons of that empty step but inert. It SHALL NOT offer a button to add a step at the end.

#### Scenario: Empty step at the end
- **WHEN** a family member opens the editor of a new recipe or one with steps
- **THEN** the step list ends with one empty step and has no "Stap toevoegen" button

#### Scenario: Typing adds the next step
- **WHEN** a family member types in the empty last step
- **THEN** a new empty step appears below it

#### Scenario: Deleting the last step with text leaves the empty step
- **WHEN** a family member deletes the only step that has text
- **THEN** one empty step remains and the undo offer is shown

#### Scenario: Buttons of the empty step are inert
- **WHEN** a family member looks at the empty last step
- **THEN** its up, down and delete buttons are shown but cannot be used
