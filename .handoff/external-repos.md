# External repositories

Updated: 2026-09-13 · protocol: 1

## `JenkaBY/bike-rental`

- Purpose: Bike rental shop backend API (equipment/customer/tariff/rental/finance management), paired with this `bikerental-ui` frontend.
- Stack: Java 21, Spring Boot 4 / Spring Modulith modular monolith, Gradle, Liquibase, OAuth2/OIDC (Spring Authorization Server), Docker Compose.
- Key directories: `service/src/main/java/com/github/jenkaby/bikerental/{customer,equipment,tariff,users,identity,rental,finance,shared}/`, `component-test/`, `requirements/`.
- Delegate here when: backend/API work — Spring Boot business logic, module boundaries, JPA/Liquibase migrations, OAuth2/OIDC server config, or OpenAPI spec changes this UI's `generate:api` consumes.
- Do not delegate when: the work is Angular/UI-specific (components, stores, i18n, frontend routing/forms) — that belongs in this repo.
- Useful labels: `bug`, `enhancement`, `documentation`, `dependencies`, `github_actions`, `java`, `good first issue`, `help wanted`.
