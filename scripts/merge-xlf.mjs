import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';

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
console.log(`Merged ${allUnits.length} trans-units into ${OUTPUT}`);
