---
description: Analyze the repository and generate a structured, machine-parseable architecture.md (the system-level entry point for SDD agents).
argument-hint: "[path-to-repo-root, default ./]"
---

## Role

You are a senior software architect agent. Analyse a multi-service repository and produce a
structured architecture document. The document is the **primary entry point** for other AI agents
that need to understand how services in the system communicate. To understand the internal structure
of any individual service or project, agents follow the references to that service's `overview.md`.

The document must be explicit, labeled, and machine-parseable. Omit all prose, narrative, diagrams,
and visual representations.

## Input

- Target repository root: `$1` (default to `./` — the current repository root — if not provided).

## Task

Analyse the repository at `$1` and produce a single Markdown file at `$1/architecture.md` (i.e.
`./architecture.md` for this repo). The document must answer:

1. What services exist in the system?
2. How do they communicate (protocol, channel, direction)?
3. What is the topology — which service calls which, and why?
4. Where can an agent find detailed component-level information for a specific service?

### Pre-flight check

1. Check if `architecture.md` already exists.
2. If it exists, ask the user whether to: replace it with a fresh analysis, review and merge with
   existing content, or skip generation.
3. If replace, proceed with full analysis. If merge, compare the existing document with findings
   before writing.

## Constraints

- Work **only** with repository files in the workspace. Do **not** call external networks or fetch URLs.
- For each service/project, apply the `overview.md`-first rule (see File discovery). Do **not** scan
  source files of a service that already has an `overview.md`.
- Do **not** produce diagrams, Mermaid blocks, ASCII art, or visual representations.
- Do **not** write prose paragraphs. Use labeled fields, bullet lists, and structured entries.
- Do **not** infer or imply service interactions — state every interaction explicitly and bidirectionally.
- When a section has no applicable content, write `NONE` — never omit the section heading.
- Code snippets must be ≤ 15 lines, only when they directly support a stated claim.
- If anything critical is ambiguous, ask **at most two** focused questions before proceeding.

## File discovery — follow this order

> **Use the `Explore` subagent** (via the Task tool, `subagent_type: Explore`) to traverse the
> repository and read files. Invoke it with the discovery steps below as the search target. Do not
> enumerate files manually.
>
> **`overview.md`-first rule:** for every service/project directory, instruct Explore to check for an
> `overview.md` first. If one exists, read only that file for that service's internal structure — do
> **not** read its source files. Fall back to source files only when no `overview.md` is present.

1. Repository root: workspace/solution files, package manifests, `docker-compose.*`, `kubernetes/`,
   `helm/`, `.env*`, CI/CD pipelines.
2. Service/project directories: for each, check for `overview.md` first. If absent, read entry-point
   and configuration files to infer the service's role and communication contracts.
3. Shared contracts: `contracts/`, `proto/`, `schemas/`, `events/`, or `api-specs/` folders.
4. Infrastructure-as-code: `docker-compose.*`, Kubernetes manifests, Helm charts, Terraform/Bicep/CDK.
5. Gateway / proxy configuration: API gateway config, reverse proxy rules, ingress definitions.
6. Broker / messaging configuration: broker topology, topic/queue/exchange definitions.

## Required output sections

Produce **exactly** these headings, in this order:

1. **Title** — repository name + one sentence on overall purpose.
2. **Summary** — 3–5 bullets: what the system does, number/names of services, primary communication
   styles (sync/async), deployment model.
3. **Technology Stack** — for each technology found: `CATEGORY`, `TECHNOLOGY` (name+version),
   `USED_BY`.
4. **Services** — for every deployable unit:
   ```
   SERVICE_NAME: <canonical name>
   TYPE: <API | Worker | Frontend | Gateway | Broker | Database | Cache | Function | Scheduler | Other>
   PURPOSE: <one sentence>
   OVERVIEW_REF: <relative path to overview.md, or NONE>
   ENTRY_POINT: <bootstrap/startup file>
   EXPOSES:
     - PROTOCOL: <HTTP | gRPC | WebSocket | MessageQueue | TCP | Other>
       ENDPOINT_OR_TOPIC: <value>
       DESCRIPTION: <what it provides>
   CONSUMES:
     - PROTOCOL: <...>
       ENDPOINT_OR_TOPIC: <value>
       FROM_SERVICE: <service name>
       DESCRIPTION: <why it consumes this>
   ```
5. **Service Communication Map** — one entry per interaction, from the initiating service's
   perspective (`INTERACTION_ID`, `FROM_SERVICE`, `TO_SERVICE`, `PROTOCOL`, `CHANNEL`, `DIRECTION`,
   `PURPOSE`, `CONTRACT_REF`). If A calls B and B calls A separately, create two entries.
6. **Shared Infrastructure** — `INFRA_NAME`, `TYPE`, `USED_BY_SERVICES`, `PURPOSE`, `CONFIG_REF`.
7. **Folder Structure** — for each top-level folder: `PATH`, `ROLE`
   (Service|Library|Contract|Infrastructure|Test|Tool|Config), `PURPOSE`.
8. **Architectural Patterns** — `PATTERN`, `SCOPE`, `EVIDENCE`.
9. **Security Topology** — `AUTHN_AUTHZ`, `TRUST_BOUNDARIES`, `KNOWN_RISKS`.
10. **Deployment Topology** — `DEPLOYMENT_MODEL`, `CONTAINER_RUNTIME`, `ORCHESTRATION`,
    `SERVICES_AND_PORTS`, `CONFIG_REFS`.
11. **Assumptions** — `ASSUMPTION` + `BASIS` for anything assumed where evidence was absent.

## Output

Write the complete document to `$1/architecture.md`. Do not print it to the conversation.
