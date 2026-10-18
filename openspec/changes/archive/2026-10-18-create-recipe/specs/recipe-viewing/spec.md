## MODIFIED Requirements

### Requirement: A recipe page shows the stored recipe
The system SHALL show, at `/recepten/<slug>`, the title, author, intro and image of the stored recipe with that slug, and its preparation time and servings when it has them.

#### Scenario: Existing recipe
- **WHEN** a family member opens the page of a stored recipe
- **THEN** its title, author, time, servings and intro are shown

#### Scenario: Optional fields are empty
- **WHEN** a recipe has no preparation time, no servings or no image
- **THEN** the page still renders, without the missing item
