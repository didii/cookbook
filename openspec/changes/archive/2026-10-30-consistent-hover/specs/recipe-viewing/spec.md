# Spec Delta

## ADDED Requirements

### Requirement: Tag pills on a recipe page are large and stand out
The system SHALL show the tag pills on a recipe page larger than the pills on a home page card, with text as large as the page's body text and a touch target of at least 36 pixels high, and with a white background so they stand out from the page. A pill that is hovered SHALL take the tint of a hovered ingredient row.

#### Scenario: Pill size
- **WHEN** a family member opens a recipe with tags
- **THEN** the pills are larger than those on a card, and at least 36 pixels high

#### Scenario: Pill background
- **WHEN** a family member opens a recipe with tags
- **THEN** each pill has a white background

#### Scenario: Hovering a pill
- **WHEN** the pointer is over a pill
- **THEN** it takes the tint of a hovered ingredient row
