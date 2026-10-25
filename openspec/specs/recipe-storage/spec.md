# recipe-storage Specification

## Purpose

Defines how the cookbook persists recipes with their ingredients, steps and the ingredients each step uses, in a form that supports rescaling portions and optional step images.

## Requirements

### Requirement: A recipe is stored with its descriptive fields
The system SHALL store, for each recipe, a unique slug, a title, an author and an intro, plus an optional number of servings (greater than zero when given), preparation time, main image, seal id and the email of who added it.

#### Scenario: Recipe is saved
- **WHEN** a recipe with all fields is inserted
- **THEN** it can be read back with the same values

#### Scenario: Duplicate slug is refused
- **WHEN** a recipe is inserted with a slug that another recipe already has
- **THEN** the insert fails and the existing recipe is unchanged

#### Scenario: Required field is missing
- **WHEN** a recipe is inserted without a title, or with zero servings
- **THEN** the insert fails

#### Scenario: Servings are optional
- **WHEN** a recipe is inserted without a number of servings
- **THEN** it is accepted and has no servings when read back

### Requirement: Ingredients are ordered and belong to one recipe
The system SHALL store each ingredient with a name and its position within exactly one recipe.

#### Scenario: Ingredients keep their order
- **WHEN** a recipe's ingredients are read ordered by position
- **THEN** they come back in the order they were entered

#### Scenario: Ingredient needs a recipe
- **WHEN** an ingredient is inserted for a recipe that does not exist
- **THEN** the insert fails

### Requirement: Ingredient quantities can be scaled
The system SHALL store an ingredient's quantity as the text as entered (the quantity text) plus an optional numeric quantity value and an optional quantity unit, without requiring the user to choose a unit, and SHALL return all three when the recipe is read.

#### Scenario: Quantity with amount and unit
- **WHEN** an ingredient is stored with text "250 g", quantity value 250 and quantity unit "g"
- **THEN** all three are returned as stored

#### Scenario: Quantity without a number
- **WHEN** an ingredient such as "boter om te bakken" is stored with empty text and no quantity value or unit
- **THEN** it is accepted

#### Scenario: Non-positive amount refused
- **WHEN** an ingredient is stored with a quantity value of zero or less
- **THEN** the insert fails

#### Scenario: Quantity value and unit are read with the recipe
- **WHEN** a recipe with an ingredient "250 g bloem" saved from the editor is read
- **THEN** the ingredient has quantity text "250 g", quantity value 250 and quantity unit "g"

### Requirement: Steps are ordered and belong to one recipe
The system SHALL store each preparation step as text with its position within exactly one recipe.

#### Scenario: Steps keep their order
- **WHEN** a recipe's steps are read ordered by position
- **THEN** they come back in the order they were entered

#### Scenario: Step needs a recipe
- **WHEN** a step is inserted for a recipe that does not exist
- **THEN** the insert fails

### Requirement: A step may have an image
The system SHALL allow a step to have an image path and an alt text, and SHALL accept steps without one.

#### Scenario: Step with image
- **WHEN** a step is stored with an image and alt text
- **THEN** both are returned as stored

#### Scenario: Step without image
- **WHEN** a step is stored without an image
- **THEN** it is accepted

### Requirement: Steps record the ingredients they use
The system SHALL store which ingredients of its own recipe a step uses, each optionally with the amount and unit used in that step; no amount means the whole ingredient quantity.

#### Scenario: Step uses part of an ingredient
- **WHEN** a step is linked to an ingredient with amount 200 and unit "g"
- **THEN** the link returns that amount and unit

#### Scenario: Step uses a whole ingredient
- **WHEN** a step is linked to an ingredient without an amount
- **THEN** the link is accepted and carries no amount

#### Scenario: Ingredient of another recipe refused
- **WHEN** a step is linked to an ingredient that belongs to a different recipe
- **THEN** the insert fails

#### Scenario: Same ingredient linked twice refused
- **WHEN** a step is linked twice to the same ingredient
- **THEN** the second insert fails

### Requirement: Deleting removes dependent rows
The system SHALL remove a recipe's ingredients, steps and step-ingredient links when the recipe is deleted, and a step's links when its step or linked ingredient is deleted.

#### Scenario: Recipe deleted
- **WHEN** a recipe with ingredients, steps and links is deleted
- **THEN** none of its ingredients, steps or links remain

#### Scenario: Ingredient deleted
- **WHEN** an ingredient used by a step is deleted
- **THEN** the step remains and its link to that ingredient is gone

### Requirement: A step may have an oven temperature and a timer
The system SHALL allow a step to have an oven temperature in degrees Celsius and a timer in minutes with an optional name, each greater than zero, SHALL refuse a timer name without minutes, and SHALL accept steps without them.

#### Scenario: Step with oven temperature and timer
- **WHEN** a step is stored with an oven temperature of 180 and a timer of 50 minutes named "Bakken"
- **THEN** all three are returned as stored

#### Scenario: Step without oven or timer
- **WHEN** a step is stored without an oven temperature and without a timer
- **THEN** it is accepted and returned without them

#### Scenario: Non-positive oven temperature or timer refused
- **WHEN** a step is stored with an oven temperature or timer minutes of zero or less
- **THEN** the insert fails

#### Scenario: Timer name needs minutes
- **WHEN** a step is stored with a timer name but no timer minutes
- **THEN** the insert fails

### Requirement: A step has ingredient chips of its own
The system SHALL store for a step any number of ingredient chips, each with free text for the quantity (which may be empty), an optional numeric quantity value (greater than zero), an optional quantity unit and a name, in order, independent of the recipe's ingredient rows, SHALL return all of them when the recipe is read, and SHALL remove them with their step.

#### Scenario: Chips keep their order
- **WHEN** a step's ingredient chips are read ordered by position
- **THEN** they come back in the order they were stored

#### Scenario: Chip without a quantity
- **WHEN** a chip such as "boter" is stored with an empty quantity text
- **THEN** it is accepted and returned with an empty quantity

#### Scenario: Chip needs a name and a step
- **WHEN** a chip is stored with an empty name, or for a step that does not exist
- **THEN** the insert fails

#### Scenario: Chips are removed with their step
- **WHEN** a step with ingredient chips is deleted
- **THEN** none of its chips remain

#### Scenario: Chip with value and unit
- **WHEN** a chip is stored with text "200 g", quantity value 200 and quantity unit "g"
- **THEN** all three are returned as stored

#### Scenario: Non-positive chip value refused
- **WHEN** a chip is stored with a quantity value of zero or less
- **THEN** the insert fails

#### Scenario: Chip quantity is read from its text on save
- **WHEN** a step with the chip "½ tl zout" is saved from the editor, or the chip "1 klontje boter"
- **THEN** the stored chips have quantity value 0,5 and unit "tl", and value 1 and unit "klontje"

#### Scenario: Chip quantity that is a loose unit
- **WHEN** a step with the chip "scheutje" as quantity and the name "rode wijn" is saved from the editor, and "scheutje" is a loose unit
- **THEN** the stored chip has quantity value 1 and unit "scheutje"

#### Scenario: Chip quantity word that is not a loose unit
- **WHEN** a step with the chip "el" as quantity is saved from the editor, and "el" is a unit but not a loose unit
- **THEN** the stored chip has no quantity value and no unit

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

#### Scenario: Recipe with categories deleted
- **WHEN** a recipe with categories is deleted
- **THEN** its links are gone and the categories themselves remain

#### Scenario: Listing returns categories in order
- **WHEN** recipes are listed and a recipe has the categories "Soep" and "Winter" in that order
- **THEN** its entry has the categories "Soep" and "Winter" in that order

### Requirement: A step stores the amounts in its text
The system SHALL store for a step the amounts in its text that scale with the servings, each with where it sits in the text (start and end of the number), a quantity value greater than zero and an optional quantity unit, SHALL return them in the order they appear in the text, and SHALL remove them with their step.

#### Scenario: Amounts keep their text order
- **WHEN** a step's amounts are read
- **THEN** they come back ordered by where they start in the text

#### Scenario: Amount with place, value and unit
- **WHEN** an amount is stored for the text "Meng 200 g bloem" at 5 to 8 with value 200 and unit "g"
- **THEN** place, value and unit are returned as stored

#### Scenario: Non-positive amount in text refused
- **WHEN** an amount is stored with a value of zero or less
- **THEN** the insert fails

#### Scenario: Amount must end after it starts
- **WHEN** an amount is stored whose end is not after its start
- **THEN** the insert fails

#### Scenario: Two amounts cannot start at the same place
- **WHEN** a step gets two amounts with the same start
- **THEN** the second insert fails

#### Scenario: Amounts are removed with their step
- **WHEN** a step with amounts is deleted
- **THEN** none of its amounts remain

### Requirement: Amounts in a step's text are found on save
The system SHALL find, when a recipe is saved from the editor, the amounts in each step's text that are followed by a unit of the recognition rules or written right before the name of one of the recipe's ingredients, from the text as stored, and SHALL NOT trust amounts sent by the browser. Durations and temperatures SHALL NOT be stored.

#### Scenario: Amount before a unit and before an ingredient
- **WHEN** a step "Meng 200 g bloem met 2 eieren" is saved for a recipe with the ingredients "bloem" and "ei"
- **THEN** the amounts are 200 with unit "g" at the number "200", and 2 without a unit at the number "2"

#### Scenario: Places refer to the stored text
- **WHEN** a step is posted with line breaks and spaces around its text
- **THEN** each stored place points at its number in the cleaned text as stored

#### Scenario: Durations and temperatures are not stored
- **WHEN** a step "Bak 20 minuten op 180 graden" is saved
- **THEN** no amount is stored for it

#### Scenario: Saving again replaces the amounts
- **WHEN** a recipe is saved again with a changed step text
- **THEN** the step's amounts match the new text and none of the old ones remain
