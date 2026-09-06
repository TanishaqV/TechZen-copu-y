import { ArrowUpRight, CalendarDays, MapPin } from 'lucide-react';
import { Link } from 'wouter';

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
  } catch (e) {
    return value;
  }
}

export function EventCard({ event, featured = false }: { event: any; featured?: boolean }) {
  const spots = Math.max((event.capacity || 100) - (event.registeredCount || event.rsvpCount || 0), 0);
  
  // Determine if the event has ended (Both current events Operation Cipher & QuizVerse have ended)
  const isEnded = Boolean(
    event.ended === true ||
    event.isEnded === true ||
    event.id === 'operation-cipher-2026' ||
    event.id === 'quizverse-2026' ||
    (event.date && !isNaN(Date.parse(event.date)) && new Date(event.date).getTime() < Date.now() - 24 * 60 * 60 * 1000)
  );

  const displayCategory = (event.category === 'QUIZ' || event.badge === 'TECH QUIZ' || (event.title || '').toLowerCase().includes('quiz')) 
    ? 'QUIZ' 
    : (event.category || event.badge || 'HACKATHON');

  return (
    <Link
      href={`/events/${event.id}`}
      data-testid={`card-event-${event.id}`}
      className={`group focus-ring relative block overflow-hidden border border-white/10 bg-[#0a0a0a] transition-all duration-500 hover:-translate-y-1 hover:border-[#ef2635]/70 ${
        featured ? 'md:col-span-2 md:grid md:grid-cols-[1.1fr_.9fr]' : ''
      }`}
    >
      {/* 30-Degree Inclined 'EVENT ENDED' Rectangular Stamp */}
      {isEnded && (
        <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center overflow-hidden">
          <div className="transform -rotate-[30deg] border-2 border-[#ef2635] bg-[#000000]/92 px-8 py-2.5 text-center shadow-[0_0_25px_rgba(239,38,53,0.6)] backdrop-blur-md">
            <span className="font-mono text-xs sm:text-sm font-black tracking-[0.25em] text-[#ef2635] uppercase drop-shadow-md">
              EVENT ENDED
            </span>
          </div>
        </div>
      )}

      <div className={`relative overflow-hidden bg-[#050505] ${featured ? 'min-h-[280px] md:min-h-full' : 'aspect-[16/10]'}`}>
        {event.imageUrl || event.coverImage ? (
          <img
            src={event.imageUrl || event.coverImage}
            alt={event.title}
            className={`h-full w-full object-cover transition duration-700 group-hover:scale-105 ${
              isEnded ? 'opacity-35 grayscale-[60%]' : 'opacity-80 group-hover:opacity-100'
            }`}
          />
        ) : (
          <div className="grid-paper h-full w-full">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_65%_35%,rgba(239,38,53,.45),transparent_30%),linear-gradient(135deg,transparent_45%,rgba(255,255,255,.08)_45%,rgba(255,255,255,.08)_46%,transparent_46%)]" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

        <div className="absolute left-3 top-3 sm:left-5 sm:top-5 flex gap-1.5 sm:gap-2 z-10">
          <span className="bg-[#ef2635] px-2 py-0.5 sm:px-2.5 sm:py-1 font-mono text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-white">
            {displayCategory}
          </span>
          <span className="border border-white/25 bg-black/35 px-2 py-0.5 sm:px-2.5 sm:py-1 font-mono text-[9px] sm:text-[10px] uppercase tracking-wider text-white/75">
            {event.format || event.locationType || 'ONLINE'}
          </span>
        </div>

        <span className="absolute bottom-3 left-3 sm:bottom-5 sm:left-5 font-mono text-[9px] sm:text-[10px] uppercase tracking-widest text-white/60 z-10">
          {isEnded ? (
            <span className="text-[#ff6570] font-semibold">REGISTRATION CLOSED</span>
          ) : spots < 15 ? (
            `${spots} spots left`
          ) : (
            'Registration open'
          )}
        </span>
      </div>

      <div className={`flex flex-col justify-between p-3.5 sm:p-5 ${featured ? 'md:p-8' : ''} ${isEnded ? 'opacity-70' : ''}`}>
        <div>
          <div className="mb-2 sm:mb-4 flex items-center justify-between font-mono text-[9px] sm:text-[10px] uppercase tracking-widest text-white/40">
            <span>{event.date}</span>
            <ArrowUpRight size={15} className="text-[#ef2635] transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
          </div>
          <h3 className={`max-w-xl font-semibold leading-tight text-white transition-colors group-hover:text-[#ff4855] ${featured ? 'text-xl sm:text-3xl md:text-4xl' : 'text-lg sm:text-2xl'}`}>
            {event.title}
          </h3>
          <p className="mt-2 sm:mt-3 line-clamp-2 text-xs sm:text-sm leading-relaxed text-white/45">{event.description || event.tagline}</p>
        </div>

        <div className="mt-4 sm:mt-6 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] sm:text-xs text-white/45">
          <span className="inline-flex items-center gap-1">
            <CalendarDays size={13} className="text-[#ef2635]" /> {event.date}
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin size={13} className="text-[#ef2635]" /> {event.location}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function EventSkeleton({ index }: { index: number }) {
  return (
    <div className="animate-pulse border border-white/10 bg-[#0a0a0a]" style={{ animationDelay: `${index * 80}ms` }}>
      <div className="aspect-[16/10] bg-white/[.06]" />
      <div className="space-y-3 p-5">
        <div className="h-2 w-20 bg-white/[.08]" />
        <div className="h-6 w-4/5 bg-white/[.08]" />
        <div className="h-3 w-full bg-white/[.06]" />
        <div className="h-3 w-2/3 bg-white/[.06]" />
      </div>
    </div>
  );
}