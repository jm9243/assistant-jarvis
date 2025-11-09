# Repository Guidelines

## Project Structure & Module Organization
- `desktop/frontend` hosts the Tauri 2 + React 18 UI. Keep routes in `src/pages`, shared widgets in `src/components/common`, node-specific blocks in `components/nodes`, and Zustand stores in `src/stores`.
- `desktop/engine` is the Python sidecar. `main.py` boots FastAPI, API contracts sit in `api/`, execution logic under `core/`, while GUI/Web/system automation helpers live in `tools/`.
- Repository-level `docs/` stores iteration plans and the canonical development standard; update it alongside structural changes. `backend`, `mobile`, and `admin-web` currently carry documentation scaffolding—mirror the same folder layout when code lands.

## Build, Test, and Development Commands
- Frontend: `cd desktop/frontend && npm install && npm run dev` for hot reload, `npm run build` for production output, and `npm run tauri dev|build` when testing the native shell.
- Linting: `npm run lint` runs ESLint with TypeScript + React hooks rules; fix violations before committing.
- Engine: `cd desktop/engine && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt` sets up dependencies, `playwright install` prepares browsers, and `python main.py` starts the FastAPI process.

## Coding Style & Naming Conventions
- TypeScript uses 2-space indentation, ES modules, `PascalCase` components, `camelCase` hooks/services, `I*` interfaces, `T*` types, and Tailwind utility classes; colocate workflow-specific logic under `components/nodes`.
- Python modules follow `snake_case`, include type hints plus docstrings, prefer `@dataclass` for immutable models, and isolate side effects in adapters; never mix UI logic into engine code.
- Refer to `desktop/docs/开发规范.md` before introducing new modules to ensure SOLID/KISS/DRY alignment.

## Testing Guidelines
- Target Vitest + React Testing Library for UI units (`*.test.tsx` next to the component) and mock Tauri commands when possible; critical workflow modules should report ≥80% coverage.
- Use pytest for the engine (`pytest tests/`), grouping fixtures by subsystem and stubbing automation drivers so CI can run headlessly.
- Record integration runs (workflow execution, agent orchestration) and attach logs or screen captures to PRs when behavior changes.

## Commit & Pull Request Guidelines
- Follow Conventional Commits (`feat(workflow): ...`, `fix(engine): ...`, `docs(guides): ...`) and keep scopes aligned with directory names.
- Each PR must include: concise summary, testing checklist, linked issue or iteration plan, and screenshots/logs for UI-affecting changes.
- Prefer small, self-contained PRs (<400 LOC touched) and rebase before merge to keep history linear.

## Security & Configuration Tips
- Copy `.env.example` per module, store secrets via the OS keychain, and never commit real credentials.
- Validate all external inputs in both React services and FastAPI endpoints; log privileged actions through the existing engine logger with contextual metadata.
