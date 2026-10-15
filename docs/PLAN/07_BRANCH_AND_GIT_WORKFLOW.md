// path: docs/PLAN/07_BRANCH_AND_GIT_WORKFLOW.md
# Branch, Commit and Release Workflow

## 1. Branch model

| Branch | Role |
| --- | --- |
| `integration` | Long-lived mainline. All completed steps merge here. Deployment source of truth. |
| `main` | Release mirror. Receives merges from `integration` only at release time. |
| `arena/<session-id>` | Build environment session branch. Work is committed and pushed here, then merged into `integration` by the owner after review. |
| `step-NN-<slug>` | Optional short-lived branch per step, merged into `integration`. |

Rules:

- Never force push on `integration` or `main`.
- Never commit directly to `main`.
- Never create a second long-lived branch.
- Every merge into `integration` is a pull request with the step handoff
  attached, and requires the CI gates to be green.

## 2. Owner procedure to make `integration` the mainline (one time)

1. Merge the planning work into `integration`, or create `integration` from
   the current default branch:
   `git checkout -b integration main && git push -u origin integration`.
2. On GitHub: Settings, Branches, change the default branch to `integration`.
3. On GitHub: Settings, Branches, add a branch protection rule for
   `integration`: require pull request, require status checks
   (`ci`, `security`, `verify`), require conversation resolution, disallow
   force pushes and deletions.
4. Configure the deploy provider (Netlify) to deploy from `integration`.
5. Keep `main` protected as well; it only receives releases from
   `integration`.

## 3. Commit convention

```
<type>(step-NN/SS): <imperative summary>
```

- Types: `feat`, `fix`, `refactor`, `perf`, `docs`, `chore`, `security`.
- One sub-step per commit. Example:
  `feat(step-05/5.4): add decimal invoice calculation engine`.
- Handoff commits use `docs(step-NN): handoff for step NN`.
- Never commit `.env`, credentials, `node_modules`, build output or logs.

## 4. Pull request template requirements

Every PR body contains: step number, sub-steps included, files added, files
extended with reason, migrations with up and down paths, environment variables
added, verification output summary, gates table from
`04_DEFINITION_OF_DONE_AND_GATES.md`, and the handoff link.

## 5. Release procedure

1. All step gates green on `integration`.
2. Tag `v<major>.<minor>.<patch>` on `integration`.
3. Merge `integration` into `main`.
4. Deploy production from `main` (or from the tag) and verify health checks.
5. Update `CHANGELOG.md` and the release notes with the step range included.

## 6. Rollback procedure

- Application: redeploy the previous Netlify deploy or the previous Docker
  image tag.
- Database: run the down migration for the affected timestamp, in reverse
  order, using `npm run db:rollback -- <timestamp>`.
- Never edit an applied migration. Fix forward with a new migration.
