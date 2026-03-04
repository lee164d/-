# AGENTS.md — StarEyeCat Project Conventions

## Project Overview
Multi-agent pipeline for AI-driven content creation. Agents: Scout → Brain → Forge → Analyst.

## Tech Stack
- Language: TypeScript (strict mode)
- Runtime: Node.js 20+
- Package manager: npm with workspaces
- LLM: Kimi K2 via OpenAI-compatible API (base URL: https://api.moonshot.cn/v1)
- Data store: Google Sheets (via googleapis SDK)
- Browser automation: Playwright (installed and debugged locally, not in CI)

## Coding Conventions
- All source code goes in `src/` subdirectories
- All tests go in `tests/` subdirectories and use Jest
- Use named exports, no default exports
- Prefer async/await over callbacks or raw promises
- All external API calls must be wrapped in dedicated client modules under `shared/`
- Environment variables loaded from `.env` via dotenv — NEVER hardcode secrets

## Testing
- Run all tests: `npm test`
- Tests must mock all external API calls (Kimi, Google Sheets, Spotify, Playwright)
- Use jest.mock() for module-level mocks

## Lint
- Run lint: `npm run lint`

## Important
- Do NOT create code for agents other than the one specified in the task
- Do NOT install or configure Playwright (it is managed locally by the human developer)
- Each task should only modify files within the scope described in the task prompt
