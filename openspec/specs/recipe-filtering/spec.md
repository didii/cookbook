# recipe-filtering Specification

## Purpose
Lets a family member find a specific recipe or look for inspiration on the home page, by searching, filtering on who made it, and choosing the order. Built for one-handed use on a phone.

## Requirements

### Requirement: Search narrows the recipes as you type
The system SHALL show a search box on the home page. It SHALL show only the recipes whose title or author contains the typed text, ignoring case and accents, updating on every keystroke without a submit step and without reloading the page.

#### Scenario: Searching by title
- **WHEN** a family member types "appel" and a recipe titled "Appeltaart" and another titled "Erwtensoep" are stored
- **THEN** only the "Appeltaart" card is shown

#### Scenario: Searching by author
- **WHEN** a family member types "oma" and a recipe by "Oma" and a recipe by "Papa" are stored
- **THEN** only the recipe by "Oma" is shown

#### Scenario: Clearing the search
- **WHEN** a family member clears the search box
- **THEN** all recipes that match the other active filters are shown again

### Requirement: Recipes can be filtered on author
The system SHALL show a chip per author (each author once, case variants counted as one) plus an "Iedereen" chip. Exactly one chip is selected, "Iedereen" by default, and selecting an author shows only that author's recipes. The chips SHALL appear only when at least 4 recipes are stored.

#### Scenario: Choosing an author
- **WHEN** a family member selects the chip "Papa" and Papa has two of five stored recipes
- **THEN** only those two recipes are shown

#### Scenario: Search and author combine
- **WHEN** an author chip is selected and text is typed in the search box
- **THEN** only recipes that match both are shown

#### Scenario: Few recipes
- **WHEN** fewer than 4 recipes are stored
- **THEN** no author chips and no sort control are shown, but the search box is

### Requirement: Recipes can be sorted
The system SHALL offer the orders "Nieuwste" (most recently added first, the default) and "A–Z" (by title, alphabetical, ignoring case and accents), and apply the chosen order to the shown recipes.

#### Scenario: Default order
- **WHEN** a family member opens the home page
- **THEN** the recipes are shown most recently added first and "Nieuwste" is selected

#### Scenario: Sorting alphabetically
- **WHEN** a family member selects "A–Z"
- **THEN** the shown recipes are ordered by title

### Requirement: The result count follows the filters
The system SHALL show how many recipes are shown, as "N recepten" when no filter is active and "N van M" when a filter or search narrows the list, and SHALL announce a change of that count to screen readers.

#### Scenario: Count with a filter
- **WHEN** 12 recipes are stored and a search matches 3
- **THEN** the page says "3 van 12 recepten"

#### Scenario: Count without a filter
- **WHEN** 12 recipes are stored and no filter is active
- **THEN** the page says "12 recepten"

### Requirement: No match offers a way out
The system SHALL, when the active filters match no recipe, say that nothing was found for them and offer a "Wis filters" button that clears search and author and restores the default order. The search box stays in place.

#### Scenario: Nothing found
- **WHEN** a family member searches for text that matches no recipe
- **THEN** the page says nothing was found and shows a "Wis filters" button, and the search box keeps what was typed

#### Scenario: Clearing all filters
- **WHEN** a family member presses "Wis filters"
- **THEN** search is empty, "Iedereen" and "Nieuwste" are selected and all recipes are shown

### Requirement: Filters are kept in the address
The system SHALL keep the search text, author and order in the page address (`q`, `auteur`, `sort`), omitting values that are the default, so a reload or a shared link shows the same list. Changing a filter SHALL replace the current history entry instead of adding one.

#### Scenario: Opening a filtered address
- **WHEN** a family member opens the home page with `?q=appel`
- **THEN** the search box holds "appel" and only matching recipes are shown

#### Scenario: Filtering does not fill the history
- **WHEN** a family member types a search and then presses the browser's back button
- **THEN** they leave the home page instead of stepping through earlier searches

### Requirement: The search bar is within thumb reach on phones
The system SHALL, on screens narrower than 48rem, fix the search bar to the bottom edge of the screen, clear of the device's safe area and above the on-screen keyboard, and keep the last recipe card from hiding behind it. The bar stays visible while scrolling. The search box and buttons are at least 48px high and their text at least 16px.

#### Scenario: Scrolling on a phone
- **WHEN** a family member scrolls the home page on a phone
- **THEN** the search bar stays at the bottom of the screen

#### Scenario: Reaching the last recipe
- **WHEN** a family member scrolls to the end of the list on a phone
- **THEN** the last card can be scrolled fully clear of the bar

### Requirement: Detailed filters open in a sheet above the bar
The system SHALL, on screens narrower than 48rem, show a "Filter" button next to the search box that opens and closes a sheet above it with the author chips, the sort control and a "Wis filters" button. Pressing Escape closes the sheet. The button shows the number of active filters (author and order each count when not the default).

#### Scenario: Opening the sheet
- **WHEN** a family member presses "Filter"
- **THEN** the sheet with chips, sort and "Wis filters" appears above the search box, the search box stays where it was, and the button shows it is expanded

#### Scenario: Closing the sheet
- **WHEN** the sheet is open and a family member presses "Filter" again or presses Escape
- **THEN** the sheet closes

#### Scenario: Active filter count
- **WHEN** an author is selected and the order is "A–Z"
- **THEN** the "Filter" button shows the number 2

### Requirement: The sheet does not move the search box
The system SHALL keep the search box at the same position on screen whether the sheet is open or closed, and SHALL separate the sheet from the search box with a gray line, the same distance above the search box as the bar's top edge is when the sheet is closed. The sheet appears with a short rise animation (0.22 s), which reduced motion turns off.

#### Scenario: Search box stays put
- **WHEN** a family member opens the sheet
- **THEN** the search box has not moved and a gray line separates it from the sheet

#### Scenario: Reduced motion
- **WHEN** a person who prefers reduced motion opens the sheet
- **THEN** it appears without the rise animation

### Requirement: Chips show their state by line style
The system SHALL show an unselected author chip with a dashed border and no fill or shadow, and the selected chip with a solid dark fill, white text and a solid border.

#### Scenario: Selected and unselected chips
- **WHEN** the sheet shows the chips and "Oma" is selected
- **THEN** "Oma" has a solid dark look and the other chips have dashed borders

### Requirement: On wide screens the filters are always visible
The system SHALL, on screens at least 48rem wide, show the search box, author chips and sort control inline under the introduction, above the result count, without a "Filter" button and without fixing them to the screen.

#### Scenario: Wide screen
- **WHEN** a family member opens the home page on a wide screen
- **THEN** search, chips and sort are visible in the page without opening anything
