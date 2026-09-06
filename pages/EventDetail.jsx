import React, { useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useEvents } from '../context/EventContext';
import { Calendar, MapPin, Share2, Download, Ticket, Copy, Check, Send, Lock, ArrowLeft } from 'lucide-react';

export default function EventDetail() {
  const [, params] = useRoute('/events/:eventId');
  const [, setLocation] = useLocation();
  const { currentUser, openAuth } = useAuth();
  const { events, registerForEvent, isUserRegistered, getUserRegistrations, setActiveTicket, downloadCalendarFile, showToast } = useEvents();

  const [answers, setAnswers] = useState({});
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const eventId = params?.eventId || events[0]?.id;
  const event = events.find(e => e.id === eventId) || events[0];

  if (!event) return null;

  const registered = isUserRegistered(event.id, currentUser?.id);
  const userTicket = registered ? getUserRegistrations(currentUser?.id).find(r => r.eventId === event.id) : null;
  const shareableUrl = `${window.location.origin}/events/${event.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopiedLink(true);
    showToast('Direct event URL copied!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleRegistration = (e) => {
    e.preventDefault();
    if (!currentUser) {
      openAuth('login');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      registerForEvent(event.id, answers, currentUser);
      setIsSubmitting(false);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-slate-100 flex flex-col selection:bg-[#ef2635]">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full animate-enter space-y-8">
        
        {/* Back Link */}
        <button
          onClick={() => setLocation('/')}
          className="inline-flex items-center space-x-2 text-xs font-mono text-zinc-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4 text-red-accent" />
          <span>BACK TO ALL EVENTS</span>
        </button>

        {/* Header Cover Banner */}
        <div className="relative rounded-lg bg-card-grid p-8 sm:p-12 border border-white/15 overflow-hidden">
          <div className="flex space-x-2 mb-3 z-10 relative">
            <span className="px-2.5 py-1 rounded-sm text-[10px] font-mono font-bold bg-red-accent text-white uppercase">
              {event.badge || event.category}
            </span>
            <span className="px-2.5 py-1 rounded-sm text-[10px] font-mono font-bold bg-[#18181f] text-zinc-300 border border-zinc-700/60 uppercase">
              {event.locationType}
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white font-outfit leading-tight z-10 relative">
            {event.title}
          </h1>
          <p className="text-sm text-zinc-300 mt-2 max-w-2xl z-10 relative">
            {event.tagline}
          </p>
        </div>

        {/* Shareable Link Widget */}
        <div className="p-4 rounded-lg bg-[#111111] border border-white/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono font-bold text-red-accent flex items-center">
              <Share2 className="w-4 h-4 mr-1.5" /> DIRECT SHAREABLE EVENT URL
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Share this link with your tech community for direct event registration.
            </p>
          </div>
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <input
              type="text"
              readOnly
              value={shareableUrl}
              className="text-xs bg-[#0b0b0b] border border-white/15 rounded px-3 py-2 text-zinc-300 font-mono flex-1 sm:w-64 truncate focus:outline-none"
            />
            <button
              onClick={handleCopyLink}
              className="px-3.5 py-2 rounded bg-red-accent hover:bg-red-600 text-white font-mono text-xs font-bold transition shrink-0 flex items-center space-x-1"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'COPIED' : 'COPY'}</span>
            </button>
          </div>
        </div>

        {/* Date & Location Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-5 rounded-lg bg-[#111111] border border-white/15 flex items-start space-x-3">
            <Calendar className="w-5 h-5 text-red-accent shrink-0" />
            <div>
              <span className="text-zinc-500 block">DATE & TIME</span>
              <span className="font-bold text-white text-sm">{event.date}</span>
              <span className="block text-zinc-400 mt-0.5">{event.time}</span>
            </div>
          </div>

          <div className="p-5 rounded-lg bg-[#111111] border border-white/15 flex items-start space-x-3">
            <MapPin className="w-5 h-5 text-red-accent shrink-0" />
            <div>
              <span className="text-zinc-500 block">LOCATION</span>
              <span className="font-bold text-white text-sm">{event.location}</span>
              <span className="block text-zinc-400 mt-0.5">{event.locationType}</span>
            </div>
          </div>
        </div>

        {/* Description & Agenda */}
        <div className="p-6 sm:p-8 rounded-lg bg-[#111111] border border-white/15 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-white font-outfit uppercase mb-2">About this Event</h3>
            <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line">
              {event.description}
            </p>
          </div>

          {event.agenda && event.agenda.length > 0 && (
            <div className="pt-4 border-t border-white/10 space-y-3">
              <h4 className="text-xs font-mono font-bold text-red-accent uppercase">Event Schedule</h4>
              <div className="space-y-2">
                {event.agenda.map((item, idx) => (
                  <div key={idx} className="p-3 rounded bg-[#0b0b0b] border border-white/10 flex items-start space-x-3 text-xs">
                    <span className="font-mono font-bold text-red-accent shrink-0">{item.time}</span>
                    <div>
                      <div className="font-bold text-white">{item.title}</div>
                      <div className="text-[11px] text-zinc-400">Speaker: {item.speaker}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Registration Section */}
        <div className="p-6 sm:p-8 rounded-lg bg-[#111111] border border-red-500/30 space-y-4">
          {registered ? (
            <div className="text-center py-4 space-y-3 font-mono">
              <div className="text-xs font-bold text-emerald-400 uppercase">✓ YOU ARE REGISTERED FOR THIS EVENT</div>
              <div className="flex justify-center space-x-3 pt-2">
                <button
                  onClick={() => {
                    if (userTicket) setActiveTicket(userTicket);
                  }}
                  className="px-5 py-2.5 rounded bg-red-accent hover:bg-red-600 text-white font-bold text-xs uppercase tracking-wider transition flex items-center space-x-1.5"
                >
                  <Ticket className="w-4 h-4" />
                  <span>View Digital Ticket Pass</span>
                </button>
                <button
                  onClick={() => downloadCalendarFile(event)}
                  className="px-4 py-2.5 rounded bg-[#191919] text-zinc-200 font-bold text-xs border border-white/15 transition flex items-center space-x-1.5"
                >
                  <Download className="w-4 h-4 text-red-accent" />
                  <span>Export Calendar (.ics)</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <h3 className="text-base font-bold text-white font-outfit uppercase">Reserve Your Spot</h3>
                  <p className="text-xs text-zinc-400">Instant registration & QR ticket code generation.</p>
                </div>
                <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  FREE RSVP
                </span>
              </div>

              {!currentUser && (
                <div className="p-3.5 rounded bg-amber-950/40 border border-amber-800/40 text-amber-200 text-xs flex items-center justify-between">
                  <span>Sign in or register an account to confirm your event RSVP.</span>
                  <button
                    onClick={() => openAuth('login')}
                    className="px-3 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shrink-0 transition"
                  >
                    Sign In Now
                  </button>
                </div>
              )}

              <form onSubmit={handleRegistration} className="space-y-3">
                {event.customQuestions?.map((q) => (
                  <div key={q.id}>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      {q.label} {q.required && <span className="text-red-accent">*</span>}
                    </label>
                    {q.type === 'select' ? (
                      <select
                        required={q.required}
                        value={answers[q.id] || ''}
                        onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                        className="w-full px-3.5 py-2 rounded tech-input text-xs bg-[#191919]"
                      >
                        <option value="">Select option...</option>
                        {q.options.map((opt, i) => (
                          <option key={i} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        required={q.required}
                        placeholder="Your response..."
                        value={answers[q.id] || ''}
                        onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                        className="w-full px-3.5 py-2 rounded tech-input text-xs"
                      />
                    )}
                  </div>
                ))}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-6 rounded bg-red-accent hover:bg-red-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-500/25 transition flex items-center justify-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{currentUser ? (isSubmitting ? 'Generating Pass...' : 'Confirm RSVP & Get Ticket Pass') : 'Sign In to Register'}</span>
                </button>
              </form>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
