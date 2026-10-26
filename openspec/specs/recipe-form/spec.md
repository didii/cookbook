# recipe-form Specification

## Purpose
The single page on which a family member creates or edits a recipe: how it is laid out, and how it is saved, cancelled, reset and guarded against accidental loss.

## Requirements

### Requirement: Creating and editing happen on one page with a main and a side column
The system SHALL present the recipe editor as one page without steps or tabs. On a wide screen it SHALL show a main column and a side column next to each other; on a narrow screen it SHALL show them in one column with the side column (photo and facts) first.

#### Scenario: Wide screen layout
- **WHEN** a family member opens the editor on a wide screen
- **THEN** the title and intro are in a main column and the author, servings and time are in a side column to its right

#### Scenario: Narrow screen layout
- **WHEN** a family member opens the editor on a phone-sized screen
- **THEN** everything is in one column and the author, servings and time come before the title

### Requirement: Nothing is stored until the family member saves
The system SHALL keep a sticky bar in view at the bottom of the editor with a primary "Opslaan" button and an "Annuleren" action, SHALL store nothing before "Opslaan" is used, and SHALL leave the editor without storing anything when "Annuleren" is used.

#### Scenario: Save bar stays in view
- **WHEN** a family member scrolls through a long recipe in the editor
- **THEN** the "Opslaan" and "Annuleren" actions stay visible

#### Scenario: Nothing stored before saving
- **WHEN** a family member changes fields and has not used "Opslaan"
- **THEN** the stored recipe is unchanged

#### Scenario: Cancel leaves without storing
- **WHEN** a family member uses "Annuleren" while editing a stored recipe, or while creating a new one
- **THEN** nothing is stored and they are taken to that recipe's page, or to the home page for a new recipe

#### Scenario: Save is busy while storing
- **WHEN** a family member has used "Opslaan" and the response has not arrived yet
- **THEN** the "Opslaan" button is disabled so the recipe cannot be submitted twice

### Requirement: All edits can be reset
The system SHALL show a "Herstel" button in the bar only while the editor differs from its starting values. Using it SHALL ask once, in the bar itself and without a dialog, whether to put everything back; confirming SHALL restore every field to its starting values (the stored ones when editing, empty when creating), and declining SHALL keep the edits.

#### Scenario: Reset hidden without changes
- **WHEN** the editor has just opened and nothing was changed
- **THEN** there is no "Herstel" button

#### Scenario: Reset asks first
- **WHEN** a family member uses "Herstel"
- **THEN** the bar asks whether to put everything back, with a yes and a no, and nothing is changed yet

#### Scenario: Reset restores the starting values
- **WHEN** a family member confirms the reset
- **THEN** every field shows its starting value again and the "Herstel" button disappears

#### Scenario: Reset can be declined
- **WHEN** a family member answers no to the reset question
- **THEN** their edits are kept and the question disappears

### Requirement: Unsaved changes are shown and guarded
The system SHALL show in the bar while the editor differs from its starting values that the changes are not saved and, when the draft is kept on the device, that it is kept there ("Concept bewaard"). It SHALL ask for confirmation before the family member leaves the page, by a link or by closing or reloading it, only while the draft could not be kept on the device. After a successful save, when nothing was changed, or while the draft is safely kept, it SHALL NOT ask.

#### Scenario: Unsaved indicator
- **WHEN** a family member changes any field
- **THEN** the bar shows "Niet opgeslagen" and, while the draft is kept, "Concept bewaard", and both disappear when the values equal the starting values again

#### Scenario: Leaving when the draft could not be kept asks first
- **WHEN** a family member with unsaved changes whose draft could not be kept on the device follows a link to another page
- **THEN** they are asked whether to leave and stay on the editor when they decline

#### Scenario: Leaving with a kept draft does not ask
- **WHEN** a family member with unsaved changes whose draft is kept on the device leaves the page
- **THEN** they are not asked anything and their changes are still there when they come back

#### Scenario: Leaving without changes does not ask
- **WHEN** a family member who changed nothing, or who has just saved, leaves the page
- **THEN** they are not asked anything

### Requirement: Tags are picked in the side column
The system SHALL show in the side column of the editor, below the preparation time, a field "Tags" in which a family member picks any number of tags. Picked tags SHALL be shown alphabetically (letter case and accents ignored), each with a button to remove it. The field SHALL be usable with the keyboard and with assistive technology. Saving SHALL store the picked tags; the editor of a stored recipe SHALL start with its tags, and Herstel SHALL restore them.

#### Scenario: Tags field in the side column
- **WHEN** a family member opens the editor
- **THEN** the side column has a field "Tags" below the preparation time

#### Scenario: Picked tags are alphabetical
- **WHEN** a family member picks "Winter" and then "Soep"
- **THEN** both are shown as picked, "Soep" first

#### Scenario: A picked tag can be removed
- **WHEN** a family member uses the remove button of a picked tag
- **THEN** the tag is no longer picked

#### Scenario: Tags are stored with the recipe
- **WHEN** a family member picks "Soep" and a new tag "Kerst" and saves
- **THEN** the recipe has those two tags and "Kerst" is a stored tag

#### Scenario: Stored tags are shown when editing
- **WHEN** a family member opens the editor of a recipe with the tags "Winter" and "Soep"
- **THEN** both are shown as picked, "Soep" first

#### Scenario: Reset puts the tags back
- **WHEN** a family member changes the picked tags and confirms the reset
- **THEN** the picked tags are the starting ones again

#### Scenario: Changing tags counts as an unsaved change
- **WHEN** a family member picks a tag
- **THEN** the bar shows "Niet opgeslagen"

### Requirement: Stored tags are suggested and new tags can be added
The system SHALL, while a family member types in the tags field, suggest the stored tags that contain the typed text, ignoring letter case and accents and leaving out the tags already picked. Choosing a suggestion SHALL pick that tag. Typed text that matches no stored tag SHALL be offered as a new tag, and choosing it, with the pointer or with Enter, SHALL pick it.

#### Scenario: Stored tags are suggested
- **WHEN** a family member types "so" in the tags field and the tags "Soep" and "Winter" are stored
- **THEN** "Soep" is suggested and "Winter" is not

#### Scenario: Suggestions ignore letter case and accents
- **WHEN** a family member types "SOEP" and the tag "Soép" or "soep" is stored
- **THEN** that tag is suggested

#### Scenario: Picked tag is not suggested again
- **WHEN** a family member has picked "Soep" and types "so"
- **THEN** "Soep" is not suggested

#### Scenario: A new tag can be added
- **WHEN** a family member types "Kerst" which is not a stored tag and chooses the offer to add it
- **THEN** "Kerst" is shown as picked

#### Scenario: Typing an existing tag in other case picks the stored tag
- **WHEN** a family member types "soep" and confirms it with Enter while the tag "Soep" is stored
- **THEN** "Soep" is shown as picked and no new tag is offered

### Requirement: A tag is at most 100 characters
The system SHALL NOT let the tags field take more than 100 characters in a tag, and SHALL refuse a save that has a longer tag, storing nothing and showing a message at the tags field. The number of tags SHALL NOT be limited.

#### Scenario: Tag length is limited
- **WHEN** a family member types more than 100 characters in the tags field
- **THEN** the field keeps only the first 100

#### Scenario: Too long tag is refused on save
- **WHEN** a save arrives with a tag of more than 100 characters
- **THEN** nothing is stored and the editor is shown again with a message at the tags field

#### Scenario: Many tags are accepted
- **WHEN** a family member picks 30 tags and saves
- **THEN** the recipe has all 30
