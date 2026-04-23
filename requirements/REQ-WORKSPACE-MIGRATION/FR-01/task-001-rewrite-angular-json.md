# Task 001: Rewrite angular.json — Multi-Project Workspace Declaration

> **Applied Skill:** `angular-tooling` — Multi-project `angular.json` structure; `@angular/build:application` builder; `@angular/build:dev-server`; `@angular-eslint/builder:lint` target scoping rules.

## 1. Objective

Replace the single `bikerental-ui` project entry in `angular.json` with four independent project declarations: `gateway`, `admin`, and `operator` as application projects and `shared` as a library project. No source files are moved in this task — the entry points reference paths that will be created in FR-02 through FR-05. This task establishes the workspace manifest skeleton that all subsequent FR-01 tasks and later FRs depend on.

## 2. File to Modify / Create

* **File Path:** `angular.json`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:** N/A — JSON file.

**Code to Add/Replace:**

* **Location:** Replace the entire file content with the snippet below.

```json
{
  "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
  "version": 1,
  "cli": {
    "packageManager": "npm",
    "schematicCollections": ["angular-eslint"]
  },
  "newProjectRoot": "projects",
  "projects": {
    "gateway": {
      "projectType": "application",
      "schematics": {},
      "root": "projects/gateway",
      "sourceRoot": "projects/gateway/src",
      "prefix": "app",
      "architect": {
        "build": {
          "builder": "@angular/build:application",
          "options": {
            "browser": "projects/gateway/src/main.ts",
            "outputPath": "dist/gateway",
            "tsConfig": "projects/gateway/tsconfig.app.json",
            "assets": [
              {
                "glob": "**/*",
                "input": "public"
              }
            ],
            "styles": [
              "@angular/material/prebuilt-themes/indigo-pink.css",
              "src/styles.css"
            ],
            "polyfills": ["@angular/localize/init"],
            "localize": ["ru", "en"]
          },
          "configurations": {
            "production": {
              "budgets": [
                {
                  "type": "initial",
                  "maximumWarning": "500kB",
                  "maximumError": "1MB"
                },
                {
                  "type": "anyComponentStyle",
                  "maximumWarning": "4kB",
                  "maximumError": "8kB"
                }
              ],
              "outputHashing": "all",
              "fileReplacements": [
                {
                  "replace": "src/environments/environment.ts",
                  "with": "src/environments/environment.prod.ts"
                }
              ]
            },
            "development": {
              "optimization": false,
              "extractLicenses": false,
              "sourceMap": true
            }
          },
          "defaultConfiguration": "production"
        },
        "serve": {
          "builder": "@angular/build:dev-server",
          "configurations": {
            "production": {
              "buildTarget": "gateway:build:production"
            },
            "development": {
              "buildTarget": "gateway:build:development"
            }
          },
          "defaultConfiguration": "development"
        },
        "test": {
          "builder": "@angular/build:unit-test",
          "options": {
            "tsConfig": "projects/gateway/tsconfig.spec.json"
          },
          "configurations": {
            "ci": {
              "watch": false,
              "coverage": true,
              "coverageExclude": ["projects/shared/**/core/api/generated/**"],
              "coverageReporters": [
                "lcov",
                "html",
                "text-summary",
                "json-summary",
                "json"
              ]
            }
          }
        },
        "lint": {
          "builder": "@angular-eslint/builder:lint",
          "options": {
            "lintFilePatterns": [
              "projects/gateway/src/**/*.ts",
              "projects/gateway/src/**/*.html"
            ]
          }
        },
        "extract-i18n": {
          "builder": "@angular/build:extract-i18n",
          "options": {
            "buildTarget": "gateway:build"
          }
        }
      },
      "i18n": {
        "sourceLocale": "en-US",
        "locales": {
          "ru": "src/locale/messages.ru.xlf",
          "en": "src/locale/messages.xlf"
        }
      }
    },
    "admin": {
      "projectType": "application",
      "schematics": {},
      "root": "projects/admin",
      "sourceRoot": "projects/admin/src",
      "prefix": "app",
      "architect": {
        "build": {
          "builder": "@angular/build:application",
          "options": {
            "browser": "projects/admin/src/main.ts",
            "outputPath": "dist/admin",
            "tsConfig": "projects/admin/tsconfig.app.json",
            "assets": [
              {
                "glob": "**/*",
                "input": "public"
              }
            ],
            "styles": [
              "@angular/material/prebuilt-themes/indigo-pink.css",
              "src/styles.css"
            ],
            "polyfills": ["@angular/localize/init"],
            "localize": ["ru", "en"]
          },
          "configurations": {
            "production": {
              "budgets": [
                {
                  "type": "initial",
                  "maximumWarning": "500kB",
                  "maximumError": "1MB"
                },
                {
                  "type": "anyComponentStyle",
                  "maximumWarning": "4kB",
                  "maximumError": "8kB"
                }
              ],
              "outputHashing": "all",
              "fileReplacements": [
                {
                  "replace": "src/environments/environment.ts",
                  "with": "src/environments/environment.prod.ts"
                }
              ]
            },
            "development": {
              "optimization": false,
              "extractLicenses": false,
              "sourceMap": true
            }
          },
          "defaultConfiguration": "production"
        },
        "serve": {
          "builder": "@angular/build:dev-server",
          "configurations": {
            "production": {
              "buildTarget": "admin:build:production"
            },
            "development": {
              "buildTarget": "admin:build:development"
            }
          },
          "defaultConfiguration": "development"
        },
        "test": {
          "builder": "@angular/build:unit-test",
          "options": {
            "tsConfig": "projects/admin/tsconfig.spec.json"
          },
          "configurations": {
            "ci": {
              "watch": false,
              "coverage": true,
              "coverageExclude": ["projects/shared/**/core/api/generated/**"],
              "coverageReporters": [
                "lcov",
                "html",
                "text-summary",
                "json-summary",
                "json"
              ]
            }
          }
        },
        "lint": {
          "builder": "@angular-eslint/builder:lint",
          "options": {
            "lintFilePatterns": [
              "projects/admin/src/**/*.ts",
              "projects/admin/src/**/*.html"
            ]
          }
        },
        "extract-i18n": {
          "builder": "@angular/build:extract-i18n",
          "options": {
            "buildTarget": "admin:build"
          }
        }
      },
      "i18n": {
        "sourceLocale": "en-US",
        "locales": {
          "ru": "src/locale/messages.ru.xlf",
          "en": "src/locale/messages.xlf"
        }
      }
    },
    "operator": {
      "projectType": "application",
      "schematics": {},
      "root": "projects/operator",
      "sourceRoot": "projects/operator/src",
      "prefix": "app",
      "architect": {
        "build": {
          "builder": "@angular/build:application",
          "options": {
            "browser": "projects/operator/src/main.ts",
            "outputPath": "dist/operator",
            "tsConfig": "projects/operator/tsconfig.app.json",
            "assets": [
              {
                "glob": "**/*",
                "input": "public"
              }
            ],
            "styles": [
              "@angular/material/prebuilt-themes/indigo-pink.css",
              "src/styles.css"
            ],
            "polyfills": ["@angular/localize/init"],
            "localize": ["ru", "en"]
          },
          "configurations": {
            "production": {
              "budgets": [
                {
                  "type": "initial",
                  "maximumWarning": "500kB",
                  "maximumError": "1MB"
                },
                {
                  "type": "anyComponentStyle",
                  "maximumWarning": "4kB",
                  "maximumError": "8kB"
                }
              ],
              "outputHashing": "all",
              "fileReplacements": [
                {
                  "replace": "src/environments/environment.ts",
                  "with": "src/environments/environment.prod.ts"
                }
              ]
            },
            "development": {
              "optimization": false,
              "extractLicenses": false,
              "sourceMap": true
            }
          },
          "defaultConfiguration": "production"
        },
        "serve": {
          "builder": "@angular/build:dev-server",
          "configurations": {
            "production": {
              "buildTarget": "operator:build:production"
            },
            "development": {
              "buildTarget": "operator:build:development"
            }
          },
          "defaultConfiguration": "development"
        },
        "test": {
          "builder": "@angular/build:unit-test",
          "options": {
            "tsConfig": "projects/operator/tsconfig.spec.json"
          },
          "configurations": {
            "ci": {
              "watch": false,
              "coverage": true,
              "coverageExclude": ["projects/shared/**/core/api/generated/**"],
              "coverageReporters": [
                "lcov",
                "html",
                "text-summary",
                "json-summary",
                "json"
              ]
            }
          }
        },
        "lint": {
          "builder": "@angular-eslint/builder:lint",
          "options": {
            "lintFilePatterns": [
              "projects/operator/src/**/*.ts",
              "projects/operator/src/**/*.html"
            ]
          }
        },
        "extract-i18n": {
          "builder": "@angular/build:extract-i18n",
          "options": {
            "buildTarget": "operator:build"
          }
        }
      },
      "i18n": {
        "sourceLocale": "en-US",
        "locales": {
          "ru": "src/locale/messages.ru.xlf",
          "en": "src/locale/messages.xlf"
        }
      }
    },
    "shared": {
      "projectType": "library",
      "schematics": {},
      "root": "projects/shared",
      "sourceRoot": "projects/shared/src",
      "prefix": "app",
      "architect": {
        "build": {
          "builder": "@angular/build:ng-packagr",
          "options": {
            "project": "projects/shared/ng-package.json",
            "tsConfig": "projects/shared/tsconfig.lib.json"
          },
          "configurations": {
            "production": {
              "tsConfig": "projects/shared/tsconfig.lib.prod.json"
            }
          }
        },
        "lint": {
          "builder": "@angular-eslint/builder:lint",
          "options": {
            "lintFilePatterns": [
              "projects/shared/src/**/*.ts",
              "projects/shared/src/**/*.html"
            ]
          }
        }
      }
    }
  }
}
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
# Validate angular.json is parseable and the CLI recognises the projects
npx ng version

# Confirm all 4 projects are listed
npx ng config projects.gateway.projectType
npx ng config projects.admin.projectType
npx ng config projects.operator.projectType
npx ng config projects.shared.projectType
```

Expected output for the last four commands: `application`, `application`, `application`, `library`.

> **Note:** `ng build <project>` commands will fail at this stage because the source entry-point files do not yet exist. That is expected and correct — entry points are created in FR-02 through FR-05.
