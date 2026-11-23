export interface ShowToastOptions {
  /** Second line, in the same muted style. */
  description?: string;
  /** One inline action, e.g. "Undo" after deleting a set. */
  action?: { label: string; onClick: () => void };
  /**
   * Replaces the toast already shown with this id instead of stacking a new
   * one, e.g. one "Saved" however often the user changes a setting.
   */
  id?: string;
}
