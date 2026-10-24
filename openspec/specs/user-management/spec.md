# user-management Specification

## Purpose
TBD - created by archiving change add-user-management. Update Purpose after archive.

## Requirements

### Requirement: Only a superadmin may use user management
The system SHALL refuse every request for the user management page and its changes, from anyone whose role is not `superadmin`, with HTTP 403 and no user data. This SHALL hold for opening the page and for saving or deleting, whatever the menu shows.

#### Scenario: Superadmin opens the page
- **WHEN** a superadmin opens the user management page
- **THEN** the page is shown

#### Scenario: Admin opens the page
- **WHEN** a member with the role `admin` opens the user management page
- **THEN** the response is HTTP 403 and shows no user data

#### Scenario: User opens the page
- **WHEN** a member with the role `user` opens the user management page
- **THEN** the response is HTTP 403 and shows no user data

#### Scenario: Non-superadmin asks for an unknown user
- **WHEN** a member who is not a superadmin opens the page of a user that does not exist
- **THEN** the response is HTTP 403, the same as for an existing user, so it does not reveal which users exist

#### Scenario: Non-superadmin saves a change
- **WHEN** a member who is not a superadmin sends a request to change a user
- **THEN** the response is HTTP 403 and the user is unchanged

#### Scenario: Non-superadmin deletes a user
- **WHEN** a member who is not a superadmin sends a request to delete a user
- **THEN** the response is HTTP 403 and the user still exists

### Requirement: The master lists users by email
The system SHALL show on the user management page a list of users sorted by email ascending (letter case ignored), each entry showing the calling name and the email. It SHALL NOT offer filtering, paging or bulk editing. The detail SHALL sit on the same page, below the list, and only when a user is selected.

#### Scenario: Users sorted by email
- **WHEN** the users "zoe@example.com", "Anna@example.com" and "mark@example.com" exist and the superadmin opens the page
- **THEN** the list shows them in the order Anna, mark, zoe

#### Scenario: No user selected
- **WHEN** the superadmin opens the page without selecting a user
- **THEN** only the list is shown, with no detail and no form

### Requirement: The list is capped at 100 users
The system SHALL load at most 100 users, the first 100 by email. When more users exist, the page SHALL say that the list is capped at 100 users.

#### Scenario: Exactly 100 users
- **WHEN** 100 users exist and the superadmin opens the page
- **THEN** all 100 are listed and no cap message is shown

#### Scenario: More than 100 users
- **WHEN** 101 users exist and the superadmin opens the page
- **THEN** only the first 100 by email are listed and the page says the list is capped at 100 users

### Requirement: Selecting a user shows an edit form
The system SHALL show, when the superadmin selects a user in the list, a form in the detail with the user's email (not editable), a field for the calling name and a choice of role (`user`, `admin`, `superadmin`), filled with the stored values. The detail SHALL appear below the list on the same page. The selected entry SHALL be marked as selected, and the selection SHALL be part of the page address.

#### Scenario: Selecting a user
- **WHEN** the superadmin selects the user "Jos" with the role `admin`
- **THEN** the list stays visible, the detail below it shows a form with Jos's email, the calling name "Jos" and the role `admin`, and Jos is marked as selected in the list

#### Scenario: Unknown user
- **WHEN** the superadmin opens the page of a user that does not exist
- **THEN** a "not found" response is shown

### Requirement: Saving changes the user
The system SHALL, when the superadmin saves the form, store the new calling name (without surrounding spaces) and role, keep the user selected and show the stored values. The email SHALL NOT change.

#### Scenario: Save a new calling name
- **WHEN** the superadmin changes the calling name of Jos to "Josje" and saves
- **THEN** Jos is stored with the calling name "Josje" and the list shows "Josje"

#### Scenario: Give the admin role
- **WHEN** the superadmin changes the role of a `user` to `admin` and saves
- **THEN** that user is stored with the role `admin`

#### Scenario: Missing role keeps the role
- **WHEN** a request to save carries a calling name but no role
- **THEN** the calling name is stored and the role is unchanged

#### Scenario: Blank calling name
- **WHEN** the superadmin saves with an empty or blank calling name
- **THEN** the form stays with a message that a calling name is needed, and nothing is stored

#### Scenario: Unknown role
- **WHEN** a request to save carries a role other than `user`, `admin` or `superadmin`
- **THEN** it is refused and nothing is stored

### Requirement: Reset restores the stored values
The system SHALL offer a button "Herstel" that puts the stored calling name and role back in the form without saving.

#### Scenario: Reset the form
- **WHEN** the superadmin changes the calling name in the form and uses "Herstel"
- **THEN** the form shows the stored calling name again and nothing is stored

### Requirement: Deleting a user needs a confirmation
The system SHALL, when the superadmin uses "Verwijderen", open a popup that names the user and offers "Verwijderen" and "Annuleren", and SHALL NOT delete anything until the popup's "Verwijderen" is used. The popup SHALL close without deleting on "Annuleren", on Escape and on a click outside it.

#### Scenario: Popup asks for confirmation
- **WHEN** the superadmin uses "Verwijderen" for a user
- **THEN** a popup naming the user opens with "Verwijderen" and "Annuleren", and the user still exists

#### Scenario: Cancel closes the popup
- **WHEN** the popup is open and the superadmin uses "Annuleren"
- **THEN** the popup closes and the user still exists

#### Scenario: Popup for your own record warns about losing access
- **WHEN** a superadmin uses "Verwijderen" on their own record while another superadmin exists
- **THEN** the popup also says they will lose access to this page

#### Scenario: Popup explains the allowlist
- **WHEN** the popup is open
- **THEN** it says the member can sign in again while their email is on the allowlist, and links to the Cloudflare dashboard where the allowlist is managed

### Requirement: Confirming deletes the user
The system SHALL, when deletion is confirmed, delete the user record and the user's recipe views, keep all recipes, and return to the user management page with no user selected, where the user is no longer listed. When the superadmin deleted their own record, they SHALL be taken to the home page instead, where the welcome screen shows.

#### Scenario: Delete a user
- **WHEN** the superadmin confirms deletion of Jos
- **THEN** Jos no longer exists, the page shows the list without Jos and no selected user, and recipes are unchanged

#### Scenario: Delete own record
- **WHEN** two superadmins exist and one confirms deleting their own record
- **THEN** the record is gone and they are taken to the home page, where the welcome screen asks for their calling name

#### Scenario: Deleted member returns
- **WHEN** a deleted member who is still allowed to sign in opens the cookbook
- **THEN** the welcome screen asks for their calling name again

### Requirement: There is always a superadmin
The system SHALL keep at least one superadmin. It SHALL refuse a change of role or a deletion that would leave no superadmin, for any record. A superadmin SHALL be able to promote another member to `superadmin`, and to demote or delete themselves while another superadmin exists. When no other superadmin exists, the form SHALL show the role of the sole superadmin as fixed and disable "Verwijderen" for their record.

#### Scenario: Sole superadmin selects own record
- **WHEN** the only superadmin selects their own record
- **THEN** the role cannot be changed and "Verwijderen" is disabled, each with a visible reason ("De rol van de enige superadmin kan niet worden gewijzigd", "De enige superadmin kan niet worden verwijderd"), while the calling name can be changed

#### Scenario: Sole superadmin demotion is refused
- **WHEN** a request changes the role of the only superadmin to another role
- **THEN** it is refused and the role is unchanged

#### Scenario: Sole superadmin deletion is refused
- **WHEN** a request deletes the only superadmin
- **THEN** it is refused and the record still exists

#### Scenario: Promote another member
- **WHEN** the superadmin changes the role of another member to `superadmin` and saves
- **THEN** that member is stored as `superadmin`

#### Scenario: Demote self while another superadmin exists
- **WHEN** two superadmins exist and one confirms demoting themselves to `admin`
- **THEN** their role is `admin` and they are taken to the home page

#### Scenario: Two superadmins demote each other
- **WHEN** two superadmins send a request at the same time that demotes the other
- **THEN** at most one of the requests succeeds and one superadmin remains

### Requirement: A disabled control says why
The system SHALL show, next to every control it disables on the user management page, the reason it is disabled as visible text.

#### Scenario: Reason next to a disabled control
- **WHEN** a control on the user management page is disabled
- **THEN** a short message beside it says why, for example "De enige superadmin kan niet worden verwijderd"

### Requirement: Demoting yourself needs a warning
The system SHALL, when a superadmin saves a form that lowers their own role, open a popup that says they will no longer have access to this page, and SHALL NOT save until the popup is confirmed. The popup SHALL close without saving on "Annuleren", on Escape and on a click outside it. Saving a form that does not lower their own role SHALL need no popup.

#### Scenario: Popup warns about losing access
- **WHEN** a superadmin changes their own role to `admin` and saves
- **THEN** a popup says they will lose access to this page, and nothing is stored yet

#### Scenario: Cancel keeps the role
- **WHEN** the warning popup is open and the superadmin uses "Annuleren"
- **THEN** the popup closes and the role is unchanged

#### Scenario: Other saves need no warning
- **WHEN** a superadmin changes only their calling name, or the role of another member, and saves
- **THEN** it is saved without a popup
