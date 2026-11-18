import { render, screen } from "@testing-library/react";
import { useParams } from "next/navigation";
import { describe, expect, it, vi } from "vitest";

import { useLocale, useTranslations } from "./use-translations";

vi.mock("next/navigation", () => ({ useParams: vi.fn() }));

const ShowHomeLabel = () => {
  const locale = useLocale();
  const translate = useTranslations("nav");
  return (
    <p>
      {locale}: {translate("home")}
    </p>
  );
};

describe("useTranslations", () => {
  it("translates into the locale of the URL", () => {
    vi.mocked(useParams).mockReturnValue({ locale: "en" });
    render(<ShowHomeLabel />);
    expect(screen.getByText("en: Home")).toBeVisible();
  });

  it("falls back to Lithuanian outside /[locale] or for an unknown locale", () => {
    vi.mocked(useParams).mockReturnValue({ locale: "xx" });
    render(<ShowHomeLabel />);
    expect(screen.getByText("lt: Pradžia")).toBeVisible();
  });
});
