import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { mockSignedInUser, signOut } from "@tests/helpers/clerk-mock";

import { useAccount } from "./account-context";
import { ClerkAccountProvider } from "./clerk-account-provider";

vi.mock("@clerk/nextjs", () => import("@tests/helpers/clerk-mock"));

const AccountProbe = () => {
  const account = useAccount();
  return (
    <>
      <output>{JSON.stringify(account?.user ?? null)}</output>
      <button type="button" onClick={() => void account?.signOut("/en")}>
        Sign out
      </button>
    </>
  );
};

const renderAccount = () => {
  render(
    <ClerkAccountProvider>
      <AccountProbe />
    </ClerkAccountProvider>,
  );
  return JSON.parse(screen.getByRole("status").textContent ?? "null");
};

describe("ClerkAccountProvider", () => {
  it("has no account while signed out", () => {
    expect(renderAccount()).toBeNull();
  });

  it("passes the Clerk user's name and email, initials instead of Clerk's placeholder image", () => {
    mockSignedInUser({
      displayName: "Jonas Jonaitis",
      email: "jonas+clerk_test@example.com",
    });

    expect(renderAccount()).toEqual({
      name: "Jonas Jonaitis",
      email: "jonas+clerk_test@example.com",
      imageUrl: null,
    });
  });

  it("passes the Google photo", () => {
    mockSignedInUser({ imageUrl: "https://img.clerk.com/photo" });

    expect(renderAccount()).toMatchObject({
      imageUrl: "https://img.clerk.com/photo",
    });
  });

  it("signs out through Clerk to the given URL", () => {
    mockSignedInUser();
    renderAccount();

    screen.getByRole("button", { name: "Sign out" }).click();

    expect(signOut).toHaveBeenCalledExactlyOnceWith({ redirectUrl: "/en" });
  });
});
