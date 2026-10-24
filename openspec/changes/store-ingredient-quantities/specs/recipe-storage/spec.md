# Spec Delta

## MODIFIED Requirements

### Requirement: Ingredient quantities can be scaled
The system SHALL store an ingredient's quantity as the text as entered (the quantity text) plus an optional numeric quantity value and an optional quantity unit, without requiring the user to choose a unit, and SHALL return all three when the recipe is read.

#### Scenario: Quantity with amount and unit
- **WHEN** an ingredient is stored with text "250 g", quantity value 250 and quantity unit "g"
- **THEN** all three are returned as stored

#### Scenario: Quantity without a number
- **WHEN** an ingredient such as "boter om te bakken" is stored with empty text and no quantity value or unit
- **THEN** it is accepted

#### Scenario: Non-positive amount refused
- **WHEN** an ingredient is stored with a quantity value of zero or less
- **THEN** the insert fails

#### Scenario: Quantity value and unit are read with the recipe
- **WHEN** a recipe with an ingredient "250 g bloem" saved from the editor is read
- **THEN** the ingredient has quantity text "250 g", quantity value 250 and quantity unit "g"

#### Scenario: Range has no quantity value
- **WHEN** an ingredient "2-3 el olie" is saved from the editor
- **THEN** its quantity text is "2-3 el" and it has no quantity value
