<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
at .specify/features/001-local-first-pwa-inventory/plan.md
<!-- SPECKIT END -->

## Spec Kit Slash Command Routing

When a user message starts with a Spec Kit command, route it to the matching agent workflow and treat the remaining message text as `$ARGUMENTS`:

- `/speckit.spec` -> `.github/agents/speckit.specify.agent.md`
- `/speckit.clarify` -> `.github/agents/speckit.clarify.agent.md`
- `/speckit.speckit.plan` -> `.github/agents/speckit.plan.agent.md`
- `/speckit.plan` -> `.github/agents/speckit.plan.agent.md`
- `/speckit.tasks` -> `.github/agents/speckit.tasks.agent.md`
- `/speckit.implement` -> `.github/agents/speckit.implement.agent.md`
- `/speckit.constitution` -> `.github/agents/speckit.constitution.agent.md`
- `/speckit.taskstoissues` -> `.github/agents/speckit.taskstoissues.agent.md`
- `/speckit.checklist` -> `.github/agents/speckit.checklist.agent.md`

Read and follow the mapped agent file before any feature-specific action.
