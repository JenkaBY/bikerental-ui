const APP_SEGMENTS = new Set(['admin', 'operator']);

export function buildOperatorUrl(baseURI: string, path: string): string {
  const base = new URL(baseURI);
  const segments = base.pathname.split('/').filter(Boolean);
  const rest = APP_SEGMENTS.has(segments[0]) ? segments.slice(1) : segments;
  const targetPath = ['operator', ...rest, path].join('/');
  return `${base.origin}/${targetPath}`;
}
