# users Specification

## Purpose
Keeps a stored record of each family member, made when they first arrive and tell the cookbook what they like to be called, so features that belong to a person (what they have seen, later settings and favorites) have something to attach to.

## Requirements

### Requirement: A new member is welcomed and asked what to call them
The system SHALL, when a signed-in family member without a stored user record opens any page of the cookbook, send them to a welcome screen instead of that page, remembering the page they asked for. The screen welcomes them and asks for their calling name (roepnaam) in a single field.

#### Scenario: First visit
- **WHEN** a signed-in family member who has no user record opens the home page
- **THEN** a welcome screen is shown that asks for their calling name, and the home page is not shown

#### Scenario: Any other page on a first visit
- **WHEN** a signed-in family member who has no user record opens a recipe page
- **THEN** the same welcome screen is shown, and it remembers the recipe page

### Requirement: The calling name creates the user
The system SHALL, when a new member submits a calling name, store a user record holding only an id, their verified email address, the calling name (without surrounding spaces) and the time it was created, and then take them to the page they first asked for, or to the home page when there was none. Email addresses that differ only in letter case SHALL be the same user.

#### Scenario: Submitting the calling name
- **WHEN** a new member enters "Jos" on the welcome screen and submits
- **THEN** a user record exists with their email, the calling name "Jos" and its creation time, and the home page is shown

#### Scenario: Continuing to the first requested page
- **WHEN** a new member who first asked for a recipe page submits a calling name
- **THEN** the recipe page is shown, not the home page

#### Scenario: Remembered page is not on this site
- **WHEN** the remembered page is an address on another site, or is not a path of this cookbook
- **THEN** it is ignored and the home page is shown after submitting

#### Scenario: Same address in another case
- **WHEN** a member whose record exists is later identified by the same address in a different letter case
- **THEN** no second record is created and no welcome screen is shown

### Requirement: A calling name is required
The system SHALL refuse an empty or blank calling name, keep the welcome screen open with a message that a name is needed, and store nothing.

#### Scenario: Blank calling name
- **WHEN** a new member submits the welcome screen with nothing, or only spaces, in the field
- **THEN** the screen stays, says that a calling name is needed, and no user record is created

### Requirement: A known member is not welcomed again
The system SHALL show the cookbook as usual to a member who has a user record, and submitting the welcome screen again SHALL NOT create a second record or change the stored name.

#### Scenario: Returning member
- **WHEN** a member with a user record opens the home page
- **THEN** the home page is shown, not the welcome screen

#### Scenario: Submitting twice
- **WHEN** a member submits the welcome screen a second time, for example from a second tab
- **THEN** there is still one record for them and the first calling name is kept

### Requirement: Refused requests store nobody
The system SHALL NOT store a user record for a request that is refused for lack of verified identity.

#### Scenario: Forged identity
- **WHEN** a request is refused with HTTP 403
- **THEN** no user record is created
