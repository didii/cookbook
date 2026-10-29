# Spec Delta

## Purpose

Lets a recipe record where it came from, as a name or a link, so the family can credit the origin and go back to the original page.

## ADDED Requirements

### Requirement: A recipe can have a source
The system SHALL store, for each recipe, an optional source of at most 500 characters. A source that is empty after trimming is stored as no source, and a recipe stored without one SHALL be read back without one.

#### Scenario: Source is saved
- **WHEN** a recipe is stored with the source "Libelle, maart 2024"
- **THEN** reading the recipe returns that source

#### Scenario: No source
- **WHEN** a recipe is stored without a source, or with a blank one
- **THEN** reading the recipe returns no source

#### Scenario: Source over the limit is refused by the database
- **WHEN** a recipe is inserted with a source of 501 characters
- **THEN** the insert fails

### Requirement: The source is entered in the recipe form
The system SHALL offer an optional "Bron" field in the side column of the recipe form, for creating and editing alike, filled with the stored source when editing. Its hint says it takes a name or a link, and it stops accepting characters at 500.

#### Scenario: Field in the side column
- **WHEN** a family member opens the new recipe form
- **THEN** a Bron field follows the author field in the side column and is not required

#### Scenario: Edit form shows the stored source
- **WHEN** a family member opens the edit form of a recipe that has a source
- **THEN** the Bron field contains it

#### Scenario: Source is saved with the recipe
- **WHEN** a family member fills in the Bron field and saves
- **THEN** the recipe is stored with that source

#### Scenario: Source is cleared
- **WHEN** a family member empties the Bron field of a recipe that has a source and saves
- **THEN** the recipe is stored without a source

#### Scenario: Source is part of the draft
- **WHEN** a family member types a source, leaves the form without saving and comes back
- **THEN** the draft restores the typed source

#### Scenario: Reset restores the source
- **WHEN** a family member changes the source and resets the form
- **THEN** the Bron field has its starting value again

#### Scenario: Draft kept before sources existed
- **WHEN** a draft kept before this field existed is restored
- **THEN** it is accepted and the Bron field is empty

### Requirement: A source over 500 characters is refused
The system SHALL refuse a source longer than 500 characters, counted after trimming, on create and edit alike: nothing is stored, and the form is shown again with what was entered and a message at the Bron field that states 500. A source of exactly 500 characters SHALL be accepted.

#### Scenario: Source at the limit is accepted
- **WHEN** a recipe is saved with a source of exactly 500 characters
- **THEN** it is stored

#### Scenario: Source over the limit is refused
- **WHEN** a recipe is saved with a source of 501 characters
- **THEN** nothing is stored and the form shows the entered values with a message at the Bron field that states 500

### Requirement: The recipe page shows the source
The system SHALL show the source of a recipe, when it has one, on the recipe page next to the author, time and servings. A source that starts with `http://` or `https://` and has no whitespace SHALL be shown as a link to that address, opening in a new tab without passing the referrer or opener, with the address's host (without a leading `www.`) as its text. Any other source SHALL be shown as plain text, never as a link.

#### Scenario: Text source
- **WHEN** a recipe has the source "Buurvrouw Marie"
- **THEN** the page shows "Buurvrouw Marie" as text and not as a link

#### Scenario: Link source
- **WHEN** a recipe has the source "https://www.smulweb.nl/recepten/123/appeltaart"
- **THEN** the page shows a link to that address with the text "smulweb.nl", opening in a new tab without referrer or opener

#### Scenario: Other schemes are not links
- **WHEN** a recipe has the source "javascript:alert(1)" or "ftp://example.com/x"
- **THEN** the page shows it as plain text

#### Scenario: Text containing a link
- **WHEN** a recipe has the source "zie https://example.com"
- **THEN** the page shows it as plain text

#### Scenario: Recipe without a source
- **WHEN** a recipe has no source
- **THEN** the page renders without a source item
