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

### Requirement: Every user has a role
The system SHALL give every user exactly one role: `user`, `admin` or `superadmin`. A member who joined without being given a role SHALL be a `user`, including everyone who joined before roles existed. The role is not asked on the welcome screen.

#### Scenario: New member is a user
- **WHEN** a new member submits a calling name on the welcome screen
- **THEN** their user record has the role `user`

#### Scenario: Existing member is a user
- **WHEN** a member whose user record was made before roles existed is looked up
- **THEN** their role is `user`

#### Scenario: Unknown role is refused
- **WHEN** a role other than `user`, `admin` or `superadmin` is stored for a member
- **THEN** it is refused and nothing is stored

### Requirement: The first superadmin is configured
The system SHALL read the email of the first superadmin from configuration. When a new member is created with that email and no superadmin exists yet, they SHALL become `superadmin`; every other new member SHALL become `user`. Letter case of the address SHALL NOT matter. Without a configured email nobody SHALL be promoted. A member who already has a user record SHALL NOT be promoted by this rule.

#### Scenario: Configured email becomes superadmin
- **WHEN** a new member with the configured email is welcomed and no superadmin exists
- **THEN** their user record has the role `superadmin`

#### Scenario: Configured email in another letter case becomes superadmin
- **WHEN** a new member whose email differs from the configured email only in letter case is welcomed and no superadmin exists
- **THEN** their user record has the role `superadmin`

#### Scenario: Configured email is not promoted when a superadmin exists
- **WHEN** a new member with the configured email is welcomed and a superadmin already exists
- **THEN** their user record has the role `user`

#### Scenario: Other emails become users
- **WHEN** a new member with another email than the configured one is welcomed
- **THEN** their user record has the role `user`

#### Scenario: No configured email promotes nobody
- **WHEN** a new member is welcomed and no email is configured
- **THEN** their user record has the role `user`

### Requirement: Roles define what a member may do
The system SHALL define what each role may do as follows: a `user` may do user things only, an `admin` may do user things and admin things, and a `superadmin` may do user things, admin things, and manage users: change any member's calling name and role (including to `superadmin`) and delete members. Everything the cookbook offers today is a user thing, except the parsing rules page, which is an admin thing and is refused with HTTP 403 to a member who is not an `admin` or `superadmin`, and the user management page, which is refused with HTTP 403 to a member who is not a `superadmin`. No other page or data endpoint checks roles, and every signed-in member keeps the access they have today.

#### Scenario: Today's features need no role
- **WHEN** a member with any role opens the home page or a recipe
- **THEN** it is shown as it is today
