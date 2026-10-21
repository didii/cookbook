## MODIFIED Requirements

### Requirement: Roles define what a member may do
The system SHALL define what each role may do as follows: a `user` may do user things only, an `admin` may do user things and admin things, and a `superadmin` may do user things, admin things, and give or take away the admin role of other members. Everything the cookbook offers today is a user thing, except the parsing rules page, which is an admin thing and is refused with HTTP 403 to a member who is not an `admin` or `superadmin`. No other page or data endpoint checks roles, and every signed-in member keeps the access they have today.

#### Scenario: Today's features need no role
- **WHEN** a member with any role opens the home page or a recipe
- **THEN** it is shown as it is today
