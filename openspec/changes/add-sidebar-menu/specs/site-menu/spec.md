## ADDED Requirements

### Requirement: The header has a menu with links
The system SHALL show a menu button without border in the upper-left corner of the header of every page that has the header, left of the site name, and SHALL NOT show a "Nieuw recept" button in the header. Activating the menu button SHALL slide in a sidebar from the left, with a black right border, and its links SHALL show a hover effect. The sidebar SHALL slide out again when closed, and SHALL NOT animate for people who prefer reduced motion. The sidebar contains links to the new recipe form ("Nieuw recept"), the user settings ("Instellingen") and the about page ("Over"). The sidebar SHALL close with its close button, the Escape key, a click outside it, or by following one of its links.

#### Scenario: Menu lists the links
- **WHEN** a family member activates the menu button
- **THEN** a sidebar opens with the links "Nieuw recept", "Instellingen" and "Over", each going to its own page

#### Scenario: Menu slides in and out
- **WHEN** the family member opens and closes the sidebar
- **THEN** it slides in from the left and out again, unless they prefer reduced motion

#### Scenario: Menu closes
- **WHEN** the sidebar is open and the family member presses Escape
- **THEN** the sidebar is closed

#### Scenario: Following a link closes the menu
- **WHEN** the sidebar is open and the family member follows "Over"
- **THEN** the about page is shown and the sidebar is closed

### Requirement: Settings and about are placeholders
The system SHALL serve a user settings page and an about page, each with the site header and a banner saying the screen is still being built ("Dit scherm is nog in aanbouw"). They SHALL show nothing else.

#### Scenario: Settings page
- **WHEN** a family member opens the user settings page
- **THEN** the banner that the screen is still being built is shown, and no settings

#### Scenario: About page
- **WHEN** a family member opens the about page
- **THEN** the banner that the screen is still being built is shown, and no other content
