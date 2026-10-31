# Spec Delta

## ADDED Requirements

### Requirement: A new recipe can start as a copy
The system SHALL open the form for a new recipe filled in with the title, author, servings, time, intro, source, photo, tags, ingredients and steps (with their ingredient chips, oven temperatures and timers) of a stored recipe when `/recepten/nieuw` is opened with `kopie=<slug>` of that recipe, SHALL store nothing until the form is submitted, and SHALL show the empty form for a slug that no recipe has.

#### Scenario: The form is filled in from the recipe
- **WHEN** a family member opens `/recepten/nieuw?kopie=<slug>` of a stored recipe with a photo, tags, ingredients and steps
- **THEN** the form shows that recipe's title, author, servings, time, intro, source, photo, tags, ingredients and steps

#### Scenario: Opening the copy stores nothing
- **WHEN** a family member opens the copy form and leaves without saving
- **THEN** no recipe was added and the original is unchanged

#### Scenario: Saving the copy makes a new recipe
- **WHEN** a family member saves the copy form
- **THEN** a new recipe with its own slug is stored with the family member as its creator, and the original is unchanged

#### Scenario: Unknown recipe
- **WHEN** a family member opens `/recepten/nieuw?kopie=<slug>` with a slug that no recipe has
- **THEN** the empty form is shown

### Requirement: Starting a copy starts fresh
The system SHALL discard an unfinished draft of a new recipe when the copy form is opened through the item "Kopieer" in the actions menu, and SHALL NOT discard the copy's own draft when the form is reloaded afterwards.

#### Scenario: The copy replaces an old draft
- **WHEN** a family member with an unfinished draft of a new recipe uses "Kopieer" on a recipe page
- **THEN** the form shows the copy and the old draft is gone

#### Scenario: A reload keeps the copy's changes
- **WHEN** a family member opened the copy form, changed something and reloads
- **THEN** the form shows their changes

### Requirement: A photo belongs to one recipe
The system SHALL store, for a saved recipe whose submitted photo is already used by another recipe, a copy of that photo file under a new name, so that deleting one of the recipes does not remove the photo of the other.

#### Scenario: The copy gets its own photo
- **WHEN** a family member saves a copy of a recipe with a photo without changing the photo
- **THEN** the new recipe's photo is a different file with the same content, and the original's photo is unchanged

#### Scenario: Deleting the original keeps the copy's photo
- **WHEN** the original recipe is deleted after its copy was saved
- **THEN** the copy still shows its photo
