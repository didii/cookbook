## MODIFIED Requirements

### Requirement: Ingredients and steps are tabs on a narrow screen
The system SHALL, on a screen narrower than 52rem, show the ingredients and the steps as two tabs, Ingrediënten and Bereiding, in a bar that stays at the top of the screen while scrolling, so switching is possible from anywhere on the page. On a wider screen both are shown side by side and nothing stays in view while scrolling: the timers, the ingredient list and the note scroll away with the page, which is the only thing that scrolls.

#### Scenario: Tabs on a narrow screen
- **WHEN** a family member opens a recipe on a narrow screen
- **THEN** one tab at a time is shown, the tab bar stays visible while scrolling, and the active tab is marked

#### Scenario: Two columns on a wide screen
- **WHEN** a family member opens a recipe on a wide screen
- **THEN** ingredients and steps are shown side by side with no tabs, and the ingredients scroll away with the page like the steps

#### Scenario: Long ingredient list on a wide screen
- **WHEN** the ingredient column (with any timers above the list and the note under it) is taller than the window
- **THEN** the whole page scrolls and every ingredient can be reached, without the ingredient list scrolling by itself
