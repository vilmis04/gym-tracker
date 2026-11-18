"use client";

import { useState } from "react";

export function ThrowInClient() {
  const [shouldThrow, setShouldThrow] = useState(false);
  if (shouldThrow) {
    throw new Error(
      "Test client component error for test-user@example.com (E01-T07)",
    );
  }
  return (
    <button type="button" onClick={() => setShouldThrow(true)}>
      Throw in a client component
    </button>
  );
}
