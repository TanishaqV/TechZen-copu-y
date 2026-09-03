import { useUser as useClerkUser } from '@clerk/react';

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';
const IS_CLERK_ENABLED = Boolean(CLERK_KEY && CLERK_KEY.startsWith('pk_live_'));

export function useSafeUser() {
  if (IS_CLERK_ENABLED) {
    try {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return useClerkUser();
    } catch {
      return { isLoaded: true, isSignedIn: false, user: null };
    }
  }
  return { isLoaded: true, isSignedIn: false, user: null };
}
