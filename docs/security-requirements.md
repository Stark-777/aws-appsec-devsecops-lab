# Initial security requirements

These project requirements align with [OWASP ASVS 5.0.0](https://github.com/OWASP/ASVS/tree/v5.0.0/5.0/en). This is neither an ASVS certification nor a claim that all Level 1 controls are met. All rows are **planned** until linked implementation evidence exists. Versioned IDs avoid ambiguity when ASVS changes.

| ID | Requirement and evidence | ASVS 5.0.0 alignment | Stage |
| --- | --- | --- | --- |
| AUTH-01 | Require a valid identity on document routes; reject missing, expired, malformed and wrong-audience tokens. Negative API tests. | V6 Authentication; V9 Tokens; V10 OAuth/OIDC | 1–2 local, 5 cloud |
| AUTHZ-01 | Document function and resource rules. API checks owner on every list/read/download/write/delete. Two-user guessed-ID tests. | v5.0.0-8.1.1, v5.0.0-8.2.2, v5.0.0-8.3.1 | 1–2 |
| AUTHZ-02 | Deny privileged functions to ordinary users and default deny when attributes are missing. Negative route tests. | v5.0.0-8.2.1, v5.0.0-8.3.1 | 2 |
| INPUT-01 | Validate path, query, body, content type, and size; reject unknown fields and malformed IDs without stack traces. Contract and tests. | V2 Validation and Business Logic; V4 API and Web Service | 1–2 |
| FILE-01 | Before uploads, define types, extensions, maximum size and download handling. Reject unsupported or oversized files. | v5.0.0-5.1.1, v5.0.0-5.2.1, v5.0.0-5.2.2 | Before cloud upload |
| FILE-02 | Generate storage keys on server; reject raw client path/key substitution. Traversal tests. | v5.0.0-5.3.2 | 2–3 |
| DATA-01 | Keep S3 private, encrypt storage and transport, exclude sensitive data from responses/logs. Plan and public-access checks. | V11 Cryptography; V12 Secure Communication; V14 Data Protection | 3–5 |
| IAM-01 | Scope Lambda to required table/bucket actions and OIDC role to approved workflow and resources. Policy and plan review. | V13 Configuration; V15 Secure Coding and Architecture | 3–5 |
| LOG-01 | Log denied access and admin actions with time, outcome, pseudonymous subject and request ID; omit tokens/bytes. Event test. | V16 Security Logging and Error Handling | 7 |
| SUPPLY-01 | Pin dependencies/actions; run selected code, dependency, secret and IaC checks; triage results and enforce documented gates. Generate an SBOM if time allows. CI evidence. | V13 Configuration; V15 Secure Coding and Architecture | 4; SBOM stretch |

Each implemented row needs a test, scan, or manual check in the final assessment. A passing scanner alone does not close an authorization requirement. Record exceptions in [findings](../security/findings/README.md).
