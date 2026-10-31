# Spec Delta

## ADDED Requirements

### Requirement: Public recipe pages ask not to be indexed
The system SHALL add the header `X-Robots-Tag: noindex, nofollow` to every response for an address under `/share/`, including a 404.

#### Scenario: Public page is not indexed
- **WHEN** a request asks for the public page of a stored recipe
- **THEN** the response has `X-Robots-Tag: noindex, nofollow`

#### Scenario: A missing public page is not indexed
- **WHEN** a request asks for a public page that answers 404
- **THEN** the response has `X-Robots-Tag: noindex, nofollow`

#### Scenario: Other pages carry no such header
- **WHEN** a signed-in family member requests `/`
- **THEN** the response has no `X-Robots-Tag` header
