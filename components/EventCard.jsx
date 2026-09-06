import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useEvents } from '../context/EventContext';
import { Calendar, MapPin, ArrowUpRight, Share2, Check } from 'lucide-react';
import { Link } from 'wouter';

export default function EventCard({ event }) {
  const { currentUser } = useAuth();
  const { isUserRegistered, showToast } = useEvents();
  const [copied, setCopied] = useState(false);

  const registered = isUserRegistered(event.id, currentUser?.id);

  // Determine if the event has ended (Both Operation Cipher & QuizVerse have completed)
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

  const handleShare = (e) => {
    e.stopPropagation();
    e.preventDefault();
    const shareUrl = `${window.location.origin}/events/${event.id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    showToast('Direct event URL copied!');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Link
      href={`/events/${event.id}`}
      className={`group tech-card relative rounded-lg overflow-hidden flex flex-col md:flex-row cursor-pointer transition-all duration-300 border border-white/10 hover:border-red-500/60 block ${
        isEnded ? 'opacity-75' : ''
      }`}
    >
      {/* 30-Degree Inclined 'EVENT ENDED' Rectangular Stamp */}
      {isEnded && (
        <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center overflow-hidden">
          <div className="transform -rotate-[30deg] border-2 border-[#ef2635] bg-[#0b0b0b]/92 px-8 py-2.5 text-center shadow-[0_0_25px_rgba(239,38,53,0.6)] backdrop-blur-md">
            <span className="font-mono text-xs sm:text-sm font-black tracking-[0.25em] text-[#ef2635] uppercase drop-shadow-md">
              EVENT ENDED
            </span>
          </div>
        </div>
      )}

      {/* Left Graphic Canvas */}
      <div className="relative md:w-1/2 min-h-[220px] md:min-h-[260px] bg-card-grid p-6 flex flex-col justify-between overflow-hidden border-b md:border-b-0 md:border-r border-white/10">
        
        {/* Top Badges */}
        <div className="flex items-center space-x-2 z-10">
          <span className="px-2.5 py-1 rounded-sm text-[10px] font-mono font-bold uppercase bg-red-accent text-white">
            {displayCategory}
          </span>
          <span className="px-2.5 py-1 rounded-sm text-[10px] font-mono font-bold uppercase bg-[#18181f] text-zinc-300 border border-zinc-700/60">
            {event.locationType || event.format || 'ONLINE'}
          </span>
        </div>

        {/* Diagonal Ray Line overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <div className="w-[200%] h-[1px] bg-red-accent transform -rotate-45 translate-y-28 -translate-x-12" />
        </div>

        {/* Bottom Tag inside graphic */}
        <div className="z-10 flex items-center justify-between text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
          <span>{isEnded ? 'REGISTRATION CLOSED' : 'REGISTRATION OPEN'}</span>
          {registered && <span className="text-emerald-400 font-bold">✓ REGISTERED</span>}
        </div>

      </div>

      {/* Right Details Panel */}
      <div className="md:w-1/2 p-6 sm:p-8 flex flex-col justify-between space-y-4 bg-[#09090c]">
        
        <div>
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 tracking-wider">
            <span>{event.date?.toUpperCase()}</span>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleShare}
                title="Share Direct URL Link"
                className="p-1 text-zinc-400 hover:text-white transition cursor-pointer z-20 relative"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              </button>
              <ArrowUpRight className="w-4 h-4 text-red-accent group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>

          <h3 className="text-2xl font-bold text-white group-hover:text-red-accent transition-colors font-outfit mt-2">
            {event.title}
          </h3>

          <p className="text-xs text-zinc-400 mt-2 line-clamp-3 leading-relaxed font-normal">
            {event.tagline || event.description}
          </p>
        </div>

        {/* Date & Location Footer */}
        <div className="pt-4 border-t border-white/10 flex flex-wrap items-center gap-5 text-[11px] font-mono text-zinc-400">
          <div className="flex items-center space-x-1.5">
            <Calendar className="w-3.5 h-3.5 text-red-accent" />
            <span>{event.date}</span>
          </div>

          <div className="flex items-center space-x-1.5 truncate">
            <MapPin className="w-3.5 h-3.5 text-red-accent shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>
        </div>

      </div>

    </Link>
  );
}
