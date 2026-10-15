// path: docs/PLAN/06_PROVIDER_DOCS_REGISTRY.md
# Payment Processor Documentation Registry (16 processors)

Rules for using this registry:

1. Every URL below is a starting point only. In Step 9, before writing an
   adapter, fetch the processor's own current documentation and record the
   verified URLs and facts in `docs/PROVIDERS/<provider>.md` with the date.
2. Never code an adapter from memory. Never assume a field name, endpoint or
   signature scheme that was not read in that session.
3. Registry entries in `lib/payment/registry.ts` are added only when the
   adapter code exists and its sandbox test evidence is recorded.
4. Adapter paths are fixed by this registry so no step invents a second path.

## 1. Registry table

| No | Processor | Adapter file | Server service | Docs (starting point) | Sandbox or test facts |
| --- | --- | --- | --- | --- | --- |
| 1 | Stripe | `lib/payment/adapters/stripe.ts` | `services/payment/providers/stripe-service.ts` | `https://stripe.com/docs/api` | `https://stripe.com/docs/testing` (test keys, test cards, test clocks) |
| 2 | NMI | `lib/payment/adapters/nmi.ts` | `services/payment/providers/nmi-service.ts` | `https://docs.nmi.com/`, Collect.js `https://docs.nmi.com/docs/collectjs`, index `https://docs.nmi.com/llms.txt` | `https://docs.nmi.com/docs/testing-sandbox` |
| 3 | Adyen | `lib/payment/adapters/adyen.ts` | `services/payment/providers/adyen-service.ts` | `https://docs.adyen.com/` | `https://docs.adyen.com/development-resources/testing/` (test card numbers, test accounts) |
| 4 | Verifone (2Checkout) | `lib/payment/adapters/verifone.ts` | `services/payment/providers/verifone-service.ts` | `https://docs.verifone.com/` | `https://www.verifone.com/development-partner` (sandbox via partner program; verify demo account procedure on docs site) |
| 5 | Braintree (PayPal) | `lib/payment/adapters/braintree.ts` | `services/payment/providers/braintree-service.ts` | `https://developer.paypal.com/braintree/docs` | `https://developer.paypal.com/braintree/help/sandboxHelp` |
| 6 | BlueSnap | `lib/payment/adapters/bluesnap.ts` | `services/payment/providers/bluesnap-service.ts` | `https://developers.bluesnap.com/`, index `https://developers.bluesnap.com/llms.txt` | Sandbox host `https://sandbox.bluesnap.com/services/2/`; test-mode documentation lives in the developer support area, for example `https://support.bluesnap.com/docs/test-subscriptions`; verify the current test-mode page through the index |
| 7 | Square | `lib/payment/adapters/square.ts` | `services/payment/providers/square-service.ts` | `https://developer.squareup.com/docs` | `https://developer.squareup.com/docs/testing/sandbox` |
| 8 | Payoneer | `lib/payment/adapters/payoneer.ts` | `services/payment/providers/payoneer-service.ts` | `https://developer.payoneer.com/docs/payoneer-api-reference`, portal `https://developer.payoneer.com/` | `https://developer.payoneer.com/psd2/get-started`; sandbox hosts include `https://api.sandbox.payoneer.com` and `https://psd2-api.sandbox.payoneer.com/`; PSD2 authorization sandbox `https://login.sandbox.payoneer.com` |
| 9 | FastSpring | `lib/payment/adapters/fastspring.ts` | `services/payment/providers/fastspring-service.ts` | `https://developer.fastspring.com/reference/api-overview` | Test mode with test storefronts: `https://developer.fastspring.com/docs/activate-your-store` (test link pattern `yourstore.test.onfastspring.com`, test card 4242 4242 4242 4242) |
| 10 | Paddle | `lib/payment/adapters/paddle.ts` | `services/payment/providers/paddle-service.ts` | `https://developer.paddle.com/` | `https://developer.paddle.com/sdks/sandbox/`; sandbox API base `https://sandbox-api.paddle.com`; sandbox credentials contain `_sdbx`; test card 4000 0566 5566 5556 |
| 11 | PayPro Global | `lib/payment/adapters/paypro-global.ts` | `services/payment/providers/paypro-global-service.ts` | `https://developers.payproglobal.com/docs/api/overview/` | No separate sandbox account is published; test mode is enabled in the vendor control panel with URL parameters `use-test-mode=true` and a secret key, plus an IPN simulator, documented at `https://developers.payproglobal.com/docs/integrate-with-paypro-global/go-live-checklist/` and `.../webhook-ipn/` |
| 12 | PayPal (standalone) | `lib/payment/adapters/paypal.ts` | `services/payment/providers/paypal-service.ts` | `https://developer.paypal.com/api/rest/` | `https://developer.paypal.com/sandbox-testing/overview` (sandbox accounts and test cards) |
| 13 | Payarc / PaymentCloud | `lib/payment/adapters/payarc.ts` | `services/payment/providers/payarc-service.ts` | `https://docs.payarc.net/`, authentication `https://docs.payarc.net/docs/api-authentication` | Sandbox base URL `https://testapi.payarc.net/v1`, production `https://api.payarc.net/v1`, documented in `https://docs.payarc.net/docs/faq`; PaymentCloud merchant accounts use the same Payarc API surface, verify per account |
| 14 | Rapyd | `lib/payment/adapters/rapyd.ts` | `services/payment/providers/rapyd-service.ts` | `https://docs.rapyd.net/` | `https://docs.rapyd.net/en/environments.html`; sandbox base `https://sandboxapi.rapyd.net`, production `https://api.rapyd.net` |
| 15 | Authorize.Net | `lib/payment/adapters/authorize-net.ts` | `services/payment/providers/authorize-net-service.ts` | `https://developer.authorize.net/api/reference/index.html` | `https://developer.authorize.net/hello_world/sandbox.html`, testing guide `https://developer.authorize.net/hello_world/testing_guide.html` |
| 16 | Custom | `lib/payment/adapters/custom.ts` | `services/payment/providers/custom-service.ts` | Owner-provided gateway documentation uploaded at connect time | Owner-provided sandbox endpoint; connection test performed from the admin console |

## 2. Per-adapter requirements (all 16)

Implement and document, without exception:

1. Capability declaration: currencies, countries, cards, wallets, bank
   transfer, payouts, subscriptions, refunds, partial refunds, 3DS support,
   webhook support, hosted fields, redirect, component, API-only.
2. Modes: which of the four interaction modes the processor supports, plus
   the default mode.
3. Authentication: how credentials are formed, which fields are secret, how
   they are stored encrypted, and how they are verified before enabling.
4. Payment creation: request shape, idempotency key handling, amount as
   `numeric(18,4)` string, currency USD only.
5. Confirmation: synchronous response, redirect return, or webhook, with
   every path implemented and each path idempotent.
6. Refund and void: full and partial, with reason codes stored.
7. Webhook: signature verification method, timestamp tolerance, replay
   prevention, event id deduplication in `webhook_events`.
8. Error mapping: processor error codes mapped to our typed errors and to
   English user messages, with no internal detail leakage.
9. Card data rule: no PAN, expiry or CVV ever received by our servers.
10. Sandbox validation: the exact calls performed, the observed results, and
    the recorded evidence for enabling the processor.

## 3. NMI dual mode specifics

- Collect.js is the default mode. Tokens are single use and expire after
  24 hours. Adapter must implement token collection, server-side charge with
  the token, and token expiry handling.
- Payment Component mode requires an npm package. The request goes through
  the integrator because `package.json` is integrator-owned. Record the
  request text, package name, version and purpose in `docs/PROVIDERS/nmi.md`.
- Both modes converge on the same shared server module that calls the NMI
  REST API. Mode is selected per company, one active mode at a time, and a
  switch requires a successful test in the new mode plus an audit entry.

## 4. Documentation verification protocol (Step 9 execution order)

1. Fetch each provider's docs and record facts in `docs/PROVIDERS/<name>.md`.
2. Write the adapter against the recorded facts.
3. Run the sandbox validation calls and record the results.
4. Register the processor in `lib/payment/registry.ts`.
5. Make the processor connectable in the super admin console.
6. Update this registry table with any corrected URL or fact, citing the page.
