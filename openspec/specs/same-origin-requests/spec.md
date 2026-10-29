# same-origin-requests Specification

## Purpose
TBD - created by archiving change harden-requests. Update Purpose after archive.

## Requirements

### Requirement: Data-changing requests must come from the app's own origin
The system SHALL refuse with HTTP 403, a body without cookbook content and without reaching the app, every request whose method is not GET, HEAD or OPTIONS when either:

- it has an `Origin` header whose value is not the origin of the request URL (scheme, host and port compared exactly), including the value `null`; or
- it has no `Origin` header and a `Sec-Fetch-Site` header with the value `cross-site`.

Any other request SHALL be handled as before: a data-changing request with a matching `Origin`, or with no `Origin` and no `Sec-Fetch-Site` of `cross-site` (for example from a script), and every GET, HEAD or OPTIONS request whatever its `Origin`.

#### Scenario: Same-origin post is accepted
- **WHEN** a signed-in family member's `POST https://cookbook.example.com/recepten/nieuw` has `Origin: https://cookbook.example.com`
- **THEN** the app handles it

#### Scenario: Other origin is refused
- **WHEN** a signed-in family member's `POST https://cookbook.example.com/recepten/nieuw` has `Origin: https://evil.example.org`
- **THEN** the response is HTTP 403 and the app is not reached

#### Scenario: Origin that differs only in scheme or port is refused
- **WHEN** a `POST https://cookbook.example.com/x` has `Origin: http://cookbook.example.com`, or `Origin: https://cookbook.example.com:8443`
- **THEN** each is refused with HTTP 403

#### Scenario: Null origin is refused
- **WHEN** a `POST` has `Origin: null`
- **THEN** the response is HTTP 403

#### Scenario: Cross-site post without an origin is refused
- **WHEN** a `POST` has no `Origin` header and `Sec-Fetch-Site: cross-site`
- **THEN** the response is HTTP 403

#### Scenario: Every data-changing method is covered
- **WHEN** a `PUT`, `PATCH` or `DELETE` has `Origin: https://evil.example.org`
- **THEN** each is refused with HTTP 403

#### Scenario: Post without browser headers is accepted
- **WHEN** a signed-in member's `POST` has neither `Origin` nor `Sec-Fetch-Site`
- **THEN** the app handles it

#### Scenario: Reading is not restricted
- **WHEN** a signed-in member's `GET` of a page has `Origin: https://evil.example.org`, or a `HEAD` has `Sec-Fetch-Site: cross-site`
- **THEN** the app handles it

#### Scenario: The refusal has the security headers
- **WHEN** a cross-origin `POST` is refused
- **THEN** the 403 response has the headers of the `security-headers` capability
