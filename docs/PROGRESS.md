# Project progress

- **As of:** 2026-11-27
- **Milestone:** TASK-004 local API MVP implementation
- **Status:** PR [#2](https://github.com/Stark-777/aws-appsec-devsecops-lab/pull/2) merged. The local API and tests are implemented on `feature/local-api-mvp` for review. No cloud deployment, JWT/Cognito integration, or AWS resources exist.

## Completed

- Inspected the starter repository and preserved its existing `.gitignore`.
- Drafted the eight-week roadmap, architecture/trust boundaries, ASVS-aligned requirements, cost plan, ADRs, STRIDE worksheet, findings template, backlog, and project README.
- Reviewed scope against the 48-hour budget and separated minimum evidence from stretch tools and features.
- Defined the five-route [OpenAPI 3.1 contract](api-contract.yaml) and Alice/Bob [authorization matrix](authorization-matrix.md). Recorded the approved MVP choices in ADR-006 and updated route-specific STRIDE risks. These are design artifacts, not runtime evidence.
- Implemented the five local Express routes with separate identity, validation, service and owner-scoped in-memory repository layers. The local server binds to `127.0.0.1` and requires two distinct environment-supplied synthetic tokens.
- Added strict UTF-8 and duplicate-key rejection, a 100,000-byte decoded content cap, a separate 1,000,000-byte raw body cap, authentication-first processing, uniform document 404 responses, and response security headers.
- Added [API security tests](../test/api-security.test.ts) for all 28 matrix scenario IDs and [repository unit tests](../test/repository.test.ts). Latest local run: **34 passing, 0 failing, 0 skipped** under Node 26 LTS. Cloud-only JWT variants of C03 remain pending.
- Verified a clean `npm ci`, strict type check, build and full `npm audit`; the final lockfile reported **0 npm advisories**. OpenAPI 0.1.1 lint passed with one documentation warning because the repository has no declared license.

## Pending

1. Perform a focused local application security assessment and file only confirmed findings; remediate with regression tests.
2. Design and statically review Terraform. Secure CI/CD and GitHub OIDC remain P0 portfolio objectives, with deployment approval-gated.
3. Review pricing, budget, IAM and teardown before requesting cloud approval.
4. With approval, gather bounded cloud, DAST and monitoring evidence; then assess residual risks and tear down.

## Open decisions

- Delete order, retry/idempotency, and orphan cleanup when metadata and bytes live in different cloud stores.
- Rate and total-document limits for the future public endpoint; the 100,000-byte per-document limit does not bound total spend.
- API Gateway variant, DynamoDB capacity mode, Terraform state location, and deployment region, based on current cost and security review.
- GitHub repository features available for CodeQL and other CI integrations.
- Whether Mocha's patched transitive overrides can be removed after a future upstream release.
- Repository license is undeclared; the OpenAPI lint warning remains until a license decision is made.

See [ADRs](security-decisions.md) for context and trade-offs. These proposed choices are not implemented controls.

## Risks and blockers

- **Schedule:** 48 hours is insufficient to treat every named security tool and AWS feature as mandatory. Prioritize authorization assessment, fix/regression evidence, least-privilege review, basic CI gates, and teardown.
- **Cost:** $0–5/month cannot be guaranteed. Free-tier eligibility, traffic, logs, storage, and delayed billing require review before deployment.
- **Security:** The local adapter validates only server-configured opaque test tokens. It does not verify JWT signature, issuer, audience, or expiry. The 404 body is uniform but timing may differ. No rate or total-document quota exists; in-memory data disappears on restart. Cloud deletion consistency remains open.
- **Cloud gate:** No AWS provisioning until the user reviews a concrete plan and explicitly approves it.

## Next recommended task: focused local application security assessment

Timebox a manual and automated review of the existing local API. Do not introduce intentional vulnerabilities or deploy it publicly. Acceptance criteria:

1. Run two-user black-box probes against the localhost server for list, metadata, content, delete, guessed IDs, owner/key injection, malformed/oversized bodies, and 401 precedence; record commands and observed status/body without storing token values.
2. Review routing, parser and repository boundaries for bypasses not exercised by the existing matrix; add a regression for each confirmed defect.
3. File confirmed findings with reproduction, impact, CWE/OWASP classification, remediation and residual risk. If no issue is found, record the tested scope and limits without inventing a finding.
4. Keep the cloud-only JWT, S3, IAM and cost checks pending. No Terraform, AWS provisioning or public vulnerable deployment.
