# cook-mode Specification

## Purpose

Keeps the screen awake while a family member cooks from a recipe on a phone.

## Requirements

### Requirement: Cook mode keeps the screen awake on a narrow screen
The system SHALL offer, on a screen narrower than 52rem, a cook mode that keeps the screen from going to sleep, with a switch directly above the tab bar (not in the bar that stays at the top). The switch SHALL state in text whether the screen stays awake. On a wider screen there is no cook mode.

#### Scenario: Switch on a narrow screen
- **WHEN** a family member opens a recipe on a narrow screen
- **THEN** a switch directly above the tab bar states whether the screen stays awake, and it is not part of the bar that stays at the top

#### Scenario: No cook mode on a wide screen
- **WHEN** a family member opens a recipe on a wide screen
- **THEN** no cook mode switch is shown

### Requirement: Cook mode starts by itself
The system SHALL, until the family member has used the switch, turn cook mode on when cooking has started: the first item of the open tab (the first ingredient on Ingrediënten, the first step on Bereiding) has reached the middle of the screen, or an ingredient has been ticked. It SHALL stay off before that, and SHALL use the same rule whichever tab is open, so switching tabs does not turn it off while the open tab's first item is past the middle of the screen.

#### Scenario: Off on arrival
- **WHEN** a family member opens a recipe
- **THEN** the screen is allowed to sleep

#### Scenario: Starts at the ingredients
- **WHEN** the first ingredient reaches the middle of the screen
- **THEN** cook mode turns on

#### Scenario: Starts at the steps
- **WHEN** the first step reaches the middle of the screen
- **THEN** cook mode turns on

#### Scenario: Starts by ticking
- **WHEN** a family member ticks an ingredient
- **THEN** cook mode turns on

#### Scenario: Switching tabs keeps cook mode on
- **WHEN** cook mode is on while reading the steps and the family member switches to Ingrediënten
- **THEN** cook mode stays on

### Requirement: The switch overrides automatic cook mode
The system SHALL, after the family member has used the switch once, stop switching cook mode by itself for that recipe and follow the switch only. This choice SHALL NOT be stored: reloading the page or opening another recipe starts with automatic cook mode again.

#### Scenario: Turned off by hand
- **WHEN** cook mode is on and the family member turns it off with the switch, then scrolls through the steps
- **THEN** cook mode stays off

#### Scenario: Turned on by hand
- **WHEN** the family member turns cook mode on with the switch before cooking has started
- **THEN** it is on and stays on until the switch is used again

#### Scenario: Choice is not kept
- **WHEN** a family member turned cook mode off by hand and then reloads the page or opens another recipe
- **THEN** cook mode is automatic again

### Requirement: Cook mode is honest about what it can do
The system SHALL show that the screen stays awake only when the device has granted it, say so when cook mode cannot be used or is refused, and let the screen sleep again when the page is left. It SHALL ask again when the page becomes visible again after having been hidden.

#### Scenario: Not supported or refused
- **WHEN** the browser does not support keeping the screen awake or refuses the request
- **THEN** the switch says the screen may still sleep instead of saying it stays awake

#### Scenario: Page hidden and shown again
- **WHEN** cook mode is on and the family member leaves the page for another app and comes back
- **THEN** keeping the screen awake is requested again

#### Scenario: Page is left
- **WHEN** a family member leaves the recipe page
- **THEN** the screen may sleep again
