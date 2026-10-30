# recipe-import Specification

## Purpose
TBD - created by archiving change import-recipe-from-url. Update Purpose after archive.

## Requirements

### Requirement: A new recipe can be prefilled from a web address
The system SHALL offer a page at `/recepten/importeren` that shows only a field for a web address, and SHALL, when a family member imports it, show the new recipe form, prefilled with the title, intro, servings, preparation time, ingredients, steps and photo found on that page. Nothing SHALL be stored until the form is saved. The author SHALL stay as it was, and the imported address SHALL be filled in as the recipe's source.

#### Scenario: Form is prefilled
- **WHEN** a family member imports the address of a page with a recipe
- **THEN** the form shows that recipe's title, intro, servings, time, ingredients and steps, and no recipe is stored yet

#### Scenario: Source is the imported address
- **WHEN** a family member imports an address
- **THEN** the source field holds that address

#### Scenario: Author is not imported
- **WHEN** a family member imports a recipe that names an author
- **THEN** the author field keeps the value it had before the import

#### Scenario: Ingredients and steps are recognised
- **WHEN** a family member imports a recipe whose ingredients and steps are plain text
- **THEN** the form treats them as if they had been typed: quantities and units in the ingredients are split off, and the steps get the same ingredient, temperature and timer suggestions as typed steps

#### Scenario: Servings are read from text
- **WHEN** the page gives its yield as text such as "4 porties"
- **THEN** the servings field holds 4, and it stays empty when no whole number can be read

#### Scenario: Page without a recipe
- **WHEN** a family member imports an address of a page that holds no recipe data
- **THEN** a message says no recipe was found and the form stays as it was

#### Scenario: Page that cannot be fetched
- **WHEN** a family member imports an address that cannot be reached, is refused, or is not a web page
- **THEN** a message says the page could not be fetched and the form stays as it was

#### Scenario: Address that is not a web address
- **WHEN** a family member imports text that is not an `http://` or `https://` address
- **THEN** a message asks for a web address and nothing is fetched

#### Scenario: Partly filled recipe
- **WHEN** a family member imports a page whose recipe lacks some of the fields
- **THEN** the form is filled with what was found and the other fields stay empty

#### Scenario: Import waits and can be repeated
- **WHEN** an import is running
- **THEN** the import button is disabled and says so, and when it ends with a message the same address can be imported again

#### Scenario: Import is offered only on an untouched form
- **WHEN** the form holds changes the family member made or an earlier import
- **THEN** the import field is not offered and the form is shown, and the import field returns instead of the form when the form is reset

#### Scenario: Form waits for an import
- **WHEN** a family member opens the import page
- **THEN** only the web address field is shown, and the form appears once a recipe is imported. A link next to it leads to the plain new recipe form

#### Scenario: Import is not offered elsewhere
- **WHEN** a family member opens the plain new recipe form or the editor of a stored recipe
- **THEN** it has no import field

#### Scenario: Import page saves like a new recipe
- **WHEN** a family member saves the form of the import page
- **THEN** the recipe is stored as a new recipe, with the same checks as the plain new recipe form

#### Scenario: Imported content is kept as a draft
- **WHEN** a family member imports a recipe and reloads the page
- **THEN** the imported content is restored from the draft like any other unsaved edit

### Requirement: The imported photo goes through the photo field
The system SHALL fetch the image of the imported recipe and give it to the photo field, which SHALL treat it like a chosen photo: shrink it, upload it and show it. A photo that cannot be fetched or used SHALL NOT stop the import.

#### Scenario: Photo is imported
- **WHEN** a family member imports a recipe whose page has an image
- **THEN** the photo field shows that image and the recipe can be saved with it

#### Scenario: Page without an image
- **WHEN** a family member imports a recipe whose page has no image
- **THEN** the form is prefilled and the photo field stays empty

#### Scenario: Image that cannot be used
- **WHEN** the image cannot be fetched, is too large, or is not an image
- **THEN** the form is still prefilled, the photo field stays empty, and a message says the photo was skipped

### Requirement: The server fetches pages and images for the import
The system SHALL offer family members an endpoint that fetches a web page and one that fetches an image on their behalf, because the browser may not read other sites. Each SHALL answer with the fetched bytes only, SHALL read nothing from them and keep nothing, and SHALL serve family members only.

#### Scenario: Page is fetched
- **WHEN** a family member asks for the page at an `https://` address that serves HTML
- **THEN** the HTML is returned

#### Scenario: Image is fetched
- **WHEN** a family member asks for the image at an `https://` address that serves a JPEG, PNG or WebP image
- **THEN** the image bytes are returned

#### Scenario: Not a family member
- **WHEN** a request for either endpoint does not come from a signed-in family member
- **THEN** it is refused like every other request

#### Scenario: Wrong kind of content
- **WHEN** the page endpoint reaches a response that is not HTML, or the image endpoint reaches one that is not a JPEG, PNG or WebP image
- **THEN** the request is refused with a status that says the content was not accepted

### Requirement: The fetch endpoints cannot be used to reach other places
The system SHALL fetch only `http://` and `https://` addresses, SHALL refuse addresses that point at the machine itself or a private network, SHALL apply the same rule to every address a redirect leads to, and SHALL limit redirects, response size and time.

#### Scenario: Other schemes refused
- **WHEN** an address uses a scheme other than `http` or `https`
- **THEN** it is refused and nothing is fetched

#### Scenario: Local and private addresses refused
- **WHEN** an address is `localhost`, a name ending in `.local` or `.internal`, or an IP address in a loopback, private, link-local or otherwise reserved range, in IPv4 or IPv6 notation
- **THEN** it is refused and nothing is fetched

#### Scenario: Address with credentials refused
- **WHEN** an address contains a user name or password
- **THEN** it is refused and nothing is fetched

#### Scenario: Redirect to a refused address
- **WHEN** a page redirects to an address that would have been refused
- **THEN** the redirect is not followed and the request is refused

#### Scenario: Too many redirects
- **WHEN** a page redirects more than five times
- **THEN** the request is refused

#### Scenario: Response too large
- **WHEN** a response is larger than 5 MB for a page or 2 MB for an image, whatever its declared length
- **THEN** reading stops and the request is refused

#### Scenario: Slow site
- **WHEN** a site does not answer within 10 seconds
- **THEN** the request is refused

#### Scenario: Request body is checked
- **WHEN** a request has no address, more than one address, or an address longer than 2,000 characters
- **THEN** it is refused without fetching

### Requirement: Fetching for an import is rate limited
The system SHALL limit how many pages and images one family member can have fetched in a minute.

#### Scenario: Limit reached
- **WHEN** a family member has had more than 30 fetches in the last minute
- **THEN** further requests are refused with a status that asks to wait, until the minute has passed

#### Scenario: Limits are per family member
- **WHEN** one family member has reached the limit
- **THEN** another family member's requests are still served
