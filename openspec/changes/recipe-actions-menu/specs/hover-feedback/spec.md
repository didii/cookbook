# Spec Delta

## MODIFIED Requirements

### Requirement: Text links underline under the pointer
The system SHALL, while a mouse pointer is over a link or button that is only text (such as "Alle recepten" and "Annuleren"), underline that text. A text link that is already underlined (such as the source of a recipe) SHALL instead change to a slightly different colour.

#### Scenario: Hovering a plain text link
- **WHEN** the pointer is over "Alle recepten" on a recipe page
- **THEN** its text is underlined

#### Scenario: Hovering an underlined link
- **WHEN** the pointer is over the source link of a recipe
- **THEN** it stays underlined and its colour changes slightly
