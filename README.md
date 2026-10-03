# Parcel Tracking System

Parcel intake, driver assignment, live tracking with ETA, and customer notifications for a
transport station. See the project document (v1.1) for requirements, architecture, and timeline.

| Part                        | Path              | Status                                               |
| --------------------------- | ----------------- | ---------------------------------------------------- |
| Shared types and validation | `packages/shared` | Started: statuses, constants, Zod schemas            |
| API (Hono on Lambda)        | `services/api`    | Skeleton: `/health`                                  |
| Infrastructure (AWS CDK)    | `infra`           | Skeleton: DynamoDB table, Cognito, HTTP API + Lambda |
| CI/CD                       | `Jenkinsfile`     | Written, not yet run                                 |
| Web app (Next.js)           | `apps/web`        | Not started                                          |
| Driver app (Expo, Android)  | `apps/driver`     | Not started                                          |

## Requirements

- Node.js 22 (`.nvmrc`)
- pnpm 12 (`npm install -g pnpm@12.8.1`)
- AWS credentials (only to deploy)

## Everyday commands

```bash
pnpm install
pnpm build          # builds packages in dependency order (Turborepo)
pnpm typecheck
pnpm test
pnpm lint
pnpm format         # Prettier
```

## Infrastructure

```bash
cd infra
pnpm exec cdk synth -c stage=dev       # generates CloudFormation locally, no AWS needed
pnpm exec cdk deploy --all -c stage=dev
```

The AWS region is whatever your credentials or `AWS_REGION` point to, so the region decision
(project document 7.6) needs no code change. Confirm Amazon Location Service is available in the
chosen region before the tracking phase.

## Conventions

- TypeScript everywhere (`tsconfig.base.json`).
- Status values and limits live in `packages/shared/src/constants.ts`. Import them; do not retype.
- Validate every request body with the Zod schemas in `packages/shared`.
- Main branch deploys to dev automatically; production needs a manual approval in Jenkins.

## Next steps (week 1 to week 2)

1. Create the GitHub repository and push this code.
2. Set up the Jenkins server and a Multibranch Pipeline for the repo, then run the Jenkinsfile.
3. Deploy the dev stacks and open the `/health` URL.
4. Create the first Cognito users and groups (cashier, driver, admin).
5. Start the SMS sender ID application and confirm the AWS region.
6. Week 2: ElectroDB entities (`packages/db`), parcel and trip endpoints, cashier dashboard.
