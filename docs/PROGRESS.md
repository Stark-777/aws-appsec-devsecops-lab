# Project progress

- **As of:** 2026-11-26
- **Milestone:** TASK-003 API contract and authorization design
- **Status:** Foundation PR [#1](https://github.com/Stark-777/aws-appsec-devsecops-lab/pull/1) merged. API design documents are drafted on `docs/api-contract-authorization` for review. No application code, cloud deployment, or security control implementation exists.

## Completed

- Inspected the starter repository and preserved its existing `.gitignore`.
- Drafted the eight-week roadmap, architecture/trust boundaries, ASVS-aligned requirements, cost plan, ADRs, STRIDE worksheet, findings template, backlog, and project README.
- Reviewed scope against the 48-hour budget and separated minimum evidence from stretch tools and features.
- Defined the five-route [OpenAPI 3.1 contract](api-contract.yaml) and Alice/Bob [authorization matrix](authorization-matrix.md). Recorded the approved MVP choices in ADR-006 and updated route-specific STRIDE risks. These are design artifacts, not runtime evidence.

## Pending

1. Implement and test the local API against the contract and authorization matrix; then assess and remediate confirmed findings.
2. Design and statically review Terraform. Secure CI/CD and GitHub OIDC are P0 portfolio objectives, with deployment still approval-gated.
3. Review pricing, budget, IAM, and teardown before requesting cloud approval.
4. With approval, gather bounded cloud, DAST, and monitoring evidence; then assess residual risks and tear down.

## Open decisions

- Delete order, retry/idempotency, and orphan cleanup when metadata and bytes live in different cloud stores.
- Rate and total-document limits for the future public endpoint; the 100,000-byte per-document limit does not bound total spend.
- API Gateway variant, DynamoDB capacity mode, Terraform state location, and deployment region, based on current cost and security review.
- GitHub repository features available for CodeQL and other CI integrations.

See [ADRs](security-decisions.md) for context and trade-offs. These proposed choices are not implemented controls.

## Risks and blockers

- **Schedule:** 48 hours is insufficient to treat every named security tool and AWS feature as mandatory. Prioritize authorization assessment, fix/regression evidence, least-privilege review, basic CI gates, and teardown.
- **Cost:** $0–5/month cannot be guaranteed. Free-tier eligibility, traffic, logs, storage, and delayed billing require review before deployment.
- **Security:** A local test identity adapter may mask cloud token-validation errors; cloud identity needs separate negative tests. The MVP accepts only JSON text, but Unicode byte-count handling, duplicate keys, 404 timing, and cross-store deletion need implementation tests.
- **Cloud gate:** No AWS provisioning until the user reviews a concrete plan and explicitly approves it.

## Next recommended task: local API implementation and tests

Implement only the documented five routes locally with synthetic in-memory storage. Acceptance criteria:

1. `POST`, list, metadata, content and delete match documented status codes, schemas, 100,000-byte UTF-8 limit, and generated UUIDs. No AWS calls.
2. The local identity adapter is test-only, isolated from deployable code and never accepts a client-chosen user ID as authority.
3. Mocha/Chai tests cover every matrix scenario ID C01–D05 that applies locally, including 401 precedence, uniform 404 bodies, unchanged Alice data after Bob's failed deletion, and no storage read on denied access.
4. Test results and any deviations are recorded against requirement IDs. Update the threat model and ADRs for design changes. No cloud provisioning.
