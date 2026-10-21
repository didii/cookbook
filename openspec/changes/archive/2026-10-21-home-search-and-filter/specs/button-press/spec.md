# Spec Delta

## Purpose

Gives every button with a hard shadow the same physical feel: it presses into the page while held. One definition, so buttons across the cookbook feel alike.

## ADDED Requirements

### Requirement: Shadowed buttons press in while held
The system SHALL, while a button that rests with a hard offset shadow is held down (mouse button or finger down), move that button down and to the right by the shadow's offset and remove its shadow, so it looks pressed flat into the page. It SHALL return to rest when released.

#### Scenario: Pressing a shadowed button
- **WHEN** a person holds the mouse button or a finger down on a button that has a hard shadow
- **THEN** the button moves down and to the right by its shadow's offset and its shadow is gone while it is held

#### Scenario: Releasing a pressed button
- **WHEN** the person releases the button or moves off it
- **THEN** the button returns to its resting position and shadow

### Requirement: Selected and open states use colour, not position
The system SHALL show a button's selected, expanded or toggled-on state with colour (for example a dark fill with white text), and SHALL NOT leave it pressed in or without its shadow at rest. A disabled button does not respond to a press.

#### Scenario: Expanded button at rest
- **WHEN** a shadowed toggle button is in its expanded state and not being held
- **THEN** it keeps its resting position and shadow and differs from its collapsed state by colour

#### Scenario: Disabled button
- **WHEN** a person presses a disabled button
- **THEN** the button does not move

### Requirement: Reduced motion removes the press animation
The system SHALL, for people whose device asks for reduced motion, not animate the press: the button's shadow and position change at once or not at all.

#### Scenario: Reduced motion preference
- **WHEN** a person who prefers reduced motion presses a shadowed button
- **THEN** the button changes without a transition

### Requirement: Shadowless controls do not press
The system SHALL leave controls that have no hard shadow, such as filter chips and the segments of a segmented toggle, without the press effect.

#### Scenario: Pressing a chip
- **WHEN** a person holds down a filter chip
- **THEN** the chip does not move
