## MODIFIED Requirements

### Requirement: Only admins reach the rules
The system SHALL refuse every request for the rules page, and every request that changes rules, with HTTP 403 when the member's role is not `admin` or `superadmin`, whatever the page showed or hid, and SHALL change nothing for a refused request.

#### Scenario: User opens the page
- **WHEN** a user requests the rules page by address
- **THEN** the response is 403 and no rules are shown

#### Scenario: User posts a change
- **WHEN** a user sends a rules change directly to the server
- **THEN** the response is 403 and the stored rules are unchanged

#### Scenario: Non-admin cannot restore defaults
- **WHEN** a user sends the restore-defaults request directly to the server
- **THEN** the response is 403 and the stored rules are unchanged

#### Scenario: Superadmin opens the page
- **WHEN** a superadmin opens the rules page
- **THEN** the page shows the stored rules, one row per word, in the categories Eenheden, Duur, Graden and Basisproducten

#### Scenario: Admin opens the page
- **WHEN** an admin opens the rules page
- **THEN** the page shows the stored rules, one row per word, in the categories Eenheden, Duur, Graden and Basisproducten

### Requirement: An admin restores the default rules
The system SHALL let an admin restore the default rules with one link-style button "Standaardwaarden herstellen" on the rules page, after the admin confirms, which removes the saved rules and the saved staples.

#### Scenario: Restore defaults
- **WHEN** an admin has saved a unit "kopje" and presses "Standaardwaarden herstellen"
- **THEN** the rules in use are the defaults and "kopje" is no longer a unit

#### Scenario: Restore also restores the staples
- **WHEN** an admin has saved a staple "meel" and presses "Standaardwaarden herstellen"
- **THEN** the default staples are in use and "meel" is no longer a staple

#### Scenario: Restore is confirmed first
- **WHEN** an admin presses "Standaardwaarden herstellen" and declines the confirmation
- **THEN** nothing is sent and the stored rules and staples are unchanged
