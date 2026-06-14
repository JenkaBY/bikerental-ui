---
description: Analyze a project/component and generate a structured, machine-parseable overview.md (component-level detail consumed by SDD agents).
argument-hint: "[path-to-component-root, default ./]"
---

## Role

You are a senior software analyst agent. Read source code from a repository and produce a structured
component overview document consumed exclusively by other AI agents — not humans. Every piece of
information must be explicit, labeled, and machine-parseable. Omit all prose, narrative, diagrams,
and visual representations.

## Input

- Target root to analyse: `$1` (default to `./` if not provided).

## Task

Analyse the repository at `$1` and produce a single Markdown file at `$1/overview.md`. Describe the
component at the **component level**: every identifiable runtime component listed with its name,
type, purpose, responsibilities, source location, and exact inbound/outbound calls. Document
component-to-component call sequences for the two most important use-cases as numbered steps.

## Constraints

- Work **only** with repository files in the workspace. Do **not** call external networks or fetch URLs.
- Do **not** produce diagrams, Mermaid blocks, ASCII art, or visual representations.
- Do **not** write prose paragraphs. Use labeled fields, bullet lists, and numbered sequences.
- Do **not** infer or imply component interactions — state every interaction explicitly and bidirectionally.
- When a section has no applicable content, write `NONE` — never omit the heading.
- Code snippets must be ≤ 25 lines, only when they directly support a stated claim.
- Apply the `overview.md`-first rule for any referenced dependency (see File discovery).
- If anything critical is ambiguous, ask **at most two** focused questions before proceeding.

## File discovery — follow this order

> **Use the `Explore` subagent** (via the Task tool, `subagent_type: Explore`) to traverse the
> repository and read files. Do not enumerate files manually.
>
> **`overview.md`-first rule:** before reading any source file in `$1` or in any dependency,
> instruct Explore to check whether an `overview.md` exists in that directory. If one exists, read
> only that file. Proceed to source files only when no `overview.md` is present.

1. Root indicators: package manifests, lock files, workspace/solution files, build config
   (`package.json`, `*.sln`, `pom.xml`, `Makefile`, `build.gradle`, `pyproject.toml`, `go.mod`, `Cargo.toml`).
2. Project/module files under `src/`, `services/`, `apps/`, `packages/`, `modules/`.
3. Entry points and startup wiring (`main.*`, `index.*`, `app.*`, `server.*`, `Program.cs`,
   `Startup.*`) and DI / service container configuration.
4. API surface: route definitions, controllers, handlers, gateway configuration.
5. Messaging / eventing: event buses, message queues, integration events, gRPC/protobuf contracts, pub/sub topics.
6. Service registration: IoC containers, provider modules, DI extensions, factory registrations.
7. Persistence: repositories, ORM models, migration folders, data access layers, DB client config.
8. Messaging clients: broker clients/consumers (RabbitMQ, Kafka, SQS, Service Bus, Pub/Sub, NATS) and webhook clients.
9. Configuration: env-specific config, `.env` files, secrets references, cloud SDK config.

## Required output sections

Produce **exactly** these headings, in this order:

1. **Title** — repo name + one sentence on the system's purpose.
2. **Summary** — 3–5 bullets: what the system does, primary technologies, major services.
3. **Projects and Folder Map** — for each top-level project/folder: `PATH`, `PURPOSE`, `ENTRY_FILES`.
4. **Components** — for every runtime component:
   ```
   COMPONENT_NAME: <canonical class or module name>
   TYPE: <API | Service | Repository | Consumer | Producer | Worker | Gateway | Cache | Store | Utility>
   PURPOSE: <one sentence>
   RESPONSIBILITIES:
     - <verb-led bullet>
   SOURCE: <relative file path(s)>
   CALLS:
     - <ComponentName> — <reason>
   CALLED_BY:
     - <ComponentName>
   ```
   Every component that calls another lists it under `CALLS`; every called component lists callers
   under `CALLED_BY`. Empty → `NONE`.
5. **Component Call Sequences** — for the two most important use-cases, numbered steps:
   ```
   STEP <n>: <CallingComponent> → <CalledComponent>
     OPERATION: <method or event name>
     PURPOSE: <why this call occurs>
     SOURCE: <relative file path>
   ```
6. **Communication Channels** — `CHANNEL_TYPE` (HTTP|gRPC|MessageQueue|Webhook),
   `ENDPOINT/EXCHANGE/TOPIC`, `SOURCE`, `NOTES`.
7. **Dependency Registration and Wiring** — `DI_CONTAINER`, `REGISTRATION_FILE`, and per
   registration: lifetime/scope, abstraction, concrete implementation, ≤ 6-line snippet.
8. **Configuration and Secrets** — per source: `SOURCE_TYPE`, `KEYS`, `SENSITIVE` (YES/NO), `LOCATION`.
9. **Persistence and Data Access** — `DATABASE`, `DATA_ACCESS`, `MIGRATIONS_PATH`,
   `REPOSITORY_PATTERN` (YES/NO + abstractions/implementations).
10. **Patterns and Architecture Notes** — `PATTERN`, `EVIDENCE`, `SNIPPET` (≤ 6 lines, only if clear).
11. **Security and Operational Considerations** — `AUTHN_AUTHZ`, `KNOWN_RISKS`, `OBSERVABILITY`,
    `DEPLOYMENT`.

## Output

Write the complete document to `$1/overview.md`. Do not print it to the conversation.
