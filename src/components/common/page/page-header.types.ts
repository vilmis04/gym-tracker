export interface PageHeaderProps {
  /** The page's `<h1>`. */
  title: string;
  /**
   * Detail pages only: where the back button leads (the parent page, e.g.
   * `/lt/sessions` from a session). A link, not `history.back()`, so it also
   * works when the page was opened directly.
   */
  backHref?: string;
}
