# Security decisions

These architecture decision records (ADRs) distinguish accepted phase constraints from proposed implementation choices.

## ADR-001 — Local assessment before cloud deployment

- **Status:** Accepted for the current phase, 2026-11-24.
- **Context:** The brief requires cloud evidence but authorizes documentation only now and limits spend.
- **Decision:** Build and assess the API locally first. Review the Terraform plan, cost and IAM before requesting explicit deployment approval.
- **Trade-off:** Cloud integration evidence arrives later; early authorization testing is faster and cost-free.

## ADR-002 — Private storage and API-owned authorization

- **Status:** Accepted for the MVP design, 2026-11-26; local owner-scoped path implemented and tested, cloud storage pending.
- **Context:** Clients can guess IDs or supply another user's key.
- **Decision:** Store ownership in DynamoDB and bytes in private S3 after approved deployment. Check authenticated subject against stored policy on every operation. Generate UUIDs and storage keys server-side. Use API-mediated content access, with no presigned URLs in the MVP.
- **Trade-off:** API-mediated transfers simplify authorization but increase Lambda/API cost and constrain file size. Presigned URLs need a separate authorization and expiry design if adopted later.

## ADR-003 — Cognito for cloud identity

- **Status:** Proposed.
- **Context:** Cloud authentication needs a managed issuer; local tests need deterministic synthetic identities.
- **Decision:** Use Cognito in cloud and an isolated local identity adapter for tests. The adapter must not accept a client-chosen subject header as authority or be deployable to AWS. Verify issuer, audience/client, expiry and signature at the chosen cloud integration.
- **Trade-off:** Local identity tests do not prove Cognito integration; cloud negative-token tests remain necessary.

## ADR-004 — Separate OIDC deployment and runtime roles

- **Status:** Proposed.
- **Context:** Long-lived GitHub secrets are avoidable; CI and Lambda need different permissions.
- **Decision:** Restrict OIDC trust by audience, repository and branch/protected environment. Give Lambda a separate role with only required data actions.
- **Trade-off:** OIDC removes static keys but a compromised authorized workflow can still use its role; workflow and policy review remain essential.

## ADR-005 — Bounded scanning and monitoring

- **Status:** Proposed.
- **Context:** Logging, CloudTrail data events and DAST traffic can exceed the cost target or expose sensitive data.
- **Decision:** Use redacted events and short retention, initially focus on management-event audit, and run scoped, rate-limited ZAP only against owned local or approved cloud targets.
- **Trade-off:** Minimal event selection may miss object-level audit detail; record this residual risk and revisit after cost review.

## ADR-006 — Immutable owner, narrow text content, and uniform document 404

- **Status:** Accepted for the MVP design, 2026-11-26; local API behavior implemented and tested, cloud behavior pending.
- **Context:** The API needs a small, testable authorization model with no public vulnerable deployment. User-controlled owner/key fields and guessed IDs create BOLA risk; arbitrary file uploads add content and malware risk.
- **Decision:** Use Alice and Bob as synthetic users; one immutable owner from authenticated identity; no sharing or admin routes. Accept only a JSON `content` string representing UTF-8 text, with a maximum of 100,000 encoded bytes (decimal 100 KB). Reject unknown fields, including owner/role/storage key, and duplicate JSON keys. Return 401 for missing/invalid authentication; for valid document UUIDs, return the same 404 body when a document is absent or belongs to another user. Malformed UUIDs return 400. Do not expose internal storage keys.
- **Trade-off:** Uniform 404 reduces direct existence disclosure but does not remove timing or volume side channels. JSON text is simple and avoids arbitrary file upload handling, but limits document types. API-mediated content adds compute/transfer cost. The 100 KB decimal interpretation and byte-count validation are explicit because Unicode character counts differ from UTF-8 bytes.
- **Evidence required:** [OpenAPI contract](api-contract.yaml), [authorization matrix](authorization-matrix.md), and later positive/negative tests. This ADR records a design decision, not an implemented control.

## ADR-007 — Authenticate before bounded raw JSON parsing

- **Status:** Accepted and implemented for the local API, 2026-11-27.
- **Context:** Express JSON parsing would discard duplicate object keys and decode before the application can reject malformed UTF-8. A 100,000-byte decoded content limit must also allow JSON Unicode escaping, which can make a valid raw request much larger.
- **Decision:** Run authentication before content-type, query, ID, or body validation. For create requests, accept only `application/json` with optional UTF-8 charset; parse at most 1,000,000 raw bytes without compression; decode with fatal UTF-8 checking; reject duplicate top-level keys, unknown fields, invalid Unicode strings and malformed JSON; then enforce 100,000 UTF-8 bytes on decoded content. The raw cap accommodates six-byte `\u0061` escaping of 100,000 ASCII characters plus a bounded envelope. Set `Cache-Control: no-store`, disable Express ETags, and send `X-Content-Type-Options: nosniff` on API responses.
- **Trade-off:** A raw cap permits more bytes than the stored content limit, so sustained request volume still needs rate controls. The purpose-built duplicate-key check is narrow to the one-field MVP schema; expand or replace it if nested request objects are introduced. Compressed request bodies are rejected.
- **Contract change:** [OpenAPI 0.1.1](api-contract.yaml) adds the raw body limit and broadens the 413 description. This documents a separate HTTP bound without changing the 100,000-byte document limit.
- **Evidence:** [API tests](../test/api-security.test.ts) C02, C04–C08 and raw-body limit case; cloud gateway behavior is unverified.

## ADR-008 — Inject identity; isolate the synthetic adapter

- **Status:** Accepted and implemented for the local entry point, 2026-11-27.
- **Context:** A client-selected identity header would make BOLA tests meaningless and could create an accidental deployment bypass.
- **Decision:** The HTTP app accepts an `IdentityProvider` interface that receives only the bearer token. The localhost entry point uses two distinct, environment-supplied synthetic tokens and binds to `127.0.0.1`; tests inject their own provider. Neither the app nor the repository trusts `X-User-Id`, owner, or role headers. No cloud entry point exists in this task.
- **Trade-off:** Local tokens make authorization tests deterministic but prove nothing about JWT cryptography or Cognito claims. A later cloud entry point must inject a separate verified provider and must not import `src/local`.
- **Contract change:** The local OpenAPI server URL now uses `127.0.0.1` to match the actual listener rather than relying on `localhost` DNS resolution.
- **Evidence:** [identity and route code](../src/http/identity.ts), [local adapter](../src/local/identity.ts), and tests C02–C03, L04, M04, R04, D04 plus spoofed-header case.

## ADR-009 — Patch test-runner transitive dependencies narrowly

- **Status:** Accepted for this local toolchain, 2026-11-27.
- **Context:** Initial `npm audit` found one high, three moderate and one low advisory through Mocha 11. Mocha 12 removed the high/low findings but still resolved affected `glob` and `minimatch` versions.
- **Decision:** Use Mocha 12 and exact `glob` 14.0.6 / `minimatch` 11.0.9 overrides in the lockfile. Re-run type checking, tests, `npm ci`, and audit because the overrides cross transitive major ranges.
- **Trade-off:** Future Mocha upgrades may make the overrides unnecessary or incompatible. Review them during dependency maintenance; do not assume a zero-advisory audit proves all dependencies safe.

## Open decisions

| Question | Planning default | Resolve by |
| --- | --- | --- |
| HTTP API or REST API Gateway? | Compare authorization features and current cost | Week 3 |
| DynamoDB capacity and Terraform state storage? | Compare cost/security; never commit state | Week 3 |
| GitHub visibility and CodeQL availability? | Confirm actual repository and plan support | Week 4 |
| Delete order and failure recovery across metadata and object stores? | Specify idempotency, retry and orphan cleanup before cloud deployment | Week 3–5 |
| Rate and total-document limits? | Limit test traffic now; set cloud controls after cost review | Week 3–5 |
| Local synthetic adapter replacement for cloud? | Implement separate JWT-verifying provider and cloud entry point; never import `src/local` | Week 5 |
