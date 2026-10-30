# site-menu Specification

## Purpose
TBD - created by archiving change add-sidebar-menu. Update Purpose after archive.

## Requirements

### Requirement: The header has a menu with links
The system SHALL show a menu button without border in the upper-left corner of the header of every page that has the header, left of the site name, and SHALL NOT show a "Nieuw recept" button in the header. Activating the menu button SHALL slide in a sidebar from the left, with a black right border, and its links SHALL show a hover effect. The sidebar SHALL slide out again when closed, and SHALL NOT animate for people who prefer reduced motion. The sidebar contains links to the home page ("Home"), the fridge page ("Koelkast"), the new recipe form ("Nieuw recept"), the recipe import page ("Recept importeren"), the tag manager ("Tags"), the user settings ("Instellingen") and the about page ("Over"), in that order. For an `admin` or `superadmin` it also contains "Beheer" (the admin area, which opens on the parsing rules page) after those. For every role the last item is "Uitloggen", which signs the family member out. The sidebar SHALL close with its close button, the Escape key, a click outside it, or by following one of its links.

#### Scenario: Menu lists the links
- **WHEN** a family member with the role `user` activates the menu button
- **THEN** a sidebar opens with the links "Home", "Koelkast", "Nieuw recept", "Recept importeren", "Tags", "Instellingen", "Over" and "Uitloggen", in that order, and no others

#### Scenario: Menu lists the links for an admin
- **WHEN** a member with the role `admin` activates the menu button
- **THEN** the sidebar lists "Home", "Koelkast", "Nieuw recept", "Recept importeren", "Tags", "Instellingen", "Over", "Beheer" and "Uitloggen", in that order, and no "Herkenning", "Foto's" or "Gebruikers"

#### Scenario: Menu lists the links for a superadmin
- **WHEN** a superadmin activates the menu button
- **THEN** the sidebar lists the same links as for an admin, in the same order

#### Scenario: Fridge link
- **WHEN** a family member with any role follows "Koelkast" in the sidebar
- **THEN** the fridge page is shown and the sidebar is closed

#### Scenario: Admin link
- **WHEN** an admin follows "Beheer" in the sidebar
- **THEN** the parsing rules page is shown inside the admin area, and the sidebar is closed

#### Scenario: Home link
- **WHEN** a family member with any role follows "Home" in the sidebar
- **THEN** the home page is shown, the same page the site name in the header leads to, and the sidebar is closed

#### Scenario: Tags link
- **WHEN** a family member with any role follows "Tags" in the sidebar
- **THEN** the tag manager is shown

#### Scenario: Import link
- **WHEN** a family member with any role follows "Recept importeren" in the sidebar
- **THEN** the recipe import page is shown

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

### Requirement: Settings and about are placeholders
The system SHALL serve a user settings page and an about page, each with the site header and a banner saying the screen is still being built ("Dit scherm is nog in aanbouw"). They SHALL show nothing else.

#### Scenario: Settings page
- **WHEN** a family member opens the user settings page
- **THEN** the banner that the screen is still being built is shown, and no settings

#### Scenario: About page
- **WHEN** a family member opens the about page
- **THEN** the banner that the screen is still being built is shown, and no other content
