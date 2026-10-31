import { readFileSync } from 'node:fs';

const LOCALE_DIR = 'projects/shared/src/locale';

function unitsById(xlf) {
  const units = new Map();
  for (const match of xlf.matchAll(/<trans-unit[^>]*\bid="([^"]+)"[\s\S]*?<\/trans-unit>/g)) {
    units.set(match[1], match[0]);
  }
  return units;
}

const sourceIds = [...unitsById(readFileSync(`${LOCALE_DIR}/messages.xlf`, 'utf8')).keys()];
const ruUnits = unitsById(readFileSync(`${LOCALE_DIR}/messages.ru.xlf`, 'utf8'));

const missing = sourceIds.filter((id) => {
  const target = ruUnits.get(id)?.match(/<target[^>]*>([\s\S]*?)<\/target>/);
  return !target || target[1].trim() === '';
});

if (missing.length) {
  console.error(`Missing Russian targets (${missing.length}): ${missing.join(' ')}`);
  process.exit(1);
}
console.log(`OK: ${sourceIds.length} units translated`);
