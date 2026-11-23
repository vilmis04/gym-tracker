import { type ReactNode } from "react";
import { vi } from "vitest";

import type { TestUser } from "../factories";
import type { MockClerk, MockUserState } from "./clerk-mock.types";

/**
 * Stand-in for `@clerk/nextjs` in unit tests (E04-T01): Clerk's hooks need
 * `<ClerkProvider>` and clerk-js from the network, which jsdom tests don't
 * have. Only code that talks to Clerk itself needs it (`AuthProvider`,
 * `ClerkAccountProvider`); app components read `useAccount()` and are
 * tested with `<AccountContext value={…}>` instead. Signed out by default;
 * sign a user in for one test with `mockSignedInUser()`, check sign-out
 * with the `signOut` spy. The signed-in session's `getToken` spy returns
 * {@link MOCK_SESSION_TOKEN} (E04-T02).
 *
 * @example
 * vi.mock("@clerk/nextjs", () => import("@tests/helpers/clerk-mock"));
 * mockSignedInUser({ displayName: "Rūta Žemaitė" });
 * expect(signOut).toHaveBeenCalledWith({ redirectUrl: "/lt" });
 */
export const signOut = vi.fn(async () => {});

export const MOCK_SESSION_TOKEN = "mock-clerk-session-token";

export const getToken = vi.fn(
  async (): Promise<string | null> => MOCK_SESSION_TOKEN,
);

/** Renders its children; tests check the props it was given. */
export const ClerkProvider = ({ children }: { children: ReactNode }) =>
  children;

export const useClerk = vi.fn<() => MockClerk>(() => ({
  signOut,
  session: null,
}));

export const useUser = vi.fn<() => MockUserState>(() => SIGNED_OUT_STATE);

/** Clerk's `useUser()` reports `user` as signed in until the test ends. */
export function mockSignedInUser({
  displayName = "Rūta Žemaitė",
  email = "ruta+clerk_test@example.com",
  imageUrl = null,
}: Partial<Pick<TestUser, "displayName" | "email">> & {
  imageUrl?: string | null;
} = {}) {
  useClerk.mockReturnValue({ signOut, session: { getToken } });
  useUser.mockReturnValue({
    isLoaded: true,
    isSignedIn: true,
    user: {
      fullName: displayName,
      primaryEmailAddress: { emailAddress: email },
      hasImage: imageUrl !== null,
      imageUrl: imageUrl ?? CLERK_PLACEHOLDER_IMAGE_URL,
    },
  });
}

const SIGNED_OUT_STATE: MockUserState = {
  isLoaded: true,
  isSignedIn: false,
  user: null,
};

// What Clerk returns as `imageUrl` for a user without a photo.
const CLERK_PLACEHOLDER_IMAGE_URL = "https://img.clerk.com/placeholder";
