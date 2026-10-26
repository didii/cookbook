## MODIFIED Requirements

### Requirement: The home page lists the stored recipes as cards
The system SHALL show a short welcome (the heading "Wat eten we vandaag?" and one line of introduction) on the home page, followed by every stored recipe as a card, linking to the recipe's page. Recipes added most recently come first. The page SHALL state how many recipes there are. A card SHALL show, from top to bottom: the recipe's main image when it has one, with its seal at the top right of the image; a tile band; the title; "van" and the author, followed by the preparation time when there is one; and the recipe's tags. On a phone-width screen the cards are shown one per row; on wider screens as many columns as fit. A card keeps the height its own content gives it; cards in one row are not stretched to match. Where there is no image, the tile band is as tall as the image and the tile band together, in whole tiles, and no seal is shown.

#### Scenario: Stored recipes are listed
- **WHEN** a family member opens the home page and two recipes are stored
- **THEN** both are shown as cards, the most recently added first, each linking to its own page

#### Scenario: A new recipe appears
- **WHEN** a recipe is added and the home page is opened again
- **THEN** the new recipe is on the page and the count has gone up by one

#### Scenario: Recipe without time or image
- **WHEN** a stored recipe has no preparation time and no main image
- **THEN** its card shows the title and author, without a time, an image or a seal, and the tile band is taller instead

#### Scenario: Welcome above the recipes
- **WHEN** a family member opens the home page
- **THEN** the heading "Wat eten we vandaag?" and a line of introduction are shown above the first recipe card

#### Scenario: Image, band, then text
- **WHEN** a card of a recipe with an image is shown
- **THEN** the image comes first, the tile band follows it, and the title, author and tags follow the band

#### Scenario: Seal on the image
- **WHEN** a card of a recipe with an image and a seal is shown
- **THEN** the seal is shown at the top right of the image

#### Scenario: Card without image is as tall as with
- **WHEN** a card of a recipe without an image and a card of a recipe with an image are shown at the same width
- **THEN** their image and tile band parts are equally tall and the buttons in the tile band are in the same place

#### Scenario: One card per row on a phone
- **WHEN** the home page is shown on a phone-width screen
- **THEN** every card takes the full width, one per row

#### Scenario: Two recipes on one phone screen
- **WHEN** the home page is opened on a phone with at least two stored recipes, scrolled to the first card
- **THEN** at least two cards are fully visible without scrolling

#### Scenario: The whole card opens the recipe
- **WHEN** a family member taps a card anywhere except on a button in it
- **THEN** the recipe's page opens

#### Scenario: Card reacts to the pointer
- **WHEN** the pointer is over a card
- **THEN** the card lifts a little and its hard shadow grows, unless the person prefers reduced motion

## REMOVED Requirements

### Requirement: A card shows the categories of its recipe
**Reason**: Categories are renamed to tags.
**Migration**: See "A card shows the tags of its recipe": same behavior under the new name.

## ADDED Requirements

### Requirement: A card shows the tags of its recipe
The system SHALL show on a card the first two tags of the recipe, in the order the listing gives them, as small pills below the author line. When the recipe has more than two, a further pill SHALL say how many are left ("+1", "+2" and so on). The pills SHALL NOT be links or buttons, and a recipe without tags SHALL show none.

#### Scenario: Recipe with two tags
- **WHEN** a card is shown for a recipe with the tags "Soep" and "Winter", given in that order
- **THEN** a pill for each is shown, "Soep" first, and no "+" pill

#### Scenario: Recipe with more tags
- **WHEN** a card is shown for a recipe with the tags "Hoofdgerecht", "Vlees" and "Winter", given in that order
- **THEN** pills for "Hoofdgerecht" and "Vlees" are shown, and a pill "+1"

#### Scenario: Recipe without tags
- **WHEN** a card is shown for a recipe without tags
- **THEN** it shows no tag pills

#### Scenario: Pills are not interactive
- **WHEN** a card with tag pills is shown
- **THEN** none of the pills is a link or a button
