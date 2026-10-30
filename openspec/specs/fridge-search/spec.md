# fridge-search Specification

## Purpose
TBD - created by archiving change add-fridge-search. Update Purpose after archive.

## Requirements

### Requirement: The fridge page lists recipes by what is in the house
The system SHALL serve a page at `/koelkast` with the site header, for every family member whatever their role, with the heading "Wat zit er in de koelkast?" and a line of introduction. Below them SHALL come the "Heb ik" and "Liever niet" lists (see below), the order control, a count line and every stored recipe that the lists leave as a card. With no entry in either list every stored recipe is shown, newest first. When no recipe is stored the page SHALL say so and link to the new recipe form, like the home page, and show no lists.

#### Scenario: Opening the page
- **WHEN** a family member opens `/koelkast` and recipes are stored
- **THEN** the heading "Wat zit er in de koelkast?", the lists "Heb ik" and "Liever niet" and a card per recipe, newest first, are shown

#### Scenario: No recipes stored
- **WHEN** a family member opens `/koelkast` and no recipe is stored
- **THEN** the page says there are no recipes yet and links to the new recipe form, and shows no lists

### Requirement: Ingredients are added to the lists with an input
The system SHALL show for each of "Heb ik" and "Liever niet" a label, an input with a button on its right (a blue "+" for "Heb ik", a "−" for "Liever niet") and under them the entries as removable chips. Pressing Enter in the input or pressing its button SHALL add the typed text, trimmed and with runs of spaces made one, as a chip, empty the input and keep the focus in it. Empty text SHALL add nothing. A word that is already in the list (letter case and accents ignored) SHALL not be added again. A word is in at most one list: adding it to one list SHALL remove it from the other. Pressing the cross of a chip SHALL remove the chip and move the focus to the input of its list. Adding or removing SHALL update the page without reloading it. The input SHALL keep its place when chips are added.

#### Scenario: Adding with Enter
- **WHEN** a family member types "kip" in the "Heb ik" input and presses Enter
- **THEN** the chip "kip" is under that input, the input is empty and has the focus

#### Scenario: Adding with the button
- **WHEN** a family member types "spruitjes" in the "Liever niet" input and presses its button
- **THEN** the chip "spruitjes" is in the "Liever niet" list, the input is empty and has the focus

#### Scenario: Adding several in a row
- **WHEN** a family member types "kip", presses Enter, types "rijst" and presses Enter
- **THEN** the chips "kip" and "rijst" are both in the list

#### Scenario: Empty text
- **WHEN** a family member presses Enter in an empty input
- **THEN** no chip is added

#### Scenario: The same word twice
- **WHEN** "Kip" is in "Heb ik" and a family member adds "kip" there
- **THEN** the list still has one chip

#### Scenario: A word moves to the other list
- **WHEN** "ui" is in "Heb ik" and a family member adds "ui" to "Liever niet"
- **THEN** "ui" is in "Liever niet" and no longer in "Heb ik"

#### Scenario: Removing a chip
- **WHEN** a family member presses the cross of the chip "kip"
- **THEN** "kip" is no longer in the list and the focus is in the input of that list

### Requirement: The lists are kept in the address
The system SHALL keep the "Heb ik" entries (`heb` once per entry), the "Liever niet" entries (`zonder` once per entry) and the order (`sort`, only for "A–Z") in the page address, so a reload or a shared link shows the same page. Changing a list SHALL replace the current history entry instead of adding one.

#### Scenario: Opening an address with lists
- **WHEN** a family member opens `/koelkast?heb=kip&heb=rijst&zonder=spruitjes`
- **THEN** "kip" and "rijst" are in "Heb ik", "spruitjes" is in "Liever niet", and the recipes are narrowed to them

#### Scenario: Changing a list does not fill the history
- **WHEN** a family member adds an entry and then presses the browser's back button
- **THEN** they leave the page instead of stepping through earlier lists

### Requirement: Ingredients are matched on whole words
The system SHALL say that an entry matches an ingredient of a recipe when all words of the entry appear, in the same order and next to each other, as whole words in the ingredient's name, ignoring letter case and accents. A word is a run of letters and digits. An entry never matches part of a word.

#### Scenario: A whole word matches
- **WHEN** the entry is "kip" and an ingredient is named "gekookte kip"
- **THEN** the entry matches that ingredient

#### Scenario: Part of a word does not match
- **WHEN** the entry is "kip" and an ingredient is named "kipfilet"
- **THEN** the entry does not match that ingredient

#### Scenario: Case and accents are ignored
- **WHEN** the entry is "creme fraiche" and an ingredient is named "Crème fraîche"
- **THEN** the entry matches that ingredient

#### Scenario: An entry of several words
- **WHEN** the entry is "rode ui" and one recipe has an ingredient "rode ui" and another has "ui" and "rode wijn"
- **THEN** the entry matches only the first recipe

### Requirement: The lists narrow and order the recipes
The system SHALL leave out every recipe that has an ingredient matching any "Liever niet" entry. When "Heb ik" has entries, it SHALL show only the recipes in which at least one entry matches an ingredient, and show the recipes in which more entries match before those in which fewer match. An entry counts once for a recipe however many ingredients it matches. Recipes with as many matches keep the chosen order: "Nieuwste" (most recently added first, the default) or "A–Z" (by title, ignoring case and accents). With no "Heb ik" entry the chosen order applies to the whole list.

#### Scenario: Recipes without a match are hidden
- **WHEN** "kip" is in "Heb ik" and one of three recipes has an ingredient "kip"
- **THEN** only that recipe is shown

#### Scenario: More matches first
- **WHEN** "rijst" and "melk" are in "Heb ik", recipe A uses only "rijst" and is newer than recipe B, which uses both
- **THEN** B is shown before A

#### Scenario: Same number of matches keep the chosen order
- **WHEN** "rijst" and "melk" are in "Heb ik" and two recipes use exactly one of them
- **THEN** they are shown newest first, or by title when "A–Z" is selected

#### Scenario: Liever niet removes recipes
- **WHEN** "spruitjes" is in "Liever niet" and one of three recipes has an ingredient "spruitjes"
- **THEN** the other two recipes are shown

#### Scenario: Liever niet beats Heb ik
- **WHEN** "kip" is in "Heb ik", "ui" is in "Liever niet" and a recipe has both "kip" and "ui"
- **THEN** that recipe is not shown

#### Scenario: An entry counts once
- **WHEN** "kip" is in "Heb ik" and a recipe has the ingredients "kip" and "gekookte kip"
- **THEN** that recipe counts one match

#### Scenario: Choosing the order
- **WHEN** a family member selects "A–Z"
- **THEN** the shown recipes are ordered by title, within groups of equal matches

### Requirement: The count line and the way out
The system SHALL show how many recipes are shown, as "N recepten" when both lists are empty and "N van M recepten" when they narrow the list, and SHALL announce a change of that count to screen readers. When no recipe is left, the page SHALL say that nothing was found and offer a "Wis alles" button that empties both lists and restores the default order.

#### Scenario: Count with a list
- **WHEN** 12 recipes are stored and the lists leave 3
- **THEN** the page says "3 van 12 recepten"

#### Scenario: Count without a list
- **WHEN** 12 recipes are stored and both lists are empty
- **THEN** the page says "12 recepten"

#### Scenario: Nothing found
- **WHEN** the lists leave no recipe
- **THEN** the page says nothing was found and shows a "Wis alles" button

#### Scenario: Clearing everything
- **WHEN** a family member presses "Wis alles"
- **THEN** both lists are empty, "Nieuwste" is selected and all recipes are shown

### Requirement: A card shows the recipe and what is in the house
The system SHALL show each recipe as the home page card (image with seal, tile band with the maple leaf, title, author, time and tags). Only this part opens the recipe. It SHALL be separated by a line from a plain part below it that does not open the recipe, so a missed press on a button in it cannot leave the page. When "Heb ik" has entries, the card SHALL also show, under the tags and still in the part that opens the recipe, "N/M in huis": N is the number of "Heb ik" entries that match an ingredient of this recipe, M the number of "Heb ik" entries. With no "Heb ik" entry the card shows neither the count nor the plain part.

#### Scenario: The card opens the recipe
- **WHEN** a family member presses the title of a card
- **THEN** the recipe page is shown

#### Scenario: Count of used entries
- **WHEN** "rijst", "melk", "ei" and "bloem" are in "Heb ik" and a recipe uses "melk", "ei" and "bloem"
- **THEN** its card says "3/4 in huis"

#### Scenario: No Heb ik entries
- **WHEN** "Heb ik" is empty
- **THEN** the cards show no count and no plain part

#### Scenario: Plain part is separate
- **WHEN** a card shows the plain part
- **THEN** a separator divides it from the part that opens the recipe and nothing in it is part of the link

### Requirement: A card lists the ingredients it still needs
The system SHALL show in the plain part of a card, under "Ontbreekt", each ingredient of the recipe that no "Heb ik" entry matches and that no staple matches, in recipe order, each with a "+" button ("Ik heb …") and a "−" button ("Liever geen …"). Pressing "+" SHALL add the ingredient's name to "Heb ik" and pressing "−" to "Liever niet", with the rules of the inputs. The buttons SHALL be quiet (outline, no fill) and at least 44px wide and 48px high, close together. When more than five ingredients are missing, the card SHALL show five and a button "+N meer" that shows the rest. When no ingredient is missing, the heading and list are not shown.

#### Scenario: Missing ingredients
- **WHEN** "rijst" is in "Heb ik" and a recipe has the ingredients "rijst", "melk" and "kaneel"
- **THEN** its card lists "melk" and "kaneel" under "Ontbreekt" and not "rijst"

#### Scenario: Staples are not missing
- **WHEN** "boter" is a staple and a recipe has the ingredients "rijst" and "boter" and "rijst" is in "Heb ik"
- **THEN** its card does not list "boter"

#### Scenario: Adding a missing ingredient to Heb ik
- **WHEN** a family member presses "+" on the ingredient "melk" of a card
- **THEN** "melk" is in "Heb ik" and no longer listed under "Ontbreekt"

#### Scenario: Excluding a missing ingredient
- **WHEN** a family member presses "−" on the ingredient "kaneel" of a card
- **THEN** "kaneel" is in "Liever niet" and the recipes with "kaneel" are no longer shown

#### Scenario: Many missing ingredients
- **WHEN** a recipe is missing seven ingredients
- **THEN** its card lists five and a button "+2 meer", and pressing it lists all seven

#### Scenario: Nothing missing
- **WHEN** every ingredient of a recipe is matched or a staple
- **THEN** its card shows no "Ontbreekt"

#### Scenario: Buttons do not open the recipe
- **WHEN** a family member presses "+" on a card
- **THEN** the page stays on `/koelkast`

### Requirement: A card names the entries the recipe does not use
The system SHALL show in the plain part of a card, under "Heb je, niet in dit recept", each "Heb ik" entry that matches no ingredient of the recipe, struck through, each followed for screen readers by the text "(niet in dit recept)". Without such an entry the heading is not shown.

#### Scenario: Unused entries are struck through
- **WHEN** "rijst", "melk" and "ei" are in "Heb ik" and a recipe uses "rijst" and "melk" only
- **THEN** its card shows "ei" struck through under "Heb je, niet in dit recept"

#### Scenario: Screen readers get the reason
- **WHEN** a card shows a struck-through entry
- **THEN** the entry is followed by the text "(niet in dit recept)" for screen readers

#### Scenario: All entries used
- **WHEN** every "Heb ik" entry matches an ingredient of a recipe
- **THEN** its card shows no "Heb je, niet in dit recept"

### Requirement: The lists are on top of the page
The system SHALL show the lists at the top of the page, below the introduction, where they scroll away with the page. Below 48rem "Heb ik" is stacked above "Liever niet"; from 48rem they sit side by side over the full width. The inputs and buttons are at least 48px high and their text at least 16px. Clickable items on the page SHALL show a light tint on hover and SHALL NOT raise.

#### Scenario: Scrolling on a phone
- **WHEN** a family member scrolls the page on a phone
- **THEN** the lists scroll out of view with the page

#### Scenario: Narrow screen
- **WHEN** the page is shown on a screen narrower than 48rem
- **THEN** "Heb ik" is above "Liever niet"

#### Scenario: Wide screen
- **WHEN** the page is shown on a screen at least 48rem wide
- **THEN** the two lists are side by side

#### Scenario: Hover tints, not raises
- **WHEN** a family member hovers over a card or a button on the page
- **THEN** it takes a light tint and does not move
