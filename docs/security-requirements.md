# Initial security requirements

These project requirements align with [OWASP ASVS 5.0.0](https://github.com/OWASP/ASVS/tree/v5.0.0/5.0/en). This is neither an ASVS certification nor a claim that all Level 1 controls are met. Local evidence is listed below; cloud controls remain planned. Versioned IDs avoid ambiguity when ASVS changes.

| ID | Requirement and evidence | ASVS 5.0.0 alignment | Stage |
| --- | --- | --- | --- |
| AUTH-01 | Require a valid identity on document routes; reject missing, expired, malformed and wrong-audience tokens. Negative API tests. | V6 Authentication; V9 Tokens; V10 OAuth/OIDC | 1–2 local, 5 cloud |
| AUTHZ-01 | Document function and resource rules. API checks owner on every list/read/download/write/delete. Two-user guessed-ID tests. | v5.0.0-8.1.1, v5.0.0-8.2.2, v5.0.0-8.3.1 | 1–2 |
| AUTHZ-02 | If a privileged function is added after the MVP, deny it to ordinary users and default deny when attributes are missing. No MVP admin route exists, so this is not currently testable. | v5.0.0-8.2.1, v5.0.0-8.3.1 | Future route |
| INPUT-01 | Validate path, query, body, content type, and size; reject unknown fields and malformed IDs without stack traces. Contract and tests. | V2 Validation and Business Logic; V4 API and Web Service | 1–2 |
| FILE-01 | Accept only JSON containing nonempty UTF-8 text; enforce a 100,000-byte decoded content limit, reject unsupported media types and oversized content, and return content as `text/plain` with `nosniff`. No arbitrary file upload. | V2 Validation, V4 API; v5.0.0-5.2.1 for size. File extension and malware controls are not applicable to this MVP text-only interface. | Local API, then cloud |
| FILE-02 | Generate storage keys on server; reject raw client path/key substitution. Traversal tests. | v5.0.0-5.3.2 | 2–3 |
| DATA-01 | Keep S3 private, encrypt storage and transport, exclude sensitive data from responses/logs. Plan and public-access checks. | V11 Cryptography; V12 Secure Communication; V14 Data Protection | 3–5 |
| IAM-01 | Scope Lambda to required table/bucket actions and OIDC role to approved workflow and resources. Policy and plan review. | V13 Configuration; V15 Secure Coding and Architecture | 3–5 |
| LOG-01 | Log denied access and admin actions with time, outcome, pseudonymous subject and request ID; omit tokens/bytes. Event test. | V16 Security Logging and Error Handling | 7 |
| SUPPLY-01 | Pin dependencies/actions; run selected code, dependency, secret and IaC checks; triage results and enforce documented gates. Generate an SBOM if time allows. CI evidence. | V13 Configuration; V15 Secure Coding and Architecture | 4; SBOM stretch |

Each implemented row needs a test, scan, or manual check in the final assessment. A passing scanner alone does not close an authorization requirement. Record exceptions in [findings](../security/findings/README.md).

## Local evidence and remaining verification

| Requirement | Local evidence | Remaining boundary |
| --- | --- | --- |
| AUTH-01 | [API tests](../test/api-security.test.ts) C02–C03, L04, M04, R04, D04 assert 401 and precedence for missing/unknown synthetic tokens. | JWT signature, issuer, audience and expiry validation require a future cloud identity provider. |
| AUTHZ-01 | API tests C01, L01–L03, M01–M03, R01–R03, D01–D03 and [repository tests](../test/repository.test.ts) cover owner-scoped list/read/delete and no denied content access. | DynamoDB/S3 IAM and integration behavior remain unverified. |
| AUTHZ-02 | No privileged endpoint exists in the MVP. | Define tests if an admin or sharing function is added. |
| INPUT-01 | API tests C04–C08, L05, M05, R05, D05 and raw-body case cover schema, malformed UTF-8/JSON, duplicate keys, IDs, query fields and size limits. | API Gateway request transformations and deployed limits remain unverified. |
| FILE-01 | API tests C05–C08 and R01 cover media type, decoded UTF-8 byte boundary, raw bound and `text/plain`/`nosniff`. | Load, rate and cloud cost controls remain open. |
| FILE-02 | API test C01 and repository unit test verify server-generated key and no API exposure; C04/L05 reject client-supplied key fields. | S3 key generation and policy integration remain unverified. |
| DATA-01, IAM-01, LOG-01, SUPPLY-01 | No cloud or CI control is claimed from these local tests. | Design, deploy and verify in later approved milestones. |
