# parsing-rules Specification

## Purpose
TBD - created by archiving change configure-parsing-rules. Update Purpose after archive.

## Requirements

### Requirement: Recognition words are stored rules
The system SHALL keep the words it recognises in recipe text as stored rules of five kinds: units, loose units (units that may be written without a number), duration words that multiply a number before them (each with its minutes per 1, "uur" = 60), fixed durations (a phrase and its number of minutes, "een kwartier" = 15), and words for degrees. While no rules have been saved, or the saved rules cannot be read, the system SHALL use exactly the words the cookbook recognised before rules were configurable, with the default loose units "snuf", "snufje", "scheut", "scheutje", "mespunt", "mespuntje", "handvol", "klont" and "klontje". Saved rules that lack loose units SHALL use the default loose units and keep their other saved words. Rules saved with separate minute words, hour words and spoken durations SHALL be read as duration words with 1 and 60 minutes per number and as fixed durations.

#### Scenario: Default rules
- **WHEN** no rules have been saved
- **THEN** the rules in use hold the units, duration words, fixed durations and degree words that were hard-coded before, so "30 minuten", "1,5 uur", "een kwartier", "180 graden" and "250 g bloem" are recognised as before

#### Scenario: Default loose units
- **WHEN** no rules have been saved
- **THEN** the rules in use hold the loose units "snuf", "snufje", "scheut", "scheutje", "mespunt", "mespuntje", "handvol", "klont" and "klontje"

#### Scenario: Degree words include the degree sign
- **WHEN** no rules have been saved
- **THEN** "180°", "180 °C" and "180 graden" are recognised as oven temperatures

#### Scenario: Grams are not degrees
- **WHEN** no rules have been saved and a step's text contains "180 gr"
- **THEN** the step gets no oven temperature

#### Scenario: Unreadable saved rules
- **WHEN** the saved rules are not valid JSON or do not have the shape of the rules (including an empty word list)
- **THEN** the default rules are used and the pages still work

#### Scenario: Saved rules without loose units
- **WHEN** the saved rules hold the units "g" and "kopje" and no loose units
- **THEN** the rules in use hold the units "g" and "kopje" and the default loose units

#### Scenario: Rules saved before duration rows
- **WHEN** the saved rules hold the minute words "minuten", the hour words "uur" and the spoken duration "een kwartier" with 15
- **THEN** the rules in use hold "minuten" with 1 minute per number, "uur" with 60 minutes per number and the fixed duration "een kwartier" with 15 minutes

### Requirement: Admins see the rules menu link
The system SHALL show a link "Herkenning" in the sidebar menu to a signed-in member whose role is `admin` or `superadmin`, going to the rules page, and SHALL NOT show it to a member whose role is `user`.

#### Scenario: Admin sees the link
- **WHEN** an admin opens the menu
- **THEN** it lists "Herkenning" after "Nieuw recept", "Instellingen" and "Over"

#### Scenario: Superadmin sees the link
- **WHEN** a superadmin opens the menu
- **THEN** it lists "Herkenning"

#### Scenario: User does not see the link
- **WHEN** a user opens the menu
- **THEN** it does not list "Herkenning"

### Requirement: Only admins reach the rules
The system SHALL refuse every request for the rules page, and every request that changes rules, with HTTP 403 when the member's role is not `admin` or `superadmin`, whatever the page showed or hid, and SHALL change nothing for a refused request.

#### Scenario: User opens the page
- **WHEN** a user requests the rules page by address
- **THEN** the response is 403 and no rules are shown

#### Scenario: User posts a change
- **WHEN** a user sends a rules change directly to the server
- **THEN** the response is 403 and the stored rules are unchanged

#### Scenario: Non-admin cannot restore defaults
- **WHEN** a user sends the restore-defaults request directly to the server
- **THEN** the response is 403 and the stored rules are unchanged

#### Scenario: Superadmin opens the page
- **WHEN** a superadmin opens the rules page
- **THEN** the page shows the stored rules, one row per word, in the categories Eenheden, Duur, Graden and Basisproducten

#### Scenario: Admin opens the page
- **WHEN** an admin opens the rules page
- **THEN** the page shows the stored rules, one row per word, in the categories Eenheden, Duur, Graden and Basisproducten

### Requirement: An admin changes the rules as rows of words
The system SHALL let an admin edit the units, loose units and degree words as rows with one word each, and the durations as rows with a word, a whole number of minutes and a checkbox "Vast", and save all rows at once. A row with "Vast" checked is a fixed duration; an unchecked row multiplies the number before the word. Words SHALL be matched literally, never as regular expressions, ignoring letter case. The system SHALL refuse the whole save, store nothing and say on the faulty row what is wrong when a duration has no whole number of minutes from 1 to 1440, a duration has minutes but no word, a word is in two of the lists units, duration words (checked or not) and degree words (a loose unit may also be a unit), a word is twice in the durations, a word has characters other than letters, `°` and spaces, or a unit or loose unit has anything but letters (these are matched as one word). It SHALL refuse a save with no units, no degree words or no unchecked duration, and say so at the list. Empty rows and repeated words in the other lists are dropped.

#### Scenario: Add a unit
- **WHEN** an admin types "kopje" in the empty row of the units and saves
- **THEN** the units include "kopje" and the page shows the saved rules

#### Scenario: Add a loose unit
- **WHEN** an admin types "druppel" in the empty row of the loose units and saves
- **THEN** the loose units include "druppel" and the page shows the saved rules

#### Scenario: Remove a word
- **WHEN** an admin removes the row "min" from the durations and saves
- **THEN** "min" is no longer stored as a duration word

#### Scenario: Spoken duration
- **WHEN** an admin adds the duration row "drie kwartier" with 45 minutes and "Vast" checked, and saves
- **THEN** the fixed durations include "drie kwartier" with 45 minutes

#### Scenario: Duration per number
- **WHEN** an admin adds the duration row "halfuur" with 30 minutes and "Vast" unchecked, and saves
- **THEN** the duration words include "halfuur" with 30 minutes per number

#### Scenario: Spoken duration without minutes
- **WHEN** an admin saves a duration row "een tijdje" with no minutes or with 0 minutes
- **THEN** the page stays, says on that row that it needs a whole number of minutes from 1 to 1440, and no rules change

#### Scenario: Duration without word
- **WHEN** an admin saves a duration row with 15 minutes and no word
- **THEN** the page stays, says on that row that it needs a word, and no rules change

#### Scenario: Empty list
- **WHEN** an admin saves with no units left
- **THEN** the page stays, says the units cannot be empty, and no rules change

#### Scenario: No duration per number
- **WHEN** an admin saves with every duration row set to "Vast"
- **THEN** the page stays, says there must be a duration without "Vast", and no rules change

#### Scenario: No loose units
- **WHEN** an admin saves with no loose units
- **THEN** the save succeeds and no word is a loose unit

#### Scenario: Word in two lists
- **WHEN** an admin puts "u" in both the durations and the degree words
- **THEN** the page stays, says on the second row that the word is in two lists, and no rules change

#### Scenario: Word twice in the durations
- **WHEN** an admin saves the word "uur" on two duration rows
- **THEN** the page stays, says on the second row that the word is already in the durations, and no rules change

#### Scenario: Loose unit that is also a unit
- **WHEN** an admin saves "snufje" in both the units and the loose units
- **THEN** the save succeeds and both lists keep the word

#### Scenario: Saving the unchanged defaults succeeds
- **WHEN** an admin opens the page and saves without changing anything
- **THEN** the save succeeds and the same rules are stored

#### Scenario: Word with other characters
- **WHEN** an admin types "a+" in the degree words and saves
- **THEN** the page stays, says on that row that the word may only hold letters, ° and spaces, and no rules change

#### Scenario: Loose unit with other characters
- **WHEN** an admin types "een druppel" in the loose units and saves
- **THEN** the page stays, says on that row that the word may only hold letters, and no rules change

#### Scenario: Refused save keeps the rows
- **WHEN** a save is refused
- **THEN** the page shows every row as the admin sent it, with the message on the faulty rows

#### Scenario: Words are not regular expressions
- **WHEN** the stored duration words hold the word "m+" (for example written by hand)
- **THEN** it matches only the literal text "m+", so "20 m+" gives a timer of 20 minutes and "20 mmm" gives none

### Requirement: An admin restores the default rules
The system SHALL let an admin restore the default rules with one link-style button "Standaardwaarden herstellen" on the rules page, after the admin confirms, which removes the saved rules and the saved staples.

#### Scenario: Restore defaults
- **WHEN** an admin has saved a unit "kopje" and presses "Standaardwaarden herstellen"
- **THEN** the rules in use are the defaults and "kopje" is no longer a unit

#### Scenario: Restore also restores the staples
- **WHEN** an admin has saved a staple "meel" and presses "Standaardwaarden herstellen"
- **THEN** the default staples are in use and "meel" is no longer a staple

#### Scenario: Restore is confirmed first
- **WHEN** an admin presses "Standaardwaarden herstellen" and declines the confirmation
- **THEN** nothing is sent and the stored rules and staples are unchanged

### Requirement: Recognition follows the stored rules on save
The system SHALL use the stored rules, not fixed lists, when it splits an ingredient line into amount, unit and name, when it finds a timer or an oven temperature in a step, and when it finds the amounts in a step to store them on save, and SHALL pick up a saved change without the member reloading the page. A duration word SHALL give its number times its minutes per number. A unit saved after a step was saved SHALL apply to that step only once the step is saved again.

#### Scenario: New unit is recognised
- **WHEN** "kopje" is a stored unit and a member types the ingredient "2 kopje rijst"
- **THEN** its unit is "kopje" and its name is "rijst"

#### Scenario: New minute word makes a timer
- **WHEN** "mins" is a stored duration word with 1 minute per number and a step's text contains "20 mins"
- **THEN** the step gets a timer of 20 minutes tied to those words

#### Scenario: Duration word with its own factor
- **WHEN** "dag" is a stored duration word with 1440 minutes per number and a step's text contains "1,5 dag"
- **THEN** the step gets a timer of 2160 minutes

#### Scenario: New spoken duration makes a timer
- **WHEN** "drie kwartier" is a stored fixed duration with 45 minutes and a step's text contains "drie kwartier"
- **THEN** the step gets a timer of 45 minutes

#### Scenario: Removed word is not recognised
- **WHEN** "graden" is not a stored degree word and a step's text contains "180 graden"
- **THEN** the step gets no oven temperature

#### Scenario: Saving uses the stored units
- **WHEN** "kopje" is a stored unit and a step "doe 2 kopje rijst erbij" is saved
- **THEN** the amount 2 with unit "kopje" is stored for the step

#### Scenario: Saved change applies at once
- **WHEN** an admin saves a new unit and then opens the recipe form
- **THEN** the form already recognises that unit

### Requirement: Rules are edited like the ingredient list
The system SHALL show every list of the rules page as rows with one field each, and an empty row at the end. Typing in the empty row SHALL add a new empty row after it. In a field, `Enter` and `↓` SHALL move to the next row and `↑` to the previous one, `Alt+↑` and `Alt+↓` SHALL move the row up or down, and `Backspace` in an empty field SHALL remove the row. A row SHALL be draggable by its grip and removable with a cross right of its field.

#### Scenario: Empty row at the end
- **WHEN** an admin opens the rules page
- **THEN** every list ends with one empty row

#### Scenario: Typing adds a row
- **WHEN** an admin types in the empty row of a list
- **THEN** that row becomes a word and a new empty row follows

#### Scenario: Move between rows
- **WHEN** an admin presses `Enter` or `↓` in a field, and `↑` in the next one
- **THEN** focus goes to the next row and back to the first

#### Scenario: Move a row by keyboard
- **WHEN** an admin presses `Alt+↑` in the second row of a list
- **THEN** that row is the first and the field keeps focus and its caret

#### Scenario: Remove an empty row by keyboard
- **WHEN** an admin presses `Backspace` in an empty field that is not the last row
- **THEN** the row is removed and focus goes to the row above

#### Scenario: Remove a row with the cross
- **WHEN** an admin presses the cross of a row
- **THEN** the row is removed

#### Scenario: Reorder by dragging
- **WHEN** an admin drags a row by its grip to another place
- **THEN** the row is at that place

### Requirement: Loose units are suggested from the units
The system SHALL suggest words to type in the loose units: the words in the units list on the page, as it is edited, that are not yet a loose unit. The admin SHALL stay free to type any other word. While the suggestions are shown, `↓` and `↑` SHALL pick one, `Enter` SHALL take it and `Esc` SHALL close the list.

#### Scenario: Units are suggested
- **WHEN** an admin focuses the empty row of the loose units
- **THEN** the units that are not yet loose units are suggested

#### Scenario: Suggestions follow the typing
- **WHEN** an admin types "bl" in a loose unit row
- **THEN** only the suggestions that contain "bl" are shown

#### Scenario: Suggestions follow the units list
- **WHEN** an admin adds the unit "druppel" to the units without saving
- **THEN** "druppel" is suggested for the loose units

#### Scenario: Loose unit already filled in
- **WHEN** "snuf" is a loose unit
- **THEN** "snuf" is not suggested

#### Scenario: Take a suggestion
- **WHEN** an admin picks a suggestion with `↓` and presses `Enter`
- **THEN** the row holds that word and no row has moved

#### Scenario: Another word is allowed
- **WHEN** an admin types a word that is not suggested and saves
- **THEN** the word is stored as a loose unit

### Requirement: The rules page saves from a bar
The system SHALL show on the rules page, fixed to the bottom of the screen, the button "Opslaan" on the right and "Standaardwaarden herstellen" as a link-style button on the left.

#### Scenario: Save bar
- **WHEN** an admin opens the rules page
- **THEN** the bar with "Standaardwaarden herstellen" on the left and "Opslaan" on the right is fixed to the bottom of the screen
