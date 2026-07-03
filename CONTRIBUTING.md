# Contributing to Karnameh

We welcome contributions of all kinds. Please follow these guidelines:

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Install dependencies: `npm install`
4. Run in dev mode: `npm run tauri dev`

## Code Style

- **Rust**: Follow `rustfmt` and `clippy` standards. Run `cargo fmt && cargo clippy` before committing.
- **TypeScript/SolidJS**: Strict mode is enabled. No `any` types. Use `const` over `let`.
- **CSS**: Use CSS variables defined in `src/styles/variables.css`. No inline magic numbers.

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add task due date filtering
fix: resolve crash when client name is empty
refactor: optimize database query in project repo
docs: update build instructions in README
```

## Pull Requests

- Keep PRs focused and atomic — one concern per PR.
- Reference the related issue in the PR description.
- Ensure `npx tsc -b --noEmit` passes with zero errors before submitting.

## Reporting Issues

Use GitHub Issues. Please include:
- Your OS and version
- Steps to reproduce the bug
- Expected vs actual behavior
