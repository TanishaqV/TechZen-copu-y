import React from 'react';
import { useEvents } from '../context/EventContext';
import { X, Ticket, Calendar, MapPin, QrCode, Download, Printer, CheckCircle2 } from 'lucide-react';

export default function TicketModal() {
  const { activeTicket, setActiveTicket, events, downloadCalendarFile, showToast } = useEvents();

  if (!activeTicket) return null;

  const event = events.find(e => e.id === activeTicket.eventId);
  if (!event) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#08080a]/90 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-md bg-[#0c0c0e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={() => setActiveTicket(null)}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/70 text-slate-300 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 space-y-5">
          
          <div className="text-center">
            <div className="inline-flex p-2.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 mb-2">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white font-outfit uppercase">Official Digital Pass</h2>
            <p className="text-xs text-slate-400 mt-0.5">Show this QR pass at event check-in.</p>
          </div>

          {/* Ticket Card Container */}
          <div className="rounded-xl border-2 border-red-500/40 bg-[#111116] p-5 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold tracking-wider text-red-accent uppercase">
                  TECHZEN COMMUNITY PASS
                </span>
                <h3 className="text-base font-bold text-white leading-snug mt-0.5">{event.title}</h3>
              </div>
              <div className="p-2 rounded bg-red-accent/20 border border-red-accent/30 text-red-accent shrink-0">
                <Ticket className="w-5 h-5" />
              </div>
            </div>

            <div className="space-y-1 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Attendee:</span>
                <span className="font-bold text-white">{activeTicket.userName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Date:</span>
                <span className="font-semibold text-slate-200">{event.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Pass Code:</span>
                <span className="font-bold text-red-accent">{activeTicket.ticketCode}</span>
              </div>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-white text-slate-900 shadow-inner">
              <QrCode className="w-24 h-24 text-slate-950" />
              <span className="font-mono text-xs font-bold tracking-widest mt-2 text-slate-900">
                {activeTicket.ticketCode}
              </span>
              <span className="text-[9px] text-slate-500 font-mono">SCAN AT ENTRANCE</span>
            </div>

          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={() => downloadCalendarFile(event)}
              className="py-2.5 px-3 rounded-lg bg-[#141419] hover:bg-[#1a1a21] text-slate-200 text-xs font-bold border border-white/10 transition flex items-center justify-center space-x-1"
            >
              <Download className="w-3.5 h-3.5 text-red-accent" />
              <span>Calendar (.ics)</span>
            </button>
            <button
              onClick={handlePrint}
              className="py-2.5 px-3 rounded-lg bg-red-accent hover:bg-red-600 text-white text-xs font-bold uppercase tracking-wider shadow transition flex items-center justify-center space-x-1"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Pass</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
