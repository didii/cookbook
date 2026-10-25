## MODIFIED Requirements

### Requirement: An ingredient is typed as one line and split into quantity and name
The system SHALL let a family member type each ingredient as one line, SHALL recognise a leading quantity (a number, a decimal with a comma or point, a fraction such as ½ or 1/2, optionally followed by a known Dutch unit such as g, kg, l, el, tl, snuf or blik) and take the rest as the name, SHALL recognise a line that starts with a loose unit of the recognition rules and no number (such as "scheutje") as a quantity of that unit with amount 1, and SHALL treat any other line without a leading number as a name only.

#### Scenario: Quantity with unit and name
- **WHEN** a family member types "250 g zelfrijzende bloem"
- **THEN** the quantity is "250 g" with amount 250 and unit "g", and the name is "zelfrijzende bloem"

#### Scenario: Quantity without unit
- **WHEN** a family member types "1 ei"
- **THEN** the quantity is "1" with amount 1 and no unit, and the name is "ei"

#### Scenario: Fraction and decimal comma
- **WHEN** a family member types "½ tl zout" or "1,5 l water"
- **THEN** the amounts are 0.5 and 1.5, and the quantities keep the text as typed

#### Scenario: Unknown word after the number is part of the name
- **WHEN** a family member types "2 grote uien"
- **THEN** the quantity is "2" and the name is "grote uien"

#### Scenario: No quantity
- **WHEN** a family member types "bruine suiker"
- **THEN** the quantity is empty and the name is "bruine suiker"

#### Scenario: Loose unit without a number
- **WHEN** a family member types "scheutje rode wijn"
- **THEN** the quantity is "scheutje" with amount 1 and unit "scheutje", and the name is "rode wijn"

#### Scenario: Loose unit with a number
- **WHEN** a family member types "2 scheutje rode wijn"
- **THEN** the quantity is "2 scheutje" with amount 2 and unit "scheutje", and the name is "rode wijn"

#### Scenario: Measure without a number is part of the name
- **WHEN** a family member types "el suiker" and "el" is a unit but not a loose unit
- **THEN** the quantity is empty and the name is "el suiker"

#### Scenario: Loose unit alone has no name
- **WHEN** a family member types "scheutje" and nothing else
- **THEN** the line is refused like any quantity without a name

#### Scenario: Loose unit is a whole word
- **WHEN** a family member types "scheutjeswijn"
- **THEN** the quantity is empty and the name is "scheutjeswijn"

#### Scenario: Removed loose unit is not recognised
- **WHEN** "scheutje" is not a stored loose unit and a family member types "scheutje rode wijn"
- **THEN** the quantity is empty and the name is "scheutje rode wijn"

#### Scenario: Quantity is highlighted while typing
- **WHEN** a family member types an ingredient line with a quantity
- **THEN** the quantity part of the text in the field is shown in a different colour as it is typed
