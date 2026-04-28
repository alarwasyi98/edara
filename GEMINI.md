# GEMINI.md — Gemini-Specific Instructions for EDARA

> Thin wrapper. All project context lives in `AGENTS.md` and `.agents/` memory system.
> This file contains only Gemini-specific behavioral overrides.

---

## Activation

Read `AGENTS.md` first. It points to the full memory system.

## Gemini-Specific Rules

1. **Always read the memory system** before generating or modifying code. Start with `.agents/memory/system.md`.
2. **Financial code:** When you see money calculations, stop and verify decimal.js usage. This is the #1 source of bugs.
3. **Session logging:** After significant work, append to `.agents/memory/log.md`.
4. **Commit messages:** Follow `.agents/rules/commit-convention.md` exactly.
5. **No Clerk references:** The project migrated to Better Auth. If you see Clerk in old code, flag it.
6. **Windows environment:** Use PowerShell commands, not bash/UNIX equivalents.
7. **No SSR patterns:** Never generate `loader` functions. Use `useQuery` / `useMutation` from oRPC.
