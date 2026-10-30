## MODIFIED Requirements

### Requirement: A draft is restored when the editor opens again
The system SHALL restore the draft of a stored recipe when the editor is opened again by a reload, by typing or following its address, or by returning later, and SHALL say in the save bar that a draft was restored and when it was kept. For a new recipe, on the new recipe form and on the import page alike, the system SHALL first show a popup that asks whether to use the draft, with the draft's photo when it has one, name, servings, source, its first 3 ingredients and its first 2 steps (and a count of what is left out), and SHALL restore the draft only when the family member chooses to use it. Choosing to discard SHALL remove the draft and open the form as if there was none. The popup SHALL stay until one of the two is chosen, and until then nothing SHALL be written to the device.

#### Scenario: A reload restores the draft
- **WHEN** a family member with unsaved changes reloads the editor of a stored recipe
- **THEN** the editor shows their changes and says a draft was restored

#### Scenario: An unfinished new recipe returns
- **WHEN** a family member leaves a half-written new recipe and opens the new recipe form again later
- **THEN** a popup asks whether to use that draft and the form is not filled yet

#### Scenario: The popup shows the basics
- **WHEN** the popup opens for a draft with a photo, a name, servings, a source, 5 ingredients and 4 steps
- **THEN** it shows the photo, name, servings and source, the first 3 ingredients and the first 2 steps, and says that 2 ingredients and 2 steps are not shown

#### Scenario: A draft without a photo or source
- **WHEN** the popup opens for a draft that has no photo and no source
- **THEN** it shows no photo and no source, and shows the rest

#### Scenario: Using the draft
- **WHEN** the family member chooses to use the draft
- **THEN** the popup closes, the editor shows what they had written and says a draft was restored

#### Scenario: Discarding the draft
- **WHEN** the family member chooses to discard the draft
- **THEN** the popup closes, the draft is removed from the device and the form is empty (on the import page: the import box)

#### Scenario: The popup cannot be dismissed without a choice
- **WHEN** the family member presses Escape in the popup
- **THEN** the popup is still open and the draft is still on the device

#### Scenario: Nothing is written before the choice
- **WHEN** the popup is open and the page is hidden or closed
- **THEN** the draft on the device is the one that was offered, unchanged

#### Scenario: A stored recipe asks nothing
- **WHEN** a family member opens the editor of a stored recipe that has a draft
- **THEN** no popup is shown and the draft is restored
