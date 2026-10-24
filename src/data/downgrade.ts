// Downgrade rules (development plan Stage 5): when a plan shrinks, nothing
// is deleted. The oldest items up to the new limit stay editable; the rest
// turn read-only until the teacher removes some or upgrades again.
export function readOnlyIds<T extends { id: string; createdAt: string }>(items: T[], limit: number): Set<string> {
  if (!Number.isFinite(limit) || items.length <= limit) return new Set();
  const byAge = [...items].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
  return new Set(byAge.slice(limit).map((x) => x.id));
}
