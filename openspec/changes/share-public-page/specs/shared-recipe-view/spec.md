# Spec Delta

## Purpose

Defines the public, read-only page of a recipe that can be opened by anyone with its address, without signing in: what it shows, what a visitor can still do on it, and that it never shows anything about the family.

## ADDED Requirements

### Requirement: A recipe has a public page
The system SHALL show at `/share/<slug>`, to anyone and without a verified identity, the page of the stored recipe with that slug, and SHALL answer 404 for a slug that no recipe has.

#### Scenario: Page without identity
- **WHEN** a request without identity proof asks for `/share/<slug>` of a stored recipe
- **THEN** the response is HTTP 200 and shows that recipe

#### Scenario: Unknown recipe
- **WHEN** a request asks for `/share/<slug>` of a slug that no recipe has
- **THEN** the response is HTTP 404

### Requirement: The public page shows the recipe like the recipe page
The system SHALL show on the public page the title, author, time, servings, source, intro, photo with seal or tile band, tags, ingredients and steps of the recipe, the servings control, the cook mode switch and, on a narrow screen, the tabs, with the same look as the recipe page.

#### Scenario: Recipe content
- **WHEN** a visitor opens the public page of a recipe with a photo, tags, ingredients and steps
- **THEN** its title, author, intro, photo, tags, ingredients and steps are shown

#### Scenario: Scaling
- **WHEN** a visitor changes the servings on the public page
- **THEN** the quantities of the ingredients and steps change as on the recipe page

### Requirement: The public page has no member actions
The system SHALL NOT show on the public page the link back to all recipes, the like button, the actions menu, the edit link, the notes, the site header and menu, or links to other pages of the app, and SHALL show the tags as plain labels. A link to the outside address given as the recipe's source SHALL stay.

#### Scenario: No in-app navigation or actions
- **WHEN** a visitor opens the public page
- **THEN** it has no "Alle recepten" link, no like button, no actions menu, no notes, no site header and no link to a page of the app

#### Scenario: Tags are not links
- **WHEN** a visitor opens the public page of a recipe with tags
- **THEN** the tags are shown and none of them is a link

#### Scenario: The source link stays
- **WHEN** a visitor opens the public page of a recipe whose source is a web address
- **THEN** the source is a link to that address

### Requirement: Checking things off and timers work on the public page
The system SHALL let a visitor tick ingredients and steps and start, extend and stop the timers of steps on the public page, with the same behaviour as on the recipe page, without anything being stored on the server.

#### Scenario: Ticking an ingredient
- **WHEN** a visitor ticks an ingredient on the public page
- **THEN** it is shown as ticked

#### Scenario: Starting a timer
- **WHEN** a visitor starts the timer of a step on the public page
- **THEN** the timer counts down as on the recipe page

### Requirement: The public page shows nothing about the family
The system SHALL send for a public page only the fields of the recipe that the page shows, and SHALL NOT include any email address, member name, role, like, note, creator or other recipe, and SHALL NOT record that the recipe was viewed.

#### Scenario: No member data in the response
- **WHEN** a request without identity proof asks for the public page of a recipe that members created, liked and made notes on
- **THEN** the response contains no email address, no member name, no like, no note and no other recipe

#### Scenario: Viewing is not recorded
- **WHEN** a visitor opens the public page of a recipe
- **THEN** no "viewed" marker is stored for any member

### Requirement: Photos on the public page load without identity
The system SHALL serve a stored photo to a GET or HEAD request without a verified identity, and SHALL NOT accept an upload without one.

#### Scenario: Photo without identity
- **WHEN** a request without identity proof asks for a stored photo
- **THEN** the response is the photo

#### Scenario: Upload without identity
- **WHEN** a request without identity proof uploads a photo
- **THEN** the response is HTTP 403 and nothing is stored

### Requirement: The public page can only be read
The system SHALL answer HTTP 403 to a request without identity proof for `/share/…` that is not a GET or HEAD.

#### Scenario: Writing is refused
- **WHEN** a request without identity proof sends a POST to `/share/<slug>`
- **THEN** the response is HTTP 403

### Requirement: The public page may be cached briefly
The system SHALL send `Cache-Control: public, max-age=60` with a successful public page and answer repeated requests for it within that minute from a cache, and SHALL NOT cache a 404.

#### Scenario: Successful page is cacheable
- **WHEN** a visitor opens the public page of a stored recipe
- **THEN** the response has `Cache-Control: public, max-age=60`

#### Scenario: Repeat visits come from the cache
- **WHEN** the same public page is requested twice within a minute
- **THEN** the second response does not read the database

#### Scenario: A 404 is not cached
- **WHEN** a public page answers 404
- **THEN** the response is not stored in the cache
