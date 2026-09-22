# AGENT DIRECTIVES & WORKING RULES
**Document**: `PROJECT_HANDOVER/AGENTS.md`  
**Generated**: 2026-09-21T19:32:00-07:00

To all autonomous AI coding agents (ChatGPT, Claude, Codex, Grok, Gemini, Cursor, Copilot):

---

## 1. Primary Operating Directives

1. **Read Before Modifying**:
   * Always read `LLM_CONTEXT.md`, `02_ARCHITECTURE.md`, `07_BUSINESS_LOGIC.md`, and `22_CRITICAL_INVARIANTS.md` before altering code.
   * Inspect the exact existing file lines with `view_file` before making edits.
2. **Never Break Working Implementations**:
   * Do not replace working code with mock placeholders, stubs, or dummy comments (`// TODO: implement later`).
   * Never degrade real Firestore listeners into unpersisted in-memory variables.
3. **Respect Full-Stack Express + Vite Boundaries**:
   * Port 3000 is the only externally accessible port in this container.
   * Never change `PORT = 3000` in `server.ts`.
   * Keep secret API keys strictly on the server; never expose them with `VITE_` prefixes.
4. **Enforce Strict TypeScript**:
   * Run `npm run lint` (`tsc --noEmit`) after code changes.
   * Do not introduce untyped `any` or suppress type errors with `@ts-ignore` unless interfacing with dynamic third-party libraries.
5. **Preserve Dual-Stack Resilience**:
   * When modifying member or store mutations, update both Firestore AND local disk persistence (`data/*.json`).
