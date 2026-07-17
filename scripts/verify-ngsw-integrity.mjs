import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';

const STAGING = 'staging';
const APP_STAGING_DIRS = { gateway: '', admin: 'admin', operator: 'operator' };

const sha1 = (buf) => createHash('sha1').update(buf).digest('hex');

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(dir, entry.name);
    return entry.isDirectory() ? walk(entryPath) : [entryPath];
  });
}

function expectedManifests() {
  const { projects } = JSON.parse(readFileSync('angular.json', 'utf-8'));
  const expected = [];

  for (const [name, project] of Object.entries(projects)) {
    const build = project.architect?.build;
    const options = { ...build?.options, ...build?.configurations?.production };
    if (!options.serviceWorker) continue;

    const appDir = APP_STAGING_DIRS[name];
    if (appDir === undefined) {
      throw new Error(
        `Project '${name}' builds a service worker but has no APP_STAGING_DIRS mapping — ` +
          'add it here and in the workflow\'s "Assemble staging directory" step.',
      );
    }

    const locales = options.localize;
    if (!Array.isArray(locales) || locales.length === 0) {
      throw new Error(`Project '${name}' builds a service worker but declares no locales to verify.`);
    }

    for (const locale of locales) {
      expected.push(join(STAGING, appDir, locale, 'ngsw.json'));
    }
  }

  return expected;
}

function verifyManifest(manifestPath) {
  const appRoot = dirname(manifestPath);
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
  const basePrefix = manifest.index.slice(0, manifest.index.lastIndexOf('/') + 1);
  const failures = [];

  for (const [urlPath, expectedHash] of Object.entries(manifest.hashTable)) {
    if (!urlPath.startsWith(basePrefix)) {
      failures.push(`PREFIX MISMATCH ${manifestPath} :: ${urlPath} does not start with ${basePrefix}`);
      continue;
    }

    const filePath = join(appRoot, urlPath.slice(basePrefix.length));
    if (!existsSync(filePath)) {
      failures.push(`MISSING ${filePath} referenced by ${manifestPath}`);
      continue;
    }

    const actualHash = sha1(readFileSync(filePath));
    if (actualHash !== expectedHash) {
      failures.push(
        `HASH MISMATCH ${manifestPath} :: ${urlPath} expected ${expectedHash} got ${actualHash}`,
      );
    }
  }

  return failures;
}

if (!existsSync(STAGING)) {
  console.error(`No ${STAGING}/ directory found — run the staging assembly step first.`);
  process.exit(1);
}

const expected = expectedManifests();
const found = walk(STAGING).filter((file) => basename(file) === 'ngsw.json');
const failures = [];

for (const manifestPath of expected) {
  if (!found.includes(manifestPath)) {
    failures.push(`MISSING MANIFEST ${manifestPath} — this locale would ship with no service worker.`);
  }
}

for (const manifestPath of found) {
  if (!expected.includes(manifestPath)) {
    failures.push(`UNEXPECTED MANIFEST ${manifestPath} — not derived from angular.json.`);
  }
}

for (const manifestPath of expected.filter((manifestPath) => found.includes(manifestPath))) {
  failures.push(...verifyManifest(manifestPath));
}

if (failures.length > 0) {
  for (const failure of failures) console.error(failure);
  console.error(`\n${failures.length} ngsw.json integrity failure(s).`);
  process.exit(1);
}

console.log(`ngsw.json integrity OK (${expected.length} manifest(s): ${expected.join(', ')})`);
