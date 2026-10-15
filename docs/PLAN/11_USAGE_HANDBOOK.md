// path: docs/PLAN/11_USAGE_HANDBOOK.md
# Usage Handbook (A to Z operating guide)

This is the operating manual for building KD SOLUTION IT with the sixteen chat
prompts. Read it once fully, then follow it chat by chat.

## 1. The four rules that make everything else work

1. One chat equals one step, and for the six heavy steps (1, 3, 4, 6, 10, 13)
   one chat equals one segment of that step.
2. Every new chat starts from the mainline branch that contains all completed
   work. Never start from an empty or outdated branch.
3. Every chat ends by writing the handoff and progress files and by pushing its
   session branch; the owner then merges that session branch into the mainline.
4. Never let a chat continue into the next step or the next segment. Stop at the
   gate, hand off, start a new chat.

## 2. One-time setup before chat 1

### 2.1 Create the mainline branch

The mainline branch is `integration`. Create it from the planning branch so the
plan files are already present, then push it:

```bash
git fetch origin
git checkout -b integration origin/arena/457d65a6-kd
git push -u origin integration
```

If you prefer the GitHub interface, open a pull request from
`arena/457d65a6-kd` into a new branch named `integration` and merge it.

### 2.2 Make `integration` the default branch

GitHub -> Settings -> General -> Default branch -> switch to `integration`.
This matters: Arena creates each new chat's session branch from the repository
default branch. With `integration` as the default, every new chat
automatically starts from the completed work and nothing is lost.

### 2.3 Protect the branch

GitHub -> Settings -> Branches -> add a rule for `integration`:
require a pull request, require the status checks produced later by CI
(`ci`, `security`, `verify`), require conversation resolution, disallow force
pushes and deletions. Keep the same protection on `main`, which only receives
release merges.

### 2.4 Deployment wiring

Set the Netlify production branch to `integration`. Preview deploys come from
the session branch pull requests automatically.

## 3. Which branch to select in a new chat

| Situation | Begin the chat from | Why |
| --- | --- | --- |
| Chat 1 (step 1, segment 1A) | `integration` | It already contains the plan and the prompts |
| Chat after a completed and merged segment | `integration` | The completed segment is present |
| Chat continuing the same step (a segment was not finished) | `integration` if the partial work was merged; otherwise the session branch named in `docs/handoffs/CHAT_NN_COMPLETED.md` | The first unchecked sub-step must be visible |
| Any later step | `integration` | Accumulated work is the correct base |
| Release | `main` receives a merge from `integration` after step 16 | `main` is the release mirror only |

Rule of thumb: if the chat interface offers a branch selector, choose
`integration`. If it does not, the branch is chosen automatically from the
default branch, which is why section 2.2 must be done first.

Each chat's own work is pushed to that session's branch (for example
`arena/<session-id>`). The agent never switches, renames or deletes branches.

## 4. The per-chat loop, A to Z

1. Open a new chat in the Arena workspace for this repository.
2. Confirm the base branch is `integration` (or the branch that holds the
   latest completed work).
3. Open `docs/PLAN/chat-prompts/CHAT_NN.md` on GitHub or in your workspace.
4. Copy everything between `=== BEGIN PASTE ===` and `=== END PASTE ===`,
   including both markers.
5. Paste it as the whole message and send. Do not add a second step prompt.
6. The chat runs the BASE BRANCH CHECK, reads the plan files, and starts at the
   first unchecked sub-step of the current segment.
7. The chat implements sub-step by sub-step, runs `npm run verify`, and commits
   one sub-step per commit.
8. At the end of the segment the chat runs the segment gate, records the
   evidence, updates `docs/handoffs/CHAT_NN_PROGRESS.md`, writes or updates
   `docs/handoffs/CHAT_NN_COMPLETED.md`, and states the segment status line.
9. The chat pushes its session branch.
10. You review the change set against the owner checklist in section 6.
11. You merge the session branch into `integration` (pull request, merge
    commit, no squash across segments).
12. For the same step's next segment, paste the same prompt file again in a new
    chat. For the next step, paste the next prompt file.
13. If a segment is partial, the next chat continues from the first unchecked
    sub-step; nothing is repeated.
14. After step 16 completes, follow the release sequence in section 9.

## 5. Copy-paste blocks

### 5.1 Standard start (this is the only block most chats need)

Paste the content of the step prompt file, for example
`docs/PLAN/chat-prompts/CHAT_01.md`, between its paste markers.

### 5.2 Optional merge block (use only when the previous work is not merged yet)

```
MERGE BEFORE STARTING: create a pull request from branch <previous-session-branch>
into integration, then merge it with a merge commit. Do not switch branches and
do not start the segment until integration contains
docs/handoffs/CHAT_NN_COMPLETED.md.
```

### 5.3 Optional strict-plan block (extra safety for a first run)

```
BEFORE WRITING CODE: list every file you will create or modify for this
segment, one line each, with its path and purpose. Then implement them in that
order. Do not create any file outside that list without stating why in the
progress file.
```

### 5.4 Resume block for a partial segment

The step prompt already contains the resume instruction. If you want to be
explicit, add:

```
RESUME: read docs/handoffs/CHAT_NN_PROGRESS.md, start at sub-step NN.YY, and do
not re-implement any sub-step already marked complete.
```

## 6. Owner review checklist after every chat

Run these checks before merging the session branch:

1. The handoff file exists and states the segment status line.
2. The progress file lists every sub-step of the segment with a commit hash.
3. Every commit message starts with `feat(step-NN/SS)` or the documented type
   prefix and covers exactly one sub-step.
4. `npm run verify` output is recorded and green.
5. No file contains TODO, FIXME, "Coming Soon" or placeholder text.
6. No test file, no `.test.ts` or `.spec.ts`, no tests directory.
7. New tables have the universal columns, RLS default-deny, and an audit path.
8. New API routes have Zod validation, sanitization, rate limiting, idempotency
   where required, and the typed error envelope.
9. `.env.example` is updated for every new environment variable.
10. Migrations have matching `_down.sql` files and were applied and rolled back
    in the development database.

## 7. How the plan prevents mistakes, placeholders and losses

| Risk | Prevention built into the plan |
| --- | --- |
| A chat invents files that already exist | Ownership matrix plus single-source-of-truth list; append protocol only |
| Work is duplicated across chats | Segment model, progress file, first-unchecked-sub-step resume rule |
| Placeholder or unfinished code | Check scripts for TODO, "Coming Soon", placeholders; no-stub rule; gates per segment |
| Wrong base branch | Default branch set to `integration` plus the BASE BRANCH CHECK block in every prompt |
| Money bugs | USD only, `numeric(18,4)`, decimal.js, `check:money-math` script |
| Tenant data leaks | RLS default-deny, tenant resolver, cross-tenant 404 rule, isolation fuzz script |
| Card data exposure | Hosted fields only, assertion that card fields live inside processor frames |
| Tax mistakes | Versioned rates, determination service, segregated Tax Payable ledger, remittance evidence gate |
| Lost secrets | Secrets only in environment variables; `check:secrets`; registry in step 2 |
| Conflicting edits to shared files | Ownership table, append protocol, reserved growth blocks in nav-map and strings |
| Context exhaustion | One segment per chat; resume instruction; small commits |

## 8. Troubleshooting

| Symptom | Cause | Action |
| --- | --- | --- |
| Chat says the plan files are missing | Started from a branch without the plan | Stop the chat, verify the default branch is `integration`, start a new chat |
| Chat says the previous handoff is missing | Started from a branch without the completed segment | Merge the previous session branch, then start a new chat |
| Chat wants to continue the next segment | Prompt not stopped | Remind it of the SEGMENT RULE and end the chat after the handoff |
| `npm run verify` fails | Real defect or missing dependency | Fix forward inside the same segment; never skip the gate |
| A needed npm package appears | Package manager is integrator-owned | Request it through the integrator, record the request in the provider or handoff file, then continue |
| Migration rollback fails | Down file missing or wrong | Fix inside the same segment, re-run up and down, record evidence |
| Merge conflict in `config/nav-map.ts` or `lib/i18n/strings/en.ts` | Two segments appended at once | Keep both additions, no deletions, then re-run the dead-link and verify scripts |
| Sandbox credentials absent for a processor | Provider onboarding pending | Record the exact missing credential in `docs/PROVIDERS/<provider>.md`; never invent behaviour |

## 9. Release sequence after step 16

1. Confirm step 16 gates and the traceability audit are green.
2. Tag the mainline: `git tag v1.0.0` on `integration`, then push the tag.
3. Merge `integration` into `main` through a pull request.
4. Deploy production from `main` (or from the tag) and run health checks.
5. Update `CHANGELOG.md` with the released step range.
6. Keep `integration` as the ongoing development mainline.

## 10. Account and secret prerequisites (collect before they are needed)

| Item | Needed from | Stored where |
| --- | --- | --- |
| Supabase project URL, anon key, service role key | Step 2 | `.env.local` and Netlify environment variables |
| Database direct connection string | Step 2 | as above, never committed |
| Encryption master key (AES-256-GCM) | Step 2 | environment only, never in the database |
| Audit signing key (Ed25519) | Step 2 | environment only |
| Cloudflare Turnstile site and secret key | Step 3 | environment only |
| Google service account JSON for Drive | Step 7 | encrypted in the secret registry, not in git |
| SMTP credentials for the chosen provider | Step 12 | encrypted in the platform settings, plus environment fallback |
| Meta Cloud API tokens for WhatsApp | Step 12 | encrypted in tenant settings |
| Sentry DSN | Step 14 | environment, with PII scrubbing |
| Netlify site and deploy hook | Step 16 | platform configuration |
| Cloudflare DNS and WAF access | Step 16 | platform configuration |

Rule: nothing from this table is ever committed. `.env.example` lists the
variable names with placeholders only.

## 11. Quick reference: which document answers which question

| Question | Read |
| --- | --- |
| What is the binding specification and the 20 absolute rules? | `MASTER_PROMPT.md` |
| What features must exist? | `FEATURE_LIST.md` |
| How are the sixteen steps ordered and why? | `docs/PLAN/00_MASTER_EXECUTION_PLAN.md` |
| Which step implements a specific requirement? | `docs/PLAN/01_REQUIREMENTS_TRACEABILITY.md` |
| What rules must every chat obey? | `docs/PLAN/02_CONVENTIONS_AND_GUARDRAILS.md` |
| Who owns which file? | `docs/PLAN/03_FILE_OWNERSHIP_MATRIX.md` |
| What counts as done, and which gates exist? | `docs/PLAN/04_DEFINITION_OF_DONE_AND_GATES.md` |
| What exactly were the added requirements? | `docs/PLAN/05_ADDITIONAL_REQUIREMENTS_SPEC.md` (A1 to A15) |
| Which processors, docs and sandboxes? | `docs/PLAN/06_PROVIDER_DOCS_REGISTRY.md` |
| How do branches, commits and releases work? | `docs/PLAN/07_BRANCH_AND_GIT_WORKFLOW.md` |
| What are the sub-steps of a step? | `docs/PLAN/08_SUBSTEP_CHECKLISTS.md` |
| How do segments and stop conditions work? | `docs/PLAN/10_SEGMENT_GUIDE.md` |
| What did the previous chat finish? | `docs/handoffs/CHAT_NN_COMPLETED.md` |
| What is the exact next sub-step? | `docs/handoffs/CHAT_NN_PROGRESS.md` |
| What do I paste into a new chat? | `docs/PLAN/chat-prompts/CHAT_NN.md` |

## 12. Do not do list

- Do not paste two step prompts into one chat.
- Do not let a chat start the next segment after finishing one.
- Do not start a chat from `main` before the release merge.
- Do not merge a session branch that has a failing gate.
- Do not commit `.env`, secrets, `node_modules` or build output.
- Do not rename or delete the plan files; they are the contract between chats.
- Do not skip the handoff; a chat without a handoff is an unfinished chat.
