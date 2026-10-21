# Spec Delta

## MODIFIED Requirements

### Requirement: The home page lists the stored recipes
The system SHALL show a short welcome (the heading "Wat eten we vandaag?" and one line of introduction) on the home page, followed by every stored recipe as a card with its title, author and, when it has them, its preparation time, main image and seal, linking to the recipe's page. Recipes added most recently come first. The page SHALL state how many recipes there are. The card's image is a wide, short strip (5:2 on screens narrower than 48rem, 16:10 from 48rem) so that at least two cards fit on a phone screen.

#### Scenario: Stored recipes are listed
- **WHEN** a family member opens the home page and two recipes are stored
- **THEN** both are shown as cards, the most recently added first, each linking to its own page

#### Scenario: A new recipe appears
- **WHEN** a recipe is added and the home page is opened again
- **THEN** the new recipe is on the page and the count has gone up by one

#### Scenario: Recipe without time or image
- **WHEN** a stored recipe has no preparation time and no main image
- **THEN** its card shows the title and author, without a time or an image

#### Scenario: Welcome above the recipes
- **WHEN** a family member opens the home page
- **THEN** the heading "Wat eten we vandaag?" and a line of introduction are shown above the first recipe card

#### Scenario: Card image ratio
- **WHEN** the home page is shown on a phone-width screen
- **THEN** a card's image is five parts wide to two high, and the tile band is shown below it

#### Scenario: Two recipes on one phone screen
- **WHEN** the home page is opened on a phone with at least two stored recipes, scrolled to the first card
- **THEN** at least two cards are fully visible without scrolling

### Requirement: An empty cookbook says so
The system SHALL, when no recipe is stored, show on the home page that there are no recipes yet, with a link to add the first one, instead of an empty list. No search, filter or count is shown then.

#### Scenario: No recipes yet
- **WHEN** a family member opens the home page and no recipe is stored
- **THEN** the page says there are no recipes yet and links to the new recipe form, and shows no search box or filter
