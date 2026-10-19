# Spec Delta

## Purpose

How a family member gives a recipe a photo from the camera or gallery, how the photo is made small and stored, and how it is shown and served afterwards.

## ADDED Requirements

### Requirement: A photo is chosen from the camera or the gallery
The system SHALL offer in the recipe editor a photo field with one button that lets the family member take a picture or pick one from their device, SHALL show the chosen photo at once, and SHALL let them replace it or remove it. A recipe has at most one photo.

#### Scenario: Chosen photo is shown at once
- **WHEN** a family member chooses a photo
- **THEN** it is shown in the photo field straight away, before the upload has finished

#### Scenario: Photo is stored with the recipe
- **WHEN** a family member chooses a photo and saves the recipe
- **THEN** the recipe is stored with that photo and its page shows it

#### Scenario: Photo can be replaced
- **WHEN** a family member chooses another photo for a recipe that has one and saves
- **THEN** the recipe is stored with the new photo only

#### Scenario: Photo can be removed
- **WHEN** a family member removes the photo and saves
- **THEN** the recipe is stored without a photo

### Requirement: Photos are made small on the device first
The system SHALL shrink a chosen photo in the browser before uploading it, so that its longest side is at most 1600 pixels, SHALL apply the orientation the camera recorded, SHALL NOT enlarge a smaller photo, and SHALL upload it as WebP, or as JPEG where the browser cannot make WebP.

#### Scenario: Large photo is shrunk
- **WHEN** a family member chooses a photo of 4000 by 3000 pixels
- **THEN** the uploaded photo is 1600 by 1200 pixels

#### Scenario: Small photo is not enlarged
- **WHEN** a family member chooses a photo of 800 by 600 pixels
- **THEN** the uploaded photo is still 800 by 600 pixels

#### Scenario: Phone photo keeps its orientation
- **WHEN** a family member chooses a portrait photo taken on a phone, stored sideways with an orientation mark
- **THEN** the uploaded photo is upright

### Requirement: The server accepts only reasonable photos
The system SHALL refuse an uploaded file larger than 2 MB, and a file that is not a JPEG, PNG or WebP image judged by its content and not by its name, SHALL store nothing in that case, and SHALL answer with a status that says which of the two it was.

#### Scenario: Oversized file refused
- **WHEN** a file larger than 2 MB is uploaded
- **THEN** nothing is stored and the response status is 413

#### Scenario: Other file types refused
- **WHEN** a file that is not a JPEG, PNG or WebP image is uploaded, even one named like an image
- **THEN** nothing is stored and the response status is 415

#### Scenario: Acceptable photo is stored
- **WHEN** a JPEG, PNG or WebP image of at most 2 MB is uploaded
- **THEN** it is stored under a name the family member did not choose and the response gives the path it can be fetched at

### Requirement: Stored photos are served to family members only
The system SHALL serve an uploaded photo at the path it was given to signed-in family members only, with caching that lets the browser keep it, and SHALL answer 404 for a path that holds no photo.

#### Scenario: Photo is served
- **WHEN** a signed-in family member opens the path of an uploaded photo
- **THEN** the photo is returned with its image type and a long cache lifetime

#### Scenario: Unknown photo
- **WHEN** a family member opens a photo path that holds no photo
- **THEN** the response status is 404

### Requirement: The photo is shown in the recipe page's frame
The system SHALL show the photo in the editor in the same frame as on the recipe page (same border, shadow and 2:1 proportions, with a tile band beneath), SHALL show nothing but the add button while there is no photo, and SHALL say in text when a photo cannot be loaded.

#### Scenario: Photo in the recipe frame
- **WHEN** a family member opens the editor of a recipe that has a photo, or chooses one
- **THEN** the editor shows it in the same frame as on the recipe page, with a tile band beneath it

#### Scenario: Photo cannot be loaded
- **WHEN** the stored photo cannot be loaded
- **THEN** the editor shows a text saying the photo cannot be shown instead of a broken picture, and the family member can still replace or remove it

### Requirement: Photo problems are explained and do not lose work
The system SHALL say in text when a chosen file cannot be read as an image or the upload failed, SHALL offer to try the upload again, SHALL keep everything else the family member entered, and SHALL NOT let the recipe be saved while an upload is still running or has failed.

#### Scenario: Unreadable file
- **WHEN** a family member chooses a file the browser cannot read as an image
- **THEN** the photo field says so in text and the recipe keeps its previous photo

#### Scenario: Upload fails
- **WHEN** the upload fails, for example without a connection
- **THEN** the photo field says so and offers to try again, and the other fields keep what was entered

#### Scenario: Saving waits for the upload
- **WHEN** a family member uses "Opslaan" while the photo is still uploading
- **THEN** the recipe is not submitted until the upload has finished

### Requirement: A replaced or removed photo is deleted when saving
The system SHALL delete the previously stored uploaded photo of a recipe from storage when a save changes or removes the recipe's photo, and SHALL leave photos that are not uploads, such as the sample images, alone.

#### Scenario: Replaced photo is deleted
- **WHEN** a recipe with an uploaded photo is saved with another photo
- **THEN** the old uploaded photo is no longer stored

#### Scenario: Non-upload images are never deleted
- **WHEN** a recipe whose image is not an uploaded photo is saved with another photo
- **THEN** nothing is deleted from photo storage
