# SecureDocs project instructions

These instructions apply throughout this repository.

- Before each new task, read `docs/ROADMAP.md`, `docs/BACKLOG.md`, and `docs/PROGRESS.md` and inspect the working tree. Work on one well-defined task at a time.
- Update `docs/PROGRESS.md` after each completed milestone. Record significant architectural and security decisions as ADRs in `docs/security-decisions.md`.
- Work in small, reviewable branches and pull requests. Preserve existing files and unrelated changes; inspect the working tree before editing. Keep scope within the current week and roughly six hours of work.
- Use English for repository content. Explain non-obvious security decisions, trust boundaries, trade-offs, and verification. Label planned controls as planned; never claim a control is implemented or verified, or that a test, scan, deployment, or teardown succeeded, without evidence.
- Use only synthetic, non-sensitive data. Never commit real credentials, tokens, personal documents, Terraform state, or local environment files. Review staged changes before committing.
- Scan the exact staged content for secrets and sensitive information before committing; repeat the scan before pushing if the commit content changes. Record the tool, command, scope, and result.
- Use temporary AWS credentials for local administrative work and GitHub OIDC for CI deployment. Do not store long-lived AWS keys in GitHub.
- Authorize each document operation at the trusted API using the authenticated subject and stored resource policy. Never trust a client-supplied owner, role, tenant, or storage key. Use two synthetic users in positive and negative authorization tests.
- Keep S3 private. Never deploy intentionally vulnerable behavior publicly. If a demonstration defect is used, keep it isolated locally and remove it before deployment.
- Scan only owned local or explicitly approved cloud targets. Constrain DAST scope, rate, duration, and test accounts.
- Never provision, modify, or deploy AWS resources without explicit user approval for that phase. Local Terraform formatting, validation, scanning, and offline plan review may precede the gate when they have no cloud-side effects.
- Aim for $0–5/month but verify current account eligibility, pricing, region, expected usage, billing alerts, and teardown before requesting deployment approval. Budget alerts can lag and are not a hard cap.
- Do not commit, push, merge, or publish without authorization covering the action. Never merge a pull request without explicit approval.
- Keep threat model, requirements, findings, decisions, and README aligned with actual behavior. Security scanner output requires triage and is not proof of security.
