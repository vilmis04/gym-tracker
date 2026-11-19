export interface ShowToastOptions {
  /** Second line, in the same muted style. */
  description?: string;
  /** One inline action, e.g. "Undo" after deleting a set. */
  action?: { label: string; onClick: () => void };
}
