# Cloudflare setup (one-time)

Everything needed to stand the cookbook up from scratch on a Cloudflare account. All config values go in `packages/web/wrangler.jsonc`. Commands run from the repo root.

## 1. Account and domain

1. Create a Cloudflare account and add the domain to it. The cookbook runs on a subdomain of it (currently `cookbook.rhythm-coder.dev`); no DNS record has to be created by hand.
2. Log Wrangler in: `npx -w @cookbook/web wrangler login`.

## 2. Database

1. Run `npx -w @cookbook/web wrangler d1 create cookbook`. Answer "no" if it offers to edit the config.
2. Copy the printed `database_id` into the `d1_databases` entry.
3. Run `npm run db:migrate:remote`.

## 3. Route

Set the subdomain as a custom-domain route:

```jsonc
"routes": [{ "pattern": "cookbook.rhythm-coder.dev", "custom_domain": true }]
```

Keep `workers_dev` and `preview_urls` set to `false`. Those addresses are not covered by Access.

## 4. First deploy

Run `npm run deploy`. Wrangler creates the DNS record for the subdomain.

Until step 6 is done the app answers every request with 403, so deploying before Access exists exposes nothing but the static JS and CSS files. Right after the very first deploy some paths may return a 500 for a few minutes.

## 5. Access

In the Zero Trust dashboard (free plan, up to 50 users):

1. Add the login method: Integrations > Identity providers > Add an identity provider > One-time PIN.
2. Create a self-hosted Access application for the subdomain.
3. Allow only the One-time PIN login method on it.
4. Add an allow policy whose Include rule uses the "Emails" selector and lists the family's addresses.
5. Set the session duration to one month.

## 6. Access values

The app verifies the token Access attaches to each request, and needs two values for that:

| Variable | Value |
|---|---|
| `ACCESS_TEAM_DOMAIN` | The team domain, `<team-name>.cloudflareaccess.com` |
| `ACCESS_AUD` | The Access application's Audience (AUD) tag |

Both can be read from the login redirect instead of the dashboard:

```bash
curl -sI https://cookbook.rhythm-coder.dev/
```

The `Location` header points at the team domain, and its `kid` parameter is the AUD tag.

Put both in `wrangler.jsonc` and run `npm run deploy` again. If either is missing or wrong, signed-in users get a 403 from the app.

## 7. Check

1. Open the site in a private browser window, sign in with an allowed email and the emailed code. The home page shows that email.
2. In another private window, try an email that is not on the policy. No code arrives and no page is shown.
