import React from 'react';
import { Route, Switch, useLocation } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClerkProvider } from '@clerk/react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ErrorBoundary } from './components/error-boundary';
import { AuthProvider } from './context/AuthContext';
import { EventProvider } from './context/EventContext';

// Explicit extension: './pages/home' probes .jsx before .tsx, so on a
// case-insensitive filesystem (macOS) it resolves to the legacy Home.jsx
// while Linux/Vercel resolves home.tsx - two different homepages.
import Home from './pages/home.tsx';
import AllEvents from './pages/all-events';
import EventDetail from './pages/event-detail';
import UserPortal from './pages/user-portal';
import NotFound from './pages/not-found';

import CreateEventModal from './components/CreateEventModal';
import TicketModal from './components/TicketModal';
import AuthModal from './components/AuthModal';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '1015290855644-ca1cfggbdu0oo5euqtg2bjs819tmehu4.apps.googleusercontent.com';

function SafeClerkProvider({ children }) {
  // Only mount ClerkProvider if user has configured a valid live or registered key
  if (CLERK_PUBLISHABLE_KEY && CLERK_PUBLISHABLE_KEY.startsWith('pk_live_')) {
    return <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>{children}</ClerkProvider>;
  }
  return <>{children}</>;
}

// ErrorBoundary keeps showing its fallback until something resets it. Keying it
// on the route means navigating away from a broken page recovers the app instead
// of leaving the whole site stuck behind "Something went wrong".
function RoutedErrorBoundary({ children }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

export default function App() {
  return (
    <RoutedErrorBoundary>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <SafeClerkProvider>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <EventProvider>
                <Switch>
                  <Route path="/" component={Home} />
                  <Route path="/all-events" component={AllEvents} />
                  <Route path="/events" component={AllEvents} />
                  <Route path="/our-code" component={Home} />
                  <Route path="/manifesto" component={Home} />
                  <Route path="/events/:eventId" component={EventDetail} />
                  <Route path="/user-portal" component={UserPortal} />
                  <Route path="/dashboard" component={UserPortal} />
                  <Route path="/sign-in" component={Home} />
                  <Route path="/sign-up" component={Home} />
                  <Route component={NotFound} />
                </Switch>

                {/* Modals */}
                <CreateEventModal />
                <TicketModal />
                <AuthModal />
              </EventProvider>
            </AuthProvider>
          </QueryClientProvider>
        </SafeClerkProvider>
      </GoogleOAuthProvider>
    </RoutedErrorBoundary>
  );
}
