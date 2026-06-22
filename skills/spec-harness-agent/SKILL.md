---
name: spec-harness-agent
description: Use when a project already has or will use Spec Kit and needs a reusable Codex agent harness: AGENTS.md rules, .specify/memory active-session tracking, specUserStory reverse-spec artifacts, verification discipline, and safe bootstrap instructions for future repos. This skill does not install Spec Kit itself; it strengthens the project workflow around Spec Kit.
metadata:
  short-description: Bootstrap Spec Kit agent harness workflow
---

# Spec Harness Agent

Use this skill to add or maintain a project-local agent operating harness around Spec Kit. The goal is repeatable agent work: restore context, follow Specify -> Plan -> Tasks -> Implement, verify changes, and save session state.

Do not treat this skill as the Spec Kit installer. If `.specify/` is absent, tell the user Spec Kit must be installed or scaffolded first, then offer to create the harness files that sit around it.

## Core Workflow

1. Inspect before changing anything:
   - `AGENTS.md`
   - `.specify/HOW_TO_USE.md`
   - `.specify/constitution.md`
   - `.specify/features/`
   - `.specify/memory/active_session.md`
   - `package.json`, build/test scripts, and framework markers
2. Preserve existing project rules. If `AGENTS.md` exists, merge harness rules into it instead of replacing it.
3. If `.specify/memory/active_session.md` is missing, create it from the template below.
4. If `specUserStory/` is missing, create it for reverse-engineered page/API/user-story records.
5. For implementation work, require an active feature with `specify.md`, `plan.md`, and `tasks.md`. If tasks are missing, create or ask to create tasks before coding.
6. After work, run the best available verification command and update `.specify/memory/active_session.md` with the exact result, including blockers.

## Bootstrap Decision Rules

- **Existing Spec Kit present**: add/merge AGENTS.md harness, active session file, `specUserStory/`, and project verification notes.
- **No `.specify/` present**: do not fake Spec Kit. Tell the user to install/scaffold Spec Kit first, or create only a clearly labeled lightweight harness if they explicitly ask.
- **Dirty worktree**: do not revert unrelated changes. Mention that the harness was added alongside existing work.
- **Unknown framework**: inspect files before selecting verification commands.
- **Frontend project**: include browser/screenshot verification only when the app has a local route and the change is visual/user-facing.

## Files To Create Or Merge

### `AGENTS.md`

Add this section when missing:

```markdown
# Agent Harness Rules

1. Restore context before work:
   - Read `.specify/HOW_TO_USE.md` if present.
   - Read `.specify/memory/active_session.md` if present.
   - Check `.specify/features/` for the current feature's `specify.md`, `plan.md`, and `tasks.md`.
2. Follow Spec Kit flow: Specify -> Plan -> Tasks -> Implement. Do not implement a feature without tasks unless the user explicitly asks for an emergency fix.
3. Before edits, inspect the real code path and current working tree. Do not overwrite user changes.
4. Verification must match project risk. Prefer the repo's own scripts. Record any failed or skipped verification with exact command and reason.
5. Update `.specify/memory/active_session.md` before finishing with completed work, verification, blockers, and next best action.
6. For reverse inventory/user-story work, save artifacts under `specUserStory/`.
```

### `.specify/memory/active_session.md`

Create this file if missing:

```markdown
# Current Session Progress

- **Current Active Feature**: none
- **Latest Verified Action**: none
- **Current Blockers**: none
- **Next Best Action**: inspect current request and select or create a feature spec

## Session Log

### YYYY-MM-DD Initial Harness Setup

- **Completed Action**: Added Spec Kit agent harness files.
- **Verification**: Not run yet.
- **Notes**: Replace this entry after the first real feature task.
```

### `specUserStory/`

Create this folder when missing. Use it for reverse-engineered docs, route inventory, API/user-story mapping, and source-grounded behavior notes.

Recommended first file for app inventories:

```markdown
# Route And User Story Inventory

## Scope

- Source date:
- Project path:
- Framework:

## Routes / Screens

| Route | Component | Purpose | Primary User Story | Source |
|---|---|---|---|---|

## Notes

- Keep this file source-grounded. Cite actual routes, components, services, guards, and APIs.
```

## Verification Selection

Use project scripts when available:

- Angular/Node: `npm run build`, `npm run verify`, `npm test`, `npm run lint`
- Python: `python -m pytest`, `python -m py_compile`, project-specific test scripts
- Docker services: `docker compose config`, service health checks, targeted logs
- Docs-only change: run format/link checks if available; otherwise verify files exist and summarize no runtime tests were needed

If a command fails because of environment rather than code, record the exact signature in active session. Example: `ng test --watch=false` aborts with `Abort trap: 6` before tests execute.

## Session Update Format

Append or update concise entries:

```markdown
## YYYY-MM-DD Feature Or Task Name

- **Completed Action**: What changed.
- **Verification**: Commands run and result.
- **Current Blockers**: Exact blocker or `none`.
- **Next Best Action**: One concrete next action.
```

## Safety Constraints

- Never delete or regenerate existing `.specify/features/` without explicit user approval.
- Never replace AGENTS.md wholesale when it already exists.
- Never treat generated specs as truth if source files contradict them.
- Do not run destructive cleanup commands to bootstrap the harness.
- Do not hide verification failures. Record them precisely.
- Do not claim `npm run verify` passed if only `npm run build` passed.

## Common User Corrections

- A skill is normally installed as a Codex skill folder with `SKILL.md`; a random Markdown file in a project folder is not automatically active as a skill.
- Spec Kit and the harness are separate layers. Spec Kit defines feature workflow; this harness defines agent operating discipline and reusable session state.
- The harness can be copied into projects, but the more reusable pattern is installing this skill globally and letting it create project-local harness files on demand.
