## ADDED Requirements

### Requirement: A tag has at most one category
The system SHALL store categories by name, each name once (letter case ignored, never empty), and SHALL let a tag have no category or exactly one. A category SHALL be shared by the tags that have it. A category that no tag has SHALL NOT be kept: it is removed when the last tag leaves it. Removing a tag keeps no trace of its category link.

#### Scenario: Tag with a category
- **WHEN** a tag is linked to the category "Gerecht"
- **THEN** reading the tag gives the category "Gerecht"

#### Scenario: Tag without a category
- **WHEN** a tag has no category and the tags are read
- **THEN** its category is empty

#### Scenario: Category name is unique
- **WHEN** a category is stored with a name that another category already has, in any letter case, or with an empty name
- **THEN** the insert fails

#### Scenario: Category is shared
- **WHEN** two tags are linked to the same category
- **THEN** both are returned with that category and only one category is stored

#### Scenario: Tag needs an existing category
- **WHEN** a tag is linked to a category that does not exist
- **THEN** the update fails

#### Scenario: Unused category is removed
- **WHEN** the only tag with the category "Seizoen" gets another category, none, or is deleted
- **THEN** the category "Seizoen" is no longer stored

### Requirement: All categories can be listed
The system SHALL list all stored categories alphabetically (letter case and accents ignored), for suggestions.

#### Scenario: Categories are listed alphabetically
- **WHEN** the categories "seizoen", "Gerecht" and "Dieet" are stored and the categories are listed
- **THEN** they come back as "Dieet", "Gerecht", "seizoen"
