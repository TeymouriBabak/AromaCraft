export type CommentDestination = 'home' | 'pike-place';

export function normalizeCommentDestination(
  value?: string | null
): CommentDestination {
  const normalized = (value ?? '').trim().toLowerCase();
  if (!normalized) return 'home';
  if (normalized.includes('pike')) return 'pike-place';
  return 'home';
}

export function buildCommentTitle(destination?: string | null): string {
  const normalized = normalizeCommentDestination(destination);
  if (normalized === 'pike-place') return 'Pike Place';
  return 'Home';
}
