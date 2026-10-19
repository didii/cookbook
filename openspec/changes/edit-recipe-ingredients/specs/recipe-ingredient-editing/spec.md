# Spec Delta

## Purpose

How a family member writes, reorders, removes and saves the ingredient list of a recipe, one line per ingredient, with the quantity recognised from what was typed.

## ADDED Requirements

### Requirement: An ingredient is typed as one line and split into quantity and name
The system SHALL let a family member type each ingredient as one line, SHALL recognise a leading quantity (a number, a decimal with a comma or point, a fraction such as ½ or 1/2, optionally followed by a known Dutch unit such as g, kg, l, el, tl, snuf or blik) and take the rest as the name, and SHALL treat a line without a leading number as a name only.

#### Scenario: Quantity with unit and name
- **WHEN** a family member types "250 g zelfrijzende bloem"
- **THEN** the quantity is "250 g" with amount 250 and unit "g", and the name is "zelfrijzende bloem"

#### Scenario: Quantity without unit
- **WHEN** a family member types "1 ei"
- **THEN** the quantity is "1" with amount 1 and no unit, and the name is "ei"

#### Scenario: Fraction and decimal comma
- **WHEN** a family member types "½ tl zout" or "1,5 l water"
- **THEN** the amounts are 0.5 and 1.5, and the quantities keep the text as typed

#### Scenario: Unknown word after the number is part of the name
- **WHEN** a family member types "2 grote uien"
- **THEN** the quantity is "2" and the name is "grote uien"

#### Scenario: No quantity
- **WHEN** a family member types "bruine suiker"
- **THEN** the quantity is empty and the name is "bruine suiker"

#### Scenario: Quantity is highlighted while typing
- **WHEN** a family member types an ingredient line with a quantity
- **THEN** the quantity part of the text in the field is shown in a different colour as it is typed

### Requirement: The list always has a free row and is filled by typing
The system SHALL keep exactly one empty row at the end of the list, SHALL add a new empty row when the family member types in it, SHALL move to the next row with Enter, SHALL move to the row above or below with the up and down arrow keys, and SHALL remove an empty row, moving to the previous one, when Backspace is pressed in it. Tab SHALL keep its normal job of moving between controls.

#### Scenario: Empty row at the end
- **WHEN** a family member opens the editor of a new recipe or one with ingredients
- **THEN** the ingredient list ends with one empty row

#### Scenario: Typing adds the next row
- **WHEN** a family member types in the empty last row
- **THEN** a new empty row appears below it

#### Scenario: Enter moves to the next row
- **WHEN** a family member presses Enter in an ingredient field
- **THEN** focus moves to the next row, which is the empty row when it was the last one

#### Scenario: Arrow keys move between rows
- **WHEN** a family member presses the down or up arrow key in an ingredient field
- **THEN** focus moves to the field of the next or previous row, and nothing happens on the last or first row

#### Scenario: Backspace removes an empty row
- **WHEN** a family member presses Backspace in an empty ingredient row that is not the last
- **THEN** the row is removed and focus moves to the end of the row above

### Requirement: Ingredient rows can be removed and reordered
The system SHALL give each filled row a delete button and always-visible up and down buttons, SHALL disable "up" on the first row and "down" on the last filled row, SHALL let a row be dragged by its grip with a mouse or pen, SHALL hide the grip on screens without hover so the buttons are the only way to reorder there, and SHALL announce each move to assistive technology.

#### Scenario: Row can be removed
- **WHEN** a family member uses the delete button of a row
- **THEN** the row is gone and the other rows keep their order

#### Scenario: Row moves up and down
- **WHEN** a family member uses the up button of the third row
- **THEN** it becomes the second row, and the down button moves it back

#### Scenario: Edge rows cannot move out of the list
- **WHEN** a family member looks at the first row and the last filled row
- **THEN** the up button of the first and the down button of the last are disabled

#### Scenario: Row can be dragged
- **WHEN** a family member drags a row by its grip to another place with a mouse
- **THEN** the row is dropped there and the others keep their order, and pressing Escape during the drag puts it back

#### Scenario: Grip hidden on touch screens
- **WHEN** a family member uses a screen without hover
- **THEN** the grip is not shown and the up and down buttons remain

#### Scenario: Move is announced
- **WHEN** a row is moved by a button or a drag
- **THEN** assistive technology is told the ingredient and its new position

### Requirement: Ingredient rows can be operated from the keyboard
The system SHALL group the up, down and delete buttons of a row into one toolbar that is a single Tab stop, with the left and right arrow keys moving between its buttons, and SHALL move the row up or down with Alt and the up or down arrow key while focus stays in its field, without taking over Tab.

#### Scenario: Row buttons are one tab stop
- **WHEN** a family member presses Tab in an ingredient field
- **THEN** focus moves to the row's button group as one stop, the left and right arrow keys move between its buttons, and the next Tab moves to the next row's field

#### Scenario: Alt and arrow move the row
- **WHEN** a family member presses Alt and the up or down arrow key in an ingredient field
- **THEN** the row moves up or down, focus stays in its field with the cursor where it was, and the move is announced

### Requirement: The ingredient list is saved with the recipe
The system SHALL store, when a recipe is created or saved, each non-blank ingredient row in the order shown with its quantity text, amount, unit and name, SHALL replace the recipe's previously stored ingredients, SHALL ignore blank rows, and SHALL refuse the save with a message on the row when a row has a quantity but no name.

#### Scenario: Ingredients are stored in order
- **WHEN** a family member saves a recipe with several ingredient rows
- **THEN** its ingredients are stored in that order with their quantity text, amount, unit and name

#### Scenario: Blank rows are not stored
- **WHEN** a family member saves with blank rows between or after the ingredients
- **THEN** only the filled rows are stored

#### Scenario: Quantity without a name is refused
- **WHEN** a family member saves a row that only has a quantity, such as "250 g"
- **THEN** nothing is stored and the form shows an error on that row

#### Scenario: Saved list replaces the old one
- **WHEN** a family member edits a recipe, removes one ingredient, adds another and saves
- **THEN** the recipe has exactly the ingredients that were in the list

#### Scenario: Stored ingredients come back as lines
- **WHEN** a family member opens the editor of a recipe with stored ingredients
- **THEN** each ingredient is shown as one line, its quantity text followed by its name, in stored order
