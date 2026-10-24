# Spec Delta

## ADDED Requirements

### Requirement: A card shows whether the member has a note
The system SHALL show on a recipe's card on the home page, in the tile band beside the like button, a note icon when the signed-in member has a note for that recipe, and nothing when they have none. The icon SHALL say that there is a note ("Je hebt een notitie") and SHALL NOT show the text of the note. It SHALL NOT be a button or a link: it only indicates. A note of one member SHALL NOT show on another member's card.

#### Scenario: Recipe with a note
- **WHEN** the home page shows the card of a recipe the member has a note for
- **THEN** the card shows the note icon, named "Je hebt een notitie", and not the note's text

#### Scenario: Recipe without a note
- **WHEN** the home page shows the card of a recipe the member has no note for
- **THEN** the card shows no note icon

#### Scenario: Note icon only indicates
- **WHEN** a card shows the note icon
- **THEN** the icon is neither a link nor a button

#### Scenario: Another member's note on a card
- **WHEN** one member has a note for a recipe and another member opens the home page
- **THEN** the second member's card for that recipe shows no note icon
