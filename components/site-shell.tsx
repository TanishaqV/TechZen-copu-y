import { ArrowUpRight, Plus, X, Menu, LogOut, Mail, MessageCircle, Linkedin, Instagram } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { TechZenLogo } from './TechZenLogo';
import { useAuth } from '@/context/AuthContext';
import { useEvents } from '@/context/EventContext';

interface SiteShellProps {
  children: React.ReactNode;
}

const GMAIL_COMPOSE_URL = 'https://mail.google.com/mail/?view=cm&fs=1&to=techzen.innovation@gmail.com';
const WHATSAPP_COMMUNITY_URL = 'https://chat.whatsapp.com/techzen-community';
const LINKEDIN_URL = 'https://www.linkedin.com/company/techzen-innovation/';
const INSTAGRAM_URL = 'https://www.instagram.com/techzen.in?igsi=MTNnbXcxcmZsaTFxdw==';

export function SiteShell({ children }: SiteShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [, setLocation] = useLocation();

  const { currentUser, logout, isAdmin, isEmailAdmin } = useAuth();
  const { setCreateEventModalOpen } = useEvents();

  const activeUser = currentUser || null;
  const activeUserEmail = activeUser?.email || '';
  const effectiveIsAdmin = isAdmin || (isEmailAdmin ? isEmailAdmin(activeUserEmail) : false);

  const scrollToSection = (id: string) => {
    if (window.location.pathname !== '/') {
      setLocation('/');
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 250);
      return;
    }
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] text-white selection:bg-[#ef2635] selection:text-white font-sans">
      
      {/* Top Main Navigation Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#000000]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          
          {/* Left: Brand Logo */}
          <Link href="/" className="group flex items-center space-x-2.5 transition-transform hover:scale-[1.01] shrink-0">
            <TechZenLogo size={32} />
            <div className="flex flex-col">
              <span className="font-mono text-sm sm:text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
                TechZen <span className="bg-[#ef2635] text-[9px] px-1.5 py-0.2 uppercase text-white font-bold tracking-wider">INNOVATIONS</span>
              </span>
              <span className="font-mono text-[8px] sm:text-[9px] uppercase tracking-[.22em] text-white/40 group-hover:text-[#ef2635] transition-colors">
                Indian Hackathon Node
              </span>
            </div>
          </Link>

          {/* Center Nav Links - Arranged in exact section order matching the page layout */}
          <nav className="hidden items-center gap-6 md:flex">
            {/* 1. Home (Section 01 / Discovery) */}
            <Link 
              href="/" 
              onClick={() => { if (window.location.pathname === '/') window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
              data-testid="nav-home" 
              className="text-xs font-semibold text-white/70 hover:text-white transition-colors"
            >
              Home
            </Link>

            {/* 2. Our Manifesto (Section 02 / The Signal) */}
            <button 
              onClick={() => scrollToSection('manifesto')} 
              data-testid="nav-manifesto" 
              className="text-xs font-semibold text-white/70 hover:text-white transition-colors cursor-pointer"
            >
              Our Manifesto
            </button>

            {/* 3. All Events (Section 03 / Upcoming & Catalog) */}
            <Link 
              href="/all-events" 
              data-testid="nav-all-events" 
              className="text-xs font-semibold text-white/70 hover:text-[#ef2635] transition-colors"
            >
              All Events
            </Link>

            {/* 4. Contact */}
            <a 
              href={GMAIL_COMPOSE_URL}
              target="_blank" 
              rel="noreferrer" 
              className="text-xs font-semibold text-[#ef2635] hover:underline flex items-center gap-0.5"
            >
              <span>Contact</span>
              <ArrowUpRight size={12} />
            </a>
          </nav>

          {/* Right Action Bar & Social Links */}
          <div className="hidden items-center gap-2.5 sm:gap-3 md:flex shrink-0">
            
            {/* Minimalist Social Icon Group */}
            <div className="flex items-center gap-1 border border-white/10 bg-white/[0.03] p-1 rounded-md">
              <a 
                href={LINKEDIN_URL}
                target="_blank" 
                rel="noreferrer" 
                className="p-1.5 text-white/50 hover:text-[#0A66C2] hover:bg-white/[0.08] rounded transition-all cursor-pointer"
                title="TechZen LinkedIn Page"
              >
                <Linkedin size={15} />
              </a>

              <a 
                href={INSTAGRAM_URL}
                target="_blank" 
                rel="noreferrer" 
                className="p-1.5 text-white/50 hover:text-pink-400 hover:bg-white/[0.08] rounded transition-all cursor-pointer"
                title="TechZen Instagram (@techzen.in)"
              >
                <Instagram size={15} />
              </a>

              <a 
                href={WHATSAPP_COMMUNITY_URL}
                target="_blank" 
                rel="noreferrer" 
                className="p-1.5 text-white/50 hover:text-emerald-400 hover:bg-white/[0.08] rounded transition-all cursor-pointer"
                title="TechZen WhatsApp Community"
              >
                <MessageCircle size={15} />
              </a>
            </div>

            {/* Admin / Post Event */}
            {activeUser ? (
              <>
                {effectiveIsAdmin && (
                  <button
                    onClick={() => setCreateEventModalOpen(true)}
                    className="group flex items-center gap-1 bg-[#ef2635] hover:bg-[#ff3d4b] text-white px-3 py-1.5 text-[11px] font-mono font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer shrink-0"
                  >
                    <Plus size={14} /> Post Event
                  </button>
                )}

                <Link href="/user-portal" data-testid="button-open-portal" className="group flex items-center gap-1.5 border border-white/15 bg-white/[.04] px-3 py-1.5 text-xs font-semibold text-white transition-all hover:border-[#ef2635]/70 hover:bg-white/[.08] shrink-0 max-w-[180px] truncate">
                  <span className="truncate">{activeUser.name || 'Builder Pass'}</span>
                  <ArrowUpRight size={13} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 shrink-0" />
                </Link>

                <button
                  type="button"
                  onClick={logout}
                  data-testid="button-sign-out"
                  className="p-1.5 text-white/45 transition-colors hover:text-[#ef2635] cursor-pointer"
                  title="Sign out"
                >
                  <LogOut size={16} />
                </button>
              </>
            ) : (
              <button
                onClick={() => setLocation('/sign-in')}
                data-testid="button-join-community"
                className="group flex items-center gap-1.5 bg-[#ef2635] px-3.5 py-1.5 text-xs font-bold text-white transition-all hover:bg-[#ff3d4b] cursor-pointer"
              >
                Join community <ArrowUpRight size={13} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>
            )}
          </div>

          {/* Mobile Hamburger Menu Button */}
          <button type="button" onClick={() => setMenuOpen(!menuOpen)} data-testid="button-mobile-menu" className="p-1.5 text-white md:hidden" aria-label={menuOpen ? 'Close menu' : 'Open menu'}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Dropdown Drawer */}
        {menuOpen && (
          <div className="border-t border-white/10 bg-[#000000] px-5 py-5 md:hidden space-y-4">
            <nav className="flex flex-col gap-4">
              <Link href="/" onClick={() => setMenuOpen(false)} className="text-left text-lg text-white/80">Home</Link>
              <button onClick={() => { scrollToSection('manifesto'); setMenuOpen(false); }} className="text-left text-lg text-white/80">Our Manifesto</button>
              <Link href="/all-events" onClick={() => setMenuOpen(false)} className="text-left text-lg text-white/80">All Events</Link>
              <a href={GMAIL_COMPOSE_URL} target="_blank" rel="noreferrer" className="text-left text-lg text-[#ef2635] font-semibold flex items-center gap-2">
                <Mail size={18} /> Contact: techzen.innovation@gmail.com
              </a>
              <div className="pt-2 border-t border-white/10 flex flex-col gap-3">
                <a href={LINKEDIN_URL} target="_blank" rel="noreferrer" className="text-left text-sm text-sky-400 font-medium flex items-center gap-2">
                  <Linkedin size={16} /> LinkedIn (TechZen Innovation)
                </a>
                <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="text-left text-sm text-pink-400 font-medium flex items-center gap-2">
                  <Instagram size={16} /> Instagram (@techzen.in)
                </a>
                <a href={WHATSAPP_COMMUNITY_URL} target="_blank" rel="noreferrer" className="text-left text-sm text-emerald-400 font-medium flex items-center gap-2">
                  <MessageCircle size={16} /> WhatsApp Community
                </a>
              </div>
              {activeUser ? (
                <div className="pt-2 border-t border-white/10 flex flex-col gap-3">
                  <Link href="/user-portal" onClick={() => setMenuOpen(false)} className="text-lg text-white/85 font-semibold">My portal ({activeUser.name})</Link>
                  <button onClick={() => { logout(); setMenuOpen(false); }} className="text-left text-lg text-[#ef2635]">Sign out</button>
                </div>
              ) : (
                <button onClick={() => { setLocation('/sign-in'); setMenuOpen(false); }} className="text-left text-lg text-white/80">Sign in</button>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Dynamic Main Slot */}
      {children}

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#050505]">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-5 py-10 sm:px-8 md:flex-row md:items-end md:justify-between lg:px-12">
          <div className="space-y-4">
            <p className="font-mono text-[10px] uppercase tracking-[.24em] text-[#ef2635]">TZ / 001</p>
            <p className="max-w-xs text-sm leading-6 text-white/45">A technical community for people who prefer building to talking about building.</p>
            
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={GMAIL_COMPOSE_URL}
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center gap-2 font-mono text-xs text-white/80 hover:text-white transition-all bg-white/[0.03] hover:bg-white/[0.08] border border-white/15 hover:border-white/30 px-3.5 py-2 cursor-pointer"
              >
                <Mail size={14} className="text-[#ef2635]" />
                <span>Contact</span>
                <ArrowUpRight size={12} className="text-white/40 group-hover:text-white transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>

              <a
                href={LINKEDIN_URL}
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center gap-2 font-mono text-xs text-white/80 hover:text-white transition-all bg-white/[0.03] hover:bg-white/[0.08] border border-white/15 hover:border-white/30 px-3.5 py-2 cursor-pointer"
              >
                <Linkedin size={14} className="text-white/50 group-hover:text-[#0A66C2] transition-colors" />
                <span>LinkedIn</span>
                <ArrowUpRight size={12} className="text-white/40 group-hover:text-white transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>

              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center gap-2 font-mono text-xs text-white/80 hover:text-white transition-all bg-white/[0.03] hover:bg-white/[0.08] border border-white/15 hover:border-white/30 px-3.5 py-2 cursor-pointer"
              >
                <Instagram size={14} className="text-white/50 group-hover:text-pink-400 transition-colors" />
                <span>Instagram</span>
                <ArrowUpRight size={12} className="text-white/40 group-hover:text-white transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>

              <a
                href={WHATSAPP_COMMUNITY_URL}
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center gap-2 font-mono text-xs text-white/80 hover:text-white transition-all bg-white/[0.03] hover:bg-white/[0.08] border border-white/15 hover:border-white/30 px-3.5 py-2 cursor-pointer"
              >
                <MessageCircle size={14} className="text-white/50 group-hover:text-emerald-400 transition-colors" />
                <span>WhatsApp</span>
                <ArrowUpRight size={12} className="text-white/40 group-hover:text-white transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            </div>
          </div>

          <div className="text-left font-mono text-[10px] uppercase tracking-[.18em] text-white/30 md:text-right space-y-1">
            <div>Code · Create · Innovate</div>
            <div>
              <a href={GMAIL_COMPOSE_URL} target="_blank" rel="noreferrer" className="text-white/50 hover:text-[#ef2635] transition-colors font-semibold">techzen.innovation@gmail.com</a>
            </div>
            <div>
              <a href={LINKEDIN_URL} target="_blank" rel="noreferrer" className="text-white/40 hover:text-sky-300 transition-colors font-semibold">LinkedIn: TechZen Innovation</a>
            </div>
            <div>
              <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="text-white/40 hover:text-pink-300 transition-colors font-semibold">Instagram: @techzen.in</a>
            </div>
            <div>
              <a href={WHATSAPP_COMMUNITY_URL} target="_blank" rel="noreferrer" className="text-white/40 hover:text-emerald-300 transition-colors font-semibold">TechZen WhatsApp Community</a>
            </div>
            <div className="text-white/20 pt-1">© 2026 TechZen Events</div>
          </div>
        </div>
      </footer>
    </div>
  );
}