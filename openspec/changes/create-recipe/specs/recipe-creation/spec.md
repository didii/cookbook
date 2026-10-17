## ADDED Requirements

### Requirement: A new recipe can be added from the app
The system SHALL offer, from every page, a link to a form at `/recepten/nieuw` where a family member provides a title, an author and a number of servings, and SHALL save the recipe when the form is submitted.

#### Scenario: Link to the form
- **WHEN** a family member looks at any page
- **THEN** a link to the new recipe form is available

#### Scenario: Link on a narrow screen
- **WHEN** a family member looks at any page on a narrow (phone) screen
- **THEN** the link is shown in a short form and the signed-in email is not shown, because the header has no room for both; on wider screens both are shown

#### Scenario: Recipe is created
- **WHEN** a family member submits a title, an author and a number of servings greater than zero
- **THEN** the recipe is stored with those values and the family member's email as its creator, and they are taken to its page

### Requirement: A new recipe gets a unique address
The system SHALL give each created recipe a slug derived from its title that no other recipe has, and SHALL NOT use a slug that would clash with a fixed address.

#### Scenario: Slug from title
- **WHEN** a recipe titled "Kip met Rijst!" is created
- **THEN** its page address is `/recepten/kip-met-rijst`

#### Scenario: Same title twice
- **WHEN** a recipe is created with a title whose slug is already taken
- **THEN** it is stored under a different slug and the existing recipe is unchanged

#### Scenario: Title that clashes with the form address
- **WHEN** a recipe titled "Nieuw" is created
- **THEN** its slug is not `nieuw`

### Requirement: Invalid input is refused
The system SHALL refuse a submission with a blank title, a blank author, or servings that are not a whole number greater than zero, store nothing, and show the form again with what was entered and what is wrong.

#### Scenario: Missing title
- **WHEN** the form is submitted with a blank title
- **THEN** no recipe is stored and the form shows an error for the title

#### Scenario: Invalid servings
- **WHEN** the form is submitted with servings of zero, a negative number, a fraction or text
- **THEN** no recipe is stored and the form shows an error for the servings
