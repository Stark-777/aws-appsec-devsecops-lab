# SecureDocs threat model

**Status:** initial planning model, 2026-11-24. Update after the API contract and before cloud deployment. System boundaries are in [architecture](../../docs/architecture.md).

Assets: synthetic document bytes, metadata/ownership, user tokens, API availability, deployment permissions, audit evidence and budget. Actors: owner, another authenticated user, unauthenticated caller, maintainer, CI workflow and attacker controlling requests or a compromised workflow.

| STRIDE category | Example threat | Boundary | Planned control and evidence |
| --- | --- | --- | --- |
| Spoofing | Forged or wrong-audience token accepted | Client → API | Token validation; negative token tests. |
| Tampering | Changed document ID, owner or storage key | Client → API → stores | Ignore client authority; trusted lookup; cross-user tests. |
| Repudiation | Denied access or admin action cannot be reconstructed | API → logs | Request ID, subject pseudonym, outcome, timestamp; incident exercise. |
| Information disclosure | BOLA read/download, public S3, sensitive logs | API → S3/logs | Per-object checks, Block Public Access, redaction; negative tests and plan review. |
| Denial of service | Oversized uploads or unbounded test traffic | Client → API/billing | Size/rate limits, small data, budget checks. |
| Elevation of privilege | Ordinary user calls admin route or CI assumes broad role | User → API; GitHub → AWS | Function authorization and OIDC policy review. |

## Priority attack paths

1. User B guesses user A's document ID and obtains metadata or bytes. Probe every read/download route and list filtering.
2. User B changes an owner field or object key in a write request. Verify rejection or ignoring of these fields.
3. A workflow from an unapproved branch requests AWS credentials. Inspect OIDC trust conditions and workflow permissions.
4. A public endpoint or high-volume scan generates unexpected spend. Verify scope, limits, alerts and teardown.

For each path, add likelihood, impact, control status, test evidence, owner and residual risk after the API contract exists. Record confirmed issues in [findings](../findings/README.md). Design text alone does not mitigate a threat.
