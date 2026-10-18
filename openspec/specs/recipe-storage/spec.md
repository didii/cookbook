# recipe-storage Specification

## Purpose

Defines how the cookbook persists recipes with their ingredients, steps and the ingredients each step uses, in a form that supports rescaling portions and optional step images.

## Requirements

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

### Requirement: Ingredients are ordered and belong to one recipe
The system SHALL store each ingredient with a name and its position within exactly one recipe.

#### Scenario: Ingredients keep their order
- **WHEN** a recipe's ingredients are read ordered by position
- **THEN** they come back in the order they were entered

#### Scenario: Ingredient needs a recipe
- **WHEN** an ingredient is inserted for a recipe that does not exist
- **THEN** the insert fails

### Requirement: Ingredient quantities can be scaled
The system SHALL store an ingredient's quantity as the text as entered plus an optional numeric amount and an optional unit, without requiring the user to choose a unit.

#### Scenario: Quantity with amount and unit
- **WHEN** an ingredient is stored with text "250 g", amount 250 and unit "g"
- **THEN** all three are returned as stored

#### Scenario: Quantity without a number
- **WHEN** an ingredient such as "boter om te bakken" is stored with empty text and no amount or unit
- **THEN** it is accepted

#### Scenario: Non-positive amount refused
- **WHEN** an ingredient is stored with an amount of zero or less
- **THEN** the insert fails

### Requirement: Steps are ordered and belong to one recipe
The system SHALL store each preparation step as text with its position within exactly one recipe.

#### Scenario: Steps keep their order
- **WHEN** a recipe's steps are read ordered by position
- **THEN** they come back in the order they were entered

#### Scenario: Step needs a recipe
- **WHEN** a step is inserted for a recipe that does not exist
- **THEN** the insert fails

### Requirement: A step may have an image
The system SHALL allow a step to have an image path and an alt text, and SHALL accept steps without one.

#### Scenario: Step with image
- **WHEN** a step is stored with an image and alt text
- **THEN** both are returned as stored

#### Scenario: Step without image
- **WHEN** a step is stored without an image
- **THEN** it is accepted

### Requirement: Steps record the ingredients they use
The system SHALL store which ingredients of its own recipe a step uses, each optionally with the amount and unit used in that step; no amount means the whole ingredient quantity.

#### Scenario: Step uses part of an ingredient
- **WHEN** a step is linked to an ingredient with amount 200 and unit "g"
- **THEN** the link returns that amount and unit

#### Scenario: Step uses a whole ingredient
- **WHEN** a step is linked to an ingredient without an amount
- **THEN** the link is accepted and carries no amount

#### Scenario: Ingredient of another recipe refused
- **WHEN** a step is linked to an ingredient that belongs to a different recipe
- **THEN** the insert fails

#### Scenario: Same ingredient linked twice refused
- **WHEN** a step is linked twice to the same ingredient
- **THEN** the second insert fails

### Requirement: Deleting removes dependent rows
The system SHALL remove a recipe's ingredients, steps and step-ingredient links when the recipe is deleted, and a step's links when its step or linked ingredient is deleted.

#### Scenario: Recipe deleted
- **WHEN** a recipe with ingredients, steps and links is deleted
- **THEN** none of its ingredients, steps or links remain

#### Scenario: Ingredient deleted
- **WHEN** an ingredient used by a step is deleted
- **THEN** the step remains and its link to that ingredient is gone
