# Spec Delta

## MODIFIED Requirements

### Requirement: A new recipe can be added from the app
The system SHALL offer, from every page, a link to a form at `/recepten/nieuw` where a family member provides a title and an author, and optionally a number of servings, a preparation time, an intro and a photo, and SHALL save the recipe when the form is submitted.

#### Scenario: Link to the form
- **WHEN** a family member looks at any page
- **THEN** a link to the new recipe form is available

#### Scenario: Link on a narrow screen
- **WHEN** a family member looks at any page on a narrow (phone) screen
- **THEN** the link is shown in a short form and the signed-in email is not shown, because the header has no room for both; on wider screens both are shown

#### Scenario: Recipe is created
- **WHEN** a family member submits a title, an author and a number of servings greater than zero
- **THEN** the recipe is stored with those values and the family member's email as its creator, and they are taken to its page

#### Scenario: Servings left empty
- **WHEN** a family member submits a title and an author and leaves the servings empty
- **THEN** the recipe is stored without servings and they are taken to its page

#### Scenario: Time, intro and image are stored
- **WHEN** a family member also fills in a preparation time and an intro and adds a photo
- **THEN** the recipe is stored with those values

## REMOVED Requirements

### Requirement: The image is previewed in the form
**Reason**: The image is no longer typed as a link; choosing and showing a photo is now owned by the `recipe-photo` capability (frame, tile band, load errors).
**Migration**: See `recipe-photo`: "The photo is shown in the recipe page's frame".
