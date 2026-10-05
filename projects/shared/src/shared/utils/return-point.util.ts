export function crossPointReturnName(
  returnPointSlug: string | undefined,
  pickUpPointSlug: string | undefined,
  pointNames: ReadonlyMap<string, string>,
): string | null {
  if (!returnPointSlug || returnPointSlug === pickUpPointSlug) return null;
  return pointNames.get(returnPointSlug) ?? returnPointSlug;
}
