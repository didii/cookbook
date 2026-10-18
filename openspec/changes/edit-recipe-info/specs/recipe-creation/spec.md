## MODIFIED Requirements

### Requirement: A new recipe can be added from the app
The system SHALL offer, from every page, a link to a form at `/recepten/nieuw` where a family member provides a title and an author, and optionally a number of servings, a preparation time, an intro and an image link, and SHALL save the recipe when the form is submitted.

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
- **WHEN** a family member also fills in a preparation time, an intro and an image link
- **THEN** the recipe is stored with those values

## ADDED Requirements

### Requirement: A new recipe gets a seal
The system SHALL give each created recipe a seal chosen automatically and at random among the available seals that the fewest recipes use, without the family member choosing, unless a seal is provided, which is then used.

#### Scenario: Seal is assigned
- **WHEN** a recipe is created
- **THEN** it is stored with one of the available seals

#### Scenario: Least used seals are chosen
- **WHEN** a recipe is created while some seals are used by fewer recipes than the others
- **THEN** its seal is one of the least used ones

#### Scenario: Provided seal is used
- **WHEN** a recipe is created with a seal given
- **THEN** it is stored with that seal

### Requirement: The image is previewed in the form
The system SHALL show in the form, for new and existing recipes alike, a preview of the image link as it is typed, framed like the image on the recipe page (same border, shadow, proportions and a tile band beneath), show nothing while the field is empty, and tell the family member in text when the image cannot be loaded.

#### Scenario: Preview of the image
- **WHEN** a family member fills in or changes the image link, or opens the form of a recipe that has an image
- **THEN** the form shows that image in the same frame as on the recipe page, with a tile band beneath it

#### Scenario: Image cannot be loaded
- **WHEN** the image link does not lead to a loadable image
- **THEN** the form shows a text saying the image cannot be shown instead of a broken picture
