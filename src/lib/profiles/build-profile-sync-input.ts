import type { ClerkProfileSource, ProfileSyncInput } from "./profiles.types";

/**
 * Maps Clerk's user to the profile columns Clerk owns. Returns `null` when
 * the user has no email address (the column is required; Google accounts
 * always have one).
 *
 * The name is "first last", else the username, else the email's local part;
 * the email is stored trimmed and lowercase (exact-match buddy search). The
 * photo is kept only when the user has one: Clerk otherwise returns a
 * generated placeholder, and the app shows initials instead.
 */
export function buildProfileSyncInput({
  id,
  firstName,
  lastName,
  username,
  email,
  hasImage,
  imageUrl,
  updatedAt,
}: ClerkProfileSource): ProfileSyncInput | null {
  const normalizedEmail = email?.trim().toLowerCase();
  if (!normalizedEmail) return null;

  const fullName = [firstName, lastName]
    .map((namePart) => namePart?.trim())
    .filter(Boolean)
    .join(" ");
  const [emailLocalPart = normalizedEmail] = normalizedEmail.split("@");

  return {
    id,
    displayName: fullName || username?.trim() || emailLocalPart,
    email: normalizedEmail,
    avatarUrl: hasImage && HTTPS_URL_REGEX.test(imageUrl) ? imageUrl : null,
    clerkUpdatedAt: new Date(updatedAt),
  };
}

// The database only accepts https avatar URLs, e.g. "https://img.clerk.com/eyJ0eXBl".
const HTTPS_URL_REGEX = /^https:\/\//;
