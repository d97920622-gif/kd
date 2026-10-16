#!/usr/bin/env python3
# path: docs/EVIDENCE/step-01/governance-probe.py
"""Sub-step 1.31 evidence: the governance files as the platform sees them.

This file is evidence, not part of the product. It is run by hand when the
sub-step is closed, its output is recorded in docs/handoffs/CHAT_01_PROGRESS.md,
and it is deliberately NOT wired into `npm run verify`: the project ships no test
files (Rule 4), and a probe that needs a network and an authenticated `gh` does
not belong in the commit gate. `scripts/checks/governance.mjs` is the static
half that does, and it proves the files are internally consistent; this probe
proves the three things a file cannot prove about itself:

  1. **The workflow is registered and it ran.** A YAML file that GitHub never
     parsed is a file, not a gate. The probe reads the registered workflow list
     and the newest run on the current branch, and it fails when the newest run
     is not a success or belongs to a commit other than HEAD.
  2. **The private advisory channel is open.** SECURITY.md sends a reporter to
     GitHub's private vulnerability reporting on this repository. That channel
     is a repository setting, so the probe asks the platform whether it is on,
     which is the only way to know that the instruction in the policy works.
  3. **The review file parses.** CODEOWNERS syntax is GitHub's, not Git's, and a
     pattern written for the wrong parser is silently ignored. The probe reads
     GitHub's own parse errors for the file.

It also prints the inventory of what landed and the local state it was measured
against, so the handoff record carries the sizes rather than a claim.

Usage: python3 docs/EVIDENCE/step-01/governance-probe.py [--branch <name>]
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]

ARTEFACTS = [
    '.github/workflows/ci.yml',
    '.github/CODEOWNERS',
    '.github/pull_request_template.md',
    'CONTRIBUTING.md',
    'SECURITY.md',
    'CHANGELOG.md',
    'LICENSE',
    'scripts/changelog.mjs',
    'scripts/checks/governance.mjs',
]

findings: list[str] = []


def report(name: str, ok: bool, detail: str) -> None:
    print(f"  {name:36} {'ok' if ok else 'FAIL'} {detail}")
    if not ok:
        findings.append(f'{name}: {detail}')


def run(*arguments: str) -> tuple[int, str]:
    """Run a command and return (exit code, stdout + stderr)."""
    completed = subprocess.run(
        arguments, cwd=REPO, capture_output=True, text=True, check=False
    )
    output = (completed.stdout + completed.stderr).strip()
    return completed.returncode, output


def api(path: str) -> tuple[int, str]:
    return run('gh', 'api', path)


def git(*arguments: str) -> str:
    code, output = run('git', *arguments)
    return output if code == 0 else ''


def main() -> int:
    parser = argparse.ArgumentParser(description='probe the governance surface of the repository')
    parser.add_argument('--branch', default=None, help='branch to read the newest run from')
    arguments = parser.parse_args()

    branch = arguments.branch or git('branch', '--show-current') or 'unknown'
    head = git('rev-parse', 'HEAD')
    remote = git('config', '--get', 'remote.origin.url')
    slug = remote.removesuffix('.git').split('github.com')[-1].strip('/:')
    print(f'governance probe: {slug} on {branch} at {head[:7]}')
    print()

    dirty = git('status', '--porcelain')
    report('the tree is clean', dirty == '', f'{len(dirty.splitlines())} changed path(s)')

    print()
    print('inventory:')
    for artefact in ARTEFACTS:
        path = REPO / artefact
        if not path.is_file():
            report(artefact, False, 'missing')
            continue
        text = path.read_text(encoding='utf-8')
        report(artefact, True, f'{len(text):6} bytes, {len(text.splitlines()):5} lines')

    changelog = REPO / 'CHANGELOG.md'
    if changelog.is_file():
        lines = changelog.read_text(encoding='utf-8').splitlines()
        entries = [line for line in lines if line.startswith('- ')]
        sections = [line[4:] for line in lines if line.startswith('### ')]
        report('the changelog carries entries', len(entries) > 0, f'{len(entries)} entries, sections {", ".join(sections)}')

    print()
    print('the registered workflows:')
    code, output = api(f'repos/{slug}/actions/workflows')
    registered = []
    if code == 0:
        try:
            registered = json.loads(output).get('workflows', [])
        except json.JSONDecodeError:
            registered = []
    ci = next((item for item in registered if item.get('path') == '.github/workflows/ci.yml'), None)
    report(
        'the ci workflow is registered',
        ci is not None,
        'yes' if ci is not None else 'not on GitHub yet',
    )
    if ci is not None:
        report('the ci workflow is active', ci.get('state') == 'active', str(ci.get('state')))

    print()
    print(f'the newest run on {branch}:')
    code, output = run(
        'gh',
        'run',
        'list',
        '--branch',
        branch,
        '--limit',
        '5',
        '--json',
        'databaseId,workflowName,event,status,conclusion,headSha,url,createdAt',
    )
    runs = []
    if code == 0 and output:
        try:
            runs = json.loads(output)
        except json.JSONDecodeError:
            runs = []
    if not runs:
        report('a run exists for this branch', False, 'no run was listed for this branch')
    else:
        newest = runs[0]
        report(
            'the newest run succeeded',
            newest.get('conclusion') == 'success',
            f'{newest.get("workflowName")} {newest.get("event")} {newest.get("status")}/{newest.get("conclusion")}',
        )
        report(
            'the newest run belongs to HEAD',
            newest.get('headSha') == head,
            f'run {(newest.get("headSha") or "")[:7]} against HEAD {head[:7]}',
        )
        report('the newest run has a url', bool(newest.get('url')), str(newest.get('url')))
        for run_item in runs[1:]:
            print(
                f'    earlier: {(run_item.get("headSha") or "")[:7]} {run_item.get("event")} '
                f'{run_item.get("status")}/{run_item.get("conclusion")}'
            )

    print()
    print('the repository settings the governance files depend on:')
    code, output = api(f'repos/{slug}/private-vulnerability-reporting')
    enabled = code == 0 and '"enabled":true' in output.replace(' ', '')
    report(
        'private vulnerability reporting is on',
        enabled,
        'on' if enabled else f'off or unreadable ({output[:60]})',
    )

    # GitHub parses CODEOWNERS with its own grammar and reports its errors, and
    # the branch is passed so the file is read from the branch being probed
    # rather than from the default branch, where it does not exist until the
    # merge. A 404 therefore means the file is not on the remote yet.
    code, output = api(f'repos/{slug}/codeowners/errors?ref={branch}')
    if code == 0:
        try:
            errors = json.loads(output).get('errors', [])
        except json.JSONDecodeError:
            errors = [{'kind': 'unreadable'}]
        report(
            'the review file parses',
            len(errors) == 0,
            'no parse errors' if len(errors) == 0 else f'{len(errors)} error(s)',
        )
        for error in errors[:5]:
            print(f'    {error.get("kind")}: {error.get("message")} (line {error.get("line")})')
    else:
        report(
            'the review file parses',
            False,
            f'the file is not on {branch} on GitHub yet, so its syntax is unverified',
        )

    code, output = api(f'repos/{slug}/branches/integration/protection')
    if code == 0:
        try:
            protection = json.loads(output)
            checks = [
                item.get('context')
                for item in protection.get('required_status_checks', {}).get('checks', [])
            ]
        except json.JSONDecodeError:
            checks = []
        print(f'  {"branch protection on integration":36} ok required checks: {", ".join(checks) or "none"}')
    else:
        print(
            f'  {"branch protection on integration":36} -- not configured yet; '
            'the owner enables it with the ci check after the merge (docs/PLAN/07, section 2)'
        )

    print()
    print(f'findings: {len(findings)}')
    for finding in findings:
        print(f'  FAIL {finding}')
    ok = not findings
    print('RESULT:', 'PASS' if ok else 'FAIL')
    return 0 if ok else 1


if __name__ == '__main__':
    sys.exit(main())
