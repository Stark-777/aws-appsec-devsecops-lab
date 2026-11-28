# SecureDocs

SecureDocs is a planned AWS cloud-native application security lab for a small document API. It demonstrates requirements, threat modeling, authorization assessment, remediation, secure infrastructure and CI, monitoring, and teardown. This is a portfolio exercise, not a production document service.

**Current state:** documentation only. No API or AWS resources have been created by this repository.

## Planned architecture

A TypeScript API starts locally. Its five-route [OpenAPI contract](docs/api-contract.yaml) and [Alice/Bob authorization matrix](docs/authorization-matrix.md) are design artifacts awaiting implementation. A later, explicitly approved cloud deployment would use API Gateway, Lambda, Cognito, DynamoDB for document metadata, and private S3 for bytes. The API will check document ownership on every operation. GitHub Actions would use OIDC for a scoped deployment role. See [architecture](docs/architecture.md).

## Roadmap

The [eight-week roadmap](docs/ROADMAP.md) budgets about six hours per week and prioritizes authorization evidence over tool count. Weeks 1–2 cover the local API, BOLA assessment, fixes and regressions; 3–4 cover Terraform and basic CI security gates; 5–7 cover approved deployment, DAST, and monitoring where feasible; week 8 covers final assessment and teardown. The [backlog](docs/BACKLOG.md) and [progress tracker](docs/PROGRESS.md) identify the next task and current status.

Read the [project instructions](AGENTS.md), [security requirements](docs/security-requirements.md), [cost controls](docs/cost-management.md), [security decisions](docs/security-decisions.md), [threat model](security/threat-model/README.md), and [finding template](security/findings/README.md).

Use only synthetic data. Never commit credentials or Terraform state. Never deploy intentionally vulnerable behavior publicly. AWS deployment requires explicit approval; the $0–5/month target is not a spending guarantee.
