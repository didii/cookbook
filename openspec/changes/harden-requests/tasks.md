# Tasks

Verify each task with the type check and `pnpm test:ai`; `pnpm test:spec harden-requests` lists the delta scenarios still without a test.

## 1. Static headers

- [x] 1.1 In `handler.ts` add the four headers to every response `createFetch` returns, the 403s included, only when the response lacks them; test "A page has the headers", "A refusal has the headers" and "A header the response already has is kept" in `handler.test.ts`
- [x] 1.2 Test "A photo has the headers" against the real photo route with in-memory R2 (the `Content-Type` stays)

## 2. Content-Security-Policy

- [x] 2.1 Add `src/app/entry.server.tsx` (from the default Web entry): random nonce per request, `nonce` on `ServerRouter`, `Content-Security-Policy` with the directives of the spec on `responseHeaders`; unit-test the policy builder for "Page has the policy", "Nonce differs per response", "No unsafe script sources", "The app cannot be framed"
- [x] 2.2 Render a page through the entry and test "Inline scripts carry the nonce"; pass the nonce to `Scripts` and `ScrollRestoration` in `root.tsx` if the router does not
- [ ] 2.3 `test.todo` "The page still works under the policy" (needs a browser), then check it by hand with `pnpm dev`: recipe page, editor with photo preview, cook mode, installed app; also submit a form with an expired Access session and confirm the Access login page is reached; no CSP violations in the console

## 3. Same-origin requests

- [x] 3.1 In `handler.ts` refuse unsafe-method requests with a foreign `Origin`, `Origin: null`, or no `Origin` and `Sec-Fetch-Site: cross-site`, with 403 and without calling the request handler; tests for every scenario of `same-origin-requests` in `handler.test.ts`

## 4. Wrap-up

- [x] 4.1 Run `pnpm format:fix`, `pnpm lint:fix`, then `pnpm format:check`, `pnpm lint:check`, `pnpm test:ai` and `pnpm test:spec harden-requests`; all clean
