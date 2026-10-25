## MODIFIED Requirements

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
