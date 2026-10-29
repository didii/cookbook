## MODIFIED Requirements

### Requirement: A tag is at most 100 characters
The system SHALL NOT let the tags field take more than 100 characters in a tag, and SHALL refuse a save that has a longer tag, storing nothing and showing a message at the tags field. The number of tags is limited by the `recipe-limits` capability.

#### Scenario: Tag length is limited
- **WHEN** a family member types more than 100 characters in the tags field
- **THEN** the field keeps only the first 100

#### Scenario: Too long tag is refused on save
- **WHEN** a save arrives with a tag of more than 100 characters
- **THEN** nothing is stored and the editor is shown again with a message at the tags field

#### Scenario: Many tags are accepted
- **WHEN** a family member picks 30 tags and saves
- **THEN** the recipe has all 30
