## ADDED Requirements

### Requirement: Recognition words are stored rules
The system SHALL keep the words it recognises in recipe text as stored rules of five kinds: units, words for minutes, words for hours, words for degrees, and spoken durations (a phrase and its number of minutes). While no rules have been saved, or the saved rules cannot be read, the system SHALL use exactly the words the cookbook recognised before rules were configurable.

#### Scenario: Default rules
- **WHEN** no rules have been saved
- **THEN** the rules in use hold the units, minute words, hour words, degree words and spoken durations that were hard-coded before, so "30 minuten", "1,5 uur", "een kwartier", "180 graden" and "250 g bloem" are recognised as before

#### Scenario: Degree words include the degree sign
- **WHEN** no rules have been saved
- **THEN** "180°", "180 °C" and "180 graden" are recognised as oven temperatures

#### Scenario: Unreadable saved rules
- **WHEN** the saved rules are not valid JSON or do not have the shape of the rules
- **THEN** the default rules are used and the pages still work

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
- **THEN** the page shows the stored rules, one word per line, per kind

#### Scenario: Admin opens the page
- **WHEN** an admin opens the rules page
- **THEN** the page shows the stored rules, one word per line, per kind

### Requirement: An admin changes the rules as plain words
The system SHALL let an admin edit each kind of rule as a list of words, one per line, with spoken durations written as `phrase = minutes`, and save all lists at once. Words SHALL be matched literally, never as regular expressions, ignoring letter case. The system SHALL refuse the whole save, store nothing and say what is wrong when a spoken duration has no whole number of minutes above 0, a list is empty, a word is in two of the minute, hour and degree lists, or a word has characters other than letters, `°` and spaces.

#### Scenario: Add a unit
- **WHEN** an admin adds the line "kopje" to the units and saves
- **THEN** the units include "kopje" and the page shows the saved rules

#### Scenario: Remove a word
- **WHEN** an admin removes "min" from the minute words and saves
- **THEN** "min" is no longer stored as a minute word

#### Scenario: Spoken duration
- **WHEN** an admin adds the line "drie kwartier = 45" and saves
- **THEN** the spoken durations include "drie kwartier" with 45 minutes

#### Scenario: Spoken duration without minutes
- **WHEN** an admin saves the line "een tijdje" or "een tijdje = 0" as a spoken duration
- **THEN** the page stays, says the line needs a whole number of minutes above 0, and no rules change

#### Scenario: Empty list
- **WHEN** an admin saves with no units left
- **THEN** the page stays, says the units cannot be empty, and no rules change

#### Scenario: Word in two lists
- **WHEN** an admin puts "u" in both the minute words and the hour words (units may share a word with another list)
- **THEN** the page stays, says the word is in two lists, and no rules change

#### Scenario: Saving the unchanged defaults succeeds
- **WHEN** an admin opens the page and saves without changing anything
- **THEN** the save succeeds, although "gr" is both a unit and a degree word

#### Scenario: Words are not regular expressions
- **WHEN** an admin adds the line "a+" to the units and saves
- **THEN** it is stored as the literal word "a+", and the text "2 aaa" does not match it

### Requirement: An admin restores the default rules
The system SHALL let an admin restore the default rules with one button on the rules page, which removes the saved rules.

#### Scenario: Restore defaults
- **WHEN** an admin has saved a unit "kopje" and presses "Standaardwaarden herstellen"
- **THEN** the rules in use are the defaults and "kopje" is no longer a unit

### Requirement: Recognition follows the stored rules
The system SHALL use the stored rules, not fixed lists, when it splits an ingredient line into amount, unit and name, when it finds a timer or an oven temperature in a step, and when it scales the amounts in a step, and SHALL pick up a saved change without the member reloading the page.

#### Scenario: New unit is recognised
- **WHEN** "kopje" is a stored unit and a member types the ingredient "2 kopje rijst"
- **THEN** its unit is "kopje" and its name is "rijst"

#### Scenario: New minute word makes a timer
- **WHEN** "mins" is a stored minute word and a step's text contains "20 mins"
- **THEN** the step gets a timer of 20 minutes tied to those words

#### Scenario: New spoken duration makes a timer
- **WHEN** "drie kwartier = 45" is a stored spoken duration and a step's text contains "drie kwartier"
- **THEN** the step gets a timer of 45 minutes

#### Scenario: Removed word is not recognised
- **WHEN** "graden" is not a stored degree word and a step's text contains "180 graden"
- **THEN** the step gets no oven temperature

#### Scenario: Scaling uses the stored units
- **WHEN** "kopje" is a stored unit and a recipe with "2 kopje rijst" is scaled to double
- **THEN** a step saying "doe 2 kopje rijst erbij" shows "4 kopje"

#### Scenario: Saved change applies at once
- **WHEN** an admin saves a new unit and then opens the recipe form
- **THEN** the form already recognises that unit
