# recipe-viewing Specification

## Purpose

Lets a signed-in family member open a stored recipe and read everything needed to cook it.

## Requirements

### Requirement: A recipe page shows the stored recipe
The system SHALL show, at `/recepten/<slug>`, the title, author, intro and image of the stored recipe with that slug, and its preparation time and servings when it has them.

#### Scenario: Existing recipe
- **WHEN** a family member opens the page of a stored recipe
- **THEN** its title, author, time, servings and intro are shown

#### Scenario: Optional fields are empty
- **WHEN** a recipe has no preparation time, no servings or no image
- **THEN** the page still renders, without the missing item

### Requirement: Ingredients and steps are shown in order
The system SHALL list the recipe's ingredients and steps in their stored position order, each ingredient with its quantity text and name.

#### Scenario: Order is kept
- **WHEN** a recipe has several ingredients and steps
- **THEN** both lists appear in the order they were entered

#### Scenario: Ingredient without quantity
- **WHEN** an ingredient has an empty quantity text
- **THEN** it is shown with its name only

### Requirement: Unknown recipe gives not found
The system SHALL respond with a 404 when no recipe has the requested slug.

#### Scenario: Unknown slug
- **WHEN** a family member opens `/recepten/does-not-exist`
- **THEN** the response status is 404
