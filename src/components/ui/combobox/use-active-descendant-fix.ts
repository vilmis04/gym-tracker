"use client";

import { type RefObject, useEffect } from "react";

/**
 * Keeps the input's `aria-activedescendant` on the highlighted option.
 * cmdk 1.1.1 highlights the first option whenever the options change but
 * reads its id before the option re-renders, so the attribute stays empty
 * (or names a removed option) until the first ↑ / ↓, and screen readers
 * don't announce the option Enter would pick. Watching the options'
 * `aria-selected` (cmdk's "highlighted") and setting the attribute directly
 * fixes that; React leaves it alone as long as cmdk's own value is
 * unchanged, and cmdk's later updates trigger this again.
 */
export function useActiveDescendantFix(
  inputRef: RefObject<HTMLInputElement | null>,
  listRef: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    const input = inputRef.current;
    const list = listRef.current;
    if (!input || !list) return;

    const updateActiveDescendant = () => {
      const activeOption = list.querySelector(ACTIVE_OPTION_SELECTOR);
      if (activeOption) {
        input.setAttribute("aria-activedescendant", activeOption.id);
      } else {
        input.removeAttribute("aria-activedescendant");
      }
    };

    updateActiveDescendant();
    const observer = new MutationObserver(updateActiveDescendant);
    observer.observe(list, {
      subtree: true,
      childList: true,
      attributeFilter: ["aria-selected"],
    });
    return () => observer.disconnect();
  }, [inputRef, listRef]);
}

const ACTIVE_OPTION_SELECTOR = '[role="option"][aria-selected="true"]';
