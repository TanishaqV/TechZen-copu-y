import { ArrowDownRight, ArrowRight, Code2, Cpu, Layers3, Radio } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'wouter';
import { useListEvents } from '@workspace/api-client-react';
import logoPath from '@assets/techzen-logo.jpeg';
import { EventCard, EventSkeleton } from '@/components/event-card';
import { SiteShell } from '@/components/site-shell';

const filters = ['All', 'Meetup', 'Workshop', 'Hackathon', 'Talk'];

export default function Home() {
  const [filter, setFilter] = useState('All');
  const { data: events, isLoading, isError, refetch } = useListEvents();
  const list = useMemo(() => (events ?? []).filter((event) => filter === 'All' || event.format === filter || event.category === filter), [events, filter]);
  const featured = list.find((event) => event.featured) ?? list[0];
  const remaining = list.filter((event) => event.id !== featured?.id);
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
                <a href="#events" data-testid="link-explore-events" className="group flex items-center gap-3 bg-[#ef2635] px-5 py-3.5 text-sm font-bold text-white transition-all hover:bg-[#ff3d4b] hover:shadow-[5px_5px_0_#f4f4f4]">Explore events <ArrowDownRight size={17} className="transition-transform group-hover:translate-y-1" /></a>
                <Link href="/sign-up" data-testid="link-build-with-us" className="group flex items-center gap-2 text-sm font-semibold text-white/70 transition-colors hover:text-white">Build with us <ArrowRight size={16} className="text-[#ef2635] transition-transform group-hover:translate-x-1" /></Link>
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

        <section id="manifesto" className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 md:py-32 lg:px-12">
          <div className="grid gap-12 md:grid-cols-[.75fr_1.25fr] md:gap-20">
            <div className="animate-enter"><p className="font-mono text-[10px] uppercase tracking-[.25em] text-[#ef2635]">02 / The signal</p><p className="mt-5 max-w-xs text-sm leading-6 text-white/45">Not a conference. Not a content funnel. A live wire between curious people.</p></div>
            <div className="animate-rise delay-1"><h2 className="max-w-4xl text-balance text-4xl font-semibold leading-[1.02] tracking-[-.04em] text-white sm:text-6xl">The best ideas rarely arrive fully formed. <span className="text-white/35">They get sharper in a room with the right people.</span></h2><div className="mt-12 grid gap-8 border-t border-white/10 pt-8 sm:grid-cols-3"><div><Code2 size={21} className="text-[#ef2635]" /><p className="mt-4 text-sm font-semibold text-white">Code with context</p><p className="mt-2 text-xs leading-5 text-white/40">Practical sessions built for shipping, not spectators.</p></div><div><Layers3 size={21} className="text-[#ef2635]" /><p className="mt-4 text-sm font-semibold text-white">Create in public</p><p className="mt-2 text-xs leading-5 text-white/40">Show the rough edges. Learn faster together.</p></div><div><Cpu size={21} className="text-[#ef2635]" /><p className="mt-4 text-sm font-semibold text-white">Leave with a next step</p><p className="mt-2 text-xs leading-5 text-white/40">Every event ends with momentum you can use.</p></div></div></div>
          </div>
        </section>

        <section id="events" className="border-y border-white/10 bg-[#0b0b0b]">
          <div className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 md:py-28 lg:px-12">
            <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end"><div><p className="font-mono text-[10px] uppercase tracking-[.25em] text-[#ef2635]">03 / Upcoming</p><h2 className="mt-4 text-4xl font-semibold tracking-[-.04em] text-white sm:text-6xl">Find your room.</h2></div><div className="flex flex-wrap gap-2" role="tablist" aria-label="Event filters">{filters.map((item) => <button type="button" key={item} onClick={() => setFilter(item)} data-testid={`button-filter-${item.toLowerCase()}`} className={`focus-ring border px-3.5 py-2 font-mono text-[10px] uppercase tracking-wider transition-all ${filter === item ? 'border-[#ef2635] bg-[#ef2635] text-white' : 'border-white/15 text-white/45 hover:border-white/40 hover:text-white'}`}>{item}</button>)}</div></div>
            {isLoading && <div className="mt-12 grid gap-5 md:grid-cols-2"><EventSkeleton index={0} /><EventSkeleton index={1} /><EventSkeleton index={2} /></div>}
            {isError && <div className="mt-12 flex flex-col items-start border border-[#ef2635]/40 bg-[#ef2635]/[.06] p-8"><p className="font-mono text-[10px] uppercase tracking-widest text-[#ff6570]">Signal interrupted</p><p className="mt-3 text-white/70">We couldn't load the event feed right now.</p><button type="button" onClick={() => refetch()} data-testid="button-retry-events" className="mt-5 border border-white/20 px-4 py-2 text-sm text-white transition-colors hover:border-[#ef2635]">Try again</button></div>}
            {!isLoading && !isError && !featured && <div className="mt-12 border border-dashed border-white/20 p-12 text-center"><Radio size={25} className="mx-auto text-[#ef2635]" /><p className="mt-5 text-lg font-semibold text-white">The calendar is quiet.</p><p className="mt-2 text-sm text-white/45">New rooms are forming. Check back soon.</p></div>}
            {!isLoading && !isError && featured && <div className="mt-12 grid gap-5 md:grid-cols-2">{<EventCard event={featured} featured />}{remaining.map((event, index) => <div key={event.id} className={index === 0 ? '' : ''}><EventCard event={event} /></div>)}</div>}
          </div>
        </section>

        <section className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 md:py-28 lg:px-12">
          <div className="grid gap-12 md:grid-cols-[1fr_1fr] md:items-center">
            <div><p className="font-mono text-[10px] uppercase tracking-[.25em] text-[#ef2635]">04 / The loop</p><h2 className="mt-4 max-w-lg text-4xl font-semibold leading-[.98] tracking-[-.05em] text-white sm:text-6xl">Come for the event.<br /><span className="text-white/35">Stay for the signal.</span></h2></div>
            <div className="border-l border-[#ef2635] pl-7"><p className="text-lg leading-8 text-white/65">One sharp talk can change your roadmap. One honest conversation can change your week. TechZen is the recurring place to make both happen.</p><Link href="/sign-up" data-testid="link-join-signal" className="mt-7 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#ff4c59] transition-colors hover:text-white">Get on the list <ArrowRight size={15} /></Link></div>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}