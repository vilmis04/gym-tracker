/** The part of Clerk's `useUser()` result the app reads. */
export interface MockUserState {
  isLoaded: boolean;
  isSignedIn: boolean;
  user: {
    fullName: string | null;
    primaryEmailAddress: { emailAddress: string } | null;
    hasImage: boolean;
    imageUrl: string;
  } | null;
}

/** The part of Clerk's `useClerk()` result the app reads. */
export interface MockClerk {
  signOut: (options: { redirectUrl: string }) => Promise<void>;
  session: { getToken: () => Promise<string | null> } | null;
}

/**
 * What a test's `@clerk/nextjs/server` mock answers: `auth()` gives
 * `userId` and `getToken()`, `currentUser()` gives `user` (the fields
 * `getCurrentProfile()` reads) after awaiting `beforeCurrentUser` (a test's
 * hook to change the database meanwhile).
 */
export interface MockClerkServerState {
  userId: string | null;
  token: string | null;
  beforeCurrentUser: (() => Promise<unknown>) | null;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    username: string | null;
    primaryEmailAddress: { emailAddress: string } | null;
    hasImage: boolean;
    imageUrl: string;
    updatedAt: number;
  } | null;
}
