# Spec Delta

## Purpose
Gives every clickable thing the same answer to a mouse pointer: a slight recolor, or an underline for plain text. One rule, so people can tell what can be clicked.

## ADDED Requirements

### Requirement: Clickable controls recolor under the pointer
The system SHALL, while a mouse pointer is over an enabled control that has a background (a button, filter toggle, segment of a segmented toggle, tab, chip, menu item, tag pill that links, or card), give it a slight recolor: a faint ink tint over its own background, the same tint that a hovered field and a hovered ingredient row already have. A control that is disabled SHALL NOT react. A control that is selected or pressed keeps the colour of that state, but a hovered selected control SHALL still change slightly. The system SHALL NOT move or resize a control to show hover.

#### Scenario: Hovering a button
- **WHEN** the pointer is over an enabled button, such as "Wis filters" or the filter toggle
- **THEN** its background gets a slight tint

#### Scenario: Hovering a segment
- **WHEN** the pointer is over a segment of a segmented toggle, such as a sort option
- **THEN** its background gets a slight tint, also when it is the selected segment

#### Scenario: Hovering a card
- **WHEN** the pointer is over a recipe card on the home page
- **THEN** the card gets a slight tint and does not move

#### Scenario: Hovering a disabled control
- **WHEN** the pointer is over a disabled button
- **THEN** its colour does not change

### Requirement: Text fields tint under the pointer
The system SHALL, while a mouse pointer is over a text field (input, textarea, or a chips field such as the tags input) that does not have focus, give it the same tint as other controls, whatever the colour of the page behind it. A field with focus keeps its focus look.

#### Scenario: Hovering a field
- **WHEN** the pointer is over a text field that does not have focus, such as the category field on the tags page
- **THEN** its background gets the slight tint

#### Scenario: Hovering a focused field
- **WHEN** the pointer is over a text field that has focus
- **THEN** its background does not change

### Requirement: Text links underline under the pointer
The system SHALL, while a mouse pointer is over a link or button that is only text (such as "Alle recepten", "Bewerk" and "Annuleren"), underline that text. A text link that is already underlined (such as the source of a recipe) SHALL instead change to a slightly different colour.

#### Scenario: Hovering a plain text link
- **WHEN** the pointer is over "Alle recepten" or "Bewerk" on a recipe page
- **THEN** its text is underlined

#### Scenario: Hovering an underlined link
- **WHEN** the pointer is over the source link of a recipe
- **THEN** it stays underlined and its colour changes slightly

### Requirement: Touch screens show no hover
The system SHALL show the hover effects only on devices whose main pointer can hover, so a tap on a touch screen does not leave a control tinted or underlined.

#### Scenario: Touch screen
- **WHEN** a person taps a button on a device that cannot hover
- **THEN** the button keeps its normal colour after the tap
