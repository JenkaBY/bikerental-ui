# Task 003: Add extract-i18n Output Path Config to angular.json

> **Applied Skill:** `angular-tooling` — `extract-i18n` architect target options, `outputPath`.

## 1. Objective

The current `extract-i18n` targets in `angular.json` have no `outputPath` or `outFile` options — they use CLI defaults. For the merged i18n workflow (Task 001/002), each app's extraction must write to a specific temp file name so the merge script can find them. Update the three `extract-i18n` targets in `angular.json` to specify `outputPath` and `outFile`.

## 2. File to Modify

* **File Path:** `angular.json`
* **Action:** Modify Existing File

---

## 3. Code Implementation

Make the following three changes. Each change is independent — apply them in any order.

### Change 1 — `gateway` extract-i18n target

**Location:** Inside `"gateway" > "architect" > "extract-i18n" > "options"`.

**Find:**

```json
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
```

**Replace with:**

```json
        "extract-i18n": {
          "builder": "@angular/build:extract-i18n",
          "options": {
            "buildTarget": "gateway:build",
            "outputPath": "src/locale",
            "outFile": "gateway.xlf"
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
```

### Change 2 — `admin` extract-i18n target

**Location:** Inside `"admin" > "architect" > "extract-i18n" > "options"`.

**Find:**

```json
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
```

**Replace with:**

```json
        "extract-i18n": {
          "builder": "@angular/build:extract-i18n",
          "options": {
            "buildTarget": "admin:build",
            "outputPath": "src/locale",
            "outFile": "admin.xlf"
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
```

### Change 3 — `operator` extract-i18n target

**Location:** Inside `"operator" > "architect" > "extract-i18n" > "options"`.

**Find:**

```json
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
```

**Replace with:**

```json
        "extract-i18n": {
          "builder": "@angular/build:extract-i18n",
          "options": {
            "buildTarget": "operator:build",
            "outputPath": "src/locale",
            "outFile": "operator.xlf"
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
```

---

## 4. Validation Steps

```powershell
# Confirm all three extract-i18n targets have outFile set
node -e "
const a = require('./angular.json');
['gateway','admin','operator'].forEach(p => {
  const opt = a.projects[p].architect['extract-i18n'].options;
  if (!opt.outFile) throw new Error(p + ' missing outFile');
  console.log(p, opt.outFile);
});"
```

Expected output:

```
gateway gateway.xlf
admin admin.xlf
operator operator.xlf
```
