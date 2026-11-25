# Security decisions

These architecture decision records (ADRs) distinguish accepted phase constraints from proposed implementation choices.

## ADR-001 — Local assessment before cloud deployment

- **Status:** Accepted for the current phase, 2026-11-24.
- **Context:** The brief requires cloud evidence but authorizes documentation only now and limits spend.
- **Decision:** Build and assess the API locally first. Review the Terraform plan, cost and IAM before requesting explicit deployment approval.
- **Trade-off:** Cloud integration evidence arrives later; early authorization testing is faster and cost-free.

## ADR-002 — Private storage and API-owned authorization

- **Status:** Proposed for Weeks 1–3.
- **Context:** Clients can guess IDs or supply another user's key.
- **Decision:** Store ownership in DynamoDB and bytes in private S3. Check authenticated subject against stored policy on every operation. Generate storage keys server-side. Do not expose direct S3 access initially.
- **Trade-off:** API-mediated transfers simplify authorization but increase Lambda/API cost and constrain file size. Presigned URLs need a separate authorization and expiry design if adopted later.

## ADR-003 — Cognito for cloud identity

- **Status:** Proposed.
- **Context:** Cloud authentication needs a managed issuer; local tests need deterministic synthetic identities.
- **Decision:** Use Cognito in cloud and an isolated local identity adapter for tests. Verify issuer, audience/client, expiry and signature at the chosen cloud integration.
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

## Open decisions

| Question | Planning default | Resolve by |
| --- | --- | --- |
| File type and size? | Small synthetic text files; no archives | Week 1 contract |
| Sharing and admin functions? | Outside minimum scope unless an authorization matrix is defined | Week 1 |
| HTTP API or REST API Gateway? | Compare authorization features and current cost | Week 3 |
| DynamoDB capacity and Terraform state storage? | Compare cost/security; never commit state | Week 3 |
| GitHub visibility and CodeQL availability? | Confirm actual repository and plan support | Week 4 |
