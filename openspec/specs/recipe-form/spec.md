# recipe-form Specification

## Purpose
The single page on which a family member creates or edits a recipe: how it is laid out, and how it is saved, cancelled, reset and guarded against accidental loss.

## Requirements

### Requirement: Creating and editing happen on one page with a main and a side column
The system SHALL present the recipe editor as one page without steps or tabs. On a wide screen it SHALL show a main column and a side column next to each other; on a narrow screen it SHALL show them in one column with the side column (photo and facts) first.

#### Scenario: Wide screen layout
- **WHEN** a family member opens the editor on a wide screen
- **THEN** the title and intro are in a main column and the author, servings and time are in a side column to its right

#### Scenario: Narrow screen layout
- **WHEN** a family member opens the editor on a phone-sized screen
- **THEN** everything is in one column and the author, servings and time come before the title

### Requirement: Nothing is stored until the family member saves
The system SHALL keep a sticky bar in view at the bottom of the editor with a primary "Opslaan" button and an "Annuleren" action, SHALL store nothing before "Opslaan" is used, and SHALL leave the editor without storing anything when "Annuleren" is used.

#### Scenario: Save bar stays in view
- **WHEN** a family member scrolls through a long recipe in the editor
- **THEN** the "Opslaan" and "Annuleren" actions stay visible

#### Scenario: Nothing stored before saving
- **WHEN** a family member changes fields and has not used "Opslaan"
- **THEN** the stored recipe is unchanged

#### Scenario: Cancel leaves without storing
- **WHEN** a family member uses "Annuleren" while editing a stored recipe, or while creating a new one
- **THEN** nothing is stored and they are taken to that recipe's page, or to the home page for a new recipe

#### Scenario: Save is busy while storing
- **WHEN** a family member has used "Opslaan" and the response has not arrived yet
- **THEN** the "Opslaan" button is disabled so the recipe cannot be submitted twice

### Requirement: All edits can be reset
The system SHALL show a "Herstel" button in the bar only while the editor differs from its starting values. Using it SHALL ask once, in the bar itself and without a dialog, whether to put everything back; confirming SHALL restore every field to its starting values (the stored ones when editing, empty when creating), and declining SHALL keep the edits.

#### Scenario: Reset hidden without changes
- **WHEN** the editor has just opened and nothing was changed
- **THEN** there is no "Herstel" button

#### Scenario: Reset asks first
- **WHEN** a family member uses "Herstel"
- **THEN** the bar asks whether to put everything back, with a yes and a no, and nothing is changed yet

#### Scenario: Reset restores the starting values
- **WHEN** a family member confirms the reset
- **THEN** every field shows its starting value again and the "Herstel" button disappears

#### Scenario: Reset can be declined
- **WHEN** a family member answers no to the reset question
- **THEN** their edits are kept and the question disappears

### Requirement: Unsaved changes are shown and guarded
The system SHALL show "Niet opgeslagen" in the bar while the editor differs from its starting values, and SHALL ask for confirmation before the family member leaves the page, by a link or by closing or reloading it, while it does. After a successful save, or when nothing was changed, it SHALL NOT ask.

#### Scenario: Unsaved indicator
- **WHEN** a family member changes any field
- **THEN** the bar shows "Niet opgeslagen", and it disappears when the values equal the starting values again

#### Scenario: Leaving with unsaved changes asks first
- **WHEN** a family member with unsaved changes follows a link to another page
- **THEN** they are asked whether to leave and stay on the editor when they decline

#### Scenario: Leaving without changes does not ask
- **WHEN** a family member who changed nothing, or who has just saved, leaves the page
- **THEN** they are not asked anything
