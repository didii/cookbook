# recipe-actions-menu Specification

## Purpose

Gives the recipe page one menu for the things a family member can do with a recipe besides reading it: edit it, copy it and share it.

## Requirements

### Requirement: The recipe page has an actions menu button
The system SHALL show on a recipe page, in the top row next to the like button, a button with an icon only (three dots) named "Meer acties" that opens the actions menu, and SHALL NOT show a separate "Bewerk" link there. The button SHALL tell whether the menu is open.

#### Scenario: The button is shown instead of the edit link
- **WHEN** a family member opens the page of a stored recipe
- **THEN** the button "Meer acties" is shown after the like button, the menu is closed and no "Bewerk" link is on the page

#### Scenario: The button tells whether the menu is open
- **WHEN** a family member opens the menu
- **THEN** the button is announced as expanded, and as collapsed again when the menu is closed

### Requirement: The menu lists the actions in a fixed order
The system SHALL list in the opened menu, in this order, "Bewerk", "Kopieer" and "Deel", and no other items.

#### Scenario: The menu lists its items
- **WHEN** a family member opens the menu
- **THEN** it lists "Bewerk", "Kopieer" and "Deel", in that order, and no others

### Requirement: Bewerk opens the editor
The system SHALL make the menu item "Bewerk" a link to the edit form of the recipe.

#### Scenario: Bewerk links to the edit form
- **WHEN** a family member opens the menu on the page of a stored recipe
- **THEN** "Bewerk" links to `/recepten/<slug>/bewerken`

### Requirement: Kopieer is not available yet
The system SHALL show the menu item "Kopieer" disabled: it cannot be activated and is announced as unavailable.

#### Scenario: Kopieer is disabled
- **WHEN** a family member opens the menu
- **THEN** "Kopieer" is disabled and activating it does nothing

### Requirement: Deel is not available yet
The system SHALL show the menu item "Deel" disabled: it cannot be activated and is announced as unavailable.

#### Scenario: Deel is disabled
- **WHEN** a family member opens the menu
- **THEN** "Deel" is disabled and activating it does nothing

### Requirement: The menu closes
The system SHALL close the menu with the Escape key, with a click outside it, and when an item is chosen, and SHALL give the focus back to the menu button when Escape closes it.

#### Scenario: Escape closes the menu
- **WHEN** the menu is open and a family member presses Escape
- **THEN** the menu closes and the menu button has the focus

#### Scenario: A click outside closes the menu
- **WHEN** the menu is open and a family member clicks elsewhere on the page
- **THEN** the menu closes

#### Scenario: Choosing an item closes the menu
- **WHEN** the menu is open and a family member chooses "Bewerk"
- **THEN** the menu closes
