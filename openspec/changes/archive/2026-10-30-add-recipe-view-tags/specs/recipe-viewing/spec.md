# Spec Delta

## ADDED Requirements

### Requirement: A recipe page lists all tags of the recipe
The system SHALL show on a recipe page every tag of the recipe, in the order the recipe gives them, as small pills directly below the picture frame (the image and the tile band), in the same style as on a home page card. No pill SHALL stand in for a number of hidden tags. Each pill SHALL be a link to the home page filtered on that tag (`/?tag=<name>`), and a recipe without tags SHALL show none.

#### Scenario: Recipe with tags
- **WHEN** a family member opens a recipe with the tags "Hoofdgerecht", "Vlees" and "Winter"
- **THEN** a pill for each is shown below the picture frame, in that order, and no "+" pill

#### Scenario: Recipe without tags
- **WHEN** a family member opens a recipe without tags
- **THEN** no tag pills are shown

#### Scenario: Pill opens the filtered home page
- **WHEN** a family member follows the pill of the tag "Soep"
- **THEN** the home page opens with the recipes filtered on the tag "Soep"
