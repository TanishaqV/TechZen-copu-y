import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useEvents } from '../context/EventContext';
import { User, Mail, Ticket, Calendar, MapPin, Edit3 } from 'lucide-react';

export default function UserProfile() {
  const { currentUser, updateUserProfile } = useAuth();
  const { events, getUserRegistrations, setActiveTicket, setSelectedEventId, showToast } = useEvents();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentUser?.name || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [techStack, setTechStack] = useState(currentUser?.techStack?.join(', ') || '');

  if (!currentUser) return null;

  const registrations = getUserRegistrations(currentUser.id);

  const handleSave = (e) => {
    e.preventDefault();
    updateUserProfile({
      name,
      bio,
      techStack: techStack.split(',').map(s => s.trim())
    });
    setIsEditing(false);
    showToast('Profile updated!');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fadeIn">
      
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#0c0c0e] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        
        <div className="flex items-center space-x-5">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-16 h-16 rounded-full border-2 border-red-accent object-cover shadow-xl"
          />
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-extrabold text-white font-outfit">{currentUser.name}</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-accent text-white uppercase">
                {currentUser.role}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center">
              <Mail className="w-3.5 h-3.5 mr-1 text-slate-400" /> {currentUser.email}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsEditing(!isEditing)}
          className="px-4 py-2 rounded-lg bg-[#141419] hover:bg-[#1a1a21] text-slate-200 font-bold text-xs border border-white/10 transition flex items-center space-x-1.5 shrink-0"
        >
          <Edit3 className="w-4 h-4 text-red-accent" />
          <span>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
        </button>

      </div>

      {/* Profile Edit Form */}
      {isEditing && (
        <div className="p-6 rounded-2xl bg-[#0c0c0e] border border-red-500/30 space-y-4">
          <h3 className="text-sm font-bold text-white font-outfit uppercase">Edit Profile</h3>
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl tech-input text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Tech Stack</label>
              <input
                type="text"
                value={techStack}
                onChange={(e) => setTechStack(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl tech-input text-xs"
              />
            </div>
            <button
              type="submit"
              className="py-2 px-4 rounded-lg bg-red-accent hover:bg-red-600 text-white font-bold text-xs uppercase tracking-wider shadow transition"
            >
              Save Changes
            </button>
          </form>
        </div>
      )}

      {/* Registered Events Passes */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white font-outfit uppercase flex items-center">
          <Ticket className="w-5 h-5 text-red-accent mr-2" /> Registered Event Passes ({registrations.length})
        </h2>

        {registrations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {registrations.map((reg) => {
              const ev = events.find(e => e.id === reg.eventId);
              if (!ev) return null;

              return (
                <div key={reg.id} className="p-5 rounded-xl bg-[#0c0c0e] border border-white/10 flex flex-col justify-between space-y-4 hover:border-red-500/40 transition">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                        CONFIRMED PASS
                      </span>
                      <h3 className="text-base font-bold text-white mt-1.5 font-outfit">{ev.title}</h3>
                    </div>
                    <span className="font-mono text-xs font-bold text-red-accent bg-[#111116] px-2.5 py-1 rounded border border-white/10">
                      {reg.ticketCode}
                    </span>
                  </div>

                  <div className="text-xs font-mono text-slate-300 space-y-1">
                    <div>Date: {ev.date}</div>
                    <div>Location: {ev.location}</div>
                  </div>

                  <div className="flex items-center space-x-2 pt-2 border-t border-white/10">
                    <button
                      onClick={() => setActiveTicket(reg)}
                      className="flex-1 py-2 px-3 rounded-lg bg-red-accent hover:bg-red-600 text-white font-bold text-xs uppercase tracking-wider transition flex items-center justify-center space-x-1.5"
                    >
                      <Ticket className="w-3.5 h-3.5" />
                      <span>View Pass</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedEventId(ev.id);
                        window.location.hash = `event/${ev.id}`;
                      }}
                      className="py-2 px-3 rounded-lg bg-[#141419] text-slate-300 text-xs font-bold border border-white/10 transition"
                    >
                      Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center rounded-2xl bg-[#0c0c0e] border border-white/10 space-y-2">
            <p className="text-xs font-mono text-slate-400">No registered event passes yet.</p>
          </div>
        )}
      </div>

    </div>
  );
}
