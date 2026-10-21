# recipe-new-marker Specification

## Purpose
Helps a family member spot recipes they have not looked at yet, by marking recently added recipes as "Nieuw" for them until they open it or it gets old.

## Requirements

### Requirement: Recent unseen recipes are marked as new
The system SHALL show a "Nieuw" marker on a recipe's card on the home page for a signed-in member when the recipe was added less than one month ago and that member has not opened the recipe.

#### Scenario: Recent recipe never opened
- **WHEN** a recipe was added last week and a member who has not opened it views the home page
- **THEN** its card carries the "Nieuw" marker

#### Scenario: Marker is per member
- **WHEN** one member has opened a recipe and another member who has not opened it views the home page
- **THEN** the card has no marker for the first member and the marker for the second

### Requirement: Opening a recipe ends its newness
The system SHALL record that a member has opened a recipe when the member opens its page, once per member and recipe, and SHALL NOT show the marker on that recipe for that member afterwards.

#### Scenario: Opening the recipe
- **WHEN** a member opens a recipe marked "Nieuw" and later returns to the home page
- **THEN** the card no longer carries the marker

#### Scenario: Opening twice
- **WHEN** a member opens the same recipe a second time
- **THEN** the opening is still recorded only once

### Requirement: Old recipes are never new
The system SHALL NOT show the marker on a recipe that was added one month ago or longer, whether or not the member opened it.

#### Scenario: Recipe older than a month
- **WHEN** a recipe was added six weeks ago and a member who has not opened it views the home page
- **THEN** its card has no marker

### Requirement: Your own recipes are not new to you
The system SHALL NOT show the marker to the member who added the recipe.

#### Scenario: Viewing your own recent recipe
- **WHEN** a member adds a recipe and views the home page
- **THEN** the card for that recipe has no marker for them

### Requirement: The marker is readable at a glance
The system SHALL show the marker as a small yellow "Nieuw" label with a dark border and hard shadow, in the top-left corner of the card's image, and SHALL include it in the card's accessible name so that screen reader users also learn the recipe is new.

#### Scenario: Marker on a card with an image
- **WHEN** a card carries the marker
- **THEN** the label "Nieuw" is shown over the top-left of the image and is announced with the card
