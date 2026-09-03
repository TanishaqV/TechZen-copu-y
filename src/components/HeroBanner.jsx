import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useEvents } from '../context/EventContext';
import { CATEGORIES } from '../mockData';
import TechZenLogo from './TechZenLogo';
import { ArrowDownRight, ArrowRight, Code, Layers, Cpu } from 'lucide-react';
import { useLocation } from 'wouter';
import { useSafeUser as useUser } from '../lib/clerk-safe';

export default function HeroBanner() {
  const { currentUser, openAuth } = useAuth();
  const { user: clerkUser } = useUser();
  const { setCreateEventModalOpen, selectedCategory, setSelectedCategory } = useEvents();
  const [, setLocation] = useLocation();

  const isLoggedIn = Boolean(currentUser || clerkUser);

  return (
    <div className="space-y-24">
      
      {/* Top Bar Indicator */}
      <div className="border-b border-zinc-800/80 py-2 text-[11px] font-mono tracking-widest text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <span>01 / DISCOVERY</span>
          <span className="hidden sm:inline">SCROLL TO ENTER</span>
          <span>SF • NYC • EVERYWHERE</span>
        </div>
      </div>

      {/* SECTION 01 / DISCOVERY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Headline & Pitch */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="text-xs font-mono text-red-accent font-bold tracking-widest flex items-center space-x-2">
              <span className="w-6 h-[2px] bg-red-accent inline-block" />
              <span>BUILD IN PUBLIC / TOGETHER</span>
            </div>

            <h1 className="text-5xl sm:text-7xl font-black text-white font-outfit tracking-tight leading-[1.05]">
              Make your <br />
              <span className="text-red-accent">next thing.</span>
            </h1>

            <p className="text-sm sm:text-base text-zinc-300 max-w-xl leading-relaxed font-normal">
              TechZen is where developers, designers, and builders collide. Find your room, bring your unfinished idea, leave with momentum.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <a
                href="#upcoming-events"
                className="px-5 py-3 rounded bg-red-accent hover:bg-red-600 text-white font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-red-500/20 flex items-center space-x-1.5"
              >
                <span>Explore events</span>
                <ArrowDownRight className="w-4 h-4" />
              </a>

              <button
                type="button"
                onClick={() => {
                  if (isLoggedIn) {
                    setLocation('/all-events');
                  } else {
                    openAuth('signup');
                  }
                }}
                className="px-4 py-3 text-white hover:text-red-accent font-semibold text-xs flex items-center space-x-1.5 transition cursor-pointer"
              >
                <span>Build with us</span>
                <ArrowRight className="w-4 h-4 text-red-accent" />
              </button>
            </div>

          </div>

          {/* Right Column: Exact Logo Box */}
          <div className="lg:col-span-5">
            <div className="relative rounded-lg bg-card-grid border border-red-500/40 p-8 sm:p-10 flex flex-col items-center justify-between min-h-[380px] shadow-2xl group">
              
              <div className="my-auto py-6">
                <TechZenLogo showTagline={true} />
              </div>

              <div className="w-full pt-6 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-zinc-400">
                <span>SIGNAL / ACTIVE</span>
                <span className="flex items-center text-red-accent font-semibold">
                  <span className="w-2 h-2 rounded-full bg-red-accent animate-ping mr-1.5" /> 🔴 LIVE COMMUNITY
                </span>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* SECTION 02 / THE SIGNAL */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-white/10 pt-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          <div className="lg:col-span-5 space-y-3">
            <div className="section-tag">02 / THE SIGNAL</div>
            <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
              Not a conference. Not a content funnel. A live wire between curious people.
            </p>
          </div>

          <div className="lg:col-span-7 space-y-12">
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white font-outfit leading-snug">
              The best ideas rarely arrive fully formed. <br />
              <span className="text-zinc-600 font-normal">They get sharper in a room with the right people.</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-white/10">
              <div className="space-y-2">
                <Code className="w-6 h-6 text-red-accent" />
                <h4 className="text-sm font-bold text-white">Code with context</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Practical sessions built for shipping, not spectators.
                </p>
              </div>

              <div className="space-y-2">
                <Layers className="w-6 h-6 text-red-accent" />
                <h4 className="text-sm font-bold text-white">Create in public</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Show the rough edges. Learn faster together.
                </p>
              </div>

              <div className="space-y-2">
                <Cpu className="w-6 h-6 text-red-accent" />
                <h4 className="text-sm font-bold text-white">Leave with momentum</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Every event ends with a next step you can use.
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 03 / UPCOMING EVENTS BAR */}
      <section id="upcoming-events" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-white/10 pt-16">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="section-tag">03 / UPCOMING</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-outfit mt-1">
              Find your room.
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(selectedCategory === cat ? 'all' : cat)}
                className={`px-3 py-1.5 rounded text-xs font-mono tracking-wider uppercase transition cursor-pointer ${
                  selectedCategory === cat 
                    ? 'bg-red-accent text-white font-bold' 
                    : 'bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
