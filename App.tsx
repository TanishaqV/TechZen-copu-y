import { useEffect, useRef, type ReactNode } from 'react';
import { ClerkProvider, SignIn, SignUp, useClerk, useUser } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Redirect, Route, Router as WouterRouter, Switch, useLocation } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import Home from '@/pages/home';
import EventDetail from '@/pages/event-detail';
import UserPortal from '@/pages/user-portal';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const clerkPubKey = publishableKeyFromHost(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

function stripBase(path: string) {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || '/' : path;
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
    socialButtonsPlacement: 'top' as const,
    socialButtonsVariant: 'blockButton' as const,
  },
  variables: {
    colorPrimary: '#ef2635',
    colorForeground: '#f2f2f2',
    colorMutedForeground: '#8d8d8d',
    colorDanger: '#ff5360',
    colorBackground: '#111111',
    colorInput: '#191919',
    colorInputForeground: '#f2f2f2',
    colorNeutral: '#343434',
    fontFamily: 'Space Grotesk, sans-serif',
    borderRadius: '0.5rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-[#111] rounded-none w-[440px] max-w-full overflow-hidden border border-white/15',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-white font-semibold',
    headerSubtitle: 'text-white/55',
    socialButtonsBlockButtonText: 'text-white',
    formFieldLabel: 'text-white/65',
    footerActionLink: 'text-[#ff4c59]',
    footerActionText: 'text-white/45',
    dividerText: 'text-white/40',
    identityPreviewEditButton: 'text-[#ff4c59]',
    formFieldSuccessText: 'text-[#7bd7a0]',
    alertText: 'text-[#ff6570]',
    logoBox: 'h-12',
    logoImage: 'max-h-12',
    socialButtonsBlockButton: 'border-white/15 bg-white/[.04] hover:bg-white/[.08]',
    formButtonPrimary: 'bg-[#ef2635] hover:bg-[#ff3d4b] text-white',
    formFieldInput: 'border-white/15 bg-white/[.04] text-white',
    footerAction: 'border-white/10',
    dividerLine: 'bg-white/10',
    alert: 'border-[#ef2635]/40 bg-[#ef2635]/10',
    otpCodeFieldInput: 'border-white/15 bg-white/[.04] text-white',
    formFieldRow: 'text-white',
    main: 'bg-transparent',
  },
};

function SignInPage() {
  return <div className="grid min-h-[100dvh] place-items-center bg-[#000000] px-4 py-10"><SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} /></div>;
}

function SignUpPage() {
  return <div className="grid min-h-[100dvh] place-items-center bg-[#000000] px-4 py-10"><SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} /></div>;
}

function HomeRedirect() {
  const { isLoaded, isSignedIn } = useUser();
  if (!isLoaded) return <LoadingFrame />;
  return isSignedIn ? <Redirect to="/user-portal" /> : <Home />;
}

function LoadingFrame() {
  return <div className="min-h-[100dvh] bg-[#000000] p-8"><div className="h-2 w-24 animate-pulse bg-[#ef2635]/40" /></div>;
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const client = useQueryClient();
  const previousUser = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (previousUser.current !== undefined && previousUser.current !== userId) client.clear();
      previousUser.current = userId;
    });
    return unsubscribe;
  }, [addListener, client]);
  return null;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function Router() {
  return <RoutedErrorBoundary><Switch>
    <Route path="/" component={HomeRedirect} />
    <Route path="/events/:eventId" component={EventDetail} />
    <Route path="/user-portal" component={UserPortal} />
    <Route path="/sign-in/*?" component={SignInPage} />
    <Route path="/sign-up/*?" component={SignUpPage} />
    <Route component={NotFound} />
  </Switch></RoutedErrorBoundary>;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();
  return <ClerkProvider
    publishableKey={clerkPubKey}
    proxyUrl={clerkProxyUrl}
    appearance={clerkAppearance}
    signInUrl={`${basePath}/sign-in`}
    signUpUrl={`${basePath}/sign-up`}
    localization={{
      signIn: { start: { title: 'Welcome back, builder', subtitle: 'Sign in to get back in the room.' } },
      signUp: { start: { title: 'Join the signal', subtitle: 'Create your TechZen builder account.' } },
    }}
    routerPush={(to) => setLocation(stripBase(to))}
    routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
  >
    <QueryClientProvider client={queryClient}>
      <ClerkQueryClientCacheInvalidator />
      <Router />
    </QueryClientProvider>
  </ClerkProvider>;
}

function App() {
  return <WouterRouter base={basePath}><ClerkProviderWithRoutes /></WouterRouter>;
}

export default App;