## REMOVED Requirements

### Requirement: A recipe has categories
**Reason**: Categories are renamed to tags; "category" is kept free for a group a tag can belong to (a later change). Tags have no stored order.
**Migration**: See "A recipe has tags": same behavior under the new name, minus the stored order; stored categories become tags with their links.

## ADDED Requirements

### Requirement: A recipe has tags
The system SHALL store tags by name, each name once (letter case ignored, never empty), and SHALL let a recipe have any number of them, each at most once per recipe. A tag SHALL be shared by the recipes that have it. The system SHALL return a recipe's tags in alphabetical order (letter case and accents ignored) when a recipe is read. When recipes are listed, it SHALL return them most used first (the number of recipes that have the tag, most first, equal counts alphabetical). A recipe without tags gets an empty list.

#### Scenario: Recipe with tags
- **WHEN** a recipe is linked to the tags "Winter" and "Soep"
- **THEN** reading its tags gives "Soep", then "Winter"

#### Scenario: Recipe without tags
- **WHEN** a recipe has no tags and recipes are listed
- **THEN** its entry has an empty list of tags

#### Scenario: Tag name is unique
- **WHEN** a tag is stored with a name that another tag already has, in any letter case, or with an empty name
- **THEN** the insert fails

#### Scenario: Tag is shared
- **WHEN** two recipes are linked to the same tag
- **THEN** both are returned with that tag and only one tag is stored

#### Scenario: Tag linked twice is refused
- **WHEN** a recipe is linked to a tag it already has
- **THEN** the insert fails

#### Scenario: Link needs a recipe and a tag
- **WHEN** a link is stored for a recipe or a tag that does not exist
- **THEN** the insert fails

#### Scenario: Listing returns the most used tags first
- **WHEN** recipes are listed, a recipe has the tags "Soep", "Bakken" and "winter", and "winter" is on 3 recipes, "Soep" on 2 and "Bakken" on 1
- **THEN** its entry has the tags "winter", "Soep" and "Bakken" in that order

#### Scenario: Equally used tags are alphabetical
- **WHEN** recipes are listed and a recipe has the tags "winter" and "Soep", each on only that recipe
- **THEN** its entry has the tags "Soep" and "winter" in that order

#### Scenario: Reading a recipe returns tags alphabetically
- **WHEN** a recipe with the tags "winter" and "Soep" is read
- **THEN** it has the tags "Soep" and "winter" in that order

### Requirement: Tags outlive the recipes that have them
The system SHALL remove the links between a recipe and its tags when the recipe is deleted, and SHALL keep the tags themselves, also when no recipe uses a tag any more.

#### Scenario: Recipe with tags deleted
- **WHEN** a recipe with tags is deleted
- **THEN** its links are gone and the tags themselves remain

#### Scenario: Unused tag remains
- **WHEN** the only recipe with the tag "Soep" is saved without that tag
- **THEN** the tag "Soep" is still stored and listed

### Requirement: Saving a recipe stores its tags
The system SHALL store the tags given with a recipe when it is created or updated. Updating a recipe with tags SHALL replace its stored tags; updating it without tags SHALL leave them alone.

#### Scenario: Recipe is created with tags
- **WHEN** a recipe is created with the tags "Soep" and "Winter"
- **THEN** it is stored with those tags and both tags exist

#### Scenario: Recipe tags are replaced
- **WHEN** a recipe with the tags "Soep" and "Winter" is updated with the tags "Snel"
- **THEN** it has only the tag "Snel"

#### Scenario: Update without tags keeps them
- **WHEN** a recipe with the tag "Soep" is updated without any tags given
- **THEN** it still has the tag "Soep"

#### Scenario: Update with an empty list clears them
- **WHEN** a recipe with the tag "Soep" is updated with an empty list of tags
- **THEN** it has no tags

### Requirement: Given tags are matched to stored tags
The system SHALL drop blank tags and keep a tag given twice (letter case ignored) once. A tag whose name matches a stored tag regardless of letter case SHALL use that stored tag and its spelling; any other tag SHALL be created.

#### Scenario: Existing spelling is reused
- **WHEN** a recipe is saved with the tag "soep" and a tag "Soep" is stored
- **THEN** the recipe has the tag "Soep" and no second tag is created

#### Scenario: Duplicate and blank tags are dropped
- **WHEN** a recipe is saved with the tags "Soep", " ", "soep" and "Winter"
- **THEN** it has the tags "Soep" and "Winter"

#### Scenario: Unknown tag is created
- **WHEN** a recipe is saved with the tag "Kerst" and no such tag is stored
- **THEN** the tag "Kerst" is stored and the recipe has it

### Requirement: All tags can be listed
The system SHALL list all stored tags alphabetically (letter case and accents ignored), for suggestions.

#### Scenario: Tags are listed alphabetically
- **WHEN** the tags "winter", "Soep" and "Bakken" are stored and the tags are listed
- **THEN** they come back as "Bakken", "Soep", "winter"
