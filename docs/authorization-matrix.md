# MVP authorization matrix and test scenarios

**Status:** local scenarios implemented in [API security tests](../test/api-security.test.ts); cloud JWT and S3 cases remain pending. The [OpenAPI contract](api-contract.yaml) defines responses. Alice and Bob are synthetic users with distinct authenticated subject IDs. Alice owns document `A1`; Bob owns `B1`. `U1` is a valid UUID with no stored document. A guessed ID means the caller knows or guesses another user's syntactically valid UUID; UUID unpredictability is not an authorization control.

## Rules and response precedence

- All five routes require valid authentication. Missing, expired, malformed, forged, or wrong-issuer/audience credentials return **401**, including when another request field is also invalid.
- Ownership is immutable and comes only from the authenticated subject. The server generates UUIDs and internal storage keys. Request fields or query parameters cannot choose an owner, role, or key.
- For a valid UUID on a document route, an absent document and a document owned by another user return the **same 404 status and generic body**. Malformed UUIDs return **400** after authentication. Neither response includes owner or storage information. Test body equality; compare timing qualitatively because exact timing equality is not guaranteed.
- `GET /documents` filters by authenticated subject in the trusted data access path. It must never fetch all records and rely on response-side filtering alone.
- `POST /documents` accepts only JSON with a nonempty `content` string. The decoded UTF-8 content must be at most **100,000 bytes** (decimal 100 KB). JSON Schema character limits alone are insufficient for multibyte text. Unknown and duplicate JSON keys are rejected.
- Content access is mediated by the API. No presigned URL or direct S3 key is returned. On cloud deployment, Lambda must check stored ownership before any S3 read or delete.

## Planned route tests

| ID | Route | Caller and input | Expected result | Requirement IDs |
| --- | --- | --- | --- | --- |
| C01 | `POST /documents` | Alice, valid small JSON text | 201; new UUID; Alice is stored owner; `Location` points to metadata; response omits storage key | AUTH-01, AUTHZ-01, INPUT-01, FILE-01, FILE-02 |
| C02 | `POST /documents` | No credential | 401; no record created | AUTH-01 |
| C03 | `POST /documents` | Invalid/expired/wrong-audience credential | 401; no record created | AUTH-01 |
| C04 | `POST /documents` | Alice supplies `ownerId`, `role`, or `storageKey` in separate attempts | 400 for each unknown field; no record created | AUTHZ-01, INPUT-01, FILE-02 |
| C05 | `POST /documents` | Alice sends `text/plain`, missing `Content-Type`, or another media type instead of `application/json` | 415; no record created | INPUT-01, FILE-01 |
| C06 | `POST /documents` | Alice sends 100,001 UTF-8 bytes, including a multibyte boundary case | 413; no record created | INPUT-01, FILE-01 |
| C07 | `POST /documents` | Alice sends empty content, malformed JSON, invalid UTF-8, or duplicate `content` keys | 400; no record created | INPUT-01, FILE-01 |
| C08 | `POST /documents` | Alice sends exactly 100,000 UTF-8 bytes, including multibyte characters | 201; stored byte size is exactly 100,000 | INPUT-01, FILE-01 |
| L01 | `GET /documents` | Alice, with A1 and B1 stored | 200; contains A1 and no B1 metadata; no storage keys | AUTH-01, AUTHZ-01, DATA-01 |
| L02 | `GET /documents` | Bob, with A1 and B1 stored | 200; contains B1 and no A1 metadata | AUTHZ-01 |
| L03 | `GET /documents` | Authenticated user with no documents | 200 and empty array | AUTHZ-01 |
| L04 | `GET /documents` | No credential or invalid credential, separately | 401; no list data | AUTH-01 |
| L05 | `GET /documents` | Alice supplies `ownerId=Bob`, `role=admin`, or `storageKey=...` query parameters | 400 for each unknown parameter; no cross-user data | AUTHZ-01, INPUT-01, FILE-02 |
| M01 | `GET /documents/{id}` | Alice requests A1 | 200; A1 metadata only | AUTH-01, AUTHZ-01 |
| M02 | `GET /documents/{id}` | Bob requests guessed A1 UUID | 404 with same body as U1; no A1 metadata | AUTHZ-01 |
| M03 | `GET /documents/{id}` | Alice requests U1 | 404 with same body as M02 | AUTHZ-01 |
| M04 | `GET /documents/{id}` | Missing or invalid credential, separately | 401, including when ID is malformed | AUTH-01 |
| M05 | `GET /documents/{id}` | Alice supplies malformed UUID | 400; no lookup | INPUT-01 |
| R01 | `GET /documents/{id}/content` | Alice requests A1 | 200 `text/plain; charset=utf-8`; exact A1 bytes; `nosniff` and `no-store` | AUTH-01, AUTHZ-01, DATA-01 |
| R02 | `GET /documents/{id}/content` | Bob requests guessed A1 UUID | 404 with same body as U1; no content or storage URL | AUTHZ-01, FILE-02 |
| R03 | `GET /documents/{id}/content` | Alice requests U1 | 404 with same body as R02 | AUTHZ-01 |
| R04 | `GET /documents/{id}/content` | Missing or invalid credential, separately | 401; no content | AUTH-01 |
| R05 | `GET /documents/{id}/content` | Alice supplies malformed UUID | 400; no storage read | INPUT-01 |
| D01 | `DELETE /documents/{id}` | Alice deletes A1 | 204; later read returns 404; A1 metadata and content removed | AUTH-01, AUTHZ-01 |
| D02 | `DELETE /documents/{id}` | Bob attempts to delete guessed A1 UUID | 404 with same body as U1; A1 remains readable by Alice | AUTHZ-01 |
| D03 | `DELETE /documents/{id}` | Alice deletes U1 | 404 with same body as D02 | AUTHZ-01 |
| D04 | `DELETE /documents/{id}` | Missing or invalid credential, separately | 401; no deletion | AUTH-01 |
| D05 | `DELETE /documents/{id}` | Alice supplies malformed UUID | 400; no deletion | INPUT-01 |

`AUTHZ-02` covers privileged functions. The MVP has **no admin or sharing route**, so no false claim of a privileged-route test is made. If one is introduced later, define its denial matrix before implementation. On a real cloud deployment, add token signature/issuer/audience/expiry tests and direct S3 public-access checks; local synthetic identity tests do not prove those properties.

## Evidence expected during implementation

The local [API suite](../test/api-security.test.ts) names each scenario ID and checks status plus side effects. It compares absent and other-owner 404 bodies on every ID route; reads Alice's data after Bob's denied deletion; and uses an instrumented in-memory repository to assert no content load or removal on denied access. [Repository unit tests](../test/repository.test.ts) check owner-scoped storage operations. These tests do not prove any S3 behavior.

**Cloud-only pending:** C03's expired, forged, wrong-issuer and wrong-audience JWT variants; real Cognito token validation; private S3 and IAM checks; and cloud storage read/delete ordering. C03 locally checks only an unknown synthetic bearer token. No local test should be described as JWT verification.

## Residual design risks

- A uniform 404 body reduces direct existence disclosure but timing, request logs, and rate patterns can still reveal information. Do not claim full indistinguishability; add bounded rate controls and monitor abuse later.
- API-mediated bytes avoid presigned URL policy complexity but add Lambda/API cost and throughput limits. The 100,000-byte cap bounds individual content, not total document count or request volume.
- Deleting metadata and bytes across separate stores is not atomic. Decide deletion order, idempotency, retries, and orphan cleanup before cloud deployment.
- The local identity adapter must never be enabled by a client-controlled header or deployed to AWS. Cloud token validation needs independent integration evidence.
