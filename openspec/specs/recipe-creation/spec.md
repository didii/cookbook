# recipe-creation Specification

## Purpose
Lets a family member add a new recipe to the cookbook, so recipes can be shared within the family.

## Requirements

### Requirement: A new recipe can be added from the app
The system SHALL offer, in the menu of the header of every page, a link to a form at `/recepten/nieuw` where a family member provides a title and an author, and optionally a number of servings, a preparation time, an intro and a photo, and SHALL save the recipe when the form is submitted.

#### Scenario: Link to the form
- **WHEN** a family member opens the menu on any page
- **THEN** a link "Nieuw recept" to the new recipe form is available, and the header itself has no such link

#### Scenario: Recipe is created
- **WHEN** a family member submits a title, an author and a number of servings greater than zero
- **THEN** the recipe is stored with those values and the family member's email as its creator, and they are taken to its page

#### Scenario: Servings left empty
- **WHEN** a family member submits a title and an author and leaves the servings empty
- **THEN** the recipe is stored without servings and they are taken to its page

#### Scenario: Time, intro and image are stored
- **WHEN** a family member also fills in a preparation time and an intro and adds a photo
- **THEN** the recipe is stored with those values

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

### Requirement: The author is suggested from existing authors
The system SHALL suggest, while the author is typed, the authors already on stored recipes, each author once and matched regardless of letter case, SHALL accept an author that is not yet stored, and SHALL store an author that matches an existing one regardless of case with the existing spelling.

#### Scenario: Existing authors are suggested
- **WHEN** a family member opens the new recipe form and recipes by "Oma" and "Papa" are stored
- **THEN** both are offered as suggestions, once each, even when "Oma" was entered with different letter case on several recipes

#### Scenario: Suggestions ignore letter case
- **WHEN** a family member types "oma" in the author field
- **THEN** "Oma" is among the suggestions

#### Scenario: New author is accepted
- **WHEN** a family member submits an author that no stored recipe has
- **THEN** the recipe is stored with that author as typed

#### Scenario: Existing spelling is reused
- **WHEN** a family member submits "oma" and "Oma" is already stored as an author
- **THEN** the recipe is stored with the author "Oma"

### Requirement: Invalid input is refused
The system SHALL refuse a submission with a blank title, a blank author, or servings that are filled in but not a whole number greater than zero, store nothing, and show the form again with what was entered and what is wrong.

#### Scenario: Missing title
- **WHEN** the form is submitted with a blank title
- **THEN** no recipe is stored and the form shows an error for the title

#### Scenario: Invalid servings
- **WHEN** the form is submitted with servings of zero, a negative number, a fraction or text
- **THEN** no recipe is stored and the form shows an error for the servings

### Requirement: The form is usable with assistive technology
The system SHALL mark the required fields of the form visibly with an asterisk that is explained on the form and not conveyed by colour alone, SHALL expose them as required to assistive technology, and SHALL, after a refused submission, describe each error in text tied to its field and move focus to the first field in error.

#### Scenario: Required fields are marked
- **WHEN** a family member opens the new recipe form
- **THEN** the title and author labels carry an asterisk, the form explains that fields with an asterisk are required, and the servings label has none

#### Scenario: Errors are announced and focused
- **WHEN** a submission is refused
- **THEN** each error is shown as text associated with its field and focus is on the first field in error

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
