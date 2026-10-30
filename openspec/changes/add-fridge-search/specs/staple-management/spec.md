## ADDED Requirements

### Requirement: Staples are stored words
The system SHALL keep a list of staples, the ingredients most households always have, that the fridge page leaves out of "Ontbreekt". While no list has been saved, or the saved list cannot be read, the system SHALL use the default staples "zout", "peper", "water", "olie", "boter" and "suiker". A staple matches an ingredient by the same whole-word rule as the fridge entries.

#### Scenario: Default staples
- **WHEN** no staples have been saved
- **THEN** the staples in use are "zout", "peper", "water", "olie", "boter" and "suiker"

#### Scenario: Unreadable list
- **WHEN** the saved staples cannot be read
- **THEN** the default staples are in use

#### Scenario: A saved list replaces the defaults
- **WHEN** an admin has saved the staples "zout" and "meel"
- **THEN** exactly "zout" and "meel" are in use

#### Scenario: A saved empty list means no staples
- **WHEN** an admin has saved an empty list of staples
- **THEN** no staples are in use

### Requirement: Admins edit the staples on the rules page
The system SHALL show on the rules page ("Herkenning") a fourth category "Basisproducten" after "Graden", with the staples in use as rows with one word each, edited like the other lists of the page (an empty row at the end, the same keyboard and drag behaviour) and saved with the page's own save bar together with the other lists. A staple SHALL be a word or words of only letters and spaces, of at most 40 characters. The system SHALL refuse the whole save, store nothing and say on the faulty row what is wrong when a staple has other characters or is longer than 40 characters, and SHALL refuse a save with more than 100 staples, saying so at the list. Empty rows and repeated staples (letter case and accents ignored) are dropped. An empty list is allowed. The staples SHALL be refused to a member who is not an `admin` or `superadmin` like every change of the rules page.

#### Scenario: The page has the staples
- **WHEN** an admin opens the rules page
- **THEN** the category "Basisproducten" is shown after "Graden" with the staples in use, one row per word

#### Scenario: Adding a staple
- **WHEN** an admin types "meel" in the empty row of the staples and saves
- **THEN** the staples in use include "meel" and the page shows the saved rules

#### Scenario: Removing a staple
- **WHEN** an admin removes the row "suiker" from the staples and saves
- **THEN** "suiker" is no longer a staple in use

#### Scenario: Saved with the other lists
- **WHEN** an admin adds a unit "kopje" and a staple "meel" and saves once
- **THEN** both are stored

#### Scenario: A refused save keeps the staples too
- **WHEN** an admin saves a faulty duration row and a new staple "meel"
- **THEN** the page stays, says what is wrong on the duration row, and the staple "meel" is not stored

#### Scenario: Repeated staple
- **WHEN** an admin saves the staples "Zout" and "zout"
- **THEN** the staples in use include "Zout" once

#### Scenario: Other characters
- **WHEN** an admin types "zout!" in the staples and saves
- **THEN** the page stays, says on that row that the word may only hold letters and spaces, and nothing is stored

#### Scenario: Too long a word
- **WHEN** an admin saves a staple of more than 40 characters
- **THEN** the page stays, says on that row that the word is too long, and nothing is stored

#### Scenario: Too many staples
- **WHEN** an admin saves 101 staples
- **THEN** the page stays, says at the list that there are too many, and nothing is stored

#### Scenario: A user posts staples
- **WHEN** a user sends a rules change with staples directly to the server
- **THEN** the response is 403 and the stored staples are unchanged

### Requirement: Staples only hide missing ingredients
The system SHALL use the staples only to leave ingredients out of "Ontbreekt" on the fridge page. A staple SHALL NOT count as a match for a "Heb ik" entry, and typing a staple in a list SHALL work like any other word.

#### Scenario: A staple typed in Heb ik
- **WHEN** "boter" is a staple and a family member adds "boter" to "Heb ik"
- **THEN** recipes with an ingredient "boter" match it like any other entry

#### Scenario: A staple is not listed as missing
- **WHEN** "zout" is a staple and a recipe has the ingredient "zout"
- **THEN** its card does not list "zout" under "Ontbreekt"
