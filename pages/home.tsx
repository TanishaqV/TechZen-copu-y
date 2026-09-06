import { ArrowDownRight, ArrowRight, ArrowUpRight, CheckCircle2, Code2, Cpu, Globe, Instagram, Layers3, MessageCircle, Radio, ShieldCheck, Users, Zap } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'wouter';
import { useSafeUser as useUser } from '@/lib/clerk-safe';
import { EventCard, EventSkeleton } from '@/components/event-card';
import { SiteShell } from '@/components/site-shell';
import { INITIAL_EVENTS, CATEGORIES } from '@/mockData';
import { useEvents } from '@/context/EventContext';
import { useAuth } from '@/context/AuthContext';

const filters = ['ALL', 'HACKATHON', 'QUIZ'];

export default function Home() {
  const [filter, setFilter] = useState('ALL');
  const { user: clerkUser } = useUser();
  const { currentUser } = useAuth();
  const { events: contextEvents } = useEvents();
  const isLoggedIn = Boolean(currentUser || clerkUser);

  const rawEvents = (contextEvents && contextEvents.length > 0) ? contextEvents : INITIAL_EVENTS;

  const events = rawEvents.filter((item) => {
    if (filter === 'ALL') return true;
    return (item.category || '').toLowerCase() === filter.toLowerCase();
  });

  const featured = events[0];
  const remaining = events.slice(1);
  const logoPath = '/techzen-logo.png';

  return (
    <SiteShell>
      <main>
        <section className="relative overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 grid-paper opacity-50" />
          <div className="absolute -right-20 top-20 h-80 w-80 rounded-full bg-[#ef2635]/10 blur-3xl" />
          <div className="relative mx-auto grid max-w-[1440px] items-end gap-12 px-5 pb-20 pt-16 sm:px-8 md:grid-cols-[1.15fr_.85fr] md:pb-28 md:pt-28 lg:px-12">
            <div className="animate-enter">
              <div className="mb-8 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[.25em] text-[#ef2635]"><span className="h-px w-9 bg-[#ef2635]" /> Build in public / together</div>
              <h1 className="max-w-5xl text-balance text-[clamp(3.5rem,8vw,8.5rem)] font-bold leading-[.84] tracking-[-.07em] text-white">Make your<br /><span className="text-[#ef2635]">next thing.</span></h1>
              <p className="mt-9 max-w-lg text-base leading-7 text-white/55 sm:text-lg">TechZen is where developers, designers, and builders collide. Find your room, bring your unfinished idea, leave with momentum.</p>
              <div className="mt-9 flex flex-wrap items-center gap-5">
                <a href="#events" onClick={(e) => { e.preventDefault(); document.getElementById('events')?.scrollIntoView({ behavior: 'smooth' }); }} data-testid="link-explore-events" className="group flex items-center gap-3 bg-[#ef2635] px-5 py-3.5 text-sm font-bold text-white transition-all hover:bg-[#ff3d4b] hover:shadow-[5px_5px_0_#f4f4f4]">Explore events <ArrowDownRight size={17} className="transition-transform group-hover:translate-y-1" /></a>
                
                {/* Build with us link: Redirects to /all-events if logged in, or /sign-up if not */}
                <Link href={isLoggedIn ? "/all-events" : "/sign-up"} data-testid="link-build-with-us" className="group flex items-center gap-2 text-sm font-semibold text-white/70 transition-colors hover:text-white">
                  Build with us <ArrowRight size={16} className="text-[#ef2635] transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
            <div className="animate-rise delay-2 relative mx-auto w-full max-w-sm md:mb-2">
              <div className="absolute -inset-3 border border-[#ef2635]/25" />
              <div className="relative overflow-hidden border border-white/15 bg-black">
                <img src={logoPath} alt="TechZen logo" className="aspect-square w-full object-cover" data-testid="img-hero-logo" />
                <div className="flex items-center justify-between border-t border-white/10 px-4 py-3 font-mono text-[9px] uppercase tracking-[.2em] text-white/45"><span>Signal / active</span><span className="flex items-center gap-2 text-[#ef2635]"><i className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#ef2635]" /> Live community</span></div>
              </div>
            </div>
          </div>
          <div className="relative mx-auto flex max-w-[1440px] items-center justify-between border-t border-white/10 px-5 py-4 font-mono text-[9px] uppercase tracking-[.2em] text-white/30 sm:px-8 lg:px-12"><span>01 / Discovery</span><span>Scroll to enter</span><span className="hidden sm:inline">SF · NYC · Everywhere</span></div>
        </section>

        <section id="manifesto" className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 md:py-28 lg:px-12">
          <div className="grid gap-10 md:grid-cols-[.82fr_1.18fr] md:gap-14 items-stretch">
            {/* Left Column: Flex-col with h-full so Signal Box stretches to match right column height exactly */}
            <div className="animate-enter flex flex-col justify-between h-full">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[.25em] text-[#ef2635]">02 / The signal</p>
                <p className="mt-2.5 max-w-xs text-sm leading-6 text-white/45">Not a conference. Not a content funnel. A live wire between curious people.</p>
              </div>

              {/* Signal Box: flex-1 flex flex-col justify-between to align bottom edge with right side */}
              <div className="mt-4 flex-1 flex flex-col justify-between border border-white/10 bg-white/[0.02] p-5 font-mono text-xs space-y-4 relative overflow-hidden group hover:border-[#ef2635]/40 transition-all shadow-xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#ef2635]/10 rounded-full blur-2xl pointer-events-none" />
                
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="flex items-center gap-2 font-bold text-white tracking-wider text-[11px]">
                    <Radio size={14} className="text-[#ef2635] animate-pulse" />
                    COMMUNITY / ACTIVE
                  </span>
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                    LIVE SIGNAL
                  </span>
                </div>

                {/* Bento Grid Community Metrics */}
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  {/* Featured Bento Card (Spans col-span-2) */}
                  <div className="col-span-2 bg-gradient-to-r from-[#ef2635]/15 via-black/80 to-black/60 p-3 border border-[#ef2635]/35 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-white/50 uppercase tracking-wider flex items-center gap-1.5 font-mono text-[9px]">
                        <Users size={12} className="text-[#ef2635]" /> Builders Network
                      </div>
                      <div className="text-lg font-black text-white font-mono tracking-tight flex items-baseline gap-2">
                        500+ <span className="text-[10px] text-white/45 font-normal">Active Students</span>
                      </div>
                    </div>
                    <div className="text-[9px] font-mono text-emerald-400 bg-emerald-950/70 border border-emerald-800/60 px-2 py-1 font-bold">
                      ACTIVE STUDENTS
                    </div>
                  </div>

                  {/* Bento Card 2: Open Code (with Red Hue) */}
                  <div className="col-span-1 bg-gradient-to-br from-[#ef2635]/10 via-black/80 to-black/70 p-2.5 border border-[#ef2635]/25 hover:border-[#ef2635]/50 space-y-0.5 transition-all">
                    <div className="text-white/50 uppercase tracking-wider flex items-center gap-1 font-mono text-[9px]">
                      <Zap size={11} className="text-amber-400" /> Open Code
                    </div>
                    <div className="text-sm font-extrabold text-white font-mono">100%</div>
                    <div className="text-[8.5px] text-white/40">Peer Review</div>
                  </div>

                  {/* Bento Card 3: Campuses (with Red Hue) */}
                  <div className="col-span-1 bg-gradient-to-br from-[#ef2635]/10 via-black/80 to-black/70 p-2.5 border border-[#ef2635]/25 hover:border-[#ef2635]/50 space-y-0.5 transition-all">
                    <div className="text-white/50 uppercase tracking-wider flex items-center gap-1 font-mono text-[9px]">
                      <Globe size={11} className="text-sky-400" /> Campuses
                    </div>
                    <div className="text-sm font-extrabold text-white font-mono">25+</div>
                    <div className="text-[8.5px] text-white/40">Active Campuses</div>
                  </div>
                </div>

                {/* Core Pillars List */}
                <div className="space-y-1.5 pt-1 border-t border-white/5">
                  <div className="flex items-center gap-2 text-white/70 text-[11px] font-sans">
                    <CheckCircle2 size={13} className="text-[#ef2635] shrink-0" />
                    <span><strong className="text-white font-mono">Zero Fluff:</strong> Practical shipping, hackathons, & real code.</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/70 text-[11px] font-sans">
                    <CheckCircle2 size={13} className="text-[#ef2635] shrink-0" />
                    <span><strong className="text-white font-mono">Team Finder:</strong> Match with leads & builders across India.</span>
                  </div>
                </div>

                {/* Community Mantra */}
                <div className="border-l-2 border-[#ef2635] pl-3 py-1 font-sans text-[11px] text-white/60 leading-relaxed italic bg-white/[0.01]">
                  "Building the largest grassroots hackathon community across Indian colleges."
                </div>

                {/* Action CTA Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <a 
                    href="https://chat.whatsapp.com/techzen-community"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/40 hover:border-emerald-500 px-3 py-2 text-white font-bold text-[10px] transition-all cursor-pointer group/btn"
                  >
                    <span className="flex items-center gap-1.5"><MessageCircle size={12} /> WhatsApp</span>
                    <ArrowUpRight size={12} className="transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                  </a>

                  <a 
                    href="https://www.instagram.com/techzen.in?igsi=MTNnbXcxcmZsaTFxdw=="
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between bg-pink-600/20 hover:bg-pink-600 border border-pink-500/40 hover:border-pink-500 px-3 py-2 text-white font-bold text-[10px] transition-all cursor-pointer group/btn"
                  >
                    <span className="flex items-center gap-1.5"><Instagram size={12} /> Instagram</span>
                    <ArrowUpRight size={12} className="transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                  </a>
                </div>
              </div>
            </div>
            <div className="animate-rise delay-1"><h2 className="max-w-4xl text-balance text-4xl font-semibold leading-[1.02] tracking-[-.04em] text-white sm:text-6xl">The best ideas rarely arrive fully formed. <span className="text-white/35">They get sharper in a room with the right people.</span></h2><div className="mt-12 grid gap-8 border-t border-white/10 pt-8 sm:grid-cols-3"><div><Code2 size={21} className="text-[#ef2635]" /><p className="mt-4 text-sm font-semibold text-white">Code with context</p><p className="mt-2 text-xs leading-5 text-white/40">Practical sessions built for shipping, not spectators.</p></div><div><Layers3 size={21} className="text-[#ef2635]" /><p className="mt-4 text-sm font-semibold text-white">Create in public</p><p className="mt-2 text-xs leading-5 text-white/40">Show the rough edges. Learn faster together.</p></div><div><Cpu size={21} className="text-[#ef2635]" /><p className="mt-4 text-sm font-semibold text-white">Leave with a next step</p><p className="mt-2 text-xs leading-5 text-white/40">Every event ends with momentum you can use.</p></div></div></div>
          </div>
        </section>

        <section id="events" className="border-y border-white/10 bg-[#000000]">
          <div className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 md:py-28 lg:px-12">
            <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[.25em] text-[#ef2635]">03 / Upcoming</p>
                <h2 className="mt-4 text-4xl font-semibold tracking-[-.04em] text-white sm:text-6xl">Find your room.</h2>
              </div>
              <div className="flex flex-wrap gap-2" role="tablist" aria-label="Event filters">
                {filters.map((item) => (
                  <button
                    type="button"
                    key={item}
                    onClick={() => setFilter(item)}
                    data-testid={`button-filter-${item.toLowerCase()}`}
                    className={`focus-ring border px-3.5 py-2 font-mono text-[10px] uppercase tracking-wider transition-all cursor-pointer ${
                      filter === item
                        ? 'border-[#ef2635] bg-[#ef2635] text-white font-bold'
                        : 'border-white/15 text-white/45 hover:border-white/40 hover:text-white'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {!featured ? (
              <div className="mt-12 border border-dashed border-white/20 p-12 text-center">
                <Radio size={25} className="mx-auto text-[#ef2635]" />
                <p className="mt-5 text-lg font-semibold text-white">The calendar is quiet.</p>
                <p className="mt-2 text-sm text-white/45">No events found matching "{filter}". Check back soon or select "ALL".</p>
              </div>
            ) : (
              <>
                <div className="mt-12 grid gap-5 md:grid-cols-2">
                  <EventCard event={featured} featured />
                  {remaining.map((event) => (
                    <div key={event.id}>
                      <EventCard event={event} />
                    </div>
                  ))}
                </div>

                {/* Small More Events Button */}
                <div className="mt-12 flex justify-center">
                  <Link
                    href="/all-events"
                    data-testid="link-more-events"
                    className="group inline-flex items-center gap-2 border border-white/20 bg-[#141414] px-6 py-3 font-mono text-xs font-bold uppercase tracking-widest text-white transition-all hover:border-[#ef2635] hover:bg-[#ef2635] hover:text-white hover:shadow-[0_0_25px_rgba(239,38,53,0.35)]"
                  >
                    More Events <ArrowUpRight size={15} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                </div>
              </>
            )}
          </div>
        </section>

        <section className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 md:py-28 lg:px-12">
          <div className="grid gap-12 md:grid-cols-[1fr_1fr] md:items-center">
            <div><p className="font-mono text-[10px] uppercase tracking-[.25em] text-[#ef2635]">04 / The loop</p><h2 className="mt-4 max-w-lg text-4xl font-semibold leading-[.98] tracking-[-.05em] text-white sm:text-6xl">Come for the event.<br /><span className="text-white/35">Stay for the signal.</span></h2></div>
            <div className="border-l border-[#ef2635] pl-7">
              <p className="text-lg leading-8 text-white/65">One sharp talk can change your roadmap. One honest conversation can change your week. TechZen is the recurring place to make both happen.</p>
              
              {/* Get on the list link: Redirects to /all-events if logged in, or /sign-up if not */}
              <Link href={isLoggedIn ? "/all-events" : "/sign-up"} data-testid="link-join-signal" className="mt-7 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#ff4c59] transition-colors hover:text-white">
                Get on the list <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}