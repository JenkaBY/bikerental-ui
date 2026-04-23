# Task 002: Create XLF Merge Script

> **Applied Skill:** `angular-tooling` — i18n extraction workflow, XLF file format.

## 1. Objective

Create `scripts/merge-xlf.mjs` — a Node.js ESM script that:

1. Reads `src/locale/gateway.xlf`, `src/locale/admin.xlf`, and `src/locale/operator.xlf` (the per-app temp files written by `ng extract-i18n`).
2. Collects all `<trans-unit>` elements from all three files, de-duplicating by `id`.
3. Writes the merged result to `src/locale/messages.xlf` (same structure as the existing file).
4. Deletes the three temp files.

## 2. File to Create

* **File Path:** `scripts/merge-xlf.mjs`
* **Action:** Create New File

---

## 3. Code Implementation

```javascript
import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'node:fs';

const LOCALE_DIR = 'src/locale';
const SOURCES = ['gateway', 'admin', 'operator'];
const OUTPUT = `${LOCALE_DIR}/messages.xlf`;

function extractTransUnits(xlf) {
  const matches = [...xlf.matchAll(/<trans-unit[\s\S]*?<\/trans-unit>/g)];
  return matches.map((m) => m[0]);
}

function extractId(unit) {
  const match = unit.match(/id="([^"]+)"/);
  return match ? match[1] : null;
}

function buildXlf(transUnits, sourceLocale = 'en-US') {
  return `<?xml version="1.0" encoding="UTF-8" ?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">
  <file source-language="${sourceLocale}" datatype="plaintext" original="ng2.template">
    <body>
      ${transUnits.join('\n      ')}
    </body>
  </file>
</xliff>
`;
}

const seenIds = new Set();
const allUnits = [];

for (const app of SOURCES) {
  const path = `${LOCALE_DIR}/${app}.xlf`;
  if (!existsSync(path)) {
    console.warn(`Warning: ${path} not found — skipping`);
    continue;
  }
  const content = readFileSync(path, 'utf-8');
  for (const unit of extractTransUnits(content)) {
    const id = extractId(unit);
    if (id && !seenIds.has(id)) {
      seenIds.add(id);
      allUnits.push(unit);
    }
  }
  unlinkSync(path);
}

writeFileSync(OUTPUT, buildXlf(allUnits), 'utf-8');
console.log(`Merged ${allUnits.size ?? allUnits.length} trans-units into ${OUTPUT}`);
```

---

## 4. Validation Steps

```powershell
# Dry-run: verify the script parses without errors
node --input-type=module --eval "import './scripts/merge-xlf.mjs'" 2>&1
```

Expected: The script imports cleanly. If no `src/locale/gateway.xlf` etc. exist it will print `Warning: ... not found` and write an empty `messages.xlf` — that is acceptable for a dry-run.

> **Note:** Full integration is validated in Task 003 via `npm run i18n:extract`.
