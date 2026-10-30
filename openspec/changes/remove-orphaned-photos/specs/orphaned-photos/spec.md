## ADDED Requirements

### Requirement: Only admins may use the orphaned photos page
The system SHALL refuse every request for the orphaned photos page and for deleting photos from it, from anyone whose role is not `admin` or `superadmin`, with HTTP 403 and no photo data. This SHALL hold for opening the page and for deleting, whatever the menu shows.

#### Scenario: Admin opens the page
- **WHEN** a member with the role `admin` or `superadmin` opens the orphaned photos page
- **THEN** the page is shown

#### Scenario: User opens the page
- **WHEN** a member with the role `user` opens the orphaned photos page
- **THEN** the response is HTTP 403 and shows no photo data

#### Scenario: User sends a delete
- **WHEN** a member with the role `user` sends a request to delete photos
- **THEN** the response is HTTP 403 and no photo is deleted

### Requirement: Stored photos are listed
The system SHALL list the photos in the photo storage, oldest first and at most 100 at a time, with for each its thumbnail, upload date and size. Two filters, "Ongebruikt" (hides photos that a recipe or step uses) and "Ouder dan 1 dag" (hides photos uploaded less than 24 hours ago), SHALL be on by default and kept in the address; with both off every stored photo is listed.

#### Scenario: Unused photo is listed
- **WHEN** a photo was uploaded more than 24 hours ago and no recipe or step uses it
- **THEN** it is in the list with its thumbnail, upload date and size

#### Scenario: Used photo is hidden by default
- **WHEN** a recipe uses a stored photo as its image and the filter "Ongebruikt" is on
- **THEN** that photo is not in the list

#### Scenario: Photo of a step is hidden by default
- **WHEN** a step uses a stored photo as its image and the filter "Ongebruikt" is on
- **THEN** that photo is not in the list

#### Scenario: Recent photo is hidden by default
- **WHEN** a photo was uploaded less than 24 hours ago and the filter "Ouder dan 1 dag" is on
- **THEN** that photo is not in the list

#### Scenario: Used photo is shown without the filter
- **WHEN** the filter "Ongebruikt" is off
- **THEN** photos that a recipe or step uses are in the list

#### Scenario: Recent photo is shown without the filter
- **WHEN** the filter "Ouder dan 1 dag" is off
- **THEN** photos uploaded less than 24 hours ago are in the list

#### Scenario: Filters are in the address
- **WHEN** an admin turns a filter off
- **THEN** the address holds that choice, and opening that address shows the same list

#### Scenario: Oldest first
- **WHEN** the list holds several photos
- **THEN** the oldest upload comes first

#### Scenario: Only 100 are shown
- **WHEN** more than 100 photos match the filters
- **THEN** the oldest 100 are shown and the page says how many are shown out of how many match

#### Scenario: Nothing to show
- **WHEN** no stored photo matches the filters
- **THEN** the page says so, keeps the filters available and offers no delete button

### Requirement: Used and recent photos are marked
The system SHALL show a muted book icon at the bottom right of the tile of a photo that a recipe or step uses, linking to the recipe that uses it, and SHALL NOT let such a photo be selected. It SHALL show a clock icon in the warning (yellow) colour, not a link, in the same place on the tile of a photo uploaded less than 24 hours ago that no recipe uses. A photo that is both used and recent SHALL show the book.

#### Scenario: Used photo cannot be selected
- **WHEN** the list holds a photo that a recipe uses
- **THEN** its tile has no checkbox and "Alles selecteren" does not take it

#### Scenario: Used photo links to its recipe
- **WHEN** the list holds a photo that a recipe uses
- **THEN** its tile shows a book icon that links to that recipe

#### Scenario: Photo of a step links to its recipe
- **WHEN** the list holds a photo that a step uses
- **THEN** its tile shows a book icon that links to the recipe the step belongs to

#### Scenario: Recent photo shows a clock
- **WHEN** the list holds a photo uploaded less than 24 hours ago that no recipe uses
- **THEN** its tile shows a clock icon without a link and can be selected

#### Scenario: Used and recent shows the book
- **WHEN** the list holds a photo that a recipe uses and that was uploaded less than 24 hours ago
- **THEN** its tile shows the book icon and not the clock

### Requirement: Selection and totals share one line
The system SHALL show above the list, on one line, how many of the selectable listed photos are selected out of how many there are ("2/12 foto's"), the size of the selection out of the total size of the selectable listed photos, and the controls "Alles selecteren" and "Niets". When used photos are listed, the line SHALL also say how many are in use. "Alles selecteren" SHALL select every selectable listed photo. Changing a filter SHALL clear the selection.

#### Scenario: Totals
- **WHEN** the list holds selectable photos
- **THEN** the page shows how many are selected out of how many there are, and the size of the selection out of their total size

#### Scenario: Select all
- **WHEN** an admin chooses "Alles selecteren"
- **THEN** every selectable listed photo is selected and the selection count and size follow

#### Scenario: Select none
- **WHEN** an admin chooses "Niets"
- **THEN** no photo is selected

#### Scenario: Used photos are counted apart
- **WHEN** the list holds photos that a recipe uses
- **THEN** the totals line says how many are in use, and they are not part of the counts or sizes

#### Scenario: Changing a filter clears the selection
- **WHEN** photos are selected and an admin changes a filter
- **THEN** no photo is selected afterwards

### Requirement: An admin can delete chosen photos
The system SHALL let an admin delete the photos they selected, with one button that deletes the selection and no button that deletes everything. The server SHALL check at that moment that each named photo is still not used by any recipe or step, deleting only those that are not. The age of a photo SHALL NOT stop a delete.

#### Scenario: Chosen photos are deleted
- **WHEN** an admin selects some listed photos and deletes them
- **THEN** those photos are removed from storage and from the list, and the others stay

#### Scenario: All listed photos are deleted
- **WHEN** an admin chooses "Alles selecteren" and then deletes the selection
- **THEN** every selectable photo in the list is removed from storage

#### Scenario: Photo used in the meantime
- **WHEN** an admin deletes a photo that a recipe has started to use since the page was opened
- **THEN** that photo is not deleted

#### Scenario: Recent photo can be deleted
- **WHEN** an admin deletes a photo uploaded less than 24 hours ago that no recipe uses
- **THEN** that photo is removed from storage

#### Scenario: Used photo cannot be deleted by request
- **WHEN** a request names a photo that a recipe or step uses
- **THEN** that photo is not deleted

#### Scenario: Unknown name
- **WHEN** a request names something that is not a stored photo
- **THEN** nothing is deleted for that name and the other names are handled as usual

### Requirement: Deleting is confirmed in a dialog
The system SHALL ask for confirmation in a modal dialog titled "Weet je het zeker?" before deleting. It SHALL show the number and total size of the selected photos, and, only when the selection holds a photo uploaded less than 24 hours ago, a warning that its form may still be open. Its buttons are "Annuleer", which has focus, and "Verwijder N foto's". The dialog SHALL close without deleting on "Annuleer", on Escape and on a click outside it.

#### Scenario: Deleting asks to confirm
- **WHEN** an admin chooses "Verwijder selectie"
- **THEN** a dialog shows the number and total size of the selected photos and nothing is deleted yet

#### Scenario: Warning for recent photos
- **WHEN** the selection holds a photo uploaded less than 24 hours ago
- **THEN** the dialog shows the warning "Een foto van minder dan een dag oud hoort misschien bij een formulier dat nog openstaat."

#### Scenario: No warning without recent photos
- **WHEN** the selection holds no photo uploaded less than 24 hours ago
- **THEN** the dialog shows no such warning

#### Scenario: Cancelling
- **WHEN** an admin chooses "Annuleer", presses Escape or clicks outside the dialog
- **THEN** the dialog closes and nothing is deleted

#### Scenario: Confirming
- **WHEN** an admin chooses "Verwijder N foto's" in the dialog
- **THEN** the selected photos are deleted

### Requirement: The result is reported with links to the recipes
The system SHALL answer a delete with how many photos were deleted and, for each photo that was kept because a recipe or step uses it, the title and slug of that recipe. The page SHALL show how many were deleted and, when any were kept, how many, with a link to each recipe that uses them.

#### Scenario: Result is reported
- **WHEN** a delete has finished
- **THEN** the page says how many photos were deleted

#### Scenario: Kept photos link to their recipes
- **WHEN** a delete has finished and some photos were kept because a recipe uses them
- **THEN** the page says how many were kept and links to each of those recipes

#### Scenario: Kept photo shows its recipe
- **WHEN** a photo was kept because a recipe started to use it
- **THEN** it stays in the list marked with the book icon that links to that recipe
