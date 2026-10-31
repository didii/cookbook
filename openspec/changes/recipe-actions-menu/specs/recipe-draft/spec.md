# Spec Delta

## MODIFIED Requirements

### Requirement: Starting an edit from the recipe page starts fresh
The system SHALL discard the draft of a recipe when its editor is opened through the item "Bewerk" in the actions menu on the recipe page and start from the stored recipe, and SHALL NOT discard it when the editor is reloaded afterwards or opened any other way.

#### Scenario: The edit link starts fresh
- **WHEN** a family member with a draft of a recipe uses the item "Bewerk" in the actions menu on that recipe's page
- **THEN** the editor shows the stored recipe and the draft is gone

#### Scenario: A reload after the edit link keeps the new draft
- **WHEN** a family member opened the editor through the item "Bewerk", changed something and reloads
- **THEN** the editor shows their changes and does not start fresh again
