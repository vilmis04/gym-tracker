import { describe, expect, it } from "vitest";

import { buildProfileSyncInput } from "./build-profile-sync-input";

import type { ClerkProfileSource } from "./profiles.types";

const CLERK_USER: ClerkProfileSource = {
  id: "user_2abc",
  firstName: "Rūta",
  lastName: "Žemaitė",
  username: null,
  email: "ruta@example.com",
  hasImage: true,
  imageUrl: "https://img.clerk.com/ruta",
  updatedAt: Date.UTC(2026, 10, 23, 12),
};

describe("buildProfileSyncInput", () => {
  it("maps Clerk's user to the profile columns", () => {
    expect(buildProfileSyncInput(CLERK_USER)).toEqual({
      id: "user_2abc",
      displayName: "Rūta Žemaitė",
      email: "ruta@example.com",
      avatarUrl: "https://img.clerk.com/ruta",
      clerkUpdatedAt: new Date("2026-11-23T12:00:00.000Z"),
    });
  });

  it("stores the email trimmed and lowercase", () => {
    expect(
      buildProfileSyncInput({ ...CLERK_USER, email: "  Ruta@Example.COM " })
        ?.email,
    ).toBe("ruta@example.com");
  });

  it.each([
    [{ firstName: "  Rūta ", lastName: null }, "Rūta"],
    [{ firstName: null, lastName: "Žemaitė" }, "Žemaitė"],
    [{ firstName: " ", lastName: null, username: "ruta_z" }, "ruta_z"],
    [{ firstName: null, lastName: null, username: null }, "ruta"],
  ])("names the user from %j as %j", (nameFields, displayName) => {
    expect(
      buildProfileSyncInput({ ...CLERK_USER, ...nameFields })?.displayName,
    ).toBe(displayName);
  });

  it("keeps no photo when Clerk only has its placeholder", () => {
    expect(
      buildProfileSyncInput({ ...CLERK_USER, hasImage: false })?.avatarUrl,
    ).toBeNull();
  });

  it("drops a photo URL that isn't https", () => {
    expect(
      buildProfileSyncInput({ ...CLERK_USER, imageUrl: "javascript:alert(1)" })
        ?.avatarUrl,
    ).toBeNull();
  });

  it.each([null, "", "   "])(
    "returns null without an email address (%j)",
    (email) => {
      expect(buildProfileSyncInput({ ...CLERK_USER, email })).toBeNull();
    },
  );
});
