## ADDED Requirements

### Requirement: Every response carries the security headers
The system SHALL add these headers, with exactly these values, to every response the app sends (pages, data requests, photos, redirects and error responses, including the 403 for a request without identity):

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: same-origin`
- `Permissions-Policy: geolocation=(), microphone=(), payment=(), usb=()`

A header the response already carries SHALL keep the value it has.

#### Scenario: A page has the headers
- **WHEN** a signed-in family member requests `/`
- **THEN** the response has the four headers above with those values

#### Scenario: A photo has the headers
- **WHEN** a signed-in family member requests a stored photo
- **THEN** the response has the four headers above and its own `Content-Type` is unchanged

#### Scenario: A refusal has the headers
- **WHEN** a request without identity proof is refused with 403
- **THEN** the 403 response has the four headers above

#### Scenario: A header the response already has is kept
- **WHEN** the app produces a response with `X-Content-Type-Options: nosniff` and `Cache-Control: private, max-age=31536000, immutable`
- **THEN** the response still has both, once each

### Requirement: Pages carry a Content-Security-Policy
The system SHALL send a `Content-Security-Policy` header on every HTML page response, with these directives and no others:

- `default-src 'self'`
- `script-src 'self' 'nonce-<nonce>'`
- `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`
- `font-src https://fonts.gstatic.com`
- `img-src 'self' data: blob:`
- `connect-src 'self'`
- `manifest-src 'self'`
- `worker-src 'self'`
- `object-src 'none'`
- `base-uri 'self'`
- `form-action 'self'`
- `frame-ancestors 'none'`

`<nonce>` SHALL be a new random value (at least 128 bits, base64) for every response, and SHALL be the `nonce` attribute of every inline `<script>` in that page. No directive SHALL contain `'unsafe-eval'`, and `script-src` SHALL NOT contain `'unsafe-inline'`.

#### Scenario: Page has the policy
- **WHEN** a signed-in family member requests `/`
- **THEN** the response has a `Content-Security-Policy` header with exactly the directives above

#### Scenario: Nonce differs per response
- **WHEN** a signed-in family member requests `/` twice
- **THEN** the two `Content-Security-Policy` headers contain different nonces

#### Scenario: Inline scripts carry the nonce
- **WHEN** a signed-in family member requests `/`
- **THEN** every inline `<script>` in the HTML has a `nonce` attribute equal to the nonce in that response's `Content-Security-Policy` header

#### Scenario: No unsafe script sources
- **WHEN** a signed-in family member requests `/`
- **THEN** the `script-src` directive contains neither `'unsafe-inline'` nor `'unsafe-eval'`, and no directive contains `'unsafe-eval'`

#### Scenario: The app cannot be framed
- **WHEN** a signed-in family member requests `/`
- **THEN** the policy contains `frame-ancestors 'none'` and the response has `X-Frame-Options: DENY`

#### Scenario: The page still works under the policy
- **WHEN** a signed-in family member opens a recipe in a real browser
- **THEN** the page hydrates, the Mulish font loads, photos show and the browser console reports no Content-Security-Policy violation
