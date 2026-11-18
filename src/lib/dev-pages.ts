/**
 * Developer-only pages under `/dev` (design tokens, later the UI kit) are on
 * in `next dev` and off in production builds, where they answer 404. Set
 * `ENABLE_DEV_PAGES=1` at runtime to show them on a preview deployment, e.g.
 * for a design review.
 */
export function isDevPagesEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.ENABLE_DEV_PAGES === "1"
  );
}
