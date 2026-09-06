import React from 'react';
import Navbar from '../components/Navbar';
import HeroBanner from '../components/HeroBanner';
import EventCard from '../components/EventCard';
import { useEvents } from '../context/EventContext';
import { useAuth } from '../context/AuthContext';
import { ArrowRight } from 'lucide-react';
import { useLocation } from 'wouter';
import { useSafeUser as useUser } from '../lib/clerk-safe';

export default function Home() {
  const { events, selectedCategory, setCreateEventModalOpen } = useEvents();
  const { currentUser, openAuth } = useAuth();
  const { user: clerkUser } = useUser();
  const [, setLocation] = useLocation();

  const isLoggedIn = Boolean(currentUser || clerkUser);

  const filteredEvents = events.filter(e => {
    if (selectedCategory === 'all') return true;
    return e.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0b0b] text-slate-100 font-sans selection:bg-[#ef2635] selection:text-white">
      
      {/* Top Navbar */}
      <Navbar />

      {/* Hero & Section 01, 02, 03 */}
      <main className="flex-1 animate-enter">
        <HeroBanner />

        {/* Section 03 Events Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 space-y-6">
          {filteredEvents.length > 0 ? (
            <div className="space-y-6">
              {filteredEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="p-12 text-center rounded-lg bg-[#111111] border border-white/15 space-y-2 font-mono text-xs text-zinc-400">
              No events found matching this category.
            </div>
          )}
        </div>

        {/* SECTION 04 / THE LOOP */}
        <section className="border-t border-white/15 bg-[#080808] py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              <div className="lg:col-span-6 space-y-3">
                <div className="section-tag">04 / THE LOOP</div>
                <h2 className="text-4xl sm:text-6xl font-black text-white font-outfit leading-tight">
                  Come for the <br />
                  event. <br />
                  <span className="text-zinc-600 font-normal">Stay for the signal.</span>
                </h2>
              </div>

              <div className="lg:col-span-6 border-l-2 border-red-accent pl-6 sm:pl-8 space-y-6">
                <p className="text-base sm:text-lg text-zinc-300 leading-relaxed font-normal">
                  One sharp talk can change your roadmap. One honest conversation can change your week. TechZen is the recurring place to make both happen.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    if (isLoggedIn) {
                      setLocation('/all-events');
                    } else {
                      openAuth('signup');
                    }
                  }}
                  className="text-xs font-mono font-bold text-red-accent hover:text-white uppercase tracking-widest flex items-center space-x-2 transition cursor-pointer"
                >
                  <span>GET ON THE LIST</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>

          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#080808] border-t border-white/15 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          
          <div className="space-y-1">
            <div className="text-xs font-mono text-red-accent font-bold">TZ / 001</div>
            <p className="text-xs text-zinc-400 max-w-sm">
              A technical community for people who prefer building to talking about building.
            </p>
          </div>

          <div className="text-left md:text-right space-y-1 font-mono">
            <div className="text-xs text-zinc-400 tracking-wider">
              CODE • CREATE • INNOVATE
            </div>
            <div className="text-[11px] text-zinc-600">
              © 2026 TECHZEN INNOVATIONS
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
