## MODIFIED Requirements

### Requirement: Recipes can be filtered on author
The system SHALL show a "Van wie" field: a multi-select with autocomplete over the authors (each author once, case variants counted as one). Typing narrows the suggestions to the authors that contain the typed text, ignoring case and accents; a picked author is not suggested again and shows as a chip with a button to remove it. With no author picked, which is the default, recipes by everyone are shown; with one or more picked, a recipe is shown when its author is any of them. The field SHALL appear only when at least 4 recipes are stored.

#### Scenario: Choosing an author
- **WHEN** a family member picks "Papa" and Papa has two of five stored recipes
- **THEN** only those two recipes are shown

#### Scenario: Choosing several authors
- **WHEN** a family member picks "Papa" and "Oma", Papa has two and Oma one of five stored recipes
- **THEN** those three recipes are shown

#### Scenario: No author picked
- **WHEN** no author is picked
- **THEN** recipes by everyone are shown

#### Scenario: Finding an author by typing
- **WHEN** a family member types "pa" in the field and the authors are "Mama", "Oma" and "Papa"
- **THEN** "Papa" is suggested and "Oma" is not

#### Scenario: Picked author is not suggested again
- **WHEN** "Papa" is picked and the family member types "pa"
- **THEN** "Papa" is not suggested

#### Scenario: Removing a picked author
- **WHEN** a family member presses the remove button on the chip "Papa"
- **THEN** "Papa" is no longer picked and the recipes of the remaining picks, or of everyone, are shown

#### Scenario: Search and author combine
- **WHEN** an author is picked and text is typed in the search box
- **THEN** only recipes that match both are shown

#### Scenario: Few recipes
- **WHEN** fewer than 4 recipes are stored
- **THEN** no author field and no sort control are shown, but the search box is

### Requirement: No match offers a way out
The system SHALL, when the active filters match no recipe, say that nothing was found for them and offer a "Wis filters" button that clears search and authors and restores the default order. The search box stays in place.

#### Scenario: Nothing found
- **WHEN** a family member searches for text that matches no recipe
- **THEN** the page says nothing was found and shows a "Wis filters" button, and the search box keeps what was typed

#### Scenario: Clearing all filters
- **WHEN** a family member presses "Wis filters"
- **THEN** search is empty, no author is picked, "Nieuwste" is selected and all recipes are shown

### Requirement: Filters are kept in the address
The system SHALL keep the search text, authors and order in the page address (`q`, `auteur` once per picked author, and `sort`), omitting values that are the default, so a reload or a shared link shows the same list. Changing a filter SHALL replace the current history entry instead of adding one.

#### Scenario: Opening a filtered address
- **WHEN** a family member opens the home page with `?q=appel`
- **THEN** the search box holds "appel" and only matching recipes are shown

#### Scenario: Opening an address with authors
- **WHEN** a family member opens the home page with `?auteur=Oma&auteur=Papa`
- **THEN** "Oma" and "Papa" are picked and only their recipes are shown

#### Scenario: Filtering does not fill the history
- **WHEN** a family member types a search and then presses the browser's back button
- **THEN** they leave the home page instead of stepping through earlier searches

### Requirement: Detailed filters open in a sheet above the bar
The system SHALL, on screens narrower than 48rem, show a "Filter" button next to the search box that opens and closes a sheet above it with the "Van wie" field, the sort control and a "Wis filters" button. Pressing Escape closes the sheet, except that when the suggestions of a field are open, the first Escape closes only those. The button shows the number of active filters: authors (one, however many are picked) and order, each counted when not the default.

#### Scenario: Opening the sheet
- **WHEN** a family member presses "Filter"
- **THEN** the sheet with the field, sort and "Wis filters" appears above the search box, the search box stays where it was, and the button shows it is expanded

#### Scenario: Closing the sheet
- **WHEN** the sheet is open and a family member presses "Filter" again or presses Escape
- **THEN** the sheet closes

#### Scenario: Escape closes the suggestions first
- **WHEN** the sheet is open, the suggestions of a field are open and a family member presses Escape twice
- **THEN** the first press closes the suggestions and the sheet stays open, the second closes the sheet

#### Scenario: Active filter count
- **WHEN** two authors are picked and the order is "A–Z"
- **THEN** the "Filter" button shows the number 2

### Requirement: On wide screens the filters are always visible
The system SHALL, on screens at least 48rem wide, show the search box, the "Van wie" field and the sort control inline under the introduction, above the result count, without a "Filter" button and without fixing them to the screen.

#### Scenario: Wide screen
- **WHEN** a family member opens the home page on a wide screen
- **THEN** search, field and sort are visible in the page without opening anything

## REMOVED Requirements

### Requirement: Chips show their state by line style
**Reason**: There are no author chips to choose from any more; authors are picked in a multi-select field.
**Migration**: None. The look of the sort control is unchanged.
