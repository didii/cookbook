# Spec Delta

## Purpose

How a step gets its ingredient, oven temperature and timer chips while a family member writes it: chips that follow the step's words automatically, chips pinned by hand, and the rules that tie a chip to the words it came from.

## ADDED Requirements

### Requirement: A timer is recognised from the step text
The system SHALL recognise a duration written in Dutch in a step ("30 minuten", "1,5 uur", "een half uur", "een kwartier", "anderhalf uur", "20-25 minuten") as the step's timer, in whole minutes, using the lower value of a range, and SHALL give a step at most one timer: the first duration in its text.

#### Scenario: Minutes become a timer
- **WHEN** a step's text contains "30 minuten", "30 min" or "30 minuut"
- **THEN** the step gets a timer of 30 minutes tied to those words

#### Scenario: Hours and fractions of hours
- **WHEN** a step's text contains "2 uur" or "1,5 uur"
- **THEN** the timer is 120 and 90 minutes

#### Scenario: Spoken amounts
- **WHEN** a step's text contains "een half uur", "een kwartier" or "anderhalf uur"
- **THEN** the timer is 30, 15 and 90 minutes

#### Scenario: A range uses its lower value
- **WHEN** a step's text contains "20-25 minuten"
- **THEN** the timer is 20 minutes

#### Scenario: Text without a duration has no timer
- **WHEN** a step's text contains no duration, or only a number such as "30 gram"
- **THEN** the step gets no timer

#### Scenario: Only the first duration is a timer
- **WHEN** a step's text contains "10 minuten" and later "20 minuten"
- **THEN** the step's timer is 10 minutes and the second duration gets no chip

### Requirement: An oven temperature is recognised from the step text
The system SHALL recognise a temperature written as a number of 50 to 300 followed by "graden", "°C", "°" or "gr" as the step's oven temperature, and SHALL give a step at most one: the first one in its text.

#### Scenario: Degrees become an oven temperature
- **WHEN** a step's text contains "180 graden", "180 °C" or "180°C"
- **THEN** the step gets an oven temperature of 180 tied to those words

#### Scenario: Implausible numbers are ignored
- **WHEN** a step's text contains "3 graden" or "1500 graden"
- **THEN** the step gets no oven temperature

#### Scenario: Only the first temperature counts
- **WHEN** a step's text contains "180 graden" and later "200 graden"
- **THEN** the oven temperature is 180 and the second gets no chip

### Requirement: An ingredient is recognised by its name in the step text
The system SHALL give a step an ingredient chip for each ingredient of the recipe whose name it mentions, matching the last word of the ingredient's name against the words of the step regardless of letter case, singular or plural ("ei" and "eieren", "appel" and "appels", "ui" and "uien"), preferring the longest name when several ingredients share a word, and SHALL give a step one chip per ingredient.

#### Scenario: Name in the text creates an ingredient chip
- **WHEN** a step's text contains "bloem" and the recipe has the ingredient "250 g zelfrijzende bloem"
- **THEN** the step gets an ingredient chip for that ingredient tied to the word "bloem"

#### Scenario: Plurals match
- **WHEN** a step's text contains "eieren" or "uien" and the recipe has the ingredients "ei" and "ui"
- **THEN** the step gets chips for both

#### Scenario: The longest name wins
- **WHEN** a recipe has "boter" and "koude boter" and a step's text contains "koude boter"
- **THEN** the chip is for "koude boter" and is tied to both words

#### Scenario: Other words create nothing
- **WHEN** a step's text contains no ingredient name of the recipe
- **THEN** the step gets no ingredient chips

#### Scenario: An ingredient is chipped once per step
- **WHEN** a step's text mentions the same ingredient twice
- **THEN** the step has one chip for it, tied to the first mention

### Requirement: An ingredient chip shows the amount that belongs to the step
The system SHALL show on an ingredient chip, in this order of preference, the amount written in the step directly before the name ("100 g boter"), else the quantity of the ingredient's row in the list when no other step mentions that ingredient, else the name alone, and SHALL keep the chip following the list when a row is renamed or its quantity changes, and SHALL drop a following chip whose row is removed.

#### Scenario: Amount written before the name
- **WHEN** a step's text contains "100 g boter" and the ingredient list has "150 g boter"
- **THEN** the chip shows "100 g boter" and is tied to all of "100 g boter"

#### Scenario: Amount from the list when only this step uses the ingredient
- **WHEN** only one step mentions "bloem" and the list has "250 g zelfrijzende bloem"
- **THEN** that step's chip shows "250 g zelfrijzende bloem"

#### Scenario: No amount when several steps use the ingredient
- **WHEN** two steps mention "boter" without an amount
- **THEN** both chips show "boter" without an amount

#### Scenario: A changed list amount updates the chips
- **WHEN** a family member changes "250 g bloem" to "300 g bloem" in the list and a following chip uses that amount
- **THEN** that chip shows "300 g bloem" and a pinned chip keeps its own amount

#### Scenario: A removed or renamed list row updates the chips
- **WHEN** a family member removes an ingredient's row from the list, or renames it so it no longer matches the step's words
- **THEN** a following chip for it is removed and a pinned chip keeps its values but stops following the list

### Requirement: Following chips are created, changed and removed by the text
The system SHALL create a following (automatic) chip when the words of a step start to say something a chip can show, SHALL change it while the words change, SHALL remove it when the words are removed or no longer say it, SHALL NOT take focus or interrupt typing when it does so, and SHALL keep a step's chips and their words together when the step is moved.

#### Scenario: Typing a duration creates a timer chip
- **WHEN** a family member types "30 minuten" in a step that has no timer
- **THEN** a following timer chip of 30 minutes appears and focus stays in the text

#### Scenario: Editing the words updates the chip
- **WHEN** a family member changes "30 minuten" to "45 minuten" in a step with a following timer chip
- **THEN** the same chip now shows 45 minutes

#### Scenario: Removing the words removes the chip
- **WHEN** a family member deletes the words of a following chip
- **THEN** the chip disappears

#### Scenario: Chips travel with their step
- **WHEN** a step with chips is moved up or down
- **THEN** its chips and their marked words move with it unchanged

### Requirement: The words of a chip are followed through every edit
The system SHALL follow the words a chip is tied to (its anchor) through edits by the replaced range of each edit and not by position: text before the anchor moves it, text inside stretches it, text typed exactly at either edge stays outside, an edit that cuts into an edge shrinks the anchor to what remains, replacing all of the anchor's words keeps the anchor on the new words, and deleting them loses the anchor.

#### Scenario: Text before an anchor moves it
- **WHEN** characters are typed or deleted before an anchor
- **THEN** the anchor still covers the same words

#### Scenario: Text inside an anchor stretches it
- **WHEN** a character is typed inside the words of an anchor
- **THEN** the anchor still covers all of its words, including the new character

#### Scenario: Text typed at an edge stays outside
- **WHEN** a character is typed directly before the first or directly after the last character of an anchor
- **THEN** the anchor does not include it

#### Scenario: Characters that take two code units shift by two
- **WHEN** an emoji is typed before an anchor
- **THEN** the anchor still covers the same words

#### Scenario: Replacing an edge cuts the anchor back
- **WHEN** a selection that covers the end of an anchor and the text after it is replaced
- **THEN** the anchor covers only the words that remain and not the new text

#### Scenario: Replacing all of an anchor's words keeps the anchor on the new words
- **WHEN** all the words of an anchor are selected and replaced by other text
- **THEN** the anchor covers the new text

#### Scenario: Deleting an anchor's words loses it
- **WHEN** all the words of an anchor are deleted or cut
- **THEN** the anchor is lost

#### Scenario: Anchors survive random edits elsewhere
- **WHEN** a long series of random insertions, deletions and replacements that never touch an anchor's words is applied to a step
- **THEN** the anchor always covers the same words it covered at the start

### Requirement: A chip can follow the text or be pinned
The system SHALL let every chip that has anchor words either follow the text (automatic) or be pinned (manual). A pinned chip SHALL keep its values whatever the text says; when its words change it SHALL show the new values as a proposed change that can be accepted or discarded, and when its words no longer say it, or are gone, it SHALL show a proposed removal that can be accepted or discarded. Changing a value in the chip's popup pins the chip.

#### Scenario: Pinning freezes the values
- **WHEN** a family member pins a following chip
- **THEN** the chip keeps its current values, whatever happens to the text

#### Scenario: A pinned chip proposes changes instead of making them
- **WHEN** the words of a pinned timer chip of 30 minutes are changed to "45 minuten"
- **THEN** the chip still holds 30 minutes and shows 45 minutes as a proposed change

#### Scenario: Accepting a proposed change
- **WHEN** a family member accepts the proposed change
- **THEN** the chip holds the new values, is still pinned, and shows no proposal

#### Scenario: Discarding a proposed change
- **WHEN** a family member discards the proposed change
- **THEN** the chip keeps its values and the same proposal is not shown again until the words change again

#### Scenario: A pinned chip proposes its removal
- **WHEN** the words of a pinned chip are deleted, or edited so that they no longer say a timer, temperature or ingredient
- **THEN** the chip stays and is shown as proposed for removal

#### Scenario: Accepting a proposed removal
- **WHEN** a family member accepts the proposed removal
- **THEN** the chip is removed and leaves no ghost

#### Scenario: Discarding a proposed removal
- **WHEN** a family member discards the proposed removal
- **THEN** the chip stays, pinned and without anchor words

#### Scenario: Following the text again
- **WHEN** a family member switches a pinned chip that still has anchor words back to following the text
- **THEN** the chip takes the values the words say and follows them from then on

#### Scenario: Editing a value pins the chip
- **WHEN** a family member changes the minutes, degrees, quantity or name of a following chip in its popup
- **THEN** the chip is pinned with the new value

#### Scenario: Hand-made chips cannot follow the text
- **WHEN** a chip was added by hand and has no anchor words
- **THEN** it is pinned and its popup offers no way to follow the text

### Requirement: Clicking a chip opens a popup that explains and edits it
The system SHALL open, when a chip is clicked, a popup for that chip with the fields of its kind (minutes and name for a timer; degrees for an oven; quantity and name for an ingredient), a choice between following the text and being pinned with a short explanation of both, and a way to remove the chip. Clicking the chip's link or pin icon SHALL switch between following and pinned and open the popup. Escape SHALL close it and return focus to the chip.

#### Scenario: Clicking a chip opens its popup
- **WHEN** a family member clicks a chip
- **THEN** a popup with that chip's fields, the follow or pinned choice and a remove action opens next to it

#### Scenario: Clicking the icon switches the mode and opens the popup
- **WHEN** a family member clicks the link icon of a following chip, or the pin icon of a pinned chip that has anchor words
- **THEN** the chip switches to the other mode and its popup opens

#### Scenario: The popup explains the two modes
- **WHEN** the popup is open
- **THEN** it says in text what following and pinned mean, including that a pinned chip only proposes changes

#### Scenario: Escape closes the popup
- **WHEN** a family member presses Escape in the popup
- **THEN** it closes and focus returns to the chip

### Requirement: Chips can be used from the keyboard
The system SHALL make the chips of a step one Tab stop, with the left and right arrow keys moving between them, SHALL open a chip's popup with Enter or Space, SHALL offer every action of the mode button inside the popup, and SHALL NOT make the icon button of each chip a separate Tab stop.

#### Scenario: Chips are one tab stop
- **WHEN** a family member tabs through a step with several chips
- **THEN** the chips are reached as one stop and the left and right arrow keys move between them

#### Scenario: Enter opens the popup
- **WHEN** a family member presses Enter or Space on a focused chip
- **THEN** its popup opens, and the follow or pinned choice in it does everything the icon button does

### Requirement: A removed chip that had anchor words can be brought back
The system SHALL, when a chip that has anchor words is removed, leave a ghost of it in the step's add row, shown only while that step is hovered or has focus; using the ghost SHALL bring the chip back following its words. The text SHALL NOT create the chip again by itself while the ghost exists, and the ghost SHALL disappear when its words are deleted. Removing a chip without anchor words SHALL leave nothing.

#### Scenario: Removing an anchored chip leaves a ghost
- **WHEN** a family member removes a chip that has anchor words
- **THEN** the chip is gone, its words stay in the text unmarked, and a ghost of the chip is in the step's add row

#### Scenario: A ghost is shown only while its step is active
- **WHEN** a step with a ghost is neither hovered nor has focus
- **THEN** the ghost is not visible but its space is kept

#### Scenario: Restoring a ghost
- **WHEN** a family member uses a ghost
- **THEN** the chip is back, following its words, and the ghost is gone

#### Scenario: A ghost is not recreated by the text
- **WHEN** the words of a ghost are still in the text and the text is edited elsewhere
- **THEN** no new chip appears for those words

#### Scenario: A ghost disappears with its words
- **WHEN** the words of a ghost are deleted
- **THEN** the ghost is gone

#### Scenario: Removing a hand-made chip leaves nothing
- **WHEN** a family member removes a chip that was added by hand
- **THEN** the chip is gone and no ghost remains

### Requirement: Chips can be added by hand
The system SHALL show under each step's chips an add row on its own line, always taking its space so nothing moves when it appears, with buttons to add an ingredient, an oven temperature or a timer, SHALL create such a chip pinned and without anchor words, SHALL open its popup, and SHALL offer an oven or timer button only while the step has neither a chip nor a ghost of that kind.

#### Scenario: The add row keeps its space
- **WHEN** a family member moves from one step to another
- **THEN** no step changes height and nothing on the page moves

#### Scenario: A hand-made chip is pinned and has no words
- **WHEN** a family member adds a timer with the add button and fills in 15 minutes
- **THEN** the step has a pinned timer chip of 15 minutes without anchor words

#### Scenario: One oven and one timer per step
- **WHEN** a step already has an oven chip or a timer chip, or a ghost of one
- **THEN** the add row does not offer another of that kind

### Requirement: Anchor words are marked in the text
The system SHALL mark the words a following chip is tied to with a yellow underline and the words of a pinned chip with a blue underline, SHALL fill the marked words with the same colour while their chip is hovered or has focus, and SHALL mark nothing for chips without anchor words, ghosts and discarded proposals.

#### Scenario: Following and pinned chips are marked differently
- **WHEN** a step has a following and a pinned chip with anchor words
- **THEN** the following one's words have a yellow underline and the pinned one's a blue underline

#### Scenario: Hovering a chip fills its words
- **WHEN** a family member hovers a chip, or focuses it with the keyboard
- **THEN** its words in the text are filled with the colour of their underline

### Requirement: Chips are saved with their step
The system SHALL store with each step its chips as they stand: a following chip with the values its words say and a pinned chip with its pinned values, ignoring open proposals so that the old value is kept, together with a timer's name.

#### Scenario: Chips are stored with their step
- **WHEN** a family member saves a recipe whose steps have ingredient, oven and timer chips
- **THEN** each step is stored with those chips, and the recipe page shows them

#### Scenario: A pinned chip is saved with its pinned values
- **WHEN** a pinned chip shows a proposed change and the recipe is saved
- **THEN** the stored chip has the pinned values and not the proposed ones

#### Scenario: The timer's name does not pin it
- **WHEN** a following timer chip is given a name such as "Deeg rust"
- **THEN** it still follows the text, and the name is stored and shown when the recipe is opened again

### Requirement: Stored chips are tied to their words again when editing
The system SHALL, when a stored recipe is opened for editing, tie each stored chip to its words again: a chip equal to what its words say follows the text, any other chip is pinned, and a chip whose words cannot be found is pinned without anchor words. A timer's name SHALL NOT count in the comparison.

#### Scenario: A stored chip that matches its text follows it
- **WHEN** a recipe is opened whose step text says "30 minuten" and whose stored timer is 30 minutes
- **THEN** the timer chip follows the text

#### Scenario: A stored chip that differs is pinned
- **WHEN** a recipe is opened whose step text says "30 minuten" but whose stored timer is 40 minutes
- **THEN** the timer chip is pinned at 40 minutes with a proposed change to 30

#### Scenario: A stored chip without matching words is pinned without words
- **WHEN** a recipe is opened whose stored chip has no words in the step's text that could say it
- **THEN** the chip is pinned and has no anchor words

### Requirement: Open proposals are counted and reachable
The system SHALL show in the save bar the number of proposed changes and removals that are open, as a link that moves focus to the next one, and SHALL NOT show anything when there are none. Open proposals SHALL NOT stop the recipe from being saved.

#### Scenario: Suggestions are counted in the save bar
- **WHEN** two pinned chips have an open proposal
- **THEN** the save bar says "2 voorstellen open", and nothing about proposals while there are none

#### Scenario: The count jumps to the next suggestion
- **WHEN** a family member uses the "voorstellen open" link
- **THEN** focus moves to the first chip with an open proposal, and then to the next on each use

### Requirement: The ingredient list shows where each ingredient is used
The system SHALL show under each ingredient row in the editor "Gebruikt in stap" followed by the numbers of the steps that have a chip for that ingredient, and nothing when no step does.

#### Scenario: Usage line lists the steps
- **WHEN** the ingredient "zout" has chips in steps 1 and 5
- **THEN** the line under its row says "Gebruikt in stap 1, 5"

#### Scenario: Unused ingredient has no usage line
- **WHEN** no step has a chip for an ingredient
- **THEN** no usage line is shown under its row
