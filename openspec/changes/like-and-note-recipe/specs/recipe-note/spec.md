## ADDED Requirements

### Requirement: A member keeps one private note per recipe
The system SHALL let the signed-in member keep one note of free text per recipe, shown on the recipe page to that member only, for example to remember a tweak. A member without a note for a recipe SHALL see an empty note. The note SHALL be marked as visible to the member only ("Alleen voor jou").

#### Scenario: Recipe without a note
- **WHEN** a member opens a recipe they have no note for
- **THEN** the note is empty and the note button on a narrow screen has no marker

#### Scenario: Recipe with a note
- **WHEN** a member opens a recipe they wrote a note for
- **THEN** the note shows their text and the note button on a narrow screen carries a marker

#### Scenario: Another member's note
- **WHEN** one member has a note for a recipe and another member opens it
- **THEN** the second member sees an empty note

### Requirement: On a narrow screen the note is a floating button with a field
The system SHALL, on a screen narrower than 52rem, show a floating note button at the bottom right of the recipe page, clear of the bottom of the page content and of any timers. Pressing it SHALL open a note field above the button and turn the button into a close button. The field SHALL close when the member taps outside it, presses the button again or presses Escape. The button and the field SHALL have accessible names, and focus SHALL move into the field when it opens and back to the button when it closes.

#### Scenario: Opening the note field
- **WHEN** a member presses the note button on a narrow screen
- **THEN** the note field opens above the button with their note in it, and the button is a close button

#### Scenario: Closing by tapping outside
- **WHEN** the note field is open and the member taps outside it
- **THEN** the field closes

#### Scenario: Closing with the button
- **WHEN** the note field is open and the member presses the button
- **THEN** the field closes

### Requirement: On a wide screen the note is always shown under the ingredients
The system SHALL, on a screen of 52rem or wider, show the note as a panel under the ingredient list, with its text field always visible and no note button. The note SHALL be saved when the member leaves the field.

#### Scenario: Note panel on a wide screen
- **WHEN** a member opens a recipe on a wide screen
- **THEN** the note panel with its field is shown under the ingredients and there is no floating note button

#### Scenario: Leaving the field saves
- **WHEN** a member changes the note on a wide screen and moves focus out of the field
- **THEN** the changed note is stored

### Requirement: A changed note is saved on dismissal and after a pause in typing
The system SHALL store the note for the member and the recipe when the member dismisses the field after changing its text, and also by itself once the member has stopped typing for a while, so no save button is needed. The pause SHALL be 2 seconds on a screen of 52rem or wider and 5 seconds on a narrower screen, where typing is slower. Each change to the text SHALL restart the pause, and a save by dismissal SHALL replace a save that is waiting. The system SHALL store nothing when the text is the same as the text last stored or shown when the field was opened. A note whose text is empty or only whitespace SHALL be removed, so a member without a note has no stored note. The note SHALL be there when the page is opened again.

#### Scenario: Changed note is stored
- **WHEN** a member opens the field, changes the text and dismisses it
- **THEN** the new text is stored and shown when the page is opened again

#### Scenario: Unchanged note is not stored
- **WHEN** a member opens the field and dismisses it without changing the text
- **THEN** nothing is stored

#### Scenario: Autosave after a pause
- **WHEN** a member changes the text and stops typing for the length of the pause
- **THEN** the text is stored without the field being dismissed

#### Scenario: Typing restarts the pause
- **WHEN** a member changes the text, types again before the pause has passed, and then stops
- **THEN** nothing is stored until the pause has passed since the last change

#### Scenario: Autosave waits longer on a narrow screen
- **WHEN** a member changes the note on a narrow screen and 2 seconds pass without typing
- **THEN** the text is not stored yet, and it is stored after 5 seconds

#### Scenario: Dismissing replaces a waiting save
- **WHEN** a member changes the text and dismisses the field before the pause has passed
- **THEN** the text is stored once, at the dismissal

#### Scenario: Wide save failure shows a message
- **WHEN** a member leaves the field on a wide screen and the changed note cannot be stored
- **THEN** the member is told under the field that the note was not saved, the text stays and no cue is shown

#### Scenario: Saving while open shows no cue after dismissing
- **WHEN** a changed note was stored by the pause while the field was open and the member then dismisses the field without further changes
- **THEN** no cue is shown

#### Scenario: Emptied note is removed
- **WHEN** a member deletes all the text of their note and dismisses the field
- **THEN** they have no stored note for the recipe

#### Scenario: Note cannot be saved
- **WHEN** a member dismisses a changed note and it cannot be stored
- **THEN** the text stays in the field, the field stays open, no saved cue is shown and the member is told the note was not saved

#### Scenario: Failed note can be abandoned
- **WHEN** the field was kept open after a failed save and the member dismisses it again and the note still cannot be stored
- **THEN** the field closes, so a note that can never be stored does not trap the member

#### Scenario: Leaving while a save is under way
- **WHEN** a save is still under way, the member types more and then leaves the page
- **THEN** the newest text is sent as well

### Requirement: A note has a maximum length
The system SHALL limit a note to 4000 characters: the field stops typing at the limit and the server SHALL refuse a longer note, and a request body that is clearly too large before reading it, with status 413, storing nothing.

#### Scenario: Note too long
- **WHEN** a note longer than 4000 characters is sent to the server
- **THEN** it is refused with status 413 and nothing is stored

### Requirement: The narrow field says when everything is saved
The system SHALL show under the text of the note field on a narrow screen a hint, "Wordt vanzelf bewaard. Tik buiten het veld om te sluiten.", while the text has changes that are not stored. When the text has been stored since the field was opened and nothing is left to store, the system SHALL show "Bewaard" with a check mark in the place of the hint, announced to assistive technology without taking focus. Opening the field without changing anything SHALL keep the hint, since nothing was stored.

#### Scenario: Hint while there is unsaved text
- **WHEN** a member opens the field on a narrow screen and types
- **THEN** the hint is shown under the text

#### Scenario: Saved replaces the hint
- **WHEN** the text changed while the field was open has been stored and the member has not typed since
- **THEN** "Bewaard" is shown in the place of the hint

#### Scenario: Typing brings the hint back
- **WHEN** "Bewaard" is shown and the member types again
- **THEN** the hint is shown again

#### Scenario: Opening alone shows the hint
- **WHEN** a member opens the field and does not change the text
- **THEN** the hint is shown, not "Bewaard"

### Requirement: A saved cue confirms a real change
The system SHALL show a short cue, "Notitie bewaard", next to the note button on a narrow screen when a changed note was stored while the field was closed, and in the note panel on a wide screen after every stored change, and never when nothing was stored. The cue SHALL be announced to assistive technology without taking focus. It SHALL fade out by itself after a delay, and tapping it SHALL remove it at once. With reduced motion it SHALL disappear without fading.

#### Scenario: Cue after a change
- **WHEN** a changed note has been stored on a wide screen, or on a narrow screen while the field is closed
- **THEN** the cue "Notitie bewaard" is shown

#### Scenario: No cue without a change
- **WHEN** a member opens the field and dismisses it without changing the text
- **THEN** no cue is shown

#### Scenario: Cue fades out
- **WHEN** the cue has been shown for a few seconds
- **THEN** it fades out and is gone

#### Scenario: Tapping the cue removes it
- **WHEN** the cue is shown and the member taps it
- **THEN** it is removed at once

### Requirement: Notes go with their recipe and member
The system SHALL remove the notes of a recipe when the recipe is deleted and the notes of a member when the member is removed.

#### Scenario: Removing a member removes their notes
- **WHEN** a member who wrote notes is removed
- **THEN** no note by that member remains

#### Scenario: Deleting a recipe removes its notes
- **WHEN** a recipe that members wrote notes for is deleted
- **THEN** no note for that recipe remains
