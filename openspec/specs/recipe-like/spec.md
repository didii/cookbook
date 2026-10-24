# recipe-like Specification

## Purpose
TBD - created by archiving change like-and-note-recipe. Update Purpose after archive.

## Requirements

### Requirement: A recipe can be liked with a maple leaf button
The system SHALL show a maple-leaf-shaped button that lets the signed-in member like a recipe and unlike it again, on the recipe page in the top row beside the link to editing, and on every recipe card on the home page, in the card's tile band. A liked recipe SHALL show a filled white leaf on a red button; a recipe that is not liked SHALL show an outlined leaf on a white button, and the button SHALL always be shown, liked or not. The button SHALL have no visible text, a touch target of at least 44 by 44 pixels, an accessible name that says what pressing it does ("Markeer als favoriet" or "Verwijder uit favorieten"), and SHALL expose its state as pressed or not pressed. The button SHALL change colour while the pointer is over it, so it is clear that it can be pressed.

#### Scenario: Recipe not liked
- **WHEN** a member opens a recipe they have not liked
- **THEN** the leaf button is shown outlined, not pressed, with the accessible name "Markeer als favoriet"

#### Scenario: Recipe liked
- **WHEN** a member opens a recipe they have liked
- **THEN** the leaf button is shown filled, pressed, with the accessible name "Verwijder uit favorieten"

#### Scenario: Card of a liked recipe
- **WHEN** the home page shows the card of a recipe the member has liked
- **THEN** the card's leaf button is shown filled and pressed

#### Scenario: Card of a recipe not liked
- **WHEN** the home page shows the card of a recipe the member has not liked
- **THEN** the card's leaf button is shown outlined and not pressed

#### Scenario: Another member's like on a card
- **WHEN** one member has liked a recipe and another member opens the home page
- **THEN** the second member's card for that recipe shows the leaf not liked

#### Scenario: Leaf reacts to the pointer
- **WHEN** the pointer is over the leaf button
- **THEN** the button's colour differs from its colour at rest, whether it is liked or not

### Requirement: Pressing the leaf stores or removes the like
The system SHALL store the like for the member and the recipe when the member presses the leaf on a recipe they have not liked, and SHALL remove it when they press it on a recipe they have liked. A like SHALL exist at most once per member and recipe. The leaf SHALL change at once, without a page reload, and the like SHALL still be there when the page is opened again.

#### Scenario: Liking a recipe
- **WHEN** a member presses the leaf of a recipe they have not liked and opens the page again
- **THEN** the leaf is shown liked

#### Scenario: Unliking a recipe
- **WHEN** a member presses the leaf of a recipe they have liked and opens the page again
- **THEN** the leaf is shown not liked

#### Scenario: Liking twice stores one like
- **WHEN** the like of a recipe is stored for a member who already liked it
- **THEN** the member still has exactly one like for that recipe

#### Scenario: Like cannot be saved
- **WHEN** a member presses the leaf and the like cannot be stored
- **THEN** the leaf returns to the state it had before the press

### Requirement: A like is private to the member
The system SHALL show a like only to the member who gave it. A like of one member SHALL NOT change what another member sees.

#### Scenario: Another member's like
- **WHEN** one member has liked a recipe and another member opens it
- **THEN** the second member sees the leaf not liked

### Requirement: Likes go with their recipe and member
The system SHALL remove the likes of a recipe when the recipe is deleted and the likes of a member when the member is removed.

#### Scenario: Removing a member removes their likes
- **WHEN** a member who has liked recipes is removed
- **THEN** no like by that member remains

#### Scenario: Deleting a recipe removes its likes
- **WHEN** a recipe that members have liked is deleted
- **THEN** no like for that recipe remains

### Requirement: Pressing the leaf on a card does not open the recipe
The system SHALL, when the member presses the leaf button on a card, like or unlike the recipe as on the recipe page and keep the member on the home page. The card SHALL stay one link to the recipe, with the leaf button next to that link and not inside it.

#### Scenario: Liking from a card
- **WHEN** a member presses the leaf on the card of a recipe they have not liked
- **THEN** the leaf shows liked at once, the like is stored and the member stays on the home page

#### Scenario: Unliking from a card
- **WHEN** a member presses the leaf on the card of a recipe they have liked
- **THEN** the leaf shows not liked at once, the like is removed and the member stays on the home page

#### Scenario: A like from a card is kept
- **WHEN** a member likes a recipe from its card, searches so the card is hidden and clears the search
- **THEN** the card shows the leaf liked

#### Scenario: Leaf is not inside the link
- **WHEN** a card is shown
- **THEN** the link to the recipe does not contain the leaf button
