# Spec Delta

## MODIFIED Requirements

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
