# recipe-deletion Specification

## Purpose
TBD - created by archiving change delete-recipe. Update Purpose after archive.

## Requirements

### Requirement: A recipe page has a delete button at the bottom
The system SHALL show on the edit page of a stored recipe, at the bottom of the page after the form and its save bar, a button "Verwijder recept". It SHALL NOT be in the site header, SHALL NOT be on the recipe page, and SHALL NOT be on the page for a new recipe.

#### Scenario: Delete button is shown
- **WHEN** a family member opens the edit page of a stored recipe
- **THEN** a button "Verwijder recept" is available at the bottom of the page, after the form

#### Scenario: No delete button on the recipe page
- **WHEN** a family member opens the page of a stored recipe
- **THEN** there is no button "Verwijder recept"

#### Scenario: No delete button for a new recipe
- **WHEN** a family member opens the page for a new recipe
- **THEN** there is no button "Verwijder recept"

### Requirement: Deleting needs a confirmation in a popup
The system SHALL, when the delete button is used, open a popup that names the recipe and offers "Verwijderen" and "Annuleren", and SHALL NOT delete anything until "Verwijderen" is used. The popup SHALL close without deleting on "Annuleren", on the Escape key, and on a click outside it.

#### Scenario: Popup asks for confirmation
- **WHEN** a family member uses the delete button
- **THEN** a popup naming the recipe opens with "Verwijderen" and "Annuleren", and the recipe is still stored

#### Scenario: Cancel closes the popup
- **WHEN** the popup is open and the family member uses "Annuleren"
- **THEN** the popup closes and the recipe is still stored

#### Scenario: Click outside closes the popup
- **WHEN** the popup is open and the family member clicks outside it
- **THEN** the popup closes and the recipe is still stored

#### Scenario: Escape closes the popup
- **WHEN** the popup is open and the family member presses Escape
- **THEN** the popup closes and the recipe is still stored

### Requirement: Confirming deletes the recipe
The system SHALL, when deletion is confirmed, delete the recipe with its ingredients, steps and views, delete its photo if it has one, and take the family member to the home page, where the recipe is no longer listed. A failure to delete the photo SHALL NOT turn into an error.

#### Scenario: Recipe is deleted
- **WHEN** a family member confirms the deletion of a recipe
- **THEN** the recipe and its ingredients and steps are gone, its page responds 404, and the family member is taken to the home page

#### Scenario: Photo is deleted
- **WHEN** a recipe with a photo is deleted
- **THEN** its photo is removed from storage

#### Scenario: Unknown recipe
- **WHEN** deletion is submitted for a slug that no recipe has
- **THEN** the response status is 404
