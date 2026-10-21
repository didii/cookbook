## ADDED Requirements

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

### Requirement: The first superadmin is seeded
The system SHALL make `info@rhythm-coder.dev` a user with the role `superadmin` and the calling name `Dieter` from the moment the database is set up, before that person has signed in. Because their user record already exists, they SHALL NOT see the welcome screen. When that address already belongs to a member, that member SHALL become `superadmin` and keep their calling name. Letter case of the address SHALL NOT matter.

#### Scenario: Seeded superadmin
- **WHEN** a fresh database is set up
- **THEN** a user record for `info@rhythm-coder.dev` exists with the calling name `Dieter` and the role `superadmin`

#### Scenario: Seeded address in another case
- **WHEN** the member `Info@Rhythm-Coder.dev` is looked up
- **THEN** their role is `superadmin`

#### Scenario: Seed promotes an existing member
- **WHEN** `info@rhythm-coder.dev` was already a member with another calling name and the seed is applied
- **THEN** their role is `superadmin` and their calling name is unchanged

#### Scenario: Seeded superadmin is known without the welcome screen
- **WHEN** `info@rhythm-coder.dev` signs in for the first time
- **THEN** they are a known member and are not asked for a calling name

### Requirement: Roles define what a member may do
The system SHALL define what each role may do as follows: a `user` may do user things only, an `admin` may do user things and admin things, and a `superadmin` may do user things, admin things, and give or take away the admin role of other members. Everything the cookbook offers today is a user thing. This requirement states the intended meaning of the roles; this change does not check roles on any page or data endpoint, and every signed-in member keeps the access they have today.

#### Scenario: Today's features need no role
- **WHEN** a member with any role opens the home page or a recipe
- **THEN** it is shown as it is today
