# recipe-editing Specification

## Purpose
Lets a family member revise the base information of a stored recipe, so shared recipes can be corrected and kept up to date.

## Requirements

### Requirement: The base information of a recipe can be edited
The system SHALL offer, at `/recepten/<slug>/bewerken`, a form filled in with the stored values of the recipe with that slug, and SHALL save the changes when the form is submitted and take the family member back to the recipe page. The recipe's slug SHALL stay as it was, and so SHALL its seal unless a seal is provided with the edit, which then replaces it, and so SHALL its ingredients and steps unless the family member changed them in the form. The form does not show the seal.

#### Scenario: Form shows the stored values
- **WHEN** a family member opens the edit form of a stored recipe
- **THEN** every field of the form contains the stored value

#### Scenario: Recipe is updated
- **WHEN** a family member changes values and submits
- **THEN** the recipe is stored with the new values, keeps its slug, keeps its ingredients and steps when they were not changed, and they are taken to its page

#### Scenario: Seal kept
- **WHEN** a family member edits a recipe without a seal being provided
- **THEN** the recipe keeps its seal

#### Scenario: Seal provided
- **WHEN** a recipe is updated with a seal given
- **THEN** it is stored with that seal

#### Scenario: Optional field emptied
- **WHEN** a family member empties the servings, time or intro and submits
- **THEN** the recipe is stored without that value

#### Scenario: Unknown recipe
- **WHEN** a family member opens or submits the edit form of a slug that no recipe has
- **THEN** the response status is 404 and nothing is stored

### Requirement: Creating and editing use the same form
The system SHALL present the same form, with the same fields, labels, hints and behaviour, when a recipe is created and when it is edited. Only the starting values differ: empty for a new recipe, the stored values for an existing one.

#### Scenario: Same form for new and existing recipes
- **WHEN** a family member opens the new recipe form and the edit form of a stored recipe
- **THEN** both show the same fields in the same order and differ only in their starting values

### Requirement: Edited input is validated like new input
The system SHALL refuse an edit with a blank title, a blank author, or servings that are filled in but not a whole number greater than zero, change nothing, and show the form again with what was entered and what is wrong, with the same accessibility as the new recipe form.

#### Scenario: Invalid edit is refused
- **WHEN** the edit form is submitted with a blank title
- **THEN** the recipe is unchanged and the form shows an error for the title

### Requirement: An edited author keeps the existing spelling
The system SHALL store an edited author that matches the author of another stored recipe regardless of letter case with that recipe's spelling, and SHALL accept an author that no other recipe has as typed.

#### Scenario: Edited author reuses spelling
- **WHEN** a family member changes an author to "oma" and another recipe has the author "Oma"
- **THEN** the recipe is stored with the author "Oma"

#### Scenario: Own author can be respelled
- **WHEN** a family member changes the author "Oma" of the only recipe by that author to "oma"
- **THEN** the recipe is stored with the author "oma"
