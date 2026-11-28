# SecureDocs

SecureDocs is a planned AWS cloud-native application security lab for a small document API. It demonstrates requirements, threat modeling, authorization assessment, remediation, secure infrastructure and CI, monitoring, and teardown. This is a portfolio exercise, not a production document service.

**Current state:** five-route local API and synthetic in-memory tests. No AWS resources have been created by this repository. This is not a production document service or a JWT/Cognito integration.

## Planned architecture

The TypeScript/Express API uses an injected identity provider, a document service, and an owner-scoped in-memory repository. The local server binds only to `127.0.0.1`. Its five routes follow the [OpenAPI contract](docs/api-contract.yaml) and [Alice/Bob authorization matrix](docs/authorization-matrix.md). A later, explicitly approved cloud deployment would use API Gateway, Lambda, Cognito, DynamoDB for metadata, and private S3 for bytes. GitHub Actions would use OIDC for a scoped deployment role. See [architecture](docs/architecture.md).

## Run locally

Use Node 26 LTS (pinned in `.nvmrc`) and npm. Supply two distinct, temporary local bearer tokens of at least 32 characters; do not commit or log their values.

```sh
nvm use
npm ci
npm run typecheck
npm run build
npm test
export SECUREDOCS_ALICE_TOKEN="$(openssl rand -hex 32)"
export SECUREDOCS_BOB_TOKEN="$(openssl rand -hex 32)"
npm start
```

The synthetic adapter accepts only those server-configured bearer tokens and maps them to Alice or Bob. Client-supplied identity headers have no authority. `src/local/server.ts` is the localhost-only entry point; future cloud code must provide a separate, real token-verifying identity provider. The tests inject a separate deterministic provider and do not verify JWT signatures, issuer, audience, or expiration.

`POST /documents` accepts only JSON with a nonempty UTF-8 `content` string. The decoded content limit is 100,000 bytes; a separate 1,000,000-byte raw body limit permits valid JSON escaping at that boundary. Unknown or duplicate fields are rejected. The server generates UUIDs and internal keys, derives immutable ownership from identity, and returns content through the API. No owner ID or storage key is returned.

`npm run check` runs strict type checking and the Mocha/Chai unit and HTTP security suites. [Progress](docs/PROGRESS.md) records the actual result and pending cloud cases.

## Roadmap

The [eight-week roadmap](docs/ROADMAP.md) budgets about six hours per week and prioritizes authorization evidence over tool count. Weeks 1–2 cover the local API, BOLA assessment, fixes and regressions; 3–4 cover Terraform and basic CI security gates; 5–7 cover approved deployment, DAST, and monitoring where feasible; week 8 covers final assessment and teardown. The [backlog](docs/BACKLOG.md) and [progress tracker](docs/PROGRESS.md) identify the next task and current status.

Read the [project instructions](AGENTS.md), [security requirements](docs/security-requirements.md), [cost controls](docs/cost-management.md), [security decisions](docs/security-decisions.md), [threat model](security/threat-model/README.md), and [finding template](security/findings/README.md).

Use only synthetic data. Never commit credentials or Terraform state. Never deploy intentionally vulnerable behavior publicly. AWS deployment requires explicit approval; the $0–5/month target is not a spending guarantee.
