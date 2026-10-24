# Spec Delta

## Purpose

Gives the cookbook a Canadian touch: a buffalo-plaid pattern (red with crossing dark bands) used in two places, away from the text people read while cooking.

## ADDED Requirements

### Requirement: The welcome card has a plaid frame
The system SHALL show the card of the welcome screen inside a frame of plaid, with an ink outline around the frame, rounded outer corners and a hard shadow. The card inside the frame SHALL have an ink border and rounded corners, and its tile band SHALL be clipped to those corners. The page behind the frame SHALL stay plain.

#### Scenario: Card is framed in plaid
- **WHEN** a new member opens the welcome screen
- **THEN** the card is surrounded by a plaid frame and the page behind it has no plaid

#### Scenario: Frame and card are rounded
- **WHEN** a new member opens the welcome screen
- **THEN** the frame has a larger corner radius than the card inside it, and the tile band does not stick out of the card's corners

#### Scenario: Frame on a narrow screen
- **WHEN** the welcome screen is opened on a screen 320 pixels wide
- **THEN** the frame and the card fit without horizontal scrolling

### Requirement: The top of the menu sidebar is plaid
The system SHALL show the top section of the menu sidebar in plaid, as tall as the header together with its fret, with an ink line below it. The rest of the sidebar SHALL stay solid red. The close button SHALL stay a bare white cross, without border or fill, 0.5rem from the left edge, where the menu button sits on a narrow screen.

#### Scenario: Top of the sidebar is plaid
- **WHEN** a family member opens the menu
- **THEN** the top section of the sidebar is plaid and the rest of the sidebar is solid red

#### Scenario: Plaid section is as tall as the header
- **WHEN** a family member opens the menu
- **THEN** the plaid section is as tall as the header with its fret

#### Scenario: Close button on the plaid
- **WHEN** a family member opens the menu
- **THEN** the close button is a white cross with no border and no fill, 0.5rem from the left edge

### Requirement: Plaid is decorative and limited to two places
The system SHALL draw plaid only from the existing red and ink colours, SHALL hide it from assistive technology, and SHALL NOT show it anywhere other than the welcome card frame and the top of the menu sidebar. In particular the header, the recipe page, the recipe cards and the home page SHALL have no plaid.

#### Scenario: Plaid is hidden from assistive technology
- **WHEN** a plaid area is shown
- **THEN** it is not announced by assistive technology

#### Scenario: No plaid in the header
- **WHEN** a family member opens any page with the header while the menu is closed
- **THEN** the header shows no plaid

#### Scenario: No plaid on recipe pages and cards
- **WHEN** a family member opens the home page or a recipe page
- **THEN** no plaid is shown on the page
