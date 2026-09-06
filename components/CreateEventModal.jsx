import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useEvents } from '../context/EventContext';
import { CATEGORIES } from '../mockData';
import { X, Lock, ShieldAlert, Users, Image, Calendar, MapPin, Award, Plus, Trash2, HelpCircle } from 'lucide-react';

export default function CreateEventModal() {
  const { currentUser, isAdmin } = useAuth();
  const { createEventModalOpen, setCreateEventModalOpen, createEvent, showToast } = useEvents();

  // Basic Info
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [category, setCategory] = useState('HACKATHON');
  const [badge, setBadge] = useState('LIVE HACKATHON');

  // Dates & Timings
  const [date, setDate] = useState('June 29 - July 20, 2026');
  const [deadlineDate, setDeadlineDate] = useState('June 28, 2026');
  const [time, setTime] = useState('18:30 - 21:30 IST');

  // Location & Venue (TBA required ONLY for IN PERSON and HYBRID)
  const [locationType, setLocationType] = useState('ONLINE');
  const [isTBA, setIsTBA] = useState(false);
  const [location, setLocation] = useState('TechZen Platform / Online Stream');

  // Team & Capacity
  const [capacity, setCapacity] = useState('500');
  const [maxTeamSize, setMaxTeamSize] = useState('4');
  const [maxTeams, setMaxTeams] = useState('50');
  const [allowSolo, setAllowSolo] = useState(true);
  const [prizePool, setPrizePool] = useState('$5,000 Cash + Vouchers & Swag');

  // Media Posters & Banners
  const [coverImage, setCoverImage] = useState('/operation-cipher.png');
  const [bannerImage, setBannerImage] = useState('');
  const [sponsorLogo, setSponsorLogo] = useState('');

  // Detailed Text
  const [description, setDescription] = useState('');
  const [tracks, setTracks] = useState('Software Track, Hardware Track');
  const [rules, setRules] = useState('');
  const [tags, setTags] = useState('Hackathon, Code, Prizes');

  if (!createEventModalOpen) return null;

  const handleLocationTypeChange = (newType) => {
    setLocationType(newType);
    if (newType === 'ONLINE') {
      setIsTBA(false);
      setLocation('TechZen Platform / Online Stream');
    } else if (newType === 'IN PERSON' || newType === 'HYBRID') {
      if (location === 'TechZen Platform / Online Stream') {
        setLocation('Main Campus Auditorium');
      }
    }
  };

  const handleTBAToggle = (e) => {
    const checked = e.target.checked;
    setIsTBA(checked);
    if (checked) {
      setLocation('TBA (To Be Announced)');
    } else {
      setLocation('Main Campus Auditorium');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!isAdmin) {
      showToast('🔒 Event posting is restricted to Admin accounts', 'info');
      setCreateEventModalOpen(false);
      return;
    }

    const finalLocation = (locationType !== 'ONLINE' && isTBA) ? 'TBA (To Be Announced)' : location;

    createEvent({
      title,
      tagline,
      category,
      badge,
      date,
      deadlineDate,
      time,
      locationType,
      location: finalLocation,
      capacity: parseInt(capacity) || 500,
      maxTeamSize: parseInt(maxTeamSize) || 4,
      maxTeams: parseInt(maxTeams) || 50,
      allowSolo: allowSolo,
      prizePool,
      coverImage: coverImage || '/operation-cipher.png',
      bannerImage,
      sponsorLogo,
      description,
      tracks: tracks ? tracks.split(',').map(t => t.trim()) : [],
      rules,
      tags
    }, currentUser);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#08080a]/90 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl my-auto bg-[#0c0c0e] border border-white/15 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={() => setCreateEventModalOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8 space-y-6 max-h-[85vh] overflow-y-auto">
          
          <div>
            <div className="text-xs font-mono font-bold text-[#ef2635] mb-1 uppercase flex items-center gap-1.5">
              <Lock className="w-4 h-4" /> OFFICIAL ADMIN EVENT PUBLISHER
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white font-mono uppercase">Detailed Event Publishing Studio</h2>
            <p className="text-xs text-slate-400 mt-1">
              Publish comprehensive event posts with custom posters, dates, venue settings, track rules, and team limits.
            </p>
          </div>

          {!isAdmin ? (
            <div className="p-6 rounded-xl bg-amber-950/40 border border-amber-800/40 text-amber-200 text-xs space-y-3">
              <div className="flex items-center space-x-2 text-sm font-bold text-amber-400">
                <ShieldAlert className="w-5 h-5" />
                <span>Admin Authorization Required</span>
              </div>
              <p>
                Events can only be published by official TechZen admin accounts.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 text-xs font-mono">
              
              {/* SECTION 1: BASIC IDENTIFICATION */}
              <div className="p-4 border border-white/10 bg-[#121216] rounded-xl space-y-4">
                <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2 text-[#ef2635]">
                  <span>1. Basic Event Details</span>
                </h3>

                <div>
                  <label className="block text-white/70 mb-1 font-semibold">Event Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Operation Cipher 2026 / Hackathon"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-black/60 border border-white/15 px-3.5 py-2.5 text-white outline-none focus:border-[#ef2635]"
                  />
                </div>

                <div>
                  <label className="block text-white/70 mb-1 font-semibold">Tagline / Short Subtitle</label>
                  <input
                    type="text"
                    placeholder="e.g. THE PLAN. THE CODE. THE ESCAPE."
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    className="w-full bg-black/60 border border-white/15 px-3.5 py-2 text-white outline-none focus:border-[#ef2635]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-white/70 mb-1 font-semibold">Category *</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-black/60 border border-white/15 px-3 py-2 text-white bg-[#111115]"
                    >
                      {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-white/70 mb-1 font-semibold">Badge Tag</label>
                    <input
                      type="text"
                      placeholder="LIVE HACKATHON"
                      value={badge}
                      onChange={(e) => setBadge(e.target.value)}
                      className="w-full bg-black/60 border border-white/15 px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-white/70 mb-1 font-semibold">Prize Pool Details</label>
                    <input
                      type="text"
                      placeholder="$5,000 Cash + Swag"
                      value={prizePool}
                      onChange={(e) => setPrizePool(e.target.value)}
                      className="w-full bg-black/60 border border-white/15 px-3 py-2 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: DATES, TIMINGS & VENUE */}
              <div className="p-4 border border-white/10 bg-[#121216] rounded-xl space-y-4">
                <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2 text-[#ef2635]">
                  <Calendar size={16} />
                  <span>2. Dates, Timings & Venue Settings</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-white/70 mb-1 font-semibold">Event Dates *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. June 29 - July 20, 2026"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-black/60 border border-white/15 px-3.5 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-white/70 mb-1 font-semibold">Registration Deadline</label>
                    <input
                      type="text"
                      placeholder="e.g. June 28, 2026"
                      value={deadlineDate}
                      onChange={(e) => setDeadlineDate(e.target.value)}
                      className="w-full bg-black/60 border border-white/15 px-3.5 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-white/70 mb-1 font-semibold">Event Time / Schedule</label>
                    <input
                      type="text"
                      placeholder="e.g. 18:30 - 21:30 IST"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full bg-black/60 border border-white/15 px-3.5 py-2 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white/70 mb-1 font-semibold">Location Format</label>
                      <select
                        value={locationType}
                        onChange={(e) => handleLocationTypeChange(e.target.value)}
                        className="w-full bg-black/60 border border-white/15 px-3 py-2 text-white bg-[#111115]"
                      >
                        <option value="ONLINE">💻 ONLINE</option>
                        <option value="IN PERSON">📍 IN PERSON</option>
                        <option value="HYBRID">🌐 HYBRID</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-white/70 mb-1 font-semibold">
                        {locationType === 'ONLINE' ? 'Online Platform / Link' : 'Venue / Physical Address'}
                      </label>
                      <input
                        type="text"
                        disabled={locationType !== 'ONLINE' && isTBA}
                        placeholder={locationType === 'ONLINE' ? 'TechZen Platform / Online Stream' : 'San Francisco Campus Auditorium'}
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className={`w-full bg-black/60 border border-white/15 px-3.5 py-2 text-white ${
                          locationType !== 'ONLINE' && isTBA ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      />
                    </div>
                  </div>

                  {/* TBA Checkbox Toggle ONLY shown for IN PERSON and HYBRID modes */}
                  {locationType !== 'ONLINE' && (
                    <label className="inline-flex items-center gap-2 text-xs text-amber-400 font-bold cursor-pointer bg-amber-950/40 p-2.5 rounded border border-amber-800/40">
                      <input
                        type="checkbox"
                        checked={isTBA}
                        onChange={handleTBAToggle}
                        className="accent-[#ef2635] w-4 h-4 cursor-pointer"
                      />
                      <span>Set Physical Venue as "TBA (To Be Announced)"</span>
                    </label>
                  )}
                </div>
              </div>

              {/* SECTION 3: POSTERS, BANNERS & MEDIA */}
              <div className="p-4 border border-white/10 bg-[#121216] rounded-xl space-y-4">
                <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2 text-[#ef2635]">
                  <Image size={16} />
                  <span>3. Posters, Banners & Media Artwork</span>
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-white/70 mb-1 font-semibold">Cover Poster Image URL *</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        placeholder="/operation-cipher.png or https://..."
                        value={coverImage}
                        onChange={(e) => setCoverImage(e.target.value)}
                        className="w-full bg-black/60 border border-white/15 px-3.5 py-2 text-white"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-white/40">Presets:</span>
                      <button type="button" onClick={() => setCoverImage('/operation-cipher.png')} className="text-[#ef2635] underline hover:text-white">Operation Cipher Poster</button>
                      <button type="button" onClick={() => setCoverImage('/quizverse.png')} className="text-[#ef2635] underline hover:text-white">QuizVerse Poster</button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white/70 mb-1 font-semibold">Header Banner Image (Optional)</label>
                      <input
                        type="text"
                        placeholder="https://..."
                        value={bannerImage}
                        onChange={(e) => setBannerImage(e.target.value)}
                        className="w-full bg-black/60 border border-white/15 px-3.5 py-2 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-white/70 mb-1 font-semibold">Sponsor Logo URL (Optional)</label>
                      <input
                        type="text"
                        placeholder="https://..."
                        value={sponsorLogo}
                        onChange={(e) => setSponsorLogo(e.target.value)}
                        className="w-full bg-black/60 border border-white/15 px-3.5 py-2 text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 4: TEAM SIZE & TRACKS */}
              <div className="p-4 border border-[#ef2635]/30 bg-[#141012] rounded-xl space-y-4">
                <h3 className="text-sm font-bold text-[#ef2635] uppercase flex items-center gap-2">
                  <Users size={16} />
                  <span>4. Team Limits & Custom Tracks</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/70 mb-1 font-semibold">Allow Solo Participants? *</label>
                    <select
                      value={allowSolo ? 'yes' : 'no'}
                      onChange={(e) => setAllowSolo(e.target.value === 'yes')}
                      className="w-full bg-black/80 border border-[#ef2635]/50 px-3 py-2 text-white font-bold"
                    >
                      <option value="yes">YES — Allow Solo Participants (1 to Max Limit)</option>
                      <option value="no">NO — Teams Only (2 to Max Limit Selected)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-white/70 mb-1 font-semibold">Max Team Size Allowed *</label>
                    <select
                      value={maxTeamSize}
                      onChange={(e) => setMaxTeamSize(e.target.value)}
                      className="w-full bg-black/80 border border-[#ef2635]/50 px-3 py-2 text-white font-bold"
                    >
                      <option value="1">1 Member (Solo Only)</option>
                      <option value="2">Up to 2 Members</option>
                      <option value="3">Up to 3 Members</option>
                      <option value="4">Up to 4 Members (Default)</option>
                      <option value="5">Up to 5 Members</option>
                      <option value="6">Up to 6 Members</option>
                      <option value="8">Up to 8 Members</option>
                      <option value="10">Up to 10 Members</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-white/70 mb-1 font-semibold">Maximum Allowed Teams *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="e.g. 50"
                      value={maxTeams}
                      onChange={(e) => setMaxTeams(e.target.value)}
                      className="w-full bg-black/80 border border-[#ef2635]/50 px-3.5 py-2 text-white font-bold"
                    />
                    <p className="text-[10px] text-white/40 mt-1">Admin limit on total registered teams for event & PPT submission.</p>
                  </div>

                  <div>
                    <label className="block text-white/70 mb-1 font-semibold">Individual Capacity *</label>
                    <input
                      type="text"
                      required
                      placeholder="500"
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value)}
                      className="w-full bg-black/60 border border-white/15 px-3.5 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-white/70 mb-1 font-semibold">Tracks Available</label>
                    <input
                      type="text"
                      placeholder="Software Track, Hardware Track"
                      value={tracks}
                      onChange={(e) => setTracks(e.target.value)}
                      className="w-full bg-black/60 border border-white/15 px-3.5 py-2 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 5: DETAILED OVERVIEW & RULES */}
              <div className="p-4 border border-white/10 bg-[#121216] rounded-xl space-y-4">
                <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2 text-[#ef2635]">
                  <span>5. Comprehensive Description & Rules</span>
                </h3>

                <div>
                  <label className="block text-white/70 mb-1 font-semibold">Full Event Overview / Blueprint *</label>
                  <textarea
                    rows={5}
                    required
                    placeholder="Provide complete breakdown, timeline, track guidelines, and prizes..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-black/60 border border-white/15 px-3.5 py-2 text-white resize-none"
                  />
                </div>

                <div>
                  <label className="block text-white/70 mb-1 font-semibold">Prerequisites & Rules (Optional)</label>
                  <textarea
                    rows={3}
                    placeholder="Enter submission guidelines, negative marking rules for quiz, etc."
                    value={rules}
                    onChange={(e) => setRules(e.target.value)}
                    className="w-full bg-black/60 border border-white/15 px-3.5 py-2 text-white resize-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 px-6 rounded-xl bg-[#ef2635] hover:bg-[#ff3d4b] text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-red-600/30 transition cursor-pointer"
              >
                🚀 Publish Detailed Event Live
              </button>

            </form>
          )}

        </div>
      </div>
    </div>
  );
}
