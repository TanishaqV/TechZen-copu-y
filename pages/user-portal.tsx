import React from 'react';
import { Redirect, Link } from 'wouter';
import { CalendarDays, ChevronRight, LogOut, MapPin, Ticket, UserRound, ArrowUpRight, Plus, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useEvents } from '../context/EventContext';
import { useListEvents, useListMyRegistrations } from '@/lib/api-client';
import { SiteShell } from '@/components/site-shell';
import HostDashboard from '@/components/HostDashboard';

function portalDate(value?: string) {
  if (!value) return 'TBA';
  try {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
  } catch (e) {
    return value;
  }
}

export default function UserPortal() {
  const { currentUser, logout, isAdmin, isEmailAdmin } = useAuth();
  const { setCreateEventModalOpen } = useEvents();
  const { data: events = [], isLoading: eventsLoading } = useListEvents();
  const { data: registrations = [], isLoading: regsLoading } = useListMyRegistrations();

  // If no user is logged in, redirect to homepage or sign-in
  if (!currentUser) {
    return <Redirect to="/sign-in" />;
  }

  const effectiveIsAdmin = isAdmin || (isEmailAdmin ? isEmailAdmin(currentUser?.email || '') : false);

  // Find user registrations
  const userRegistrations = registrations.filter(
    (r) => r.userEmail?.toLowerCase() === currentUser.email?.toLowerCase() || r.userId === currentUser.id
  );

  const registeredEventIds = new Set(userRegistrations.map((r) => r.eventId));
  const myEvents = events.filter((e) => registeredEventIds.has(e.id));
  const nextEvent = myEvents[0] || events[0];

  return (
    <SiteShell>
      <main className="mx-auto max-w-[1440px] px-5 pb-24 pt-14 sm:px-8 md:pt-20 lg:px-12">
        
        {/* Header */}
        <div className="flex flex-col justify-between gap-8 border-b border-white/10 pb-10 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.25em] text-[#ef2635]">
              {effectiveIsAdmin && <ShieldCheck size={14} className="text-[#ef2635]" />}
              <span>{effectiveIsAdmin ? 'VERIFIED ADMIN / ORGANIZER' : 'ATTENDEE PORTAL'}</span>
            </div>
            <h1 className="mt-4 text-5xl font-semibold leading-none tracking-[-.06em] text-white sm:text-7xl font-mono uppercase">
              {effectiveIsAdmin ? 'Admin Control' : 'Your signal.'}
            </h1>
            <p className="mt-5 text-base text-white/55">
              Welcome back, <span className="text-white font-semibold">{currentUser.name}</span> ({currentUser.email}).
            </p>
          </div>

          <div className="flex items-center gap-3">
            {effectiveIsAdmin && (
              <button
                type="button"
                onClick={() => setCreateEventModalOpen(true)}
                className="flex items-center gap-2 bg-[#ef2635] hover:bg-[#ff3d4b] px-5 py-2.5 text-sm font-bold text-white transition-all cursor-pointer shadow-lg shadow-red-500/20"
              >
                <Plus size={16} /> Post New Event
              </button>
            )}

            <button
              type="button"
              onClick={logout}
              data-testid="button-portal-sign-out"
              className="flex items-center gap-2 border border-white/15 px-4 py-2.5 text-sm text-white/60 transition-colors hover:border-[#ef2635] hover:text-white cursor-pointer"
            >
              <LogOut size={16} /> Sign out
            </button>
          </div>
        </div>

        {/* If Admin: Mount Full Admin Dashboard with PPTs, Team Emails & Roster */}
        {effectiveIsAdmin ? (
          <div className="mt-10">
            <HostDashboard />
          </div>
        ) : (
          <>
            {/* Status Grid for Regular Users */}
            <div className="mt-10 grid gap-5 md:grid-cols-[1.3fr_.7fr]">
              
              {/* Next Up Event */}
              <div className="relative overflow-hidden border border-[#ef2635]/50 bg-[#171010] p-7 sm:p-9">
                <div className="absolute right-0 top-0 h-full w-1/2 bg-[linear-gradient(135deg,transparent_48%,rgba(239,38,53,.12)_48%,rgba(239,38,53,.12)_49%,transparent_49%)]" />
                <div className="relative">
                  <p className="font-mono text-[10px] uppercase tracking-[.22em] text-[#ff5863]">Next up</p>
                  
                  {eventsLoading ? (
                    <div className="mt-8 h-10 w-3/4 animate-pulse bg-white/10" />
                  ) : nextEvent ? (
                    <>
                      <h2 data-testid="text-next-event-title" className="mt-5 max-w-xl text-3xl font-semibold leading-tight tracking-[-.035em] text-white sm:text-4xl">
                        {nextEvent.title}
                      </h2>
                      <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/55">
                        <span className="flex items-center gap-2">
                          <CalendarDays size={16} className="text-[#ef2635]" /> {portalDate(nextEvent.date)}
                        </span>
                        <span className="flex items-center gap-2">
                          <MapPin size={16} className="text-[#ef2635]" /> {nextEvent.location}
                        </span>
                      </div>
                      <Link
                        href={`/events/${nextEvent.id}`}
                        data-testid="link-next-event"
                        className="mt-8 inline-flex items-center gap-2 border border-white/20 px-4 py-3 text-sm font-semibold text-white transition-all hover:border-[#ef2635] hover:bg-[#ef2635]"
                      >
                        Open event details <ChevronRight size={16} />
                      </Link>
                    </>
                  ) : (
                    <>
                      <h2 className="mt-5 max-w-md text-3xl font-semibold text-white">No upcoming rooms yet.</h2>
                      <p className="mt-4 max-w-md text-sm leading-6 text-white/45">
                        The next good idea could be yours. Browse the calendar and find something worth showing up for.
                      </p>
                      <Link href="/events" data-testid="link-find-next-event" className="mt-7 inline-flex items-center gap-2 bg-[#ef2635] px-4 py-3 text-sm font-bold text-white">
                        Find an event <ChevronRight size={16} />
                      </Link>
                    </>
                  )}
                </div>
              </div>

              {/* Activity Pass */}
              <div className="border border-white/10 bg-[#111] p-7 sm:p-9">
                <p className="font-mono text-[10px] uppercase tracking-[.22em] text-white/35">Your activity</p>
                <div className="mt-9 flex items-end gap-4">
                  <span data-testid="text-registration-count" className="text-6xl font-semibold tracking-[-.07em] text-white">
                    {regsLoading ? '—' : userRegistrations.length}
                  </span>
                  <span className="pb-2 text-sm text-white/45">
                    events<br />registered
                  </span>
                </div>
                <div className="mt-8 h-px bg-white/10" />
                <div className="mt-6 flex items-center gap-3 text-sm text-white/55">
                  <Ticket size={17} className="text-[#ef2635]" /> Builder Pass Status: <span className="text-white font-semibold">Active</span>
                </div>
                <div className="mt-3 flex items-center gap-3 text-sm text-white/55">
                  <UserRound size={17} className="text-[#ef2635]" /> {currentUser.email} (Member)
                </div>
              </div>
            </div>

            {/* Registrations List */}
            <section className="mt-20">
              <div className="flex items-end justify-between border-b border-white/10 pb-5">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[.22em] text-[#ef2635]">Archive / attendance</p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-[-.04em] text-white">Your registrations</h2>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-white/30">
                  {userRegistrations.length} total
                </span>
              </div>

              {regsLoading ? (
                <div className="mt-5 space-y-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-24 animate-pulse border border-white/10 bg-white/[.03]" />
                  ))}
                </div>
              ) : userRegistrations.length === 0 ? (
                <div className="mt-5 border border-dashed border-white/20 p-10 text-center">
                  <p className="font-semibold text-white">Your calendar is clear.</p>
                  <p className="mt-2 text-sm text-white/40">When you RSVP for an event, your builder pass and ticket will appear here.</p>
                  <Link href="/events" className="mt-5 inline-flex items-center gap-2 bg-[#ef2635] px-4 py-2.5 text-xs font-bold text-white">
                    Explore Events <ArrowUpRight size={14} />
                  </Link>
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  {userRegistrations.map((registration) => {
                    const ev = events.find((e) => e.id === registration.eventId);
                    return (
                      <Link
                        href={`/events/${registration.eventId}`}
                        key={registration.id}
                        data-testid={`row-registration-${registration.id}`}
                        className="group flex flex-col justify-between gap-5 border border-white/10 bg-[#111] p-5 transition-all hover:border-white/30 sm:flex-row sm:items-center"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#ef2635]/10 font-mono text-xs font-bold text-[#ff5863]">
                            TZ
                          </div>
                          <div>
                            <p className="font-semibold text-white transition-colors group-hover:text-[#ff5863]">
                              {ev?.title || `Event #${registration.eventId}`}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/40">
                              <span className="flex items-center gap-1.5">
                                <CalendarDays size={13} /> {portalDate(ev?.date)}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <MapPin size={13} /> {ev?.location || 'San Francisco, CA'}
                              </span>
                              <span className="text-[#ff5863] font-mono">
                                Ticket: {registration.ticketCode}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className="flex items-center gap-2 self-end font-mono text-[10px] uppercase tracking-widest text-white/35 sm:self-auto">
                          View Ticket <ChevronRight size={15} className="text-[#ef2635]" />
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}

      </main>
    </SiteShell>
  );
}