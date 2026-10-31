# Spec Delta

## MODIFIED Requirements

### Requirement: Access is limited to allowlisted family members
The system SHALL allow only people whose email address is on the family allowlist to reach any page of the cookbook, except the public page of a recipe and the stored photos (see `shared-recipe-view`).

#### Scenario: Allowlisted member signs in
- **WHEN** a person opens the cookbook, enters an allowlisted email address and then enters the one-time code sent to that address
- **THEN** the cookbook page they requested is shown

#### Scenario: Unknown email is refused
- **WHEN** a person opens the cookbook and enters an email address that is not on the allowlist
- **THEN** no page of the cookbook is shown to them

### Requirement: Requests without verified identity are refused
The system SHALL respond with HTTP 403 and no cookbook content to any request that does not carry a valid, verifiable proof of a signed-in family member, on every address at which the app is reachable, except a GET or HEAD request for the public page of a recipe (`/share/…`) or for a stored photo (`/foto/…`).

#### Scenario: Request with no identity proof
- **WHEN** a request reaches the app with no identity proof attached
- **THEN** the response is HTTP 403 and contains no cookbook content

#### Scenario: Forged identity
- **WHEN** a request reaches the app claiming an allowlisted email address but without a validly signed identity proof for it
- **THEN** the response is HTTP 403 and contains no cookbook content

#### Scenario: Expired identity proof
- **WHEN** a request reaches the app with an identity proof whose validity period has ended
- **THEN** the response is HTTP 403 and contains no cookbook content

#### Scenario: Public page needs no identity proof
- **WHEN** a request with no identity proof asks for the public page of a recipe
- **THEN** the response is not refused with 403

#### Scenario: Other pages stay closed
- **WHEN** a request with no identity proof asks for the home page, a recipe page, a data request of one or any non-GET request to `/share/…`
- **THEN** the response is HTTP 403 and contains no cookbook content
