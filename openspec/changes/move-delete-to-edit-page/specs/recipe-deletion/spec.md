## MODIFIED Requirements

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
