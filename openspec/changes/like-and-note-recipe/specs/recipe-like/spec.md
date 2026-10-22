## ADDED Requirements

### Requirement: A recipe can be liked with a heart button
The system SHALL show on a recipe page, in the top row beside the link to editing, a heart-shaped button that lets the signed-in member like the recipe and unlike it again. A liked recipe SHALL show a filled heart on a red button; a recipe that is not liked SHALL show an outlined heart on a white button. The button SHALL have no visible text, a touch target of at least 44 by 44 pixels, an accessible name that says what pressing it does ("Markeer als favoriet" or "Verwijder uit favorieten"), and SHALL expose its state as pressed or not pressed.

#### Scenario: Recipe not liked
- **WHEN** a member opens a recipe they have not liked
- **THEN** the heart button is shown outlined, not pressed, with the accessible name "Markeer als favoriet"

#### Scenario: Recipe liked
- **WHEN** a member opens a recipe they have liked
- **THEN** the heart button is shown filled, pressed, with the accessible name "Verwijder uit favorieten"

### Requirement: Pressing the heart stores or removes the like
The system SHALL store the like for the member and the recipe when the member presses the heart on a recipe they have not liked, and SHALL remove it when they press it on a recipe they have liked. A like SHALL exist at most once per member and recipe. The heart SHALL change at once, without a page reload, and the like SHALL still be there when the page is opened again.

#### Scenario: Liking a recipe
- **WHEN** a member presses the heart of a recipe they have not liked and opens the page again
- **THEN** the heart is shown liked

#### Scenario: Unliking a recipe
- **WHEN** a member presses the heart of a recipe they have liked and opens the page again
- **THEN** the heart is shown not liked

#### Scenario: Liking twice stores one like
- **WHEN** the like of a recipe is stored for a member who already liked it
- **THEN** the member still has exactly one like for that recipe

#### Scenario: Like cannot be saved
- **WHEN** a member presses the heart and the like cannot be stored
- **THEN** the heart returns to the state it had before the press

### Requirement: A like is private to the member
The system SHALL show a like only to the member who gave it. A like of one member SHALL NOT change what another member sees.

#### Scenario: Another member's like
- **WHEN** one member has liked a recipe and another member opens it
- **THEN** the second member sees the heart not liked

### Requirement: Likes go with their recipe and member
The system SHALL remove the likes of a recipe when the recipe is deleted and the likes of a member when the member is removed.

#### Scenario: Removing a member removes their likes
- **WHEN** a member who has liked recipes is removed
- **THEN** no like by that member remains

#### Scenario: Deleting a recipe removes its likes
- **WHEN** a recipe that members have liked is deleted
- **THEN** no like for that recipe remains
