## ADDED Requirements

### Requirement: The photo field can be given an image from elsewhere
The system SHALL let the recipe editor hand the photo field an image that was not chosen on the device, and the photo field SHALL treat it exactly like a chosen photo: shrink it, show it at once, upload it, let it be replaced or removed, and report problems the same way.

#### Scenario: Handed image is shown and uploaded
- **WHEN** the editor hands the photo field an image
- **THEN** it is shown in the field straight away and uploaded, and the recipe can be saved with it

#### Scenario: Handed image replaces the current photo
- **WHEN** the editor hands the photo field an image while it already shows a photo
- **THEN** the field shows the handed image only

#### Scenario: Handed image can be removed
- **WHEN** a family member removes the handed image
- **THEN** the field is empty, as after removing a chosen photo

#### Scenario: Handed image that is unreadable
- **WHEN** the editor hands the photo field something that cannot be read as an image
- **THEN** the field explains that the photo cannot be read and keeps what it showed before
