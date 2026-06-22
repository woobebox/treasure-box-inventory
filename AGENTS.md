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
