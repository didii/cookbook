# plaid-accent Specification

## Purpose

Gives the cookbook a Canadian touch: a buffalo-plaid pattern (red with crossing dark bands) used in two places, away from the text people read while cooking.

## Requirements

### Requirement: The welcome card has a plaid strip
The system SHALL show the card of the welcome screen with a strip of plaid along its top edge, inside the card's border and above the fret. The card SHALL have an ink border and rounded corners, and the plaid strip and the tile band SHALL be clipped to those corners. The page behind the card SHALL stay plain.

#### Scenario: Card has a plaid strip
- **WHEN** a new member opens the welcome screen
- **THEN** the top of the card is a plaid strip above the fret and the page behind the card has no plaid

#### Scenario: Card is rounded
- **WHEN** a new member opens the welcome screen
- **THEN** the card has rounded corners, and neither the plaid strip nor the tile band sticks out of them

#### Scenario: Card on a narrow screen
- **WHEN** the welcome screen is opened on a screen 320 pixels wide
- **THEN** the card fits without horizontal scrolling

### Requirement: The top of the menu sidebar is plaid
The system SHALL show the top section of the menu sidebar in plaid, as tall as the header together with its fret, with a fret along its bottom edge like the header and no border below it. The rest of the sidebar SHALL stay solid red. The close button SHALL stay a bare white cross, without border or fill, 0.5rem from the left edge, where the menu button sits on a narrow screen.

#### Scenario: Top of the sidebar is plaid
- **WHEN** a family member opens the menu
- **THEN** the top section of the sidebar is plaid and the rest of the sidebar is solid red

#### Scenario: Plaid section is as tall as the header
- **WHEN** a family member opens the menu
- **THEN** the plaid section is as tall as the header with its fret

#### Scenario: Close button on the plaid
- **WHEN** a family member opens the menu
- **THEN** the close button is a white cross with no border and no fill, 0.5rem from the left edge

### Requirement: Plaid is decorative
The system SHALL draw plaid only from the existing red and ink colours and SHALL hide it from assistive technology.

#### Scenario: Plaid is hidden from assistive technology
- **WHEN** a plaid area is shown
- **THEN** it is not announced by assistive technology
