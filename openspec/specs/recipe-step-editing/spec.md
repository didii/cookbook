# recipe-step-editing Specification

## Purpose
How a family member writes, reorders, removes and saves the steps of a recipe, and how the text of a step can carry marks and report its edits so that other things can be attached to it.

## Requirements

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

### Requirement: Steps can be reordered
The system SHALL give each step always-visible up and down buttons in its header, SHALL disable "up" on the first step and "down" on the last, SHALL let a step be dragged by its grip with a mouse or pen, SHALL hide the grip on screens without hover so the buttons are the only way to reorder there, SHALL keep the text of a step when it moves, and SHALL announce each move to assistive technology.

#### Scenario: Step moves up and down
- **WHEN** a family member uses the up button of the third step
- **THEN** it becomes the second step with its text unchanged, the steps are renumbered, and the down button moves it back

#### Scenario: Edge steps cannot move out of the list
- **WHEN** a family member looks at the first and the last step
- **THEN** the up button of the first and the down button of the last are disabled

#### Scenario: Step can be dragged
- **WHEN** a family member drags a step by its grip to another place with a mouse
- **THEN** the step is dropped there, the steps are renumbered, and pressing Escape during the drag puts it back

#### Scenario: Step move is announced
- **WHEN** a step is moved by a button or a drag
- **THEN** assistive technology is told its new number

### Requirement: Steps can be operated from the keyboard
The system SHALL group the insert, up, down and delete buttons of a step's header into one toolbar that is a single Tab stop, with the left and right arrow keys moving between its buttons, and SHALL move the step up or down with Alt and the up or down arrow key while focus stays in its text, without taking over Tab or the plain arrow keys, which keep moving the cursor.

#### Scenario: Step buttons are one tab stop
- **WHEN** a family member tabs through a step
- **THEN** its header buttons are reached as one stop, the left and right arrow keys move between them, and the next Tab moves on to the step's text and then to what follows the step

#### Scenario: Alt and arrow move the step
- **WHEN** a family member presses Alt and the up or down arrow key in a step's text
- **THEN** the step moves up or down, focus stays in its text with the cursor where it was, and the move is announced

### Requirement: Steps can be removed and the removal undone
The system SHALL give each step a delete button in its header and, when a step that has text is deleted, SHALL leave an "Ongedaan maken" action in its place for a few seconds. Deleting a step without text SHALL be immediate and offer no undo.

#### Scenario: Deleted step can be undone
- **WHEN** a family member deletes a step that has text and then uses "Ongedaan maken" within a few seconds
- **THEN** the step is back at its place with its text

#### Scenario: Deleting an empty step is immediate
- **WHEN** a family member deletes a step without text
- **THEN** it is gone and no undo is offered

### Requirement: Steps are saved with the recipe
The system SHALL store, when a recipe is created or saved, each non-blank step in the order shown with its text, SHALL replace the recipe's previously stored steps, SHALL ignore blank steps, and SHALL show the stored steps in order when the editor opens.

#### Scenario: Steps are stored in order
- **WHEN** a family member saves a recipe with several steps
- **THEN** its steps are stored in that order with their text

#### Scenario: Blank steps are not stored
- **WHEN** a family member saves with empty steps among the others
- **THEN** only the steps with text are stored

#### Scenario: Saved steps replace the old ones
- **WHEN** a family member edits a recipe, removes one step, changes another and adds one, and saves
- **THEN** the recipe has exactly the steps that were in the list

#### Scenario: Stored steps come back in the editor
- **WHEN** a family member opens the editor of a recipe with stored steps
- **THEN** every step is shown in stored order with its text

### Requirement: Step text can carry marks that sit exactly under their characters
The system SHALL be able to draw, on the text of a step, an underline or a fill under any range of characters, such that the mark lies under exactly those characters at every width, zoom level and line wrap, and such that drawing or removing a mark never moves any text.

#### Scenario: Marks sit under their characters
- **WHEN** a range of characters in a step is marked, including a range that wraps onto a second line
- **THEN** the mark covers exactly those characters and no others

#### Scenario: Marks never move the text
- **WHEN** marks are added, changed or removed
- **THEN** the text and the field's height stay exactly where they were

### Requirement: Every edit to step text is reported as a replaced range
The system SHALL know, for every change to the text of a step, which characters were replaced and by how many new characters, for typing, pasting over a selection, cutting, dropping, undo and redo, text with emoji and other characters that take two code units, and input through an input method editor, so that things attached to the text can follow it.

#### Scenario: Typing is a one-character insertion
- **WHEN** a family member types one character in the middle of a step
- **THEN** the change is reported as zero characters replaced at that position by one new character

#### Scenario: Pasting over a selection
- **WHEN** a family member pastes five characters over a selection of three
- **THEN** the change is reported as three characters replaced at the start of the selection by five new ones

#### Scenario: Cutting removes a range
- **WHEN** a family member cuts a selection
- **THEN** the change is reported as those characters replaced by none

#### Scenario: Emoji are never split
- **WHEN** a family member types, deletes or selects around an emoji or another character stored as two code units
- **THEN** the reported range never starts or ends inside that character

#### Scenario: Undo and redo are reported
- **WHEN** a family member undoes or redoes a change
- **THEN** the change is reported as the exact replaced range, found by comparing the text before and after

#### Scenario: Input method input is reported when it completes
- **WHEN** a family member composes text with an input method editor
- **THEN** the change is reported once, when the composition ends, as the range the composition replaced

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
