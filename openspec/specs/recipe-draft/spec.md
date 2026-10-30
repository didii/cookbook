# recipe-draft Specification

## Purpose
How the recipe editor keeps a family member's unsaved work on their own device, brings it back after a reload, and lets it go at the right moments.

## Requirements

### Requirement: Edits are kept on the device as they are made
The system SHALL keep the editor's unsaved state, including the base fields, the tags, the photo, the ingredients and the steps with their chips, in the browser's local storage shortly after each change and when the page is hidden or closed, separately for each signed-in family member and for each recipe or for a new recipe, and SHALL keep nothing while the editor equals the stored recipe. A draft kept before tags existed SHALL still be restored, with no tags.

#### Scenario: Edits are kept as they are made
- **WHEN** a family member changes any part of the editor
- **THEN** a draft with the whole editor state is stored on their device

#### Scenario: Tags are kept in the draft
- **WHEN** a family member picks a tag in the editor
- **THEN** the draft on their device holds that tag

#### Scenario: A draft from before tags restores
- **WHEN** the editor opens and the draft on the device has no tags
- **THEN** the draft is restored with no tags and nothing fails

#### Scenario: An unchanged recipe keeps no draft
- **WHEN** the editor is changed and then changed back to exactly the stored recipe
- **THEN** no draft remains on the device

#### Scenario: Drafts are per family member
- **WHEN** two family members use the same browser to edit the same recipe
- **THEN** each sees only their own draft

#### Scenario: A photo that is still uploading is not kept
- **WHEN** a draft is stored while a chosen photo is still uploading
- **THEN** the draft holds the recipe's previous photo and not the unfinished one

### Requirement: A draft is restored when the editor opens again
The system SHALL restore the draft of a stored recipe when the editor is opened again by a reload, by typing or following its address, or by returning later, and SHALL say in the save bar that a draft was restored and when it was kept. For a new recipe, on the new recipe form and on the import page alike, the system SHALL show the draft in the form and a popup on top that asks whether to keep it (its button says "Herstel concept", like the Herstel button of the editor), with the draft's photo when it has one, name, servings, source, its first 3 ingredients and its first 2 steps (and a count of what is left out), and SHALL say nothing in the save bar about a restored draft. Clicking outside the popup SHALL keep the draft. Choosing to discard SHALL remove the draft and empty the form as if there was none. The popup SHALL stay until the draft is kept or discarded, and until then nothing SHALL be written to the device.

#### Scenario: A reload restores the draft
- **WHEN** a family member with unsaved changes reloads the editor of a stored recipe
- **THEN** the editor shows their changes and says a draft was restored

#### Scenario: An unfinished new recipe returns
- **WHEN** a family member leaves a half-written new recipe and opens the new recipe form again later
- **THEN** the form shows that draft and a popup on top asks whether to keep it

#### Scenario: The popup shows the basics
- **WHEN** the popup opens for a draft with a photo, a name, servings, a source, 5 ingredients and 4 steps
- **THEN** it shows the photo, name, servings and source, the first 3 ingredients and the first 2 steps, and says that 2 ingredients and 2 steps are not shown

#### Scenario: A draft without a photo or source
- **WHEN** the popup opens for a draft that has no photo and no source
- **THEN** it shows no photo and no source, and shows the rest

#### Scenario: Using the draft
- **WHEN** the family member chooses to use the draft
- **THEN** the popup closes and the editor keeps what they had written, without a line in the save bar about a restored draft

#### Scenario: Discarding the draft
- **WHEN** the family member chooses to discard the draft
- **THEN** the popup closes, the draft is removed from the device and the form is empty (on the import page: the import box)

#### Scenario: The popup cannot be dismissed without a choice
- **WHEN** the family member presses Escape in the popup
- **THEN** the popup is still open and the draft is still on the device

#### Scenario: Clicking outside keeps the draft
- **WHEN** the family member clicks outside the popup
- **THEN** the popup closes and the editor keeps what they had written

#### Scenario: Nothing is written before the choice
- **WHEN** the popup is open and the page is hidden or closed
- **THEN** the draft on the device is the one that was offered, unchanged

#### Scenario: A stored recipe asks nothing
- **WHEN** a family member opens the editor of a stored recipe that has a draft
- **THEN** no popup is shown and the draft is restored

### Requirement: Starting an edit from the recipe page starts fresh
The system SHALL discard the draft of a recipe when its editor is opened through the "Bewerk" link on the recipe page and start from the stored recipe, and SHALL NOT discard it when the editor is reloaded afterwards or opened any other way.

#### Scenario: The edit link starts fresh
- **WHEN** a family member with a draft of a recipe uses the "Bewerk" link on that recipe's page
- **THEN** the editor shows the stored recipe and the draft is gone

#### Scenario: A reload after the edit link keeps the new draft
- **WHEN** a family member opened the editor through the "Bewerk" link, changed something and reloads
- **THEN** the editor shows their changes and does not start fresh again

### Requirement: A draft ends when its work is done
The system SHALL remove a recipe's draft after a successful save and when the family member resets the editor, SHALL keep it when a save is refused, and SHALL keep it when the family member cancels and leaves.

#### Scenario: A save ends the draft
- **WHEN** a family member saves successfully
- **THEN** the draft of that recipe is removed

#### Scenario: A refused save keeps the draft
- **WHEN** a save is refused because of an invalid field
- **THEN** the draft is still on the device

#### Scenario: Reset ends the draft
- **WHEN** a family member confirms "Herstel"
- **THEN** the draft is removed

### Requirement: A recipe changed in the meantime is flagged
The system SHALL, when a restored draft was started from an older version of the stored recipe than the current one, say so and let the family member keep the draft or start over from the stored version, and SHALL NOT replace either without their choice.

#### Scenario: A recipe changed meanwhile is flagged
- **WHEN** a draft is restored and the stored recipe has been saved since the draft was started
- **THEN** the editor says the recipe was changed in the meantime and offers to keep the draft or to start over

#### Scenario: Keeping the draft after a change
- **WHEN** the family member chooses to keep the draft
- **THEN** the draft stays as it is and the notice disappears

#### Scenario: Starting over after a change
- **WHEN** the family member chooses to start over
- **THEN** the editor shows the stored recipe and the draft is removed

### Requirement: Old drafts are cleaned up and storage problems do not stop editing
The system SHALL remove drafts that were last kept more than 30 days ago, SHALL keep at most the 20 most recent drafts, SHALL ignore a draft it cannot read or that was made by an older version of the editor, and SHALL keep the editor fully usable when local storage is unavailable or full.

#### Scenario: Old drafts are cleaned up
- **WHEN** the editor opens and the device holds a draft kept 31 days ago and more than 20 drafts
- **THEN** the old draft and the oldest drafts beyond 20 are removed

#### Scenario: An unreadable draft is ignored
- **WHEN** the stored draft is not readable, or was made by an older version of the editor
- **THEN** the editor opens on the stored recipe and the draft is removed

#### Scenario: Storage that fails does not break editing
- **WHEN** local storage is unavailable or full
- **THEN** the editor works as before and nothing is lost or shown as an error except that the leave confirmation returns
