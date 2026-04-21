---
name: create-store
description: 'Create store for the specified service'
tools: ['execute/testFailure', 'execute/getTerminalOutput', 'execute/awaitTerminal', 'execute/killTerminal', 'execute/createAndRunTask', 'execute/runInTerminal', 'read', 'edit', 'search', 'todo', 'insert_edit_into_file', 'replace_string_in_file', 'create_file', 'apply_patch', 'run_in_terminal', 'get_terminal_output', 'get_errors', 'show_content', 'open_file', 'list_dir', 'read_file', 'file_search', 'grep_search', 'validate_cves', 'run_subagent', 'semantic_search']
agent: 'agent'
---

1. Migrate usage of models from the `src/app/core/api/generated/models` directory to use the ui-models from the `src/app/core/models` directory.
2. Create mappers in the `src/app/core/mappers` directory;
3. Migrate to global state store persisted in the `src/app/core/state` folder. Create a mapper in the `src/app/core/mappers` folder, create models in the 'src/app/core/models' to decouple ui models and api models.
   Add and use the `loading` state during loading the entity list.
   Add and use the `saving` state during creating and updating an entity.
4. use aliases for the imports defined in the `tsconfig.json`:
   "@api-models": "src/app/core/api/generated/models/index.ts"
   "@ui-models": "src/app/core/models/index.ts"

## Store usage rule

1. 
