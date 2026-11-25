# Security findings

Use one Markdown file per confirmed finding, named `F-YYYY-NNN-short-title.md`. Use synthetic proof of concept data. Redact tokens, account IDs and document contents; never store live secrets.

## Finding template

```markdown
# F-YYYY-NNN — Short title

- Status: Open | Remediated | Accepted risk | False positive
- Severity: Critical | High | Medium | Low | Informational
- First observed / last verified: YYYY-MM-DD / YYYY-MM-DD
- Affected version, route and environment:
- Reporter / owner:
- Related requirement and threat:

## Summary and impact

State the violated trust boundary, attacker prerequisite, affected asset and realistic impact.

## Reproduction

1. Set up synthetic users and records.
2. Send a minimal redacted request.
3. Record expected and observed responses and safe evidence references.

## Root cause

Identify the missing or ineffective control.

## Remediation and verification

Describe the fix, negative regression test, test command/result and review date.

## Residual risk

State remaining exposure, limitations and any accepted exception with owner and expiry.
```

Severity reflects exploitability and impact, not scanner labels alone. Close a finding only after verifying the fix and a meaningful regression. Demonstration defects stay local and are removed before deployment.
