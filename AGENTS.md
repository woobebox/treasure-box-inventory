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

## Spec Kit Slash Command Routing

When a user message starts with one of the slash commands below, treat the remaining text in that same user message as `$ARGUMENTS`, read the mapped `.github/agents/*.agent.md` file, and execute that agent workflow before taking any other feature-specific action. Do not ask the user to repeat the command text unless the arguments after the slash command are empty and the mapped workflow requires input.

| User command | Agent workflow to execute |
| --- | --- |
| `/speckit.spec` | `.github/agents/speckit.specify.agent.md` |
| `/speckit.clarify` | `.github/agents/speckit.clarify.agent.md` |
| `/speckit.speckit.plan` | `.github/agents/speckit.plan.agent.md` |
| `/speckit.plan` | `.github/agents/speckit.plan.agent.md` |
| `/speckit.tasks` | `.github/agents/speckit.tasks.agent.md` |
| `/speckit.implement` | `.github/agents/speckit.implement.agent.md` |
| `/speckit.constitution` | `.github/agents/speckit.constitution.agent.md` |
| `/speckit.taskstoissues` | `.github/agents/speckit.taskstoissues.agent.md` |
| `/speckit.checklist` | `.github/agents/speckit.checklist.agent.md` |

Routing notes:
- `/speckit.spec` is the short alias for the existing `speckit.specify` workflow.
- `/speckit.speckit.plan` is supported exactly as written for compatibility; `/speckit.plan` is also accepted as the normalized alias.
- The slash command itself is only a router. The actual behavior, prerequisites, files to read or write, and validation steps come from the mapped agent workflow file plus the harness rules in this `AGENTS.md`.
