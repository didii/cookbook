## ADDED Requirements

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
