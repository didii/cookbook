## ADDED Requirements

### Requirement: An expired session sends the member to sign in again
The system SHALL, when a request made by the app fails because the Cloudflare Access session has expired, load the current page again as a full page load, so that Access shows its sign-in and returns the member to that page afterwards. The member SHALL NOT be shown the raw failure.

The cause is an expired session when a same-origin request for the current page, made without following redirects, is answered with a redirect.

#### Scenario: Expired session while saving
- **WHEN** a member saves a recipe, their Access session has expired and the save request fails
- **THEN** the page is loaded again and the member reaches the Access sign-in

#### Scenario: Expired session while opening a page
- **WHEN** a member follows a link inside the app, their Access session has expired and the page data request fails
- **THEN** the page is loaded again and the member reaches the Access sign-in

#### Scenario: No connection is not an expired session
- **WHEN** a request fails and the check of the current page also fails because there is no connection
- **THEN** the page is not loaded again and the error page is shown as before

#### Scenario: Other failures are not an expired session
- **WHEN** a request fails and the check of the current page is answered normally
- **THEN** the page is not loaded again and the error page is shown as before

### Requirement: Unsaved edits survive the sign-in
The system SHALL keep the edits of a recipe whose save failed because of an expired session, so that the editor shows them again after the member has signed in.

#### Scenario: Edits come back after signing in
- **WHEN** a member's save fails because their session expired, they sign in again and are returned to the editor
- **THEN** the editor shows the edits they had made, as when a draft is restored after a reload

### Requirement: A note whose save failed is kept and the member signs in again
The system SHALL, when saving the member's note fails and the check of the current page shows an expired session, keep the note text on the device with the stored note it was typed on, and load the current page again so that Access shows its sign-in. If the member already left the page, the text SHALL be kept without loading again, because the page change reaches the sign-in itself. For any other failure nothing SHALL be kept and the note SHALL behave as before.

#### Scenario: Note kept when the session expired
- **WHEN** a member's note save fails and their Access session has expired
- **THEN** the note text is kept on the device and the page is loaded again to reach the Access sign-in

#### Scenario: Note kept when the member left before the save failed
- **WHEN** a member leaves the recipe while their note save is under way, the save fails and their Access session has expired
- **THEN** the note text is kept on the device and the page is not loaded again by the note

#### Scenario: Note failure without an expired session
- **WHEN** a note save fails and the check of the current page shows no expired session (no connection or another cause)
- **THEN** nothing is kept, the page is not loaded again and the note shows that it cannot be saved, as before

### Requirement: A kept note comes back after signing in
The system SHALL, when the member returns to a recipe for which a note text was kept and the stored note is still the one that text was typed on, show the kept text in the note field. The kept copy SHALL be removed once it has been restored.

#### Scenario: Note comes back after signing in
- **WHEN** a member returns to the recipe after signing in again and a note text was kept for it
- **THEN** the note field shows the kept text and the kept copy is removed

### Requirement: A stale kept note is not restored
The system SHALL NOT restore a kept note text when the stored note is no longer the one it was typed on, because the note was changed elsewhere in the meantime. The kept copy SHALL be removed.

#### Scenario: Stale kept note is not restored
- **WHEN** a member returns to the recipe and the stored note differs from the one the kept text was typed on
- **THEN** the kept text is removed and the note field shows the stored note
