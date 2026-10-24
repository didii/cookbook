# Spec Delta

## MODIFIED Requirements

### Requirement: The marker is readable at a glance
The system SHALL show the marker as a small yellow "Nieuw" label with a dark border and hard shadow, in the top-left corner of the card's image, or of the tile band when the card has no image, and SHALL announce it with the card, as part of the card link's description, so that screen reader users also learn the recipe is new.

#### Scenario: Marker on a card with an image
- **WHEN** a card carries the marker
- **THEN** the label "Nieuw" is shown over the top-left of the image and is announced with the card

#### Scenario: Marker on a card without an image
- **WHEN** a card without an image carries the marker
- **THEN** the label "Nieuw" is shown over the top-left of the tile band and is announced with the card
