# Prioritized engineering backlog

**Current phase:** documentation; see [PROGRESS](PROGRESS.md) for actual status. These are proposed tasks, not completed features. Pick one well-defined task at a time. P0 protects the core security story or cloud gate.

| Priority | Task | Dependency | Done when |
| --- | --- | --- | --- |
| P0 | Define route contract, file scope, owner model and two-user authorization matrix | Current docs | Contract and matrix reviewed; ambiguous operations resolved. |
| P0 | Expand STRIDE into route-specific abuse cases | Contract | Threats have likelihood, impact, controls and tests. |
| P0 | Build local TypeScript API with synthetic in-memory documents | Contract | No AWS calls; Mocha/Chai tests pass. |
| P0 | Probe BOLA and function-level authorization | Local API | Negative tests cover every implemented document route and privileged action. |
| P0 | Record and remediate confirmed findings | Assessment | Reproduction, cause, fix and regression linked. |
| P0 | Add Terraform state/plan secret exclusions before IaC files | Before Terraform | State and plan artifacts cannot be staged accidentally. |
| P0 | Design least-privilege Terraform, private S3 and data stores | Stable contract | Plan and IAM review; Checkov findings triaged; no apply. |
| P0 | Prepare cost estimate, inventory, teardown and approval packet | Terraform plan | Current pricing and alerts verified for review. |
| P1 | Add reproducible CI, secrets and dependency checks, one SAST engine, and IaC scanning | API and IaC | Selected checks run with documented gates and triage; minimal workflow permissions. |
| P1 | Implement constrained GitHub OIDC role | Approved design | Trust and permission policies reviewed; no static key. |
| P1 | Run approved cloud integration and authenticated ZAP tests | Approved target | Authorization evidence, scoped report and cost check. |
| P1 | Add security logging and incident exercise | Approved deployment | Correlated redacted events and runbook. |
| P1 | Final assessment, interview story and teardown | Prior stages | Claims link to evidence; residual risks and charges documented. |
| Stretch | Add CodeQL, extra Semgrep rules, Trivy container scanning if Docker is used, and CycloneDX SBOM | Core CI stable | Each added tool answers a distinct question and has a maintained gate or documented report. |
| Stretch | Add sharing/admin routes, CloudTrail data events, or cloud-hosted DAST | Core evidence and cost review | Authorization and cost impact documented before implementation. |

**Next recommended task:** define the API contract and two-user authorization matrix, then refine the route-specific threat model. The measurable acceptance criteria are in [PROGRESS](PROGRESS.md). This documentation task comes before code so BOLA tests follow defined behavior.
