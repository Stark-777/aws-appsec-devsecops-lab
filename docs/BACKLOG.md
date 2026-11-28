# Prioritized engineering backlog

**Current phase:** API contract design is documented; see [PROGRESS](PROGRESS.md) for review status. Pick one well-defined task at a time. P0 marks core portfolio objectives, even when a later dependency prevents immediate implementation.

## Completed design tasks (implementation pending)

- Define the five-route [OpenAPI contract](api-contract.yaml), 100,000-byte UTF-8 limit, owner-only model, and two-user [authorization matrix](authorization-matrix.md).
- Expand [STRIDE threats](../security/threat-model/README.md) into route-specific risk, control, residual-risk and planned-test entries.

## Pending engineering tasks

| Priority | Task | Dependency | Done when |
| --- | --- | --- | --- |
| P0 | Build local TypeScript API with synthetic in-memory documents | Contract | No AWS calls; Mocha/Chai tests pass. |
| P0 | Probe BOLA and function-level authorization | Local API | Negative tests cover every implemented document route and privileged action. |
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

**Next recommended task:** implement only the local five-route API and Mocha/Chai authorization tests from the contract and matrix. The measurable acceptance criteria are in [PROGRESS](PROGRESS.md). No AWS provisioning is part of that task.
