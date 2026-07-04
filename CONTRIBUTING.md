# Contributing to SplitSync

Thank you for your interest in contributing to SplitSync! We welcome developer contributions to make payment splitting on Stellar more robust and feature-rich.

---

## 1. Development Guidelines

### Smart Contract Backend (Rust)
- Ensure all business logic remains in `split_sync/contracts/split_sync/src/lib.rs`.
- Write thorough unit tests inside `split_sync/contracts/split_sync/src/test.rs` for any new logic.
- Keep the contract size optimized and run code formatting:
  ```bash
  cargo fmt
  ```

### Next.js Frontend (TypeScript)
- Use standard functional React components.
- Keep helper utilities decoupled from the Stellar SDK when possible to allow lightweight Unit testing.
- Format frontend code using Prettier:
  ```bash
  npm run test # run frontend test suite
  ```

---

## 2. Commit Message Convention

To maintain a clean and readable history, we follow the conventional commit specification:

- `feat:` — Introduces a new feature.
- `fix:` — Patches a bug or resolves an issue.
- `docs:` — Updates documentation or markdown files.
- `style:` — Code style formatting adjustments.
- `refactor:` — Code changes that neither fix bugs nor add features.
- `test:` — Adds or updates testing suites.

Example:
```bash
git commit -m "feat: integrate Freighter wallet connection handler"
```
