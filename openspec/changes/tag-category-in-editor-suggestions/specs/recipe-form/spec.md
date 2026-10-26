## ADDED Requirements

### Requirement: Tag suggestions show the category of a tag
The system SHALL show, for every suggested stored tag in the tag field's popup that has a category, that category as a pill next to the tag's name. A suggested tag without a category SHALL show no pill, and neither SHALL the offer to add a new tag. Picked tags in the field SHALL NOT show a category.

#### Scenario: Suggestion with a category
- **WHEN** a family member focuses the tag field and the stored tag "Soep" has the category "Gerecht"
- **THEN** the suggestion "Soep" shows a pill "Gerecht"

#### Scenario: Suggestion without a category
- **WHEN** a family member focuses the tag field and the stored tag "Winter" has no category
- **THEN** the suggestion "Winter" shows no pill

#### Scenario: Offer for a new tag has no pill
- **WHEN** a family member types text that matches no stored tag
- **THEN** the offer to add it shows no pill

#### Scenario: Picked tag has no category pill
- **WHEN** a family member picks the tag "Soep" that has the category "Gerecht"
- **THEN** the picked tag in the field shows no pill
