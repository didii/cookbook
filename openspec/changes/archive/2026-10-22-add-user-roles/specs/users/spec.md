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
The system SHALL define what each role may do as follows: a `user` may do user things only, an `admin` may do user things and admin things, and a `superadmin` may do user things, admin things, and give or take away the admin role of other members. Everything the cookbook offers today is a user thing. This requirement states the intended meaning of the roles; this change does not check roles on any page or data endpoint, and every signed-in member keeps the access they have today.

#### Scenario: Today's features need no role
- **WHEN** a member with any role opens the home page or a recipe
- **THEN** it is shown as it is today
