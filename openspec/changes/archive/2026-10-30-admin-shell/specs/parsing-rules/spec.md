## ADDED Requirements

### Requirement: The rules sections fold
The system SHALL show each section of the rules page (Eenheden, Duur, Graden, Basisproducten) under a heading that opens and closes it, and SHALL show every section closed when the page opens. Closing a section SHALL only hide it: the rows in it, as typed, stay part of the form and are saved with the other lists.

#### Scenario: Sections start closed
- **WHEN** an admin opens the rules page
- **THEN** the four section headings are shown and none of their lists is

#### Scenario: Open a section
- **WHEN** an admin activates the heading "Duur"
- **THEN** the durations list is shown

#### Scenario: Close a section
- **WHEN** an admin activates the heading of an open section
- **THEN** its list is hidden

#### Scenario: Folding keeps the typed rows
- **WHEN** an admin adds a unit, closes the section "Eenheden" and saves
- **THEN** the unit is saved with the other lists

#### Scenario: Refused save opens the section
- **WHEN** a save is refused with a message on a row in "Graden"
- **THEN** the section "Graden" is open and shows the message, and a section without a message is closed

## REMOVED Requirements

### Requirement: Admins see the rules menu link
**Reason**: The site menu has one link "Beheer" for the admin area, and the admin navigation holds "Herkenning" (see `site-menu` and `admin-nav`).
**Migration**: Use the "Beheer" link in the site menu, which opens the rules page.
