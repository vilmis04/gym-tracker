import { render, screen } from "@testing-library/react";
import { useParams } from "next/navigation";
import { describe, expect, it, vi } from "vitest";

import { PageSkeleton } from "./page-skeleton";

vi.mock("next/navigation", () => ({ useParams: vi.fn() }));

describe("PageSkeleton", () => {
  it.each([
    ["en", "Loading"],
    ["lt", "Įkeliama"],
  ])("is a busy region that announces loading once (%s)", (locale, text) => {
    vi.mocked(useParams).mockReturnValue({ locale });
    const { container } = render(<PageSkeleton />);

    expect(screen.getByRole("status")).toHaveTextContent(text);
    expect(container.firstElementChild).toHaveAttribute("aria-busy", "true");
    // The placeholder blocks are hidden from screen readers.
    expect(container.querySelectorAll('[aria-hidden="true"]').length).toBe(6);
  });
});
