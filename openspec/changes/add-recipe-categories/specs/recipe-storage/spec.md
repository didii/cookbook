# Spec Delta

## ADDED Requirements

### Requirement: A recipe has categories
The system SHALL store categories by name, each name once (letter case ignored, never empty), and SHALL let a recipe have any number of them, each at most once per recipe and in a stored order. A category SHALL be shared by the recipes that have it. The system SHALL return a recipe's categories, in that order, when recipes are listed, and an empty list for a recipe without any. Links between a recipe and its categories SHALL be removed when the recipe is deleted, and a category SHALL remain when a recipe that had it is deleted. Categories are only seeded for now: nothing in the application changes them.

#### Scenario: Recipe with categories
- **WHEN** a recipe is linked to the categories "Soep" at position 1 and "Winter" at position 2
- **THEN** reading its categories ordered by position gives "Soep", then "Winter"

#### Scenario: Recipe without categories
- **WHEN** a recipe has no categories and recipes are listed
- **THEN** its entry has an empty list of categories

#### Scenario: Category name is unique
- **WHEN** a category is stored with a name that another category already has, in any letter case, or with an empty name
- **THEN** the insert fails

#### Scenario: Category is shared
- **WHEN** two recipes are linked to the same category
- **THEN** both are returned with that category and only one category is stored

#### Scenario: Category linked twice is refused
- **WHEN** a recipe is linked to a category it already has
- **THEN** the insert fails

#### Scenario: Link needs a recipe and a category
- **WHEN** a link is stored for a recipe or a category that does not exist
- **THEN** the insert fails

#### Scenario: Recipe deleted
- **WHEN** a recipe with categories is deleted
- **THEN** its links are gone and the categories themselves remain

#### Scenario: Listing returns categories in order
- **WHEN** recipes are listed and a recipe has the categories "Soep" and "Winter" in that order
- **THEN** its entry has the categories "Soep" and "Winter" in that order
