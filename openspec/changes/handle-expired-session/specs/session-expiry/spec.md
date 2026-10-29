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
