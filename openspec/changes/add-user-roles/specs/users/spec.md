## ADDED Requirements

### Requirement: Every user has a role
The system SHALL give every user exactly one role: `user`, `admin` or `superadmin`. A member who has no role of their own SHALL be a `user`, including everyone who joined before roles existed. The role is not asked on the welcome screen.

#### Scenario: New member is a user
- **WHEN** a new member submits a calling name on the welcome screen
- **THEN** their user record has the role `user`

#### Scenario: Existing member is a user
- **WHEN** a member whose user record was made before roles existed is looked up
- **THEN** their role is `user`

#### Scenario: Unknown role is refused
- **WHEN** a role other than `user`, `admin` or `superadmin` is stored for a member
- **THEN** it is refused and nothing is stored

### Requirement: The first superadmin is seeded
The system SHALL make `info@rhythm-coder.dev` a `superadmin` from the moment the database is set up, before that person has signed in. When they then submit the welcome screen, their user record SHALL have the role `superadmin`. Letter case of the address SHALL NOT matter.

#### Scenario: Seeded superadmin
- **WHEN** a fresh database is set up and `info@rhythm-coder.dev` is welcomed as a new member
- **THEN** their user record has the role `superadmin`

#### Scenario: Seeded address in another case
- **WHEN** `Info@Rhythm-Coder.dev` is welcomed as a new member
- **THEN** their user record has the role `superadmin`

### Requirement: Roles define what a member may do
The system SHALL define what each role may do as follows: a `user` may do user things only, an `admin` may do user things and admin things, and a `superadmin` may do user things, admin things, and give or take away the admin role of other members. Everything the cookbook offers today is a user thing. This requirement states the intended meaning of the roles; this change does not check roles on any page or data endpoint, and every signed-in member keeps the access they have today.

#### Scenario: Today's features need no role
- **WHEN** a member with any role opens the home page or a recipe
- **THEN** it is shown as it is today
