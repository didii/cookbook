## MODIFIED Requirements

### Requirement: Recipes can be filtered on author
The system SHALL show a chip per author (each author once, case variants counted as one) plus an "Iedereen" chip. Exactly one chip is selected, "Iedereen" by default, and selecting an author shows only that author's recipes. The chips SHALL appear whenever at least one recipe is stored.

#### Scenario: Choosing an author
- **WHEN** a family member selects the chip "Papa" and Papa has two of five stored recipes
- **THEN** only those two recipes are shown

#### Scenario: Search and author combine
- **WHEN** an author chip is selected and text is typed in the search box
- **THEN** only recipes that match both are shown
