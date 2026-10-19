# recipe-viewing Specification

## Purpose

Lets a signed-in family member open a stored recipe and read everything needed to cook it.

## Requirements

### Requirement: A recipe page shows the stored recipe
The system SHALL show, at `/recepten/<slug>`, the title, author, intro and image of the stored recipe with that slug, and its preparation time and servings when it has them.

#### Scenario: Existing recipe
- **WHEN** a family member opens the page of a stored recipe
- **THEN** its title, author, time, servings and intro are shown

#### Scenario: Optional fields are empty
- **WHEN** a recipe has no preparation time, no servings or no image
- **THEN** the page still renders, without the missing item

### Requirement: Ingredients and steps are shown in order
The system SHALL list the recipe's ingredients and steps in their stored position order, each ingredient with its quantity text and name.

#### Scenario: Order is kept
- **WHEN** a recipe has several ingredients and steps
- **THEN** both lists appear in the order they were entered

#### Scenario: Ingredient without quantity
- **WHEN** an ingredient has an empty quantity text
- **THEN** it is shown with its name only

### Requirement: Unknown recipe gives not found
The system SHALL respond with a 404 when no recipe has the requested slug.

#### Scenario: Unknown slug
- **WHEN** a family member opens `/recepten/does-not-exist`
- **THEN** the response status is 404

### Requirement: The recipe page links to editing
The system SHALL show on a recipe page a link to the edit form of that recipe.

#### Scenario: Link to the edit form
- **WHEN** a family member opens the page of a stored recipe
- **THEN** a link to `/recepten/<slug>/bewerken` is available

### Requirement: Ingredients and steps are tabs on a narrow screen
The system SHALL, on a screen narrower than 52rem, show the ingredients and the steps as two tabs, Ingrediënten and Bereiding, in a bar that stays at the top of the screen while scrolling, so switching is possible from anywhere on the page. On a wider screen both are shown side by side with the ingredients staying in view while the steps scroll.

#### Scenario: Tabs on a narrow screen
- **WHEN** a family member opens a recipe on a narrow screen
- **THEN** one tab at a time is shown, the tab bar stays visible while scrolling, and the active tab is marked

#### Scenario: Two columns on a wide screen
- **WHEN** a family member opens a recipe on a wide screen
- **THEN** ingredients and steps are shown side by side with no tabs, and the ingredients stay in view while scrolling the steps

#### Scenario: Long ingredient list on a wide screen
- **WHEN** the ingredient column (with any timers above the list) is taller than the window
- **THEN** the timers and the heading stay in place and the ingredient list scrolls by itself, so every ingredient can be reached

### Requirement: Each tab fills the screen
The system SHALL, on a narrow screen, make each tab's content at least as tall as the screen minus the tab bar, so that when the page is scrolled all the way down nothing but the tab bar, the timer row (when there is one) and the tab's content are on screen, and a short list is not left at the bottom of an otherwise empty page.

#### Scenario: Short tab content
- **WHEN** a family member opens a tab with only a few items and scrolls all the way down
- **THEN** the screen shows only the tab bar, the timers (if any) and that tab's content

### Requirement: Each tab remembers its scroll position
The system SHALL, on a narrow screen, remember for each tab the last position the page had while the tab bar was stuck to the top of the screen, that is, while the page was scrolled into the tab's content. Scrolling back up out of that state SHALL keep the remembered position. When switching tabs the system SHALL scroll as follows: to the position remembered for the new tab if there is one; otherwise, if only the tab being left has one, to the uppermost position with the tab bar stuck, which shows the new tab's heading just below the tab bar; otherwise not at all, so the tabs swap in place.

#### Scenario: Position is remembered
- **WHEN** a family member scrolls down the steps, switches to Ingrediënten, scrolls down there and switches back
- **THEN** the steps are shown at the position they were left at, and the same for Ingrediënten when switching again

#### Scenario: Position survives scrolling up
- **WHEN** a family member scrolls down in both tabs, scrolls back up in the open tab until the tab bar is no longer stuck, and switches tabs
- **THEN** the other tab is shown at its remembered position

#### Scenario: First visit of a tab
- **WHEN** a family member scrolls into one tab with the tab bar stuck and switches to the other tab, which has no remembered position
- **THEN** the heading of that tab is shown just below the tab bar

#### Scenario: Tabs swap in place
- **WHEN** a family member switches tabs before scrolling into either tab's content
- **THEN** the page does not scroll

#### Scenario: Ticked ingredients are kept
- **WHEN** a family member ticks ingredients, switches to Bereiding and back
- **THEN** the same ingredients are still ticked

### Requirement: All steps are shown in full
The system SHALL show every step at full reading size, in the same design on every screen size: a small "Stap N" label above the step text, steps separated by a light rule, without a current step and without buttons to go to a previous or next step.

#### Scenario: Steps are all readable
- **WHEN** a family member opens a recipe with several steps
- **THEN** every step is shown in full, in order, with its "Stap N" label, and no step is collapsed or highlighted as current

### Requirement: A step can be dimmed as done
The system SHALL let a family member tap a step to dim it as done and tap it again to undo, as a visual aid only: it is not stored and does not survive a reload. Every step label SHALL show a small square that is empty until the step is done and then holds a check mark, taking the same space in both states so nothing shifts. The state of a step SHALL be available to assistive technology.

#### Scenario: Step is marked done
- **WHEN** a family member taps a step
- **THEN** the step is dimmed, its square shows a check mark, it is announced as done, and tapping it again restores it

#### Scenario: Nothing shifts when a step is done
- **WHEN** a step is marked done
- **THEN** the label, chips and text keep their positions

#### Scenario: Marks are not kept
- **WHEN** a family member marks steps and reloads the page
- **THEN** no step is marked

### Requirement: Steps show their chips
The system SHALL show the chips that belong to a step on the same line as its "Stap N" label, on every screen size: ingredients (quantity and name), an oven temperature (degrees) and timers (see step-timers). Ingredient and oven chips are static, small and quiet (smaller than the step text, muted, no strong background) and look alike; timers are visibly different because they can be operated. When the chips do not all fit beside the label, they SHALL move together to the next line instead of splitting over both lines. A chip SHALL keep its own height beside a taller chip. A step without chips shows just its label. Chips SHALL NOT refer to the recipe's ingredient rows.

#### Scenario: Chips beside the label
- **WHEN** a step has an ingredient, an oven temperature and a timer
- **THEN** all three are shown next to the step label, the ingredient and oven chips in the same quiet style and the timer in a different one

#### Scenario: Many chips
- **WHEN** a step has more chips than fit beside its label
- **THEN** all of them are shown on the line below the label

#### Scenario: Step without chips
- **WHEN** a step has no chips
- **THEN** it is shown with just its label

#### Scenario: Chip without a matching ingredient row
- **WHEN** a step has an ingredient chip that is not in the recipe's ingredient list
- **THEN** the chip is shown as it is

### Requirement: Going to a step highlights it
The system SHALL, when a family member goes to a step from a timer, scroll to that step and highlight it for about three seconds, fading in at once and then out, also when the step was already in view. With reduced motion the highlight is shown steady, without fading.

#### Scenario: Step is highlighted
- **WHEN** a family member selects the jump control of a timer
- **THEN** the page shows the step the timer belongs to and highlights it briefly
