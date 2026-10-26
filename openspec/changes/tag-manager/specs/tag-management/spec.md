## ADDED Requirements

### Requirement: The tag manager is open to every family member
The system SHALL serve a page "Tags" at `/tags` with the site header, for every family member whatever their role. It SHALL be the only place where tags are renamed, merged, deleted or given a category.

#### Scenario: A member opens the page
- **WHEN** a family member with the role `user` opens the tag manager
- **THEN** the page "Tags" is shown with the list of tags

### Requirement: The list shows every tag with its category and use
The system SHALL list every stored tag as a row with the tag as a pill (the same pill as on the recipe card), its category as a yellow pill of the same shape, and the number of recipes that have the tag. A tag without a category SHALL show no category pill, and a tag on no recipe SHALL show 0 in a warning colour. Above the list SHALL be a line with the number of tags shown and the total ("12 van 15 tags"). Without any tag the list SHALL say there are none yet.

#### Scenario: Row shows tag, category and count
- **WHEN** the tag "Soep" with the category "Gerecht" is on 7 recipes
- **THEN** its row shows the pill "Soep", the category pill "Gerecht" and the count 7

#### Scenario: Tag without a category
- **WHEN** a tag has no category and the list is sorted by name
- **THEN** its row shows no category pill

#### Scenario: Unused tag
- **WHEN** a tag is on no recipe
- **THEN** its row shows the count 0 in the warning colour

#### Scenario: Count line
- **WHEN** 15 tags are stored and a filter leaves 12
- **THEN** the page says "12 van 15 tags"

#### Scenario: No tags yet
- **WHEN** no tag is stored
- **THEN** the page says there are no tags yet and that they are made in the recipe editor

### Requirement: The list is ordered by name or by category
The system SHALL offer a switch "Volgorde" with "Naam" and "Categorie", looking like the sort on the home page, with "Naam" selected at first. By name the rows SHALL be alphabetical (letter case and accents ignored), each with its category pill. By category the rows SHALL be grouped under a heading that shows the category as a yellow pill and the number of tags in the group; the groups SHALL be alphabetical by category, the tags without a category SHALL form the last group under a dashed pill "Zonder categorie", and the tags inside each group SHALL be alphabetical. In this order the rows SHALL NOT repeat the category pill.

#### Scenario: Sorted by name
- **WHEN** the tags "winter", "Soep" and "Bakken" are listed by name
- **THEN** the rows are "Bakken", "Soep", "winter"

#### Scenario: Sorted by category
- **WHEN** "Soep" and "Bakken" have the category "Gerecht", "Winter" has the category "Seizoen" and "Snel" has none, and the list is sorted by category
- **THEN** the groups are "Gerecht" ("Bakken", "Soep"), "Seizoen" ("Winter") and "Zonder categorie" ("Snel"), in that order

#### Scenario: Group heading shows the count
- **WHEN** the list is sorted by category and the category "Gerecht" has 2 tags
- **THEN** the heading of that group shows the pill "Gerecht" and 2

#### Scenario: Category order has no category pill on rows
- **WHEN** the list is sorted by category
- **THEN** the rows show no category pill

#### Scenario: Switch looks like the home page sort
- **WHEN** the switch is shown
- **THEN** its options are joined buttons with a black border and the selected one has a red background, like the sort on the home page

### Requirement: The list can be filtered
The system SHALL filter the list on a name search (letter case ignored, matching any part of the name), on a chip "Ongebruikt" (only tags on no recipe) and on a chip "Zonder categorie" (only tags without a category). The chips SHALL toggle and show whether they are on, and all filters SHALL combine. When nothing matches the list SHALL say "Geen tags gevonden" with a button that clears the filters.

#### Scenario: Name filter
- **WHEN** a family member types "soep" and the tags "Soep", "Soepen" and "Winter" exist
- **THEN** only "Soep" and "Soepen" are listed

#### Scenario: Unused filter
- **WHEN** a family member switches on "Ongebruikt"
- **THEN** only tags on no recipe are listed

#### Scenario: Without category filter
- **WHEN** a family member switches on "Zonder categorie"
- **THEN** only tags without a category are listed

#### Scenario: Filters combine
- **WHEN** a family member types "kerst" and switches on "Ongebruikt"
- **THEN** only unused tags containing "kerst" are listed

#### Scenario: Nothing matches
- **WHEN** no tag matches the filters
- **THEN** the page says "Geen tags gevonden" and a button clears the filters

### Requirement: A tag can be added
The system SHALL let a family member add a tag by typing its name in the field "Nieuwe tag" and pressing "Toevoegen". The name SHALL be trimmed and inner runs of spaces collapsed. A name that is empty after trimming, longer than 100 characters, or that a stored tag already has in any letter case SHALL be refused with a message at the field, and no tag SHALL be added. A new tag SHALL have no category and 0 recipes.

#### Scenario: A tag is added
- **WHEN** a family member adds "Kerst"
- **THEN** the tag is stored without a category and shows in the list with 0 recipes

#### Scenario: A taken name is refused
- **WHEN** a family member adds "soep" and the tag "Soep" exists
- **THEN** a message says the tag exists and nothing is added

#### Scenario: An empty name is refused
- **WHEN** a family member adds a name of only spaces
- **THEN** nothing is added

#### Scenario: A too long name is refused
- **WHEN** a family member adds a name of 101 characters
- **THEN** a message says the name is too long and nothing is added

### Requirement: A tag opens in a form
The system SHALL open a form for a tag when its row is activated: a bottom sheet over the page below 48rem, and a panel unfolding under the row from 48rem. The form SHALL have the name, the category and an actions part, and no close button. Only one form SHALL be open at a time. The form SHALL close when the row is activated again, on Escape, and below 48rem also on a click outside the sheet. Opening a form SHALL leave the rest of the list as it is.

#### Scenario: Row opens the form
- **WHEN** a family member activates the row of "Soep" with the category "Gerecht"
- **THEN** a form opens with the name "Soep" and the category "Gerecht"

#### Scenario: Row closes the form
- **WHEN** the form of a tag is open and its row is activated
- **THEN** the form is closed

#### Scenario: Escape closes the form
- **WHEN** a form is open and a family member presses Escape
- **THEN** the form is closed and the focus is back on its row

#### Scenario: Outside click closes the sheet
- **WHEN** the sheet is open on a phone and a family member taps outside it
- **THEN** the sheet is closed

#### Scenario: One form at a time
- **WHEN** a form is open and another row is activated
- **THEN** only the form of the other row is open

#### Scenario: Sheet on a phone, panel on a wide screen
- **WHEN** a form opens below 48rem, and then from 48rem
- **THEN** it is a sheet at the bottom of the screen, and then a panel under its row

### Requirement: Name and category are saved together
The system SHALL save the name and the category of a tag with one button "Opslaan". The new name SHALL be trimmed and inner runs of spaces collapsed; it SHALL be refused when empty or over 100 characters. A name that another tag already has, in any letter case, SHALL refuse the whole save (the category is not saved either), show a message at the name that this tag exists, and offer to merge into that tag; changing only the letter case of the tag's own name SHALL be allowed. The category SHALL be chosen from the stored categories with suggestions that contain the typed text (letter case and accents ignored); text that matches a stored category in any letter case SHALL use its stored spelling, any other text up to 100 characters SHALL create a category, and an empty category SHALL remove the tag's category. A saved form SHALL close with a short confirmation.

#### Scenario: Name and category in one save
- **WHEN** a family member changes the name of "Soepen" to "Bouillon", sets the category "Gerecht" and presses "Opslaan"
- **THEN** the tag is called "Bouillon", has the category "Gerecht" and the form is closed with a confirmation

#### Scenario: Own name in another letter case
- **WHEN** a family member changes "soep" to "Soep" and presses "Opslaan"
- **THEN** the tag is called "Soep"

#### Scenario: A taken name refuses the whole save
- **WHEN** a family member changes "Soepen" to "soep", sets the category "Gerecht" and presses "Opslaan", and the tag "Soep" exists
- **THEN** a message at the name says "Soep" exists, "Soepen" keeps its name and category, and a button offers to merge with "Soep"

#### Scenario: Merge offered for a taken name
- **WHEN** the save was refused because the name is taken and the family member activates the offer
- **THEN** the actions part shows the merge with "Soep" already chosen and the typed name and category stay in the fields

#### Scenario: Empty or too long name
- **WHEN** a family member empties the name, or types 101 characters, and presses "Opslaan"
- **THEN** a message at the name says so and nothing is saved

#### Scenario: Category suggestions
- **WHEN** a family member types "ge" in the category and the categories "Gerecht" and "Seizoen" exist
- **THEN** "Gerecht" is suggested and "Seizoen" is not

#### Scenario: A new category is created
- **WHEN** a family member types the category "Gelegenheid", which does not exist, and saves
- **THEN** the category is created and the tag has it

#### Scenario: Stored spelling is used for a category
- **WHEN** a family member types the category "gerecht" and the category "Gerecht" exists, and saves
- **THEN** the tag has the category "Gerecht" and no second category is stored

#### Scenario: Empty category removes it
- **WHEN** a family member empties the category of a tag that has one and saves
- **THEN** the tag has no category

#### Scenario: Unused category disappears
- **WHEN** the only tag with the category "Seizoen" is saved with another category
- **THEN** "Seizoen" is no longer suggested or listed as a group

### Requirement: Merging replaces only the actions part
The system SHALL show in the form the actions "Opslaan", "Samenvoegen met…" and "Verwijderen". Activating "Samenvoegen met…" SHALL replace only the actions part with a picker of the other tags (suggesting names that contain the typed text, letter case and accents ignored), a preview, "Samenvoegen" and "Annuleer"; the name and category fields above it SHALL keep what was typed. "Samenvoegen" SHALL stay disabled until a stored tag other than this one is chosen. The preview SHALL say how many recipes with this tag get the chosen tag, that recipes that already have the chosen tag keep it once, and that this tag disappears, showing both tags as pills. Merging SHALL give every recipe with this tag the chosen tag (once), delete this tag, keep the chosen tag's name and category, and close the form with a confirmation. "Annuleer" SHALL bring the actions back unchanged.

#### Scenario: Actions of the form
- **WHEN** a form is open
- **THEN** its actions are "Opslaan", "Samenvoegen met…" and "Verwijderen"

#### Scenario: Merge replaces only the actions
- **WHEN** a family member types a new name, then activates "Samenvoegen met…"
- **THEN** the picker and preview replace the three actions, and the name field still has the typed name

#### Scenario: Merge needs a chosen tag
- **WHEN** the merge picker is shown and no tag is chosen
- **THEN** "Samenvoegen" is disabled

#### Scenario: Own tag is not offered
- **WHEN** a family member types the name of the tag being merged in the picker
- **THEN** that tag is not suggested and "Samenvoegen" stays disabled

#### Scenario: Merge preview
- **WHEN** "Soepen" is on 3 recipes and the tag "Soep" is chosen
- **THEN** the preview says 3 recipes get "Soep", that recipes that have both keep it once, and that "Soepen" disappears

#### Scenario: Merge moves the recipes
- **WHEN** "Soepen" (recipes A and B) is merged into "Soep" (recipes B and C)
- **THEN** A, B and C each have "Soep" once and "Soepen" is gone

#### Scenario: Merge keeps the chosen tag as it is
- **WHEN** "Soepen" with the category "Seizoen" is merged into "Soep" with the category "Gerecht"
- **THEN** "Soep" still has the category "Gerecht"

#### Scenario: Merge is cancelled
- **WHEN** a family member activates "Annuleer" in the merge part
- **THEN** the three actions are back and nothing is changed

### Requirement: Deleting asks for confirmation
The system SHALL replace only the actions part with a confirmation when "Verwijderen" is activated, saying on how many recipes the tag is ("staat op 3 recepten") and that the recipes stay, or that it is on no recipe. "Verwijder tag" SHALL delete the tag and its links to recipes, never the recipes, and close the form with a confirmation; "Annuleer" SHALL bring the actions back unchanged.

#### Scenario: Confirmation names the recipes
- **WHEN** a family member activates "Verwijderen" for a tag on 3 recipes
- **THEN** the actions part says the tag is on 3 recipes and that they stay, with "Verwijder tag" and "Annuleer"

#### Scenario: Confirmation for an unused tag
- **WHEN** a family member activates "Verwijderen" for a tag on no recipe
- **THEN** the actions part says the tag is on no recipe

#### Scenario: Tag is deleted
- **WHEN** a family member confirms the deletion of a tag on 3 recipes
- **THEN** the tag is gone, the 3 recipes still exist without it, and it is no longer suggested in the editor

#### Scenario: Delete is cancelled
- **WHEN** a family member activates "Annuleer" in the confirmation
- **THEN** the three actions are back and the tag is still stored

### Requirement: A category can be set on many tags at once
The system SHALL offer a toggle "Selecteer". In select mode every row SHALL show a checkbox and activating a row SHALL toggle it instead of opening a form; a bar at the bottom SHALL show how many tags are selected, "Alles selecteren" (every tag the filters leave, not only the ones in view), "Niets", a field for a category with the same suggestions as in the form, and "Instellen", which is disabled while nothing is selected. "Instellen" SHALL give every selected tag that category (stored spelling reused, a new one created, empty removes it), clear the selection and say how many tags changed. Leaving select mode SHALL clear the selection, and an open form SHALL be closed when select mode starts.

#### Scenario: Select mode shows checkboxes
- **WHEN** a family member switches on "Selecteer"
- **THEN** every row shows a checkbox and the bottom bar says 0 selected

#### Scenario: Row toggles in select mode
- **WHEN** select mode is on and a family member activates a row
- **THEN** the tag is selected and no form opens

#### Scenario: Select all follows the filters
- **WHEN** a family member filters on "Zonder categorie" and activates "Alles selecteren"
- **THEN** exactly the listed tags are selected

#### Scenario: Setting a category on the selection
- **WHEN** 2 tags are selected and a family member sets the category "Gerecht" with "Instellen"
- **THEN** both tags have the category "Gerecht", the selection is empty and the page says 2 tags changed

#### Scenario: Setting needs a selection
- **WHEN** no tag is selected
- **THEN** "Instellen" is disabled

#### Scenario: Empty category on the selection
- **WHEN** 2 tags with a category are selected and "Instellen" is used with an empty category
- **THEN** both tags have no category

#### Scenario: Leaving select mode clears the selection
- **WHEN** tags are selected and a family member switches "Selecteer" off
- **THEN** no tag is selected and no checkboxes are shown

### Requirement: Tags and categories are drawn as pills
The system SHALL draw a tag as the pill of the recipe card (cream fill, ink border) and a category as a pill of the same shape with a yellow fill, so the two are told apart by colour. The recipe card SHALL use the same pill component.

#### Scenario: Category pill is yellow
- **WHEN** a category pill is shown
- **THEN** it has the same shape as a tag pill and a yellow background

#### Scenario: Recipe card uses the shared pill
- **WHEN** a recipe card shows its tags
- **THEN** each is drawn with the same pill as the tag manager's tags
