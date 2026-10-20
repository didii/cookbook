# recipe-browsing Specification

## Purpose
Browse the stored recipes from the home page: a card per recipe, and a prompt to add the first one when the cookbook is empty.

## Requirements

### Requirement: The home page lists the stored recipes
The system SHALL show every stored recipe on the home page as a card with its title, author and, when it has them, its preparation time, main image and seal, linking to the recipe's page. Recipes added most recently come first. The page SHALL state how many recipes there are.

#### Scenario: Stored recipes are listed
- **WHEN** a family member opens the home page and two recipes are stored
- **THEN** both are shown as cards, the most recently added first, each linking to its own page

#### Scenario: A new recipe appears
- **WHEN** a recipe is added and the home page is opened again
- **THEN** the new recipe is on the page and the count has gone up by one

#### Scenario: Recipe without time or image
- **WHEN** a stored recipe has no preparation time and no main image
- **THEN** its card shows the title and author, without a time or an image

### Requirement: An empty cookbook says so
The system SHALL, when no recipe is stored, show on the home page that there are no recipes yet, with a link to add the first one, instead of an empty list.

#### Scenario: No recipes yet
- **WHEN** a family member opens the home page and no recipe is stored
- **THEN** the page says there are no recipes yet and links to the new recipe form
