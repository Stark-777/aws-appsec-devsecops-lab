# SecureDocs threat model

**Status:** route-specific review with local implementation evidence, 2026-11-27. Local owner checks, validation and response behavior have [tests](../../test/api-security.test.ts); cloud token, S3, CI and monitoring controls remain planned. System boundaries are in [architecture](../../docs/architecture.md); scenario IDs are in the [authorization matrix](../../docs/authorization-matrix.md).

Assets: synthetic document bytes, metadata/ownership, user tokens, API availability, deployment permissions, audit evidence and budget. Actors: Alice, Bob, unauthenticated caller, maintainer, CI workflow and attacker controlling requests or a compromised workflow. Likelihood and impact are qualitative design estimates for a small lab, not measured exploitation rates.

| STRIDE category | Route or boundary and threat | Likelihood / impact | Proposed control | Planned tests and residual risk |
| --- | --- | --- | --- | --- |
| Spoofing | All routes: forged, expired, or wrong-audience credential | Medium / High | Validate token before parsing protected resources; isolate local test identity adapter | C02–C03, L04, M04, R04, D04. Local tests cannot prove Cognito signature/issuer checks. |
| Tampering | `POST /documents`: client supplies owner, role or storage key; duplicate JSON keys | High / High | Exact request schema, duplicate-key rejection, server-derived owner and UUID/key | C04, C07, L05. Parser and gateway normalization differences remain to be tested. |
| Repudiation | `DELETE /documents/{id}`: owner disputes deletion; denied attempts are untraceable | Medium / Medium | Redacted event with request ID, subject pseudonym, outcome and timestamp | D01–D04 plus Week 7 log exercise. Logs cannot prove user intent; retention is limited. |
| Information disclosure | `GET /documents`: Bob receives Alice's metadata | High / High | Query by authenticated subject in trusted data path; never trust owner query | L01–L05. Pagination or indexes added later could reintroduce leakage. |
| Information disclosure | `GET /documents/{id}` and `/content`: guessed Alice UUID reveals metadata, bytes or existence | High / High | Check stored owner before storage access; uniform 404 body for absent/other-owner IDs | M02–M03, R02–R03, plus storage no-read assertion. Timing and rate patterns remain. |
| Denial of service | `POST /documents`: oversized UTF-8 text or high request volume drives compute, storage and log cost | Medium / Medium | Validate decoded 100,000-byte limit, bound request reads and test traffic | C05–C07; later load/cost checks. Total document count and request rate are not capped yet. |
| Elevation of privilege | `DELETE /documents/{id}`: Bob deletes Alice's record | High / High | Owner check before any delete; preserve owner immutability | D02–D03 and Alice re-read. Cross-store delete consistency remains open. |
| Elevation of privilege | GitHub Actions → AWS: unapproved workflow assumes deployment role | Medium / High | OIDC audience/repository/ref conditions and scoped policy | Week 5 trust-policy negative review. A compromised approved workflow retains allowed permissions. |

## Route coverage and trust boundaries

1. `POST /documents`: identity → JSON validation → immutable owner and server-generated identifiers → storage. An attacker may try mass assignment, invalid media, oversized multibyte content or duplicate keys.
2. `GET /documents`: identity → owner-scoped query → metadata response. Filtering after an unscoped read is an avoidable exposure risk.
3. `GET /documents/{id}` and `/content`: identity → stored owner check → metadata or content read. A guessed UUID is still attacker-controlled input, so every ID route needs an object-level check.
4. `DELETE /documents/{id}`: identity → stored owner check → removal of metadata and bytes. Failed cross-user deletes must not mutate either store.
5. GitHub → AWS and API → logs remain future cloud boundaries. Secure CI/CD and scoped OIDC stay P0 portfolio objectives even though no AWS action is authorized in this task.

For each cloud path, attach actual evidence and reassess likelihood and residual risk. Record confirmed issues in [findings](../findings/README.md). Passing local tests is evidence for the implemented code path, not proof that Cognito, S3, or deployment controls work.
