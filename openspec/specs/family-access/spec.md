# family-access Specification

## Purpose

Keeps the cookbook private to the family: defines who can reach it, how they sign in without creating an account, and how the app knows which family member is making each request.

## Requirements

### Requirement: Access is limited to allowlisted family members
The system SHALL allow only people whose email address is on the family allowlist to reach any page of the cookbook.

#### Scenario: Allowlisted member signs in
- **WHEN** a person opens the cookbook, enters an allowlisted email address and then enters the one-time code sent to that address
- **THEN** the cookbook page they requested is shown

#### Scenario: Unknown email is refused
- **WHEN** a person opens the cookbook and enters an email address that is not on the allowlist
- **THEN** no page of the cookbook is shown to them

### Requirement: Sign-in needs no account
The system SHALL let a family member sign in using only their email address and a one-time code sent to it, without creating an account or a password anywhere.

#### Scenario: First visit by a new family member
- **WHEN** a family member whose email was just added to the allowlist opens the cookbook for the first time
- **THEN** they can sign in with an emailed one-time code and are not asked to register or choose a password

### Requirement: Sign-in persists on a device
The system SHALL keep a family member signed in on a device for at least 30 days after signing in, without asking for a new code.

#### Scenario: Returning within the session period
- **WHEN** a signed-in family member reopens the cookbook on the same device and browser a week later
- **THEN** the cookbook is shown without a sign-in prompt

### Requirement: The app knows the signed-in member
The system SHALL establish the verified email address of the signed-in family member for every request and make it available to the page being rendered.

#### Scenario: Home page shows who is signed in
- **WHEN** a signed-in family member opens the home page
- **THEN** the page shows their own email address

### Requirement: Requests without verified identity are refused
The system SHALL respond with HTTP 403 and no cookbook content to any request that does not carry a valid, verifiable proof of a signed-in family member, on every address at which the app is reachable.

#### Scenario: Request with no identity proof
- **WHEN** a request reaches the app with no identity proof attached
- **THEN** the response is HTTP 403 and contains no cookbook content

#### Scenario: Forged identity
- **WHEN** a request reaches the app claiming an allowlisted email address but without a validly signed identity proof for it
- **THEN** the response is HTTP 403 and contains no cookbook content

#### Scenario: Expired identity proof
- **WHEN** a request reaches the app with an identity proof whose validity period has ended
- **THEN** the response is HTTP 403 and contains no cookbook content

### Requirement: Development identity is confined to local development
The system SHALL allow a developer to run the app locally as a configured stand-in member without signing in, and SHALL ignore any such stand-in identity when deployed.

#### Scenario: Local run with a stand-in member
- **WHEN** a developer runs the app locally with a stand-in email address configured
- **THEN** the home page shows that email address without any sign-in step

#### Scenario: Stand-in identity configured on a deployed app
- **WHEN** the deployed app has a stand-in email address configured and receives a request with no identity proof
- **THEN** the response is HTTP 403
