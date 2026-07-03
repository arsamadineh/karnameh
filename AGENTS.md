# KarNama (کارنامه) - Development Rules & Coding Standards

This document defines the strict development rules, conventions, and architectural guidelines for the KarNama project. All engineers (human or AI) MUST adhere to these rules to ensure a high-performance, maintainable, and premium production-grade application.

## 1. Core Philosophy

*   **Performance is a Feature**: Target < 1s cold start. No unnecessary re-renders. Keep memory footprint minimal.
*   **Zero Compromise UX**: Animations must be smooth (60fps), layouts perfectly responsive, and interactions instantaneous.
*   **Maintainability over Cleverness**: Write clean, self-documenting code. Prefer explicitness over implicit magic.
*   **Production Quality**: No placeholders, no `TODO`s (unless truly unavoidable and tracked), no dead code.
*   **Persian First**: Complete RTL support, Vazirmatn typography, Persian numbers, and Jalali dates are mandatory.

## 2. Architecture Rules

### 2.1 Backend (Rust / Tauri)
*   **Separation of Concerns**: Strictly separate commands (Tauri IPC), services (business logic), repositories (database access), models (data structures), and utilities.
*   **No Giant Files**: Break down large modules. Keep files focused on a single responsibility.
*   **Error Handling**: Use the `thiserror` crate for defining custom error types. Never use `unwrap()` or `expect()` in production code unless you can mathematically prove it will never fail. Return `Result<T, AppError>` to the frontend.
*   **Asynchronous I/O**: Use `tokio` and `sqlx` for non-blocking database and file operations.
*   **State Management**: Use Tauri's managed state for shared resources (e.g., database connection pools).

### 2.2 Frontend (Vite / SolidJS / TypeScript)
*   **Framework**: Use SolidJS for fine-grained reactivity.
*   **State**: Leverage Solid's `createSignal` and `createStore`. Keep state as local as possible. Lift state up only when necessary.
*   **Components**: Use functional components. Prefer small, composable components over monolithic ones.
*   **Routing**: Use a lightweight router suitable for desktop apps (e.g., hash-based or Solid Router).
*   **API Layer**: Encapsulate all Tauri `invoke` calls within a dedicated `lib/tauri.ts` or similar API layer. Components should never call `invoke` directly.

### 2.3 Database (SQLite)
*   **Schema**: Design professionally. Use explicit foreign keys, cascading deletes (where appropriate), and strict types.
*   **Migrations**: Use `sqlx` migrations. Never alter the schema directly without a migration script.
*   **Queries**: Use compile-time checked queries with `sqlx::query!`. Avoid raw string concatenation for SQL.
*   **Transactions**: Wrap multiple related database operations in a transaction to ensure ACID compliance.

## 3. UI / UX & Animation Conventions

*   **Aesthetics**: Aim for a premium feel (Linear/Notion/Apple). Avoid generic framework looks. Use subtle shadows, blurs, and tasteful gradients.
*   **Animations**:
    *   Be meaningful, not excessive.
    *   Use CSS transitions/animations or SolidJS `Transition` components.
    *   Target 60fps. Avoid animating expensive properties (like `width`/`height`); prefer `transform` and `opacity`.
    *   Respect user preferences for reduced motion if applicable.
*   **RTL**: Ensure all flexbox/grid layouts naturally support RTL (`margin-inline-start` instead of `margin-left`, etc.).
*   **Typography**: Use Vazirmatn. Maintain a clear typographic hierarchy.

## 4. Coding Standards

### 4.1 Rust Conventions
*   Follow standard Rust naming conventions (`snake_case` for variables/functions, `CamelCase` for types/structs).
*   Run `cargo fmt` and `cargo clippy` continuously. Code must compile without warnings.
*   Document public APIs using standard Rustdoc comments (`///`).

### 4.2 TypeScript Conventions
*   Strict mode must be enabled in `tsconfig.json`.
*   Avoid `any`. Define precise interfaces or types for all data structures.
*   Use `PascalCase` for component names and interfaces, `camelCase` for variables and functions.
*   Prefer `const` over `let`.

### 4.3 CSS Conventions
*   Use Vanilla CSS with CSS Modules or scoped CSS to prevent global leakage.
*   Define design tokens (colors, spacing, fonts) as CSS variables in a central file.
*   Use BEM-like naming if not using CSS Modules, though Modules are preferred.

## 5. File Naming Rules
*   **Rust**: `snake_case.rs`
*   **TypeScript/Solid**: `PascalCase.tsx` for components, `camelCase.ts` for utilities/logic.
*   **CSS**: `ComponentName.module.css` or `global.css`.

## 6. Commit & Versioning Rules
*   Use Conventional Commits (e.g., `feat: add client list`, `fix: resolve crash on startup`, `refactor: optimize db queries`).
*   Keep commits focused and atomic.

## 7. Documentation
*   Inline comments should explain *why*, not *what*.
*   Maintain an updated `README.md` with setup instructions.
*   Document complex business logic or database schema relationships.

## 8. Performance Rules
*   Measure before optimizing, but adhere to best practices by default.
*   Avoid N+1 query problems in the repository layer.
*   Paginate or virtualize long lists on the frontend.
*   Lazy load non-critical assets.

## 9. Local-First Strategy
*   All data resides in the local SQLite database.
*   Implement automatic rolling backups (e.g., daily).
*   Provide clear manual export/import functionality via JSON or raw SQLite files.
