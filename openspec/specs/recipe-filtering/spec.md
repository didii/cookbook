# recipe-filtering Specification

## Purpose
Lets a family member find a specific recipe or look for inspiration on the home page, by searching, filtering on who made it, and choosing the order. Built for one-handed use on a phone.

## Requirements

### Requirement: Search narrows the recipes as you type
The system SHALL show a search box on the home page. It SHALL show only the recipes whose title, author or any tag contains the typed text, ignoring case and accents, updating on every keystroke without a submit step and without reloading the page.

#### Scenario: Searching by title
- **WHEN** a family member types "appel" and a recipe titled "Appeltaart" and another titled "Erwtensoep" are stored
- **THEN** only the "Appeltaart" card is shown

#### Scenario: Searching by author
- **WHEN** a family member types "oma" and a recipe by "Oma" and a recipe by "Papa" are stored
- **THEN** only the recipe by "Oma" is shown

#### Scenario: Searching by tag
- **WHEN** a family member types "soep" and a recipe tagged "Soep" and another tagged "Dessert" are stored
- **THEN** only the recipe tagged "Soep" is shown

#### Scenario: Clearing the search
- **WHEN** a family member clears the search box
- **THEN** all recipes that match the other active filters are shown again

### Requirement: Recipes can be filtered on author
The system SHALL show a "Van wie" field: a multi-select with autocomplete over the authors (each author once, case variants counted as one). Typing narrows the suggestions to the authors that contain the typed text, ignoring case and accents; a picked author is not suggested again and shows as a chip with a button to remove it. With no author picked, which is the default, recipes by everyone are shown; with one or more picked, a recipe is shown when its author is any of them. The field SHALL appear whenever at least one recipe is stored.

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

### Requirement: The search bar is within thumb reach on phones
The system SHALL, on screens narrower than 48rem, fix the search bar to the bottom edge of the screen, clear of the device's safe area and above the on-screen keyboard, and keep the last recipe card from hiding behind it. The bar stays visible while scrolling. The search box and buttons are at least 48px high and their text at least 16px.

#### Scenario: Scrolling on a phone
- **WHEN** a family member scrolls the home page on a phone
- **THEN** the search bar stays at the bottom of the screen

#### Scenario: Reaching the last recipe
- **WHEN** a family member scrolls to the end of the list on a phone
- **THEN** the last card can be scrolled fully clear of the bar

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

### Requirement: The sheet does not move the search box
The system SHALL keep the search box at the same position on screen whether the sheet is open or closed, and SHALL separate the sheet from the search box with a gray line, the same distance above the search box as the bar's top edge is when the sheet is closed. The sheet appears with a short rise animation (0.22 s), which reduced motion turns off.

#### Scenario: Search box stays put
- **WHEN** a family member opens the sheet
- **THEN** the search box has not moved and a gray line separates it from the sheet

#### Scenario: Reduced motion
- **WHEN** a person who prefers reduced motion opens the sheet
- **THEN** it appears without the rise animation

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

### Requirement: Recipes can be filtered on tags
The system SHALL show a "Tags" field next to "Van wie": a multi-select with autocomplete over the tags that at least one stored recipe has. Typing narrows the suggestions as in "Van wie", but text that matches no tag is not offered as a new one. Picked tags show as removable chips. With no tag picked, tags do not narrow the list; with one or more picked, a recipe is shown when it has any of them. The field SHALL appear whenever at least one stored recipe has a tag.

#### Scenario: Choosing a tag
- **WHEN** a family member picks "Soep" and two of five stored recipes have that tag
- **THEN** only those two recipes are shown

#### Scenario: Choosing several tags
- **WHEN** a family member picks "Soep" and "Vegetarisch", one recipe has both, another only "Soep", another only "Vegetarisch" and a fourth neither
- **THEN** the first three recipes are shown and the fourth is not

#### Scenario: Finding a tag by typing
- **WHEN** a family member types "soe" in the field and recipes have the tags "Soep" and "Dessert"
- **THEN** "Soep" is suggested and "Dessert" is not

#### Scenario: Unknown text is not offered
- **WHEN** a family member types text that matches no tag
- **THEN** no suggestion is shown and nothing can be added

#### Scenario: Removing a picked tag
- **WHEN** a family member presses the remove button on the chip "Soep"
- **THEN** "Soep" is no longer picked and the list is wider again

#### Scenario: Search and tags combine
- **WHEN** a tag is picked and text is typed in the search box
- **THEN** only recipes that match both are shown

#### Scenario: No tags stored
- **WHEN** recipes are stored and none has a tag
- **THEN** the "Tags" field is not shown

### Requirement: Recipes with more picked tags come first
The system SHALL, when tags are picked, show the recipes that have more of the picked tags before those that have fewer. Recipes with the same number of picked tags keep the chosen order ("Nieuwste" or "A–Z") within their group. With no tag picked the chosen order applies to the whole list.

#### Scenario: More matches first
- **WHEN** "Soep" and "Vegetarisch" are picked, recipe A has only "Soep" and is newer than recipe B, which has both
- **THEN** B is shown before A

#### Scenario: Same number of matches keep the chosen order
- **WHEN** "Soep" and "Vegetarisch" are picked and two recipes have exactly one of them
- **THEN** they are shown newest first, or by title when "A–Z" is selected

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
