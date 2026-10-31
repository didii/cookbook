## MODIFIED Requirements

### Requirement: A running timer is shown at its step
The system SHALL show a running timer at its step. On a narrow screen it is a card on its own line below the step label with the countdown, the label and the controls (add one minute, add five minutes, stop). On a wide screen the chip stays in place at its normal size and only shows the countdown instead of the duration (and "Klaar" when finished); the controls are in the sidebar.

#### Scenario: Timer card on a narrow screen
- **WHEN** a timer runs on a narrow screen and its step is in view
- **THEN** a card with the countdown and the controls is shown below the step label, and the other chips of the step stay beside the label

#### Scenario: Countdown in the chip on a wide screen
- **WHEN** a timer runs on a wide screen
- **THEN** its chip stays the same size and shows the countdown where the duration was

## REMOVED Requirements

### Requirement: A timer can be handed to the clock app
**Reason**: Starting a timer in the phone's clock app does not work reliably and cannot be made to work simply.
**Migration**: None. Timers run on the page only.
