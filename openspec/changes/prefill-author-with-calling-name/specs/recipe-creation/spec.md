## ADDED Requirements

### Requirement: The author starts as the member's calling name
The system SHALL open the new recipe form with the author field filled in with the calling name of the signed-in family member, and SHALL let them change it. A saved draft of the new recipe, or a refused submission, SHALL show what the member entered rather than the calling name.

#### Scenario: Author is prefilled
- **WHEN** a family member with the calling name "Jos" opens the new recipe form
- **THEN** the author field contains "Jos"

#### Scenario: Prefilled author can be changed
- **WHEN** a family member replaces the prefilled author with "Oma" and submits
- **THEN** the recipe is stored with the author "Oma"

#### Scenario: Prefill alone is not a draft
- **WHEN** a family member opens the new recipe form and changes nothing
- **THEN** no draft is kept on their device
