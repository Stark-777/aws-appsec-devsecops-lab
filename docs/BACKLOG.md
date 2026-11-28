# Prioritized engineering backlog

**Current phase:** local API MVP implemented on `feature/local-api-mvp`; see [PROGRESS](PROGRESS.md) for verification and review status. Pick one well-defined task at a time. P0 marks core portfolio objectives, even when a later dependency prevents immediate implementation.

## Completed tasks

- Define the five-route [OpenAPI contract](api-contract.yaml), 100,000-byte UTF-8 limit, owner-only model, and two-user [authorization matrix](authorization-matrix.md).
- Expand [STRIDE threats](../security/threat-model/README.md) into route-specific risk, control, residual-risk and planned-test entries.
- Implement the five local Express routes, injected synthetic identity provider, owner-scoped in-memory repository, bounded raw JSON validation, and [Mocha/Chai security tests](../test/api-security.test.ts). No AWS calls.

## Pending engineering tasks

| Priority | Task | Dependency | Done when |
| --- | --- | --- | --- |
| P0 | Assess the local API as a black-box and review the authorization code | Local API | Two-user BOLA, guessed-ID, list, delete, parser and 404 probes recorded; confirmed issues filed without introducing deliberate defects. No privileged route exists in MVP. |
| P0 | Record and remediate confirmed findings | Assessment | Reproduction, cause, fix and regression linked. |
| P0 | Add Terraform state/plan secret exclusions before IaC files | Before Terraform | State and plan artifacts cannot be staged accidentally. |
| P0 | Design least-privilege Terraform, private S3 and data stores | Stable contract | Plan and IAM review; Checkov findings triaged; no apply. |
| P0 | Prepare cost estimate, inventory, teardown and approval packet | Terraform plan | Current pricing and alerts verified for review. |
| P0 | Add secure CI/CD with reproducible tests, secrets and dependency checks, one SAST engine, and IaC scanning | API and IaC | Selected checks run with documented gates and triage; minimal workflow permissions and no static AWS keys. |
| P0 | Implement constrained GitHub OIDC deployment role | Approved Terraform and cloud gate | Trust and permission policies reviewed; no static key; deployment only after explicit approval. |
| P1 | Run approved cloud integration and authenticated ZAP tests | Approved target | Authorization evidence, scoped report and cost check. |
| P1 | Add security logging and incident exercise | Approved deployment | Correlated redacted events and runbook. |
| P1 | Final assessment, interview story and teardown | Prior stages | Claims link to evidence; residual risks and charges documented. |
| Stretch | Add CodeQL, extra Semgrep rules, Trivy container scanning if Docker is used, and CycloneDX SBOM | Core CI stable | Each added tool answers a distinct question and has a maintained gate or documented report. |
| Stretch | Add sharing/admin routes, CloudTrail data events, or cloud-hosted DAST | Core evidence and cost review | Authorization and cost impact documented before implementation. |

**Next recommended task:** assess the localhost API with two synthetic users, review the parser and repository boundaries, and record only confirmed findings. The measurable acceptance criteria are in [PROGRESS](PROGRESS.md). No AWS provisioning is part of that task.
