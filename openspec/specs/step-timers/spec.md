# step-timers Specification

## Purpose

Lets a family member run, adjust and be alerted by timers belonging to a recipe's steps.

## Requirements

### Requirement: A step timer can be run and adjusted
The system SHALL let a family member start a timer chip of a step, see its remaining time, add one or five minutes to it, and stop it. Several timers SHALL be able to run at the same time, each on its own.

#### Scenario: Timer is started
- **WHEN** a family member starts a timer of 30 minutes
- **THEN** its remaining time counts down from 30:00

#### Scenario: Time is added
- **WHEN** a family member adds one or five minutes to a running timer
- **THEN** its remaining time grows by that amount

#### Scenario: Timer is stopped
- **WHEN** a family member stops a running timer
- **THEN** it stops counting and shows its start state again

#### Scenario: Timers run side by side
- **WHEN** a family member starts timers in two different steps
- **THEN** both count down independently

### Requirement: A running timer is shown at its step
The system SHALL show a running timer at its step. On a narrow screen it is a card on its own line below the step label with the countdown, the label and the controls (add one minute, add five minutes, hand over to the app where available, stop). On a wide screen the chip stays in place at its normal size and only shows the countdown instead of the duration (and "Klaar" when finished); the controls are in the sidebar.

#### Scenario: Timer card on a narrow screen
- **WHEN** a timer runs on a narrow screen and its step is in view
- **THEN** a card with the countdown and the controls is shown below the step label, and the other chips of the step stay beside the label

#### Scenario: Countdown in the chip on a wide screen
- **WHEN** a timer runs on a wide screen
- **THEN** its chip stays the same size and shows the countdown where the duration was

### Requirement: Running timers stay in view
The system SHALL keep running and finished timers in view while scrolling. On a screen narrower than 52rem a timer whose step is less than half in view below the tab bar is shown in a row directly under the tab bar, on both tabs, with the number of its step and its remaining time (and its label when there is room); the row exists only while it has a timer and scrolls sideways when the timers do not fit. On a wider screen all running and finished timers are listed in a block above the ingredient list, whether or not their step is in view, each with its step number, label, remaining time, add one minute, add five minutes, stop (or mark done when finished) and a control to go to its step. In both places timers SHALL be ordered as their steps appear in the recipe (and by position within a step), not by when they were started, and a timer that is added or changes SHALL NOT make the others move or animate again; only a newly added timer animates in.

#### Scenario: Timer docks when its step leaves the screen
- **WHEN** a timer is running and its step scrolls out of view on a narrow screen
- **THEN** the timer is shown in the row under the tab bar with its step number

#### Scenario: Timer undocks when its step returns
- **WHEN** the step of a docked timer scrolls back into view on a narrow screen
- **THEN** the timer is no longer shown in the row, and the row disappears when it was the last one

#### Scenario: Docked timers on the other tab
- **WHEN** timers are running and the Ingrediënten tab is open on a narrow screen
- **THEN** all running timers are shown in the row

#### Scenario: Timers follow the order of the steps
- **WHEN** a timer of a later step is started before a timer of an earlier step
- **THEN** the timers are listed with the earlier step first

#### Scenario: Only a new timer animates
- **WHEN** a timer is started or time is added while other timers are shown
- **THEN** only the newly shown timer animates in and the others stay still

#### Scenario: Timers in the sidebar on a wide screen
- **WHEN** timers are running on a wide screen
- **THEN** all of them are listed above the ingredients with their controls, whatever the scroll position, and they do not appear or disappear while scrolling

#### Scenario: Go to the step of a timer
- **WHEN** a family member selects the jump control of a timer in the row or the sidebar
- **THEN** the page shows the step the timer belongs to (see recipe-viewing, Going to a step highlights it)

### Requirement: A finished timer is unmistakable
The system SHALL, when a timer reaches zero, mark it as finished with more than colour, play a sound, vibrate where the device supports it, put the number of its step in the page title, and offer adding one minute, adding five minutes or marking it done. A finished timer SHALL stay visible, also in the row under the tab bar or the sidebar, until it is dealt with.

#### Scenario: Timer ends
- **WHEN** a running timer reaches zero
- **THEN** it is marked as finished with its step number, a sound is played, the page title names the step, and the options to add time or finish are offered

#### Scenario: More time after the end
- **WHEN** a family member adds time to a finished timer
- **THEN** it runs again for that time and the finished state, sound and page title are cleared

#### Scenario: Finished timer is dismissed
- **WHEN** a family member marks a finished timer as done
- **THEN** it shows its start state again and the page title is restored

### Requirement: A timer can be handed to the clock app
The system SHALL, on devices where it can start a timer in the phone's clock app, let a family member choose per timer to hand it over: a running timer has an "App" control that starts a timer in the clock app with the time that is left, and replaces the page timer with a note showing what was handed over. The note SHALL offer to take the timer back, and the timer then continues here as if it had never been handed over, and to remove the note, which ends the timer on the page. A setting, kept in the browser and off by default, SHALL hand every timer over as soon as it is started. A handed-over timer is not counted down, docked or signalled by the page, and removing its note does not cancel the clock app's timer. Where the clock app cannot be started, neither the control nor the setting is offered.

#### Scenario: Hand over a running timer
- **WHEN** a family member chooses the clock app control of a timer with 14:32 left
- **THEN** a timer of 14:32 is started in the clock app and the page shows a note that it was handed over with that time, instead of a countdown

#### Scenario: Handover is undone
- **WHEN** a family member hands a timer over to the app by mistake and chooses to take it back
- **THEN** the timer runs on the page again, counting from its original start, and finishes at the time it would have without the hand-over

#### Scenario: Timers handed over automatically
- **WHEN** the setting to use the clock app is on and a family member starts a timer
- **THEN** the timer is started in the clock app right away and only the note is shown

#### Scenario: Clock app not available
- **WHEN** the device cannot start a timer in a clock app
- **THEN** no clock app control and no setting is offered

### Requirement: Timers survive a reload
The system SHALL keep running timers when the page is reloaded in the same browser tab, counting from their end time, so a timer that ended in the meantime is shown as finished.

#### Scenario: Reload during a timer
- **WHEN** a family member reloads the page while a timer runs
- **THEN** the timer is still running with the correct remaining time

#### Scenario: Timer ended while away
- **WHEN** a family member reloads the page after a timer's end time has passed
- **THEN** the timer is shown as finished
