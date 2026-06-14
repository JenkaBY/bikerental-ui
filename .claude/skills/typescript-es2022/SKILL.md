---
name: typescript-es2022
description: TypeScript 5.x / ES2022 coding standards for this repo — type safety, module style, naming, async/error handling, and security guardrails. Use when authoring or reviewing any .ts file, deciding types vs any/unknown, structuring modules, or wiring async/error handling in TypeScript.
---

# TypeScript Development (5.x / ES2022)

Guidance for TypeScript 5.x (or newer) compiling to an ES2022 baseline. Adjust if a runtime requires
older targets or down-level transpilation.

## Core intent

- Respect the existing architecture and coding standards; extend current abstractions before
  inventing new ones.
- Prefer readable, explicit solutions over clever shortcuts.
- Prioritize maintainability and clarity: short methods and classes, clean code.

## General guardrails

- Target TypeScript 5.x / ES2022; prefer native features over polyfills.
- Use pure ES modules; never emit `require`, `module.exports`, or CommonJS helpers.
- Rely on the project's build, lint, and test scripts (`npm run build`, `npm run lint`, `npm test`).
- Note design trade-offs when intent is not obvious.

## Project organization

- Follow the repository's folder and responsibility layout for new code.
- Use kebab-case filenames (e.g., `user-session.ts`, `data-service.ts`) unless told otherwise.
- Keep tests, types, and helpers near their implementation when it aids discovery.
- Reuse or extend shared utilities before adding new ones.

## Naming & style

- PascalCase for classes, interfaces, enums, and type aliases; camelCase for everything else.
- Skip interface prefixes like `I`; rely on descriptive names.
- Name things for behavior or domain meaning, not implementation.
- Match the project's indentation, quote style, and trailing-comma rules; run lint/format before submitting.
- Keep functions focused; extract helpers when branches grow. Favor immutable data and pure functions.

## Type system

- Avoid `any` (implicit or explicit) — prefer `unknown` plus narrowing. (`no-explicit-any` is enforced
  here, in source **and** tests.)
- Use discriminated unions for events and state machines.
- Centralize shared contracts instead of duplicating shapes.
- Express intent with utility types (`Readonly`, `Partial`, `Record`); use `Readonly<T>` for state models.

## Async, events & error handling

- Use `async/await`; wrap awaits in try/catch with structured errors.
- Guard edge cases early to avoid deep nesting.
- Route errors through the project's logging/telemetry (`LoggerService`) and surface user-facing
  errors via the project's notification pattern (e.g. `MatSnackBar`).
- Debounce configuration-driven updates and dispose resources deterministically
  (`takeUntilDestroyed()` for RxJS).

## Architecture & integrations

- Follow the repository's DI/composition pattern; keep modules single-purpose; keep transport,
  domain, and presentation layers decoupled.
- Instantiate external clients outside hot paths and inject them for testability; never hardcode
  secrets; apply retries/backoff/cancellation to network/IO; normalize external responses and map
  errors to domain shapes.

## Security

- Validate and sanitize external input with schema validators or type guards.
- Avoid dynamic code execution and untrusted template rendering; encode untrusted content before
  rendering HTML (framework escaping / trusted types).
- Use parameterized queries; keep secrets in secure storage with least-privilege scopes; use vetted
  crypto libraries only; patch dependencies promptly.

## Testing

- Add/update unit tests with the project's framework (Vitest) and naming style.
- Expand integration/e2e coverage when behavior crosses modules.
- Avoid brittle timing assertions; prefer fake timers or injected clocks.

## Performance

- Lazy-load heavy dependencies and dispose them when done.
- Defer expensive work until needed; batch or debounce high-frequency events; track resource
  lifetimes to prevent leaks.
