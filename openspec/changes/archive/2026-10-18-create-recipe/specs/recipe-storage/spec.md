## MODIFIED Requirements

### Requirement: A recipe is stored with its descriptive fields
The system SHALL store, for each recipe, a unique slug, a title, an author and an intro, plus an optional number of servings (greater than zero when given), preparation time, main image, seal id and the email of who added it.

#### Scenario: Recipe is saved
- **WHEN** a recipe with all fields is inserted
- **THEN** it can be read back with the same values

#### Scenario: Duplicate slug is refused
- **WHEN** a recipe is inserted with a slug that another recipe already has
- **THEN** the insert fails and the existing recipe is unchanged

#### Scenario: Required field is missing
- **WHEN** a recipe is inserted without a title, or with zero servings
- **THEN** the insert fails

#### Scenario: Servings are optional
- **WHEN** a recipe is inserted without a number of servings
- **THEN** it is accepted and has no servings when read back
