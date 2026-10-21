# Spec Delta

## MODIFIED Requirements

### Requirement: Sign-in needs no account
The system SHALL let a family member sign in using only their email address and a one-time code sent to it, without creating an account or a password anywhere. The only thing a new member is asked, once, after signing in, is what they like to be called.

#### Scenario: First visit by a new family member
- **WHEN** a family member whose email was just added to the allowlist opens the cookbook for the first time
- **THEN** they can sign in with an emailed one-time code and are not asked to register or choose a password, only for their calling name
