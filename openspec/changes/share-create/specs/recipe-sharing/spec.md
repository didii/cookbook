# Spec Delta

## Purpose

Lets a family member make a link to a recipe that anyone who has it can open, controlled by that member: created with one action, reused when asked for again, with an end date they can change.

## ADDED Requirements

### Requirement: Deel opens a popup with the share link
The system SHALL open a popup when the menu item "Deel" is chosen, and SHALL show in it the link of the signed-in member's share of that recipe, in the form `<address of the app>/share/<token>`. The popup SHALL close with its close button, the Escape key or a click outside it.

#### Scenario: Deel shows the link
- **WHEN** a family member chooses "Deel" for a recipe they have not shared
- **THEN** a popup opens that shows a link of the form `<address of the app>/share/<token>`

#### Scenario: The popup closes
- **WHEN** the share popup is open and the family member presses Escape
- **THEN** the popup closes

### Requirement: A member has one share per recipe
The system SHALL keep at most one share per recipe per member, SHALL create it when the member first shares the recipe, SHALL show the same link every time the member opens the popup while the share has not expired, and SHALL give another member their own share and link of the same recipe.

#### Scenario: The first share creates a link
- **WHEN** a family member shares a recipe for the first time
- **THEN** one share of that recipe and member is stored, without an end date

#### Scenario: Opening again shows the same link
- **WHEN** a family member opens the share popup of a recipe twice and the share has not expired
- **THEN** the same link is shown both times and still only one share is stored

#### Scenario: Another member has their own link
- **WHEN** two family members share the same recipe
- **THEN** they are shown different links

### Requirement: Links cannot be guessed
The system SHALL make the token of a share at least 128 bits of randomness and SHALL NOT derive it from the recipe or the member.

#### Scenario: Tokens are long and different
- **WHEN** shares of two recipes are created
- **THEN** their tokens each have at least 22 characters, differ from each other and contain neither slug

### Requirement: An expired share gets a new link
The system SHALL, when a member opens the popup of a recipe whose share of theirs has expired, replace that share with one with a new token and no end date, and SHALL NOT make the old token valid again.

#### Scenario: Expired share is replaced
- **WHEN** a family member opens the share popup of a recipe whose share of theirs ended yesterday
- **THEN** a different link is shown, the share has no end date, and the old token is no longer stored

#### Scenario: A live share is not replaced
- **WHEN** a family member opens the share popup of a recipe whose share of theirs ends tomorrow
- **THEN** the same link is shown and the end date is unchanged

### Requirement: The link can be shared or copied
The system SHALL show next to the link a button "Deel" that opens the device's share sheet with the link when the device has one, and otherwise a button "Kopieer link" that copies the link and says it was copied.

#### Scenario: Device with a share sheet
- **WHEN** the popup is open on a device that supports sharing
- **THEN** a button "Deel" is shown, no copy button, and pressing it offers the link to the share sheet

#### Scenario: Device without a share sheet
- **WHEN** the popup is open on a device that does not support sharing
- **THEN** a button "Kopieer link" is shown and pressing it puts the link on the clipboard and shows that it was copied

### Requirement: The end date can be chosen
The system SHALL offer a dropdown with the choices "24 uur", "7 dagen", "1 maand", "6 maanden", "1 jaar" and "Nooit", SHALL select "Nooit" for a share that was just created, and SHALL store the end date at once when a choice is made: that long after the moment of choosing, or no end date for "Nooit". A month or year is a calendar month or year, ending on the last day of the month when that day does not exist.

#### Scenario: The choices
- **WHEN** a family member has just shared a recipe for the first time
- **THEN** the dropdown offers "24 uur", "7 dagen", "1 maand", "6 maanden", "1 jaar" and "Nooit", in that order, with "Nooit" selected

#### Scenario: A choice is stored at once
- **WHEN** a family member chooses "7 dagen"
- **THEN** the share ends seven days after that moment, without any further action

#### Scenario: Nooit removes the end date
- **WHEN** a family member whose share ends tomorrow chooses "Nooit"
- **THEN** the share has no end date

#### Scenario: A month ends on the last day when needed
- **WHEN** a family member chooses "1 maand" on 31 January
- **THEN** the share ends on the last day of February

### Requirement: A saved choice is confirmed
The system SHALL show a checkmark after a choice was stored, SHALL make it fade away after a few seconds (and disappear without fading for people who prefer reduced motion), and SHALL show an error and keep the earlier end date when storing fails.

#### Scenario: Checkmark after a choice
- **WHEN** a family member chooses an end date and the server accepts it
- **THEN** a checkmark is shown and is gone after a few seconds

#### Scenario: A failed choice keeps the earlier date
- **WHEN** a family member chooses an end date and the server refuses it
- **THEN** an error is shown and the end date shown is the one it was before

### Requirement: The end date is shown
The system SHALL show the actual end date of the share as "Verloopt op <date>", or "Verloopt nooit" without one, and SHALL update it when a choice is stored.

#### Scenario: End date after a choice
- **WHEN** a family member chooses "1 jaar"
- **THEN** the popup shows "Verloopt op" followed by the date one year from now

#### Scenario: No end date
- **WHEN** the popup shows a share without an end date
- **THEN** it shows "Verloopt nooit"

### Requirement: An existing share starts closed
The system SHALL, when the popup opens on a share that already existed, show its end date and a button "Wijzig" instead of the dropdown, and SHALL show the dropdown without any choice selected after "Wijzig" is pressed, so that every choice, including the one matching the stored date, is stored when made.

#### Scenario: Existing share shows date and Wijzig
- **WHEN** a family member opens the popup of a recipe they shared a day ago with the end date "7 dagen"
- **THEN** the end date and a button "Wijzig" are shown and the dropdown is not

#### Scenario: Wijzig shows the dropdown without a choice
- **WHEN** the family member presses "Wijzig"
- **THEN** the dropdown is shown with no choice selected

#### Scenario: Any choice is stored
- **WHEN** the family member then chooses the same period as before
- **THEN** the end date is stored again from that moment

### Requirement: Only the owner changes a share
The system SHALL refuse to change the end date of a share that is not the signed-in member's own, and of a share that has expired.

#### Scenario: Another member's share is refused
- **WHEN** a family member sends a change of the end date for a recipe they have no share of, whether or not another member has
- **THEN** the response is 404 and no share changed

#### Scenario: An expired share is refused
- **WHEN** a family member sends a change of the end date of their share that has expired
- **THEN** the response is 404 and the share is unchanged

#### Scenario: Unknown choice is refused
- **WHEN** a family member sends a choice that is not one of the six
- **THEN** the response is 400 and the share is unchanged

### Requirement: Shares go with their recipe and member
The system SHALL delete the shares of a recipe when that recipe is deleted, and the shares of a member when that member is deleted.

#### Scenario: Deleting a recipe deletes its shares
- **WHEN** a recipe with two shares is deleted
- **THEN** no share of it remains

#### Scenario: Deleting a member deletes their shares
- **WHEN** a member with shares is deleted
- **THEN** none of their shares remain and the recipes remain
