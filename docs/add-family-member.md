# Add or remove a family member

Access to the cookbook is an email allowlist in Cloudflare. Nothing in the repo changes, and no deploy is needed.

## Add

1. Open the Zero Trust dashboard and go to the policy attached to the `cookbook` Access application (Access > Policies).
2. Add the person's email address to the Include rule ("Emails" selector).
3. Save.

They can now open the site, enter their email, and sign in with the 6-digit code sent to it. They need no Cloudflare account and no password, and they stay signed in on that device for a month.

## Remove

1. Remove their email from the same Include rule and save.
2. To cut off a session that is still active, revoke it under the Zero Trust user list.

## Not the right place

- **Account members** (Manage account > Members) invites someone to administer the Cloudflare account. That requires a Cloudflare account and is not needed for using the cookbook.
- **The Zero Trust user list** only shows who has signed in; people appear there after their first login.
