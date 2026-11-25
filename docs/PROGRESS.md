# Project progress

- **As of:** 2026-11-25
- **Milestone:** Foundation planning and review
- **Status:** Documentation drafted on `docs/secure-docs-foundation`; no application code, cloud deployment, or security control implementation. Publication status is recorded in the current pull request once one exists.

## Completed

- Inspected the starter repository and preserved its existing `.gitignore`.
- Drafted the eight-week roadmap, architecture/trust boundaries, ASVS-aligned requirements, cost plan, ADRs, STRIDE worksheet, findings template, backlog, and project README.
- Reviewed scope against the 48-hour budget and separated minimum evidence from stretch tools and features.

## Pending

1. Define an API contract and a two-user authorization matrix before implementing routes.
2. Expand the threat model against the chosen routes and record likelihood, impact, and test plans.
3. Build and assess the local API, then address confirmed findings with regression tests.
4. Design and statically review Terraform and CI. Review pricing, budget, IAM, and teardown before requesting cloud deployment approval.
5. With approval, gather bounded cloud, DAST, and monitoring evidence; then assess residual risks and tear down.

## Open decisions

- Exact document operations and response contract; whether create means metadata only or a small text upload.
- File type and size limits; no arbitrary files or archives are in minimum scope.
- Whether sharing or admin operations are needed. Default: omit them; test function-level denial for any privileged operation that is actually introduced.
- API Gateway variant, DynamoDB capacity mode, Terraform state location, and deployment region, based on current cost and security review.
- GitHub repository features available for CodeQL and other CI integrations.

See [ADRs](security-decisions.md) for context and trade-offs. These proposed choices are not implemented controls.

## Risks and blockers

- **Schedule:** 48 hours is insufficient to treat every named security tool and AWS feature as mandatory. Prioritize authorization assessment, fix/regression evidence, least-privilege review, basic CI gates, and teardown.
- **Cost:** $0–5/month cannot be guaranteed. Free-tier eligibility, traffic, logs, storage, and delayed billing require review before deployment.
- **Security:** A local test identity adapter may mask cloud token-validation errors; cloud identity needs separate negative tests. File uploads introduce size, content, and malware risks; keep them narrow.
- **Cloud gate:** No AWS provisioning until the user reviews a concrete plan and explicitly approves it.

## Next recommended task: API contract and authorization matrix

Produce a documentation-only, reviewable task; do not implement the API. Acceptance criteria:

1. Document the minimum routes, methods, request/response schemas, status codes, and limits. Decide explicitly whether uploads are in minimum scope; if so, allow only small synthetic `text/plain` content with a stated size limit.
2. Define two synthetic subjects (A and B), an owner-only rule, and a matrix of allowed/denied outcomes for every route, including missing identity, missing document, guessed cross-user ID, and client-supplied owner/key attempts.
3. State where authentication and authorization decisions occur in local and proposed cloud flows; the local adapter must be isolated from cloud deployment.
4. Map each negative case to `AUTH-01`, `AUTHZ-01`, `AUTHZ-02` if applicable, `INPUT-01`, or `FILE-01/02`; update the route-specific threat model and relevant ADRs.
5. Review the contract for consistency with the architecture and keep it within a six-hour task. No code or AWS changes.
