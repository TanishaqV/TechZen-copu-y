import { useClerk, useUser } from '@clerk/react';
import { ArrowUpRight, LogOut, Menu, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import logoPath from '@assets/techzen-logo.jpeg';

export function SiteShell({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const isPortal = location === '/user-portal';
  return (
    <div className="noise min-h-[100dvh]">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0b0b0b]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <Link href="/" data-testid="link-brand" className="focus-ring flex items-center gap-3">
            <img src={logoPath} alt="TechZen — Code, Create, Innovate" className="h-10 w-10 rounded-sm object-cover object-center" data-testid="img-logo" />
            <span className="hidden text-[15px] font-bold tracking-[.22em] text-white sm:inline">TECH<span className="text-[#ef2635]">ZEN</span></span>
          </Link>
          <nav className="hidden items-center gap-9 md:flex" aria-label="Primary navigation">
            <Link href="/#events" data-testid="link-events" className="focus-ring text-sm text-white/60 transition-colors hover:text-white">Events</Link>
            <Link href="/#manifesto" data-testid="link-manifesto" className="focus-ring text-sm text-white/60 transition-colors hover:text-white">Our code</Link>
            {user ? (
              <Link href="/user-portal" data-testid="link-portal" className={`focus-ring text-sm transition-colors ${isPortal ? 'text-white' : 'text-white/60 hover:text-white'}`}>My portal</Link>
            ) : (
              <Link href="/sign-in" data-testid="link-sign-in" className="focus-ring text-sm text-white/60 transition-colors hover:text-white">Sign in</Link>
            )}
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            {user ? (
              <>
                <Link href="/user-portal" data-testid="button-open-portal" className="group flex items-center gap-2 border border-white/15 bg-white/[.04] px-4 py-2 text-sm font-semibold text-white transition-all hover:border-[#ef2635]/70 hover:bg-[#ef2635]">
                  {user.firstName || 'Your portal'} <ArrowUpRight size={15} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
                <button type="button" onClick={() => signOut({ redirectUrl: '/' })} data-testid="button-sign-out" className="focus-ring p-2 text-white/45 transition-colors hover:text-white" aria-label="Sign out"><LogOut size={17} /></button>
              </>
            ) : (
              <Link href="/sign-up" data-testid="button-join-community" className="group flex items-center gap-2 bg-[#ef2635] px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-[#ff3d4b] hover:shadow-[4px_4px_0_#f5f5f5]">
                Join the community <ArrowUpRight size={16} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            )}
          </div>
          <button type="button" onClick={() => setMenuOpen(!menuOpen)} data-testid="button-mobile-menu" className="focus-ring p-2 text-white md:hidden" aria-label={menuOpen ? 'Close menu' : 'Open menu'}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        {menuOpen && (
          <div className="border-t border-white/10 bg-[#0b0b0b] px-5 py-5 md:hidden">
            <nav className="flex flex-col gap-4">
              <Link href="/#events" onClick={() => setMenuOpen(false)} data-testid="mobile-link-events" className="text-lg text-white/75">Events</Link>
              <Link href="/#manifesto" onClick={() => setMenuOpen(false)} data-testid="mobile-link-manifesto" className="text-lg text-white/75">Our code</Link>
              {user ? <Link href="/user-portal" onClick={() => setMenuOpen(false)} data-testid="mobile-link-portal" className="text-lg text-white/75">My portal</Link> : <Link href="/sign-in" onClick={() => setMenuOpen(false)} data-testid="mobile-link-sign-in" className="text-lg text-white/75">Sign in</Link>}
            </nav>
          </div>
        )}
      </header>
      {children}
      <footer className="border-t border-white/10 bg-[#090909]">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-5 py-10 sm:px-8 md:flex-row md:items-end md:justify-between lg:px-12">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[.24em] text-[#ef2635]">TZ / 001</p>
            <p className="mt-3 max-w-xs text-sm leading-6 text-white/45">A technical community for people who prefer building to talking about building.</p>
          </div>
          <div className="text-left font-mono text-[10px] uppercase tracking-[.18em] text-white/30 md:text-right">Code · Create · Innovate<br /><span className="text-white/20">© 2025 TechZen Events</span></div>
        </div>
      </footer>
    </div>
  );
}