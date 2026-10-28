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

### Requirement: Photos that no recipe uses are listed
The system SHALL list the stored photos that are not the image of any recipe or step and that were uploaded more than 24 hours ago, with for each its thumbnail, upload date and size, and SHALL show how many there are and their total size. The list SHALL show the oldest first.

#### Scenario: Unused photo is listed
- **WHEN** a photo was uploaded more than 24 hours ago and no recipe or step uses it
- **THEN** it is in the list with its thumbnail, upload date and size

#### Scenario: Used photo is not listed
- **WHEN** a recipe uses a stored photo as its image
- **THEN** that photo is not in the list

#### Scenario: Photo of a step is not listed
- **WHEN** a step uses a stored photo as its image
- **THEN** that photo is not in the list

#### Scenario: Recent photo is not listed
- **WHEN** a photo was uploaded less than 24 hours ago and no recipe uses it yet
- **THEN** it is not in the list

#### Scenario: Totals
- **WHEN** the list holds photos
- **THEN** the page shows how many photos there are and their total size

#### Scenario: Nothing to remove
- **WHEN** no stored photo is unused
- **THEN** the page says so and offers no delete button

#### Scenario: Oldest first
- **WHEN** the list holds several photos
- **THEN** the oldest upload comes first

### Requirement: An admin can delete unused photos
The system SHALL let an admin delete chosen photos from the list, or all listed photos at once, and SHALL check on the server at that moment that each photo is still unused and old enough, deleting only those that are.

#### Scenario: Chosen photos are deleted
- **WHEN** an admin chooses some listed photos and deletes them
- **THEN** those photos are removed from storage and from the list, and the others stay

#### Scenario: All photos are deleted
- **WHEN** an admin deletes all listed photos
- **THEN** every photo in the list is removed from storage

#### Scenario: Photo used in the meantime
- **WHEN** an admin deletes a photo that a recipe has started to use since the page was opened
- **THEN** that photo is not deleted and the page says it was kept

#### Scenario: Recent photo cannot be deleted
- **WHEN** a request names a photo uploaded less than 24 hours ago
- **THEN** that photo is not deleted

#### Scenario: Unknown name
- **WHEN** a request names something that is not a stored photo
- **THEN** nothing is deleted for that name and the other names are handled as usual

#### Scenario: Deleting asks for care
- **WHEN** an admin starts a delete
- **THEN** the page states that deleted photos cannot be brought back and asks to confirm before deleting

#### Scenario: Result is reported
- **WHEN** a delete has finished
- **THEN** the page says how many photos were deleted and how many were kept
