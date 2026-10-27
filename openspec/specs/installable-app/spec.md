# installable-app Specification

## Purpose
Give every family member easy access to the app by installing it on their phone's home screen like a regular app. Offline access may follow later.

## Requirements

### Requirement: The app can be installed
The system SHALL publish a web app manifest that names the app "Familiekookboek", starts it at `/`, shows it without browser chrome (standalone), uses the colour of the site header as theme colour and the page colour as background, and declares Dutch as its language. Every page, also the welcome screen, SHALL link that manifest and an apple-touch-icon and SHALL set the theme colour, so the browser can offer "Install" and a phone's status bar takes the header colour.

#### Scenario: Manifest names the app
- **WHEN** a browser reads the manifest
- **THEN** it finds the name "Familiekookboek", start URL `/`, display `standalone` and language `nl`

#### Scenario: Manifest uses the site colours
- **WHEN** a browser reads the manifest
- **THEN** the theme colour is the red of the header and the background colour is the page colour

#### Scenario: Pages link the manifest
- **WHEN** any page is rendered
- **THEN** it links the manifest, links the apple-touch-icon and sets the same theme colour as the manifest

### Requirement: The app has icons
The manifest SHALL list a 192 px and a 512 px icon and a maskable 512 px icon whose artwork stays inside the safe zone, and the system SHALL serve a 180 px apple-touch-icon. The icons SHALL be one artwork that is easy to replace without code changes.

#### Scenario: Icons are listed
- **WHEN** a browser reads the manifest
- **THEN** it finds 192 and 512 px icons and a 512 px icon with purpose `maskable`, and each listed file exists

### Requirement: A service worker that stays out of the way
The system SHALL register a service worker for the whole site so browsers that require one offer to install the app. The service worker SHALL NOT cache any response and SHALL NOT answer any request itself, so pages, data and the sign-in redirect of Cloudflare Access always come from the network.

#### Scenario: Service worker is registered
- **WHEN** the app starts in a browser that supports service workers
- **THEN** the service worker is registered with scope `/`

#### Scenario: No service worker support
- **WHEN** the app starts in a browser without service worker support
- **THEN** the app works as before

#### Scenario: Requests are not answered by the service worker
- **WHEN** the service worker sees a request
- **THEN** it does not respond to it and does not store anything
