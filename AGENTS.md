# Repository Guidelines

## Project Structure & Module Organization
PySchool is a Portuguese-language Python learning dashboard using plain HTML, CSS, JavaScript, and a Python lesson endpoint.
- `index.html`: login form, sidebar, and lesson, progress, and profile sections.
- `style.css`: shared theme, layout, and component styles.
- `app.js`: DOM updates, login, lesson completion, XP calculations, and Supabase REST requests.
- `api/licoes.py`: lesson data and a Vercel-style `BaseHTTPRequestHandler` exposed as `/api/licoes`.

There are no separate asset directories, dependency manifests, or test suites.

## Build, Test, and Development Commands
Run commands from the repository root:
- `python -m http.server 8000`: serve the frontend at `http://localhost:8000`. This static server does not execute `/api/licoes`; full lesson loading requires a compatible function runtime.
- `node --check app.js`: check JavaScript syntax when Node.js is installed.
- `python -m py_compile api/licoes.py`: check Python syntax; generates an untracked `__pycache__` directory.

No build step, package scripts, formatter, or linter is configured. Frontend authentication and progress requests depend on the configured Supabase service.

## Coding Style & Naming Conventions
Use four-space indentation, JavaScript semicolons, and the surrounding file's quoting style. Keep Portuguese UI text and descriptive Portuguese identifiers consistent with existing code: camelCase for JavaScript (`carregarLicoes`), snake_case for Python (`corpo_resposta`), and hyphenated DOM IDs (`tela-progresso`). Preserve lesson fields `id`, `titulo`, `descricao`, and `xp`, and keep IDs unique and stable.

## Testing Guidelines
No testing framework or coverage threshold exists. Run syntax checks and manually verify login, registration, logout, navigation, lesson completion/reversal, XP, persistence after reload, and network failure messages. Check narrow-screen layouts and browser console errors. Keep HTML IDs aligned with JavaScript selectors, including `campo-nome`, `campo-email`, and `msg-login`. If adding automated tests, use descriptive names such as `tests/test_licoes.py` and document their runner.

## Commit & Pull Request Guidelines
The single existing commit uses a filesystem path as its subject, so no established convention is evident. Use short imperative subjects, such as `Fix lesson progress calculation`. PRs should explain the change, list verification performed, link relevant issues, and include screenshots for visible UI changes.

## Security & Configuration
Never commit privileged Supabase keys or real student credentials. Use test accounts for verification. Review database row-level security when changing access. Login and registration use `pyschool_entrar` and `pyschool_cadastrar` through `/rest/v1/rpc/`; password verification belongs in the database. Do not read student passwords through the table REST endpoint.
