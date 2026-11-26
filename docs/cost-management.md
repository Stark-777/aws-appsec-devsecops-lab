# Cost management plan

**Target:** $0–5/month incremental AWS spend. This is a goal, not a hard cap. Free-tier eligibility, credits, region, settings and existing account usage vary. [AWS charges usage beyond applicable offers or credits](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/free-tier.html).

## Before approved deployment

1. Record region, baseline spend, available credits/free-tier eligibility and current service pricing without putting account identifiers in the repository.
2. Verify existing billing alerts. With approval for the account change, configure a $5 monthly budget with actual and forecast alerts and consider an earlier $1–2 alert. [AWS Budgets data and alerts can lag](https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-managing-costs.html); they cannot prevent charges.
3. Estimate expected and accidental-high usage for API Gateway, Lambda, Cognito, DynamoDB, S3, CloudWatch, CloudTrail and test traffic.
4. Review Terraform plan, resource inventory, tags and teardown commands. Obtain explicit approval before cloud mutation.

## Controls

- Prefer short-lived, single-region serverless resources. Avoid NAT gateways, load balancers, managed databases and always-on compute.
- Use small synthetic files, low test volumes, bounded API/Lambda settings where practical, and rate-limited ZAP.
- Set short CloudWatch retention and do not log document bodies. Cost-review CloudTrail data events before enabling them.
- Tag resources with project and teardown date. Use S3 lifecycle cleanup if it fits the test.
- Check cost after deployment and DAST; stop tests and tear down if spending trends over target.
- After teardown, verify API Gateway, Lambda, Cognito, DynamoDB, S3 objects/bucket, logs, trail artifacts and IAM roles. Check billing again later for delayed charges.

A public endpoint or unbounded scanner can create request and logging costs even with little stored data.
