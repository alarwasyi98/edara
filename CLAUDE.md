# CLAUDE.md — Claude-Specific Instructions for EDARA

> Thin wrapper. All project context lives in `AGENTS.md` and `.agents/` memory system.
> This file contains only Claude-specific behavioral overrides.

---

## Activation

Read `AGENTS.md` first. It points to the full memory system.

## Claude-Specific Rules

1. **Always read the memory system** before generating or modifying code. Start with `.agents/memory/system.md`.
2. **Use TodoWrite** to track multi-step tasks.
3. **Financial code:** When you see money calculations, stop and verify decimal.js usage. This is the #1 source of bugs.
4. **Session logging:** After significant work, append to `.agents/memory/log.md`.
5. **Commit messages:** Follow `.agents/rules/commit-convention.md` exactly.
6. **No Clerk references:** The project migrated to Better Auth. If you see Clerk in old code, flag it.
7. **Windows environment:** Use PowerShell commands, not bash/UNIX equivalents.
