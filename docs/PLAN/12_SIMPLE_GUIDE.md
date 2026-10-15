// path: docs/PLAN/12_SIMPLE_GUIDE.md
# Simple Guide (start here)

Keep this page open. The long plan files exist so the coding chat does not make
mistakes; you do not need to read them.

## The whole process is only three actions

1. Paste one prompt file in a new chat.
2. Type `continue` when the chat asks for permission to do the next small step.
3. Type `merge` when the chat says there is work to merge.

Nothing else. The chat does the code, the checks, the commits, the push, the
progress file and the handoff file by itself.

## How one chat runs

Inside a chat the agent works one small sub-step at a time. After each sub-step
it commits that single sub-step, runs `npm run verify`, and prints:

```
DONE: sub-step 1.3 - <one short line>
NEXT: sub-step 1.4 - <one short line>
CONTINUE? type continue for the next sub-step, or stop to finish this chat
```

- Type `continue` and the agent does the next sub-step, then asks again.
- Type `stop` and the agent closes the chat with the report below.
- The agent never starts a sub-step on its own. It always waits for your
  permission, so a mistake can never spread into the next step.

When you type `stop`, the agent prints the closing report:

```
STATUS: complete | partial
NEXT: <the file to paste in the next chat>
MERGE: ready to merge into integration | nothing to merge
```

- `NEXT` always names the exact file to paste in the next chat. You never guess.
- If it says `MERGE: ready`, reply with the single word `merge` and the agent
  opens a pull request into `integration` and merges it. Or do it yourself on
  GitHub with one click: Pull requests, New pull request, base `integration`,
  compare the session branch, Create, Merge pull request.

Then start the next chat from `integration` and paste the file from `NEXT`.

## The one file to paste first

| Chat | Paste this file |
| --- | --- |
| First chat | `docs/PLAN/chat-prompts/CHAT_01.md` |
| Every later chat | the file named in the `NEXT` line of the last report |

Paste the whole content between `=== BEGIN PASTE ===` and `=== END PASTE ===`.

## One-time settings (before the first chat)

| Where | Setting |
| --- | --- |
| GitHub, Settings, General | Default branch = `integration` |
| GitHub, Settings, Branches | Require a pull request on `integration`; add status checks later, after CI exists in step 1 |
| Hosting project | Production branch = `integration` |

Step by step for those settings is in `11_USAGE_HANDBOOK.md` section 2.

## Frequently asked

**Why not everything in one chat?**
One chat session has a limited working memory. This platform is very large, so a
single long session would start to drift and produce mistakes. Small permission
gated steps are what keeps the code clean: each sub-step is small enough to be
correct, committed on its own, and easy to review.

**How many chats in total?**
Sixteen steps, and six of them run in four short parts, so about twenty-eight to
thirty-two short chats. You can do several sub-steps in the same chat by typing
`continue`; you only start a new chat when the report asks for it.

**Do I need to read the big plan files?**
No. Use this page. The plan files exist for the coding chat.

**Do I need to write code or git commands?**
No. The chat commits and pushes its own branch. Your words are `continue` and
`merge`.

**What if a chat stops in the middle?**
Its report says `STATUS: partial` and `NEXT` names the same file. Paste that file
again in a new chat and it continues from the first unfinished sub-step.

**What if the chat says the plan files or the previous handoff are missing?**
It started from the wrong branch. Merge the previous work into `integration`
first, then start a new chat from `integration`.

**How do I see what is already done?**
Open `docs/handoffs/` on GitHub: each `CHAT_NN_COMPLETED.md` lists the finished
work of that chat.
