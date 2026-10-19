# Spec Delta

## MODIFIED Requirements

### Requirement: Unsaved changes are shown and guarded
The system SHALL show in the bar while the editor differs from its starting values that the changes are not saved and, when the draft is kept on the device, that it is kept there ("Concept bewaard op dit apparaat"). It SHALL ask for confirmation before the family member leaves the page, by a link or by closing or reloading it, only while the draft could not be kept on the device. After a successful save, when nothing was changed, or while the draft is safely kept, it SHALL NOT ask.

#### Scenario: Unsaved indicator
- **WHEN** a family member changes any field
- **THEN** the bar shows "Niet opgeslagen" and, while the draft is kept, "Concept bewaard op dit apparaat", and both disappear when the values equal the starting values again

#### Scenario: Leaving when the draft could not be kept asks first
- **WHEN** a family member with unsaved changes whose draft could not be kept on the device follows a link to another page
- **THEN** they are asked whether to leave and stay on the editor when they decline

#### Scenario: Leaving with a kept draft does not ask
- **WHEN** a family member with unsaved changes whose draft is kept on the device leaves the page
- **THEN** they are not asked anything and their changes are still there when they come back

#### Scenario: Leaving without changes does not ask
- **WHEN** a family member who changed nothing, or who has just saved, leaves the page
- **THEN** they are not asked anything
