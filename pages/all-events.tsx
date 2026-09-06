import { useState, useMemo } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, Radio, Search } from 'lucide-react';
import { useListEvents } from '@workspace/api-client-react';
import { EventCard, EventSkeleton } from '@/components/event-card';
import { SiteShell } from '@/components/site-shell';

const filters = ['All', 'Hackathon', 'Quiz'];

export default function AllEvents() {
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const { data: events, isLoading, isError, refetch } = useListEvents();

  const filteredList = useMemo(() => {
    return (events ?? []).filter((event) => {
      let matchesFilter = filter === 'All';
      if (!matchesFilter) {
        const f = filter.toLowerCase();
        const c = (event.category || '').toLowerCase();
        const fmt = (event.format || '').toLowerCase();
        const b = (event.badge || '').toLowerCase();
        const t = (event.title || '').toLowerCase();

        if (f === 'quiz') {
          matchesFilter = c.includes('quiz') || b.includes('quiz') || t.includes('quiz');
        } else if (f === 'hackathon') {
          matchesFilter = c.includes('hackathon') || b.includes('hackathon') || t.includes('cipher') || t.includes('hack');
        } else {
          matchesFilter = c === f || fmt === f || b.includes(f) || t.includes(f);
        }
      }

      const matchesSearch =
        !searchQuery ||
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (event.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (event.tagline || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [events, filter, searchQuery]);

  return (
    <SiteShell>
      <main className="min-h-screen bg-[#000000] text-white">
        {/* Header Banner */}
        <section className="relative overflow-hidden border-b border-white/10 bg-[#050505] py-16 px-5 sm:px-8 lg:px-12">
          <div className="absolute inset-0 grid-paper opacity-40" />
          <div className="absolute -right-10 top-0 h-64 w-64 rounded-full bg-[#ef2635]/10 blur-3xl" />
          
          <div className="relative mx-auto max-w-[1440px]">
            <Link href="/" className="inline-flex items-center gap-2 font-mono text-xs text-white/50 hover:text-[#ef2635] transition-colors mb-6">
              <ArrowLeft size={14} /> Back to Home
            </Link>
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.25em] text-[#ef2635]">
                  <span className="h-px w-6 bg-[#ef2635]" /> TechZen Archive
                </div>
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white">
                  All Events & Hackathons
                </h1>
                <p className="mt-3 text-sm text-white/50 max-w-xl">
                  Browse all community hackathons and tech quizzes.
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative min-w-[260px]">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-none border border-white/15 bg-black/50 py-2.5 pl-10 pr-4 font-mono text-xs text-white placeholder-white/40 focus:border-[#ef2635] focus:outline-none"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Filter Controls & Grid */}
        <section className="mx-auto max-w-[1440px] px-5 py-12 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between border-b border-white/10 pb-6 mb-8">
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Event category filters">
              {filters.map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => setFilter(item)}
                  className={`border px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-all cursor-pointer ${
                    filter === item
                      ? 'border-[#ef2635] bg-[#ef2635] text-white font-bold'
                      : 'border-white/15 text-white/45 hover:border-white/40 hover:text-white'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

            <span className="font-mono text-xs text-white/40">
              Showing {filteredList.length} {filteredList.length === 1 ? 'event' : 'events'}
            </span>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              <EventSkeleton index={0} />
              <EventSkeleton index={1} />
              <EventSkeleton index={2} />
            </div>
          )}

          {/* Error State */}
          {isError && (
            <div className="flex flex-col items-start border border-[#ef2635]/40 bg-[#ef2635]/[.06] p-8">
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#ff6570]">Signal interrupted</p>
              <p className="mt-3 text-white/70">We couldn't load the event feed right now.</p>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-5 border border-white/20 px-4 py-2 text-sm text-white transition-colors hover:border-[#ef2635]"
              >
                Try again
              </button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !isError && filteredList.length === 0 && (
            <div className="border border-dashed border-white/20 p-16 text-center">
              <Radio size={28} className="mx-auto text-[#ef2635]" />
              <p className="mt-5 text-lg font-semibold text-white">No matching events found</p>
              <p className="mt-2 text-sm text-white/45">Try adjusting your filters or search query.</p>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="mt-5 border border-white/20 bg-white/5 px-4 py-2 text-xs text-white hover:border-[#ef2635]"
                >
                  Clear search
                </button>
              )}
            </div>
          )}

          {/* Events Grid */}
          {!isLoading && !isError && filteredList.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredList.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </section>
      </main>
    </SiteShell>
  );
}
