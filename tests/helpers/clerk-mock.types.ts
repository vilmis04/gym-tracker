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
