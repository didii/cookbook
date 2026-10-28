## MODIFIED Requirements

### Requirement: The header has a menu with links
The system SHALL show a menu button without border in the upper-left corner of the header of every page that has the header, left of the site name, and SHALL NOT show a "Nieuw recept" button in the header. Activating the menu button SHALL slide in a sidebar from the left, with a black right border, and its links SHALL show a hover effect. The sidebar SHALL slide out again when closed, and SHALL NOT animate for people who prefer reduced motion. The sidebar contains links to the new recipe form ("Nieuw recept"), the recipe import page ("Recept importeren"), the tag manager ("Tags"), the user settings ("Instellingen") and the about page ("Over"), in that order. For an `admin` or `superadmin` it also contains "Herkenning" (the parsing rules page) after those, followed by "Foto's" (the orphaned photos page). For a `superadmin` only it also contains "Gebruikers" (the user management page) after "Foto's". For every role the last item is "Uitloggen", which signs the family member out. The sidebar SHALL close with its close button, the Escape key, a click outside it, or by following one of its links.

#### Scenario: Menu lists the links
- **WHEN** a family member with the role `user` activates the menu button
- **THEN** a sidebar opens with the links "Nieuw recept", "Recept importeren", "Tags", "Instellingen", "Over" and "Uitloggen", in that order, and no others

#### Scenario: Menu lists the links for an admin
- **WHEN** a member with the role `admin` activates the menu button
- **THEN** the sidebar lists "Nieuw recept", "Recept importeren", "Tags", "Instellingen", "Over", "Herkenning", "Foto's" and "Uitloggen", in that order, and no "Gebruikers"

#### Scenario: Menu lists the links for a superadmin
- **WHEN** a superadmin activates the menu button
- **THEN** the sidebar lists "Nieuw recept", "Recept importeren", "Tags", "Instellingen", "Over", "Herkenning", "Foto's", "Gebruikers" and "Uitloggen", in that order, and "Gebruikers" leads to the user management page

#### Scenario: Tags link
- **WHEN** a family member with any role follows "Tags" in the sidebar
- **THEN** the tag manager is shown

#### Scenario: Import link
- **WHEN** a family member with any role follows "Recept importeren" in the sidebar
- **THEN** the recipe import page is shown

#### Scenario: Photos link
- **WHEN** an admin follows "Foto's" in the sidebar
- **THEN** the orphaned photos page is shown

#### Scenario: Menu slides in and out
- **WHEN** the family member opens and closes the sidebar
- **THEN** it slides in from the left and out again, unless they prefer reduced motion

#### Scenario: Menu closes
- **WHEN** the sidebar is open and the family member presses Escape
- **THEN** the sidebar is closed

#### Scenario: Following a link closes the menu
- **WHEN** the sidebar is open and the family member follows "Over"
- **THEN** the about page is shown and the sidebar is closed

#### Scenario: Logging out
- **WHEN** a family member activates "Uitloggen"
- **THEN** they are signed out and the sign-in prompt is shown on their next visit instead of the cookbook
