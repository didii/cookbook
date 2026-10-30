# Spec Delta

## Purpose

One shared admin area under `/beheer`: a navigation to the admin pages that stays the same on each of them, and the layout of the page content next to it.

## ADDED Requirements

### Requirement: The admin pages share a navigation
The system SHALL show on each admin page ("Herkenning", "Foto's" and "Gebruikers", including a user's detail) a navigation titled "Beheer" with links to "Herkenning", "Foto's" and "Gebruikers", in that order, and SHALL mark the link of the current page as current.

#### Scenario: Navigation on every admin page
- **WHEN** a superadmin opens the rules page, the photos page or the user management page
- **THEN** the navigation lists "Herkenning", "Foto's" and "Gebruikers", in that order

#### Scenario: Current page is marked
- **WHEN** a superadmin opens the photos page
- **THEN** "Foto's" is marked as the current page and the other links are not

#### Scenario: Link leads to its page
- **WHEN** an admin follows "Foto's" in the navigation
- **THEN** the photos page is shown with the navigation still in place

#### Scenario: Selected user keeps the user link current
- **WHEN** a superadmin opens a user's detail
- **THEN** "Gebruikers" is marked as the current page

### Requirement: The navigation lists only the pages a role may use
The system SHALL show "Gebruikers" in the navigation to a `superadmin` only. "Herkenning" and "Foto's" SHALL be shown to an `admin` and a `superadmin`. This is a convenience: every page still refuses roles it is not for.

#### Scenario: Admin does not see Gebruikers
- **WHEN** an admin opens the rules page
- **THEN** the navigation lists "Herkenning" and "Foto's" and no "Gebruikers"

#### Scenario: Superadmin sees all
- **WHEN** a superadmin opens the rules page
- **THEN** the navigation lists "Herkenning", "Foto's" and "Gebruikers"

### Requirement: The admin area opens on the rules page
The system SHALL send a request for `/beheer` to `/beheer/herkenning`.

#### Scenario: Opening the admin area
- **WHEN** an admin opens `/beheer`
- **THEN** they are sent to the rules page

### Requirement: The navigation sits beside the content on a wide screen and above it on a narrow one
From 64rem wide the system SHALL show the navigation as a column at the left of the page content that stays in view while the page scrolls. Below that width it SHALL show the same list above the content, stacked, and SHALL NOT keep it in view while scrolling.

#### Scenario: Wide screen
- **WHEN** an admin opens an admin page on a screen at least 64rem wide
- **THEN** the navigation is a column left of the content and stays in view while scrolling

#### Scenario: Narrow screen
- **WHEN** an admin opens an admin page on a screen narrower than 64rem
- **THEN** the navigation is above the content, one link under the other, and scrolls away with the page

### Requirement: Bars fixed to the bottom start at the content
The system SHALL start a bar that an admin page fixes to the bottom of the screen (the save bar of the rules page, the delete bar of the photos page) where the page content starts, not under the navigation column.

#### Scenario: Bar beside the navigation
- **WHEN** an admin opens the rules page on a screen at least 64rem wide
- **THEN** the save bar starts at the left edge of the content, right of the navigation column

### Requirement: Pages keep their own content
The system SHALL show the content of each admin page, with its data and behaviour, unchanged inside the shared layout.

#### Scenario: Rules page inside the layout
- **WHEN** an admin opens the rules page
- **THEN** it shows its title, lists and bar as before, next to the navigation
