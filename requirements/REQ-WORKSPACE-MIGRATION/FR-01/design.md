# System Design: FR-01 — Workspace Configuration

## 1. Architectural Overview

This story transforms the repository topology from a single-component build boundary into a multi-project workspace. No source code is moved; only the workspace-level build manifest and project declarations are restructured. The current `bikerental-ui` project entry is retired and replaced by four explicitly declared project entries, each with isolated build, test, and lint responsibilities.

The resulting topology introduces a strict layered dependency contract at the build-manifest level: application projects (`gateway`, `admin`, `operator`) are declared as consumers; the library project (`shared`) is declared as a provider. This boundary is enforced by the workspace configuration itself before any code-level import rules take effect.

## 2. Impacted Components

* **`bikerental-ui` (Existing Single-Project SPA):** Retired as a named project entry. Its build, serve, test, and lint architect targets are superseded by the four new project declarations. The `src/` source tree remains untouched in this story.

* **`gateway` (New Application Project):** Declared in the workspace manifest with `build`, `serve`, `test`, and `lint` architect targets. Root set to `projects/gateway/`. Entry point will be wired in FR-03; this story declares the shell only.

* **`admin` (New Application Project):** Declared in the workspace manifest with `build`, `serve`, `test`, and `lint` architect targets. Root set to `projects/admin/`. Source wired in FR-04.

* **`operator` (New Application Project):** Declared in the workspace manifest with `build`, `serve`, `test`, and `lint` architect targets. Root set to `projects/operator/`. Source wired in FR-05.

* **`shared` (New Library Project):** Declared in the workspace manifest with `build` and `lint` architect targets only — no `serve` target. Root set to `projects/shared/`. Source wired in FR-02.

## 3. Abstract Data Schema Changes

* **No persistent data entities are affected by this story.** The workspace manifest (`angular.json`) is a build-time configuration artifact, not a runtime data store. No domain entities, attributes, or relations change.

## 4. Component Contracts & Payloads

* **Interaction: CLI → `gateway` build target**
  * **Protocol:** Angular CLI architect invocation
  * **Payload Changes:** New named target `gateway:build` declared. Produces artifact at `dist/gateway/`. Browser entry point to be specified in FR-03.

* **Interaction: CLI → `admin` build target**
  * **Protocol:** Angular CLI architect invocation
  * **Payload Changes:** New named target `admin:build` declared. Produces artifact at `dist/admin/`.

* **Interaction: CLI → `operator` build target**
  * **Protocol:** Angular CLI architect invocation
  * **Payload Changes:** New named target `operator:build` declared. Produces artifact at `dist/operator/`.

* **Interaction: CLI → `shared` build target**
  * **Protocol:** Angular CLI architect invocation
  * **Payload Changes:** New named target `shared:build` declared. No `serve` target. Output is a source-reference library resolved via path alias (no separate distribution artifact in this story).

* **Interaction: CLI → `<project>:lint` targets**
  * **Protocol:** Angular CLI architect invocation
  * **Payload Changes:** Each of the four projects declares an independent `lint` target scoped to its own `sourceRoot`. No cross-project lint aggregation at this stage.

## 5. Updated Interaction Sequence

**Happy Path — Developer builds a single application project:**

1. Developer invokes `ng build <project>` (e.g., `ng build admin`).
2. Angular CLI resolves the `admin` project entry from `angular.json`.
3. CLI reads the `build` architect target configuration for `admin`.
4. Build system compiles sources under `projects/admin/` using the project's `tsConfig`.
5. Artifact is emitted to `dist/admin/browser/`.
6. Command exits with code 0.

**Happy Path — Developer serves a project for local development:**

1. Developer invokes `ng serve <project>`.
2. Angular CLI resolves the `serve` target for the named project.
3. Dev server starts on the configured port.
4. No other project's dev server is affected.

**Unhappy Path — Unknown project name:**

1. Developer invokes `ng build unknown-project`.
2. Angular CLI fails to find a matching project entry in `angular.json`.
3. CLI exits with a descriptive error; no build artifact is produced.

**Happy Path — Schema validation:**

1. A tooling agent or CI step runs `ng version` or `ng lint` against the workspace.
2. Angular CLI validates `angular.json` against its bundled JSON schema.
3. All four project entries pass schema validation.
4. No schema errors are reported.

## 6. Non-Functional Architecture Decisions

* **Security & Auth:** Not applicable to this story. No runtime behaviour changes; no authentication boundaries are introduced or modified.

* **Scale & Performance:** Each project's build target operates independently, enabling parallel builds in CI without shared state. No caching strategies are introduced in this story — that is deferred to FR-06. Individual project build times must not exceed the pre-migration total build time for the equivalent subset of source files.
