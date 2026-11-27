# Security decisions

These architecture decision records (ADRs) distinguish accepted phase constraints from proposed implementation choices.

## ADR-001 — Local assessment before cloud deployment

- **Status:** Accepted for the current phase, 2026-11-24.
- **Context:** The brief requires cloud evidence but authorizes documentation only now and limits spend.
- **Decision:** Build and assess the API locally first. Review the Terraform plan, cost and IAM before requesting explicit deployment approval.
- **Trade-off:** Cloud integration evidence arrives later; early authorization testing is faster and cost-free.

## ADR-002 — Private storage and API-owned authorization

- **Status:** Accepted for the MVP design, 2026-11-26; implementation pending.
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

- **Status:** Accepted for the MVP design, 2026-11-26; implementation pending.
- **Context:** The API needs a small, testable authorization model with no public vulnerable deployment. User-controlled owner/key fields and guessed IDs create BOLA risk; arbitrary file uploads add content and malware risk.
- **Decision:** Use Alice and Bob as synthetic users; one immutable owner from authenticated identity; no sharing or admin routes. Accept only a JSON `content` string representing UTF-8 text, with a maximum of 100,000 encoded bytes (decimal 100 KB). Reject unknown fields, including owner/role/storage key, and duplicate JSON keys. Return 401 for missing/invalid authentication; for valid document UUIDs, return the same 404 body when a document is absent or belongs to another user. Malformed UUIDs return 400. Do not expose internal storage keys.
- **Trade-off:** Uniform 404 reduces direct existence disclosure but does not remove timing or volume side channels. JSON text is simple and avoids arbitrary file upload handling, but limits document types. API-mediated content adds compute/transfer cost. The 100 KB decimal interpretation and byte-count validation are explicit because Unicode character counts differ from UTF-8 bytes.
- **Evidence required:** [OpenAPI contract](api-contract.yaml), [authorization matrix](authorization-matrix.md), and later positive/negative tests. This ADR records a design decision, not an implemented control.

## Open decisions

| Question | Planning default | Resolve by |
| --- | --- | --- |
| HTTP API or REST API Gateway? | Compare authorization features and current cost | Week 3 |
| DynamoDB capacity and Terraform state storage? | Compare cost/security; never commit state | Week 3 |
| GitHub visibility and CodeQL availability? | Confirm actual repository and plan support | Week 4 |
| Delete order and failure recovery across metadata and object stores? | Specify idempotency, retry and orphan cleanup before cloud deployment | Week 3–5 |
| Rate and total-document limits? | Limit test traffic now; set cloud controls after cost review | Week 3–5 |
