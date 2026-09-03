import { ArrowUpRight, CalendarDays, MapPin } from 'lucide-react';
import { Link } from 'wouter';
import type { Event } from '@workspace/api-client-react';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

export function EventCard({ event, featured = false }: { event: Event; featured?: boolean }) {
  const spots = Math.max(event.capacity - event.registeredCount, 0);
  return (
    <Link href={`/events/${event.id}`} data-testid={`card-event-${event.id}`} className={`group focus-ring relative block overflow-hidden border border-white/10 bg-[#111] transition-all duration-500 hover:-translate-y-1 hover:border-[#ef2635]/70 ${featured ? 'md:col-span-2 md:grid md:grid-cols-[1.1fr_.9fr]' : ''}`}>
      <div className={`relative overflow-hidden bg-[#191919] ${featured ? 'min-h-[280px] md:min-h-full' : 'aspect-[16/10]'}`}>
        {event.imageUrl ? <img src={event.imageUrl} alt="" className="h-full w-full object-cover opacity-80 transition duration-700 group-hover:scale-105 group-hover:opacity-100" /> : <div className="grid-paper h-full w-full"><div className="absolute inset-0 bg-[radial-gradient(circle_at_65%_35%,rgba(239,38,53,.45),transparent_30%),linear-gradient(135deg,transparent_45%,rgba(255,255,255,.08)_45%,rgba(255,255,255,.08)_46%,transparent_46%)]" /></div>}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
        <div className="absolute left-5 top-5 flex gap-2">
          <span className="bg-[#ef2635] px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-white">{event.category}</span>
          <span className="border border-white/25 bg-black/35 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-white/75">{event.format}</span>
        </div>
        <span className="absolute bottom-5 left-5 font-mono text-[10px] uppercase tracking-widest text-white/60">{spots < 15 ? `${spots} spots left` : 'Registration open'}</span>
      </div>
      <div className={`flex flex-col justify-between p-5 ${featured ? 'md:p-8' : ''}`}>
        <div>
          <div className="mb-5 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-white/40">
            <span>{formatDate(event.date)}</span>
            <ArrowUpRight size={16} className="text-[#ef2635] transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
          </div>
          <h3 className={`max-w-xl font-semibold leading-[1.04] text-white transition-colors group-hover:text-[#ff4855] ${featured ? 'text-3xl sm:text-4xl' : 'text-2xl'}`}>{event.title}</h3>
          <p className="mt-4 line-clamp-2 text-sm leading-6 text-white/45">{event.description}</p>
        </div>
        <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/45">
          <span className="inline-flex items-center gap-1.5"><CalendarDays size={14} className="text-[#ef2635]" /> {formatDate(event.date)}</span>
          <span className="inline-flex items-center gap-1.5"><MapPin size={14} className="text-[#ef2635]" /> {event.location}</span>
        </div>
      </div>
    </Link>
  );
}

export function EventSkeleton({ index }: { index: number }) {
  return <div className="animate-pulse border border-white/10 bg-[#111]" style={{ animationDelay: `${index * 80}ms` }}><div className="aspect-[16/10] bg-white/[.06]" /><div className="space-y-3 p-5"><div className="h-2 w-20 bg-white/[.08]" /><div className="h-6 w-4/5 bg-white/[.08]" /><div className="h-3 w-full bg-white/[.06]" /><div className="h-3 w-2/3 bg-white/[.06]" /></div></div>;
}