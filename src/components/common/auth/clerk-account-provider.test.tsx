import { render, renderHook, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  getToken,
  MOCK_SESSION_TOKEN,
  mockSignedInUser,
  signOut,
  useClerk,
} from "@tests/helpers/clerk-mock";
import type { MockClerk } from "@tests/helpers/clerk-mock.types";

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

// The account the provider puts into the context.
const renderAccountObject = () =>
  renderHook(() => useAccount(), { wrapper: ClerkAccountProvider }).result;

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

  it("reads the current Clerk session token for Supabase", async () => {
    mockSignedInUser();
    const account = renderAccountObject();

    await expect(account.current?.getToken()).resolves.toBe(MOCK_SESSION_TOKEN);
    expect(getToken).toHaveBeenCalledOnce();
  });

  it("has no token once the Clerk session is gone", async () => {
    mockSignedInUser();
    const clerk: MockClerk = { signOut, session: { getToken } };
    useClerk.mockReturnValue(clerk);
    const account = renderAccountObject();
    // Clerk clears `session` on sign-out; an account built before reads it anew.
    clerk.session = null;

    await expect(account.current?.getToken()).resolves.toBeNull();
  });
});
