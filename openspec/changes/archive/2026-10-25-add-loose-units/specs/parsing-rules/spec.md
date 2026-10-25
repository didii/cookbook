## MODIFIED Requirements

### Requirement: Recognition words are stored rules
The system SHALL keep the words it recognises in recipe text as stored rules of six kinds: units, loose units (units that may be written without a number), words for minutes, words for hours, words for degrees, and spoken durations (a phrase and its number of minutes). While no rules have been saved, or the saved rules cannot be read, the system SHALL use exactly the words the cookbook recognised before rules were configurable, with the default loose units "snuf", "snufje", "scheut", "scheutje", "mespunt", "mespuntje", "handvol", "klont" and "klontje". Saved rules that lack loose units SHALL use the default loose units and keep their other saved words.

#### Scenario: Default rules
- **WHEN** no rules have been saved
- **THEN** the rules in use hold the units, minute words, hour words, degree words and spoken durations that were hard-coded before, so "30 minuten", "1,5 uur", "een kwartier", "180 graden" and "250 g bloem" are recognised as before

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

### Requirement: An admin changes the rules as plain words
The system SHALL let an admin edit each kind of rule as a list of words, one per line, with spoken durations written as `phrase = minutes`, and save all lists at once. Words SHALL be matched literally, never as regular expressions, ignoring letter case. The system SHALL refuse the whole save, store nothing and say what is wrong when a spoken duration has no whole number of minutes from 1 to 1440, a list is empty (spoken durations and loose units may be empty), a word is in two of the lists units, minute words, hour words and degree words (a loose unit may also be a unit), a word has characters other than letters, `°` and spaces, or a unit or loose unit has anything but letters (these are matched as one word).

#### Scenario: Add a unit
- **WHEN** an admin adds the line "kopje" to the units and saves
- **THEN** the units include "kopje" and the page shows the saved rules

#### Scenario: Add a loose unit
- **WHEN** an admin adds the line "druppel" to the loose units and saves
- **THEN** the loose units include "druppel" and the page shows the saved rules

#### Scenario: Remove a word
- **WHEN** an admin removes "min" from the minute words and saves
- **THEN** "min" is no longer stored as a minute word

#### Scenario: Spoken duration
- **WHEN** an admin adds the line "drie kwartier = 45" and saves
- **THEN** the spoken durations include "drie kwartier" with 45 minutes

#### Scenario: Spoken duration without minutes
- **WHEN** an admin saves the line "een tijdje" or "een tijdje = 0" as a spoken duration
- **THEN** the page stays, says the line needs a whole number of minutes from 1 to 1440, and no rules change

#### Scenario: Empty list
- **WHEN** an admin saves with no units left
- **THEN** the page stays, says the units cannot be empty, and no rules change

#### Scenario: No loose units
- **WHEN** an admin saves with no loose units
- **THEN** the save succeeds and no word is a loose unit

#### Scenario: Word in two lists
- **WHEN** an admin puts "u" in both the minute words and the hour words
- **THEN** the page stays, says the word is in two lists, and no rules change

#### Scenario: Loose unit that is also a unit
- **WHEN** an admin saves "snufje" in both the units and the loose units
- **THEN** the save succeeds and both lists keep the word

#### Scenario: Saving the unchanged defaults succeeds
- **WHEN** an admin opens the page and saves without changing anything
- **THEN** the save succeeds and the same rules are stored

#### Scenario: Word with other characters
- **WHEN** an admin adds the line "a+" to the units and saves
- **THEN** the page stays, says the word may only hold letters, ° and spaces, and no rules change

#### Scenario: Loose unit with other characters
- **WHEN** an admin adds the line "een druppel" to the loose units and saves
- **THEN** the page stays, says the word may only hold letters, and no rules change

#### Scenario: Words are not regular expressions
- **WHEN** the stored minute words hold the word "m+" (for example written by hand)
- **THEN** it matches only the literal text "m+", so "20 m+" gives a timer of 20 minutes and "20 mmm" gives none
