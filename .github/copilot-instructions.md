---
description: 'Core project instructions for AI assistance'
applyTo: '**'
---

# Project Context and Architecture

## System Context

You are a senior developer working on a **Angular** project using Node 24, TypeScript and Angular 21.

## Required Startup Sequence

**CRITICAL**: Read ALL memory bank files before starting ANY task:

1. `memory-bank/projectbrief.md` - Foundation and project scope
2. `memory-bank/productContext.md` - Why this project exists and user experience goals
3. `memory-bank/activeContext.md` - Current work focus and next steps
4. `memory-bank/systemPatterns.md` - Architecture and design patterns
5. `memory-bank/techContext.md` - Technologies and development setup
6. `memory-bank/progress.md` - Current status and what works
7. `memory-bank/tasks/_index.md` - All tasks and their statuses

Additional documentation to read as context requires:

- `docs/api-docs/all.json` - json file with all API endpoints and details in api-docs format
- `docs/main-flow-diagram.mermaid` - main flow diagram


## Workflow Rules

### Before Making Any Changes

1. **Check Memory Bank**: Read `activeContext.md` for current focus
2. **Verify Architecture**: Parse system architecture from `backend-architecture.md`
3. **Review Task Context**: Check current task from `tasks/_index.md`
4. **Follow Specifications**: Adhere to `technical-details.md` constraints
5. **Plan Tests**: Design test strategy following TDD approach

### After Completing Changes

1. **Update Progress**: Document changes in `progress.md`
2. **Update Task**: Add progress log entry to relevant task file in `tasks/` folder
3. **Update Active Context**: Refresh `activeContext.md` if scope changed
4. **Update Index**: Update `tasks/_index.md` with task status
5. **Verify Tests**: Ensure all tests pass with `test` profile

## Architecture Understanding

### Required Parsing from backend-architecture.md

1. **Extract and Understand**:
   - Module boundaries and relationships
   - Data flow patterns
   - System interfaces
   - Component dependencies
   - Hexagonal architecture layers (Domain, Application, Adapters)

2. **Validation**:
   - Validate changes against architectural constraints
   - Ensure new code maintains defined separation of concerns
   - Verify module boundaries are respected
   - Check that domain logic stays in domain layer
   - Confirm adapters properly isolate external dependencies

3. **Error Handling**:
   - If file not found: **STOP** and notify user
   - If diagram parse fails: **REQUEST** clarification
   - If architectural violation detected: **WARN** user with specific details
   - If dependency direction is wrong: **BLOCK** implementation

## Testing Strategy

### TDD Approach - Write Tests First

**Order of implementation**: Test → Interface → Implementation

1. **Component Tests** (`component-test` module):
   - Full integration tests with Spring Boot context
   - Endpoint testing with real HTTP requests
   - Focus on positive scenarios and happy paths
   - Test complete user flows end-to-end
   - Use real database with test containers if needed

2. **Unit Tests** (`service` module):
   - Service layer business logic testing
   - Application use case testing
   - Module interaction testing
   - Domain model behavior testing
   - Fast execution without Spring context

3. **WebMvc Tests** (`service` module):
   - Controller endpoint testing
   - Request validation and binding
   - Response format verification
   - Error handling and status codes
   - Security and authorization rules

### Testing Tools and Practices

- **Assertions**: Use **AssertJ** for all assertions (fluent and readable)
- **Async Operations**: Use **Awaitility** for async testing and eventual consistency
- **Mocking**:
   - **Mockito** for service mocks and behavior verification
   - **WireMock** for external HTTP services
   - **@MockBean** for Spring-managed dependencies
- **Spring Profile**: **MUST** use `test` profile for all test execution
- **Test Data**: Use builders or fixtures for consistent test data

## Code Quality Standards

### Validation Rules

Before committing code, verify:

1. **Type Safety**: Verify type consistency across method calls
2. **Null Safety**: Check for potential null/undefined references, use Optional where appropriate
3. **Business Rules**: Validate against documented business rules in domain layer
4. **Error Handling**: Ensure proper exception handling and logging
5. **Test Coverage**: Confirm tests exist and pass with `test` profile
6. **Code Review**: Self-review changes against architecture patterns
7. **No Comments**: Do not comment your code

### Angular Boot Best Practices

- 

### Hexagonal Architecture Compliance

- **Domain Layer**: Pure business logic, no framework dependencies
- **Application Layer**: Use cases and orchestration, depends on domain
- **Adapters**: Controllers, repositories, external clients - depend on application/domain
- **Ports**: Interfaces defined in domain/application, implemented in adapters

## Error Prevention

### Pre-Implementation Checklist

- [ ] Read all memory bank files
- [ ] Understand current task context from `activeContext.md`
- [ ] Review architectural constraints from `backend-architecture.md`
- [ ] Verify technical specifications from `technical-details.md`
- [ ] Plan test strategy (component, unit, WebMvc)
- [ ] Identify domain boundaries and module responsibilities

### Post-Implementation Checklist

- [ ] All tests pass with `test` profile
- [ ] Code follows hexagonal architecture patterns
- [ ] Documentation updated (memory bank, progress, tasks)
- [ ] No architectural violations (domain dependencies, module boundaries)
- [ ] Error handling implemented and tested
- [ ] Task progress logged in task file
- [ ] `tasks/_index.md` updated with current status

## Memory Bank Integration

This file works in conjunction with memory bank workflow:

- **Plan Mode**: Read memory bank → Verify context → Develop strategy → Document approach
- **Act Mode**: Check memory bank → Update documentation → Execute task → Log progress
- **Task Management**: Create/update task file → Document thought process → Update index

### Task Commands Integration

When user requests:

- **add task** or **create task**: Create new task file in `tasks/` folder and update `_index.md`
- **update task [ID]**: Add progress log entry to specific task file and update status
- **show tasks [filter]**: Display filtered task list from `_index.md`
- **update memory bank**: Review ALL memory bank files, particularly `activeContext.md`, `progress.md`, and
  `tasks/_index.md`

### Memory Reset Awareness

Remember: After each session, context resets completely. The memory bank is the ONLY source of truth. Keep it updated
with:

- Current work focus and decisions
- Architectural patterns discovered
- Integration approaches taken
- Progress on all tasks
- Next steps and blockers
