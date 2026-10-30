# Spec Delta

## ADDED Requirements

### Requirement: Recipes can be filtered on favourites
The system SHALL show a toggle button named "Mijn favorieten", drawn as an icon only (the maple leaf of the recipe's like button) and announced as pressed or not pressed. While pressed, only the recipes the signed-in member liked are shown; while not pressed, which is the default, liking does not narrow the list. It combines with search, authors and tags. The button SHALL be shown whenever at least one recipe is stored.

#### Scenario: Showing only favourites
- **WHEN** a family member presses "Mijn favorieten" and has liked two of five stored recipes
- **THEN** only those two recipes are shown and the button is pressed

#### Scenario: Other members' likes do not count
- **WHEN** another member liked a recipe that the signed-in member did not and "Mijn favorieten" is pressed
- **THEN** that recipe is not shown

#### Scenario: Turning favourites off
- **WHEN** "Mijn favorieten" is pressed and a family member presses it again
- **THEN** the button is not pressed and recipes are shown regardless of likes

#### Scenario: Favourites and other filters combine
- **WHEN** "Mijn favorieten" is pressed and text is typed in the search box
- **THEN** only liked recipes that also match the text are shown

#### Scenario: No favourites yet
- **WHEN** "Mijn favorieten" is pressed and the member has liked no recipe
- **THEN** the page says nothing was found and offers "Wis filters"

## MODIFIED Requirements

### Requirement: No match offers a way out
The system SHALL, when the active filters match no recipe, say that nothing was found for them and offer a "Wis filters" button that clears search, authors, tags and favourites and restores the default order. The search box stays in place.

#### Scenario: Nothing found
- **WHEN** a family member searches for text that matches no recipe
- **THEN** the page says nothing was found and shows a "Wis filters" button, and the search box keeps what was typed

#### Scenario: Clearing all filters
- **WHEN** a family member presses "Wis filters"
- **THEN** search is empty, no author and no tag is picked, "Mijn favorieten" is not pressed, "Nieuwste" is selected and all recipes are shown

### Requirement: Filters are kept in the address
The system SHALL keep the search text, authors, tags, favourites and order in the page address (`q`, `auteur` once per picked author, `tag` once per picked tag, `favoriet=1` while favourites are on, and `sort`), omitting values that are the default, so a reload or a shared link shows the same list. Changing a filter SHALL replace the current history entry instead of adding one.

#### Scenario: Opening a filtered address
- **WHEN** a family member opens the home page with `?q=appel`
- **THEN** the search box holds "appel" and only matching recipes are shown

#### Scenario: Opening an address with authors
- **WHEN** a family member opens the home page with `?auteur=Oma&auteur=Papa`
- **THEN** "Oma" and "Papa" are picked and only their recipes are shown

#### Scenario: Opening an address with tags
- **WHEN** a family member opens the home page with `?tag=Soep&tag=Vegetarisch`
- **THEN** "Soep" and "Vegetarisch" are picked and only recipes with one of them are shown

#### Scenario: Opening an address with favourites
- **WHEN** a family member opens the home page with `?favoriet=1`
- **THEN** "Mijn favorieten" is pressed and only the member's liked recipes are shown

#### Scenario: Filtering does not fill the history
- **WHEN** a family member types a search and then presses the browser's back button
- **THEN** they leave the home page instead of stepping through earlier searches

### Requirement: Detailed filters open in a sheet above the bar
The system SHALL, on screens narrower than 48rem, show a "Filter" button next to the search box that opens and closes a sheet above it with the "Van wie" field, the "Tags" field, the sort control with the "Mijn favorieten" button at the right edge of its row, and a "Wis filters" button. Pressing Escape closes the sheet, except that when the suggestions of a field are open, the first Escape closes only those. The button shows the number of active filters: authors (one, however many are picked), tags (one, however many are picked), favourites and order, each counted when not the default.

#### Scenario: Opening the sheet
- **WHEN** a family member presses "Filter"
- **THEN** the sheet with the fields, sort, "Mijn favorieten" and "Wis filters" appears above the search box, the search box stays where it was, and the button shows it is expanded

#### Scenario: Closing the sheet
- **WHEN** the sheet is open and a family member presses "Filter" again or presses Escape
- **THEN** the sheet closes

#### Scenario: Escape closes the suggestions first
- **WHEN** the sheet is open, the suggestions of a field are open and a family member presses Escape twice
- **THEN** the first press closes the suggestions and the sheet stays open, the second closes the sheet

#### Scenario: Active filter count
- **WHEN** two authors and one tag are picked and the order is "A–Z"
- **THEN** the "Filter" button shows the number 3

#### Scenario: Favourites count as one filter
- **WHEN** "Mijn favorieten" is pressed and nothing else is active
- **THEN** the "Filter" button shows the number 1

### Requirement: On wide screens the filters are always visible
The system SHALL, on screens at least 48rem wide, show the filters inline under the introduction, above the result count, over the full width of the content, without a "Filter" button, without fixing them to the screen and without a background, border or shadow of their own. The search box takes the free width of the first row with the "Mijn favorieten" button right of it. Under it "Van wie" and "Tags" share the width and the sort control keeps its own width, on a row of its own below 64rem. A line and the "Wis filters" button, at the right, close the block.

#### Scenario: Wide screen
- **WHEN** a family member opens the home page on a wide screen
- **THEN** search, "Mijn favorieten", fields, sort and "Wis filters" are visible in the page without opening anything

#### Scenario: Full width
- **WHEN** a family member opens the home page on a wide screen
- **THEN** the search box and the fields below it fill the width of the content

#### Scenario: Narrower than 64rem
- **WHEN** the screen is at least 48rem and narrower than 64rem wide
- **THEN** the sort control sits on a row of its own under "Van wie" and "Tags"
