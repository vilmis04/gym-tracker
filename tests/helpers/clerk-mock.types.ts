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
