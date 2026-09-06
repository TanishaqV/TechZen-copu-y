import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useEvents } from '../context/EventContext';
import { INITIAL_EVENTS } from '../mockData';
import { getSavedProfileDefaults, saveProfileDefaults } from '../utils/userDefaults';
import { X, Calendar, MapPin, Share2, Download, Ticket, Copy, Check, Send, Users, User, Code, Plus, Trash2, ShieldCheck } from 'lucide-react';

export default function EventDetailModal() {
  const { currentUser, openAuth } = useAuth();
  const { 
    events, 
    selectedEventId, 
    setSelectedEventId, 
    registerForEvent, 
    isUserRegistered, 
    getUserRegistrations,
    setActiveTicket,
    showToast 
  } = useEvents();

  const [activeTab, setActiveTab] = useState('event'); // 'event' | 'team' | 'project'
  const [answers, setAnswers] = useState({});
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // About Me State
  const [userProfile, setUserProfile] = useState(() => {
    const defs = getSavedProfileDefaults();
    return {
      fullName: defs.fullName || '',
      email: '',
      github: '',
      college: defs.college || '',
      role: defs.role || ''
    };
  });

  // Teammates State
  const [teamName, setTeamName] = useState('');
  const [teammates, setTeammates] = useState([
    { id: 1, name: '', email: '', role: 'Team Lead (You)' }
  ]);

  // Project Submission State
  const [projectSubmission, setProjectSubmission] = useState({
    track: 'Software Track',
    title: '',
    tagline: '',
    repoUrl: '',
    demoUrl: '',
    techStack: '',
    description: '',
    submittedAt: null
  });

  const [teamSaved, setTeamSaved] = useState(false);
  const [projectSaved, setProjectSaved] = useState(false);

  useEffect(() => {
    if (selectedEventId && currentUser) {
      const defs = getSavedProfileDefaults();
      setUserProfile({
        fullName: currentUser.name || defs.fullName || '',
        email: currentUser.email || '',
        github: currentUser.github || 'https://github.com/',
        college: currentUser.college || defs.college || 'TechZen Institute',
        role: currentUser.role || defs.role || 'Member'
      });

      setTeammates([
        { id: 1, name: currentUser.name || 'You', email: currentUser.email || '', role: 'Team Lead' }
      ]);

      const savedDataKey = `techzen_event_submission_${selectedEventId}_${currentUser.id}`;
      const savedData = localStorage.getItem(savedDataKey);
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          if (parsed.teamName) setTeamName(parsed.teamName);
          if (parsed.teammates && parsed.teammates.length) setTeammates(parsed.teammates);
          if (parsed.project) setProjectSubmission(parsed.project);
          if (parsed.userProfile) setUserProfile(parsed.userProfile);
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [selectedEventId, currentUser]);

  if (!selectedEventId) return null;

  // Robust fallback resolution
  const event = (events || []).find(e => e.id === selectedEventId) || 
                INITIAL_EVENTS.find(e => e.id === selectedEventId) || {
    id: selectedEventId,
    title: selectedEventId === 'operation-cipher-2026' ? 'Operation Cipher 2026' : 'TechZen QuizVerse 2026',
    category: selectedEventId === 'operation-cipher-2026' ? 'HACKATHON' : 'QUIZ',
    badge: selectedEventId === 'operation-cipher-2026' ? 'LIVE HACKATHON' : 'QUIZ',
    format: 'ONLINE',
    locationType: 'ONLINE',
    location: 'National Level Online • Powered by Unstop',
    date: selectedEventId === 'operation-cipher-2026' ? 'June 29 - July 20, 2026' : 'May 12, 2026',
    time: selectedEventId === 'operation-cipher-2026' ? 'National Level Hackathon' : '30 Minutes • 30 MCQs',
    capacity: 500,
    rsvpCount: 480,
    coverImage: selectedEventId === 'operation-cipher-2026' ? '/operation-cipher.png' : '/quizverse.png',
    description: selectedEventId === 'operation-cipher-2026' 
      ? `THE PLAN. THE CODE. THE ESCAPE.\nTechZen Presents: OPERATION CIPHER — A Money Heist Themed National Level Hackathon. Powered by Unstop.\n\nheist_blueprint.sh\ncipher@techzen:~$ ./initiate_heist.sh\n[*] Connecting to TechZen Indian Hackathon Node...\n[OK] SYSTEM SECURED. ROUND 1 DETAILS LOADED:\n-> Tracks: Software Track & Hardware Track\n-> Team size: 1-4 members (Individual or Team)\n-> Location: National Level Online Hackathon\n\n💻 Software Track\nBuild web/app systems, AI bots, blockchain ledgers, or cloud security tools.\n\n⚙️ Hardware Track\nDevelop IoT, smart robots, embedded devices, or firmware controllers.\n\n🏆 Prizes & Goodies\nPrizes worth Cash + Goodies + Developer Vouchers for top performers.\n\n📜 E-Certificates\nOfficial certified credentials powered by TruScholar for all participants.`
      : `TECHZEN PRESENTS: QUIZVERSE 2026\nTHINK. ANSWER. CONQUER.\n\n⏱️ 30 Minutes Quiz Duration\n🧠 30 MCQs on Core CS & Hardware Prototyping\n💡 No Negative Marking\n👥 Open to All Students\n🏆 Exciting Prizes & E-Certificates`
  };

  const isQuizEvent = (event.category || '').toLowerCase().includes('quiz') || 
                      (event.badge || '').toLowerCase().includes('quiz') || 
                      (event.title || '').toLowerCase().includes('quiz');

  const registered = isUserRegistered(event.id, currentUser?.id);
  const userTicket = registered ? getUserRegistrations(currentUser?.id).find(r => r.eventId === event.id) : null;
  const shareableUrl = `${window.location.origin}${window.location.pathname}#event/${event.id}`;

  const closeModal = () => {
    setSelectedEventId(null);
    if (window.location.hash.startsWith('#event/')) {
      window.location.hash = '';
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopiedLink(true);
    showToast('Direct event URL copied!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleQuestionChange = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
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

  // Teammates Handlers
  const addTeammate = () => {
    if (teammates.length >= 4) {
      showToast('Maximum 4 team members allowed!');
      return;
    }
    setTeammates(prev => [
      ...prev,
      { id: Date.now(), name: '', email: '', role: 'Member' }
    ]);
  };

  const removeTeammate = (id) => {
    if (teammates.length <= 1) {
      showToast('You must have at least 1 member (yourself).');
      return;
    }
    setTeammates(prev => prev.filter(t => t.id !== id));
  };

  const updateTeammate = (id, field, value) => {
    setTeammates(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const handleSaveTeamDetails = (e) => {
    e?.preventDefault();
    if (!currentUser) {
      openAuth('login');
      return;
    }

    const payload = {
      teamName: teamName || `${userProfile.fullName || 'TechZen'}'s Team`,
      teammates,
      userProfile,
      project: projectSubmission
    };

    const savedDataKey = `techzen_event_submission_${event.id}_${currentUser.id}`;
    localStorage.setItem(savedDataKey, JSON.stringify(payload));
    saveProfileDefaults({
      college: userProfile.college,
      fullName: userProfile.fullName,
      role: userProfile.role
    });
    setTeamSaved(true);
    showToast('✅ Team details saved successfully!');
    setTimeout(() => setTeamSaved(false), 3000);

    if (!isQuizEvent) {
      setActiveTab('project');
    }
  };

  // Save Submission Handler for Hackathons
  const handleSaveSubmission = (e) => {
    e.preventDefault();
    if (!currentUser) {
      openAuth('login');
      return;
    }

    const payload = {
      teamName: teamName || `${userProfile.fullName || 'TechZen'}'s Team`,
      teammates,
      userProfile,
      project: {
        ...projectSubmission,
        submittedAt: new Date().toISOString()
      }
    };

    const savedDataKey = `techzen_event_submission_${event.id}_${currentUser.id}`;
    localStorage.setItem(savedDataKey, JSON.stringify(payload));
    setProjectSubmission(prev => ({ ...prev, submittedAt: payload.project.submittedAt }));
    setProjectSaved(true);
    showToast('✅ Project & Team details saved successfully!');
    setTimeout(() => setProjectSaved(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#08080a]/90 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl my-auto bg-[#0c0c0e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={closeModal}
          className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-black/70 text-slate-300 hover:text-white transition border border-white/10 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Banner Header */}
        <div className="relative h-52 sm:h-60 w-full bg-card-grid p-6 sm:p-8 flex flex-col justify-end border-b border-white/10 overflow-hidden">
          {event.coverImage || event.imageUrl ? (
            <img 
              src={event.coverImage || event.imageUrl} 
              alt={event.title}
              className="absolute inset-0 w-full h-full object-cover opacity-50" 
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0e] via-[#0c0c0e]/75 to-transparent" />

          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded text-[10px] font-mono font-bold bg-red-accent text-white uppercase">
                {event.badge || event.category}
              </span>
              <span className="px-2.5 py-1 rounded text-[10px] font-mono font-bold bg-[#18181f] text-slate-300 border border-white/10 uppercase">
                {event.locationType || 'ONLINE'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white font-outfit leading-tight">
              {event.title}
            </h1>
            <p className="text-xs text-slate-300 mt-1 line-clamp-2">
              {event.tagline || event.description}
            </p>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex border-b border-white/10 bg-[#09090b] px-4 sm:px-8 space-x-1 sm:space-x-4 font-mono text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('event')}
            className={`py-3.5 px-3 sm:px-5 font-bold transition flex items-center space-x-2 border-b-2 cursor-pointer ${
              activeTab === 'event' 
                ? 'border-[#ef2635] text-white bg-white/[0.03]' 
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4 text-red-accent" />
            <span>Event Info & RSVP</span>
          </button>

          <button
            onClick={() => setActiveTab('team')}
            className={`py-3.5 px-3 sm:px-5 font-bold transition flex items-center space-x-2 border-b-2 cursor-pointer ${
              activeTab === 'team' 
                ? 'border-[#ef2635] text-white bg-white/[0.03]' 
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 text-red-accent" />
            <span>About Me & Teammates</span>
          </button>

          {/* Show Project Submission tab ONLY for Hackathons & Workshops, NOT for Quiz */}
          {!isQuizEvent && (
            <button
              onClick={() => setActiveTab('project')}
              className={`py-3.5 px-3 sm:px-5 font-bold transition flex items-center space-x-2 border-b-2 cursor-pointer ${
                activeTab === 'project' 
                  ? 'border-[#ef2635] text-white bg-white/[0.03]' 
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Code className="w-4 h-4 text-red-accent" />
              <span>Project Submission</span>
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[65vh] overflow-y-auto">
          
          {/* TAB 1: EVENT INFO & RSVP */}
          {activeTab === 'event' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-[#121217] border border-red-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-mono font-bold text-red-accent flex items-center">
                    <Share2 className="w-4 h-4 mr-1.5" /> SHAREABLE EVENT URL
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Share this link with your tech community for direct event registration.
                  </p>
                </div>
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <input
                    type="text"
                    readOnly
                    value={shareableUrl}
                    className="text-xs bg-[#08080a] border border-white/10 rounded-lg px-3 py-2 text-slate-300 font-mono flex-1 sm:w-60 truncate focus:outline-none"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-3 py-2 rounded-lg bg-red-accent hover:bg-red-600 text-white font-bold text-xs transition shrink-0 flex items-center space-x-1 cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Date & Location Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono text-slate-300">
                <div className="p-4 rounded-xl bg-[#111115] border border-white/10 flex items-start space-x-3">
                  <Calendar className="w-5 h-5 text-red-accent shrink-0" />
                  <div>
                    <span className="text-slate-500 block">DATE & TIME</span>
                    <span className="font-bold text-white text-sm">{event.date}</span>
                    <span className="block text-slate-400 mt-0.5">{event.time}</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#111115] border border-white/10 flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-red-accent shrink-0" />
                  <div>
                    <span className="text-slate-500 block">LOCATION</span>
                    <span className="font-bold text-white text-sm">{event.location}</span>
                    <span className="block text-slate-400 mt-0.5">{event.locationType || 'ONLINE'}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-white font-outfit uppercase">About this Event</h3>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                  {event.description}
                </p>
              </div>

              {/* Registration Section */}
              <div className="p-6 rounded-xl bg-[#111116] border border-red-500/30 space-y-4">
                {registered ? (
                  <div className="text-center py-2 space-y-3">
                    <div className="text-xs font-mono font-bold text-emerald-400 uppercase">✓ YOU ARE REGISTERED FOR THIS EVENT</div>
                    <div className="flex flex-wrap justify-center gap-3 pt-2">
                      <button
                        onClick={() => {
                          if (userTicket) setActiveTicket(userTicket);
                        }}
                        className="px-5 py-2.5 rounded-lg bg-red-accent hover:bg-red-600 text-white font-bold text-xs uppercase tracking-wider transition flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Ticket className="w-4 h-4" />
                        <span>View Ticket Pass</span>
                      </button>

                      <button
                        onClick={() => setActiveTab('team')}
                        className="px-4 py-2.5 rounded-lg bg-[#1a1a24] hover:bg-[#252533] text-white font-bold text-xs border border-white/15 transition flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Users className="w-4 h-4 text-red-accent" />
                        <span>Fill Team Details</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div>
                        <h3 className="text-sm font-bold text-white font-outfit uppercase">Reserve Your Spot</h3>
                        <p className="text-xs text-slate-400">Instant RSVP & ticket generation.</p>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                        FREE RSVP
                      </span>
                    </div>

                    <form onSubmit={handleRegistration} className="space-y-3">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 px-6 rounded-lg bg-red-accent hover:bg-red-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-500/25 transition flex items-center justify-center space-x-2 cursor-pointer"
                      >
                        <Send className="w-4 h-4" />
                        <span>{currentUser ? (isSubmitting ? 'Generating Pass...' : 'Confirm RSVP & Get Ticket') : 'Sign In to Register'}</span>
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: ABOUT ME & TEAMMATES */}
          {activeTab === 'team' && (
            <div className="space-y-6">
              
              {/* Profile Card */}
              <div className="p-5 rounded-xl bg-[#111115] border border-white/10 space-y-4">
                <div className="flex items-center space-x-2 border-b border-white/10 pb-3">
                  <User className="w-4 h-4 text-red-accent" />
                  <h3 className="text-sm font-bold text-white uppercase font-mono">1. About Me (Participant Profile)</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={userProfile.fullName}
                      onChange={(e) => setUserProfile(prev => ({ ...prev, fullName: e.target.value }))}
                      placeholder="Your full name"
                      className="w-full px-3 py-2 rounded bg-[#08080a] border border-white/10 text-white focus:outline-none focus:border-red-accent"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 flex items-center justify-between">
                      <span>Email Address</span>
                      <span className="text-[10px] text-white/40 italic">Protected / Locked</span>
                    </label>
                    <input
                      type="email"
                      readOnly
                      value={userProfile.email}
                      onChange={(e) => setUserProfile(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Your email address"
                      className="w-full px-3 py-2 rounded bg-[#08080a] border border-white/10 text-white/40 cursor-not-allowed focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Phone / WhatsApp *</label>
                    <div className="flex items-center">
                      <span className="px-3 py-2 rounded-l bg-[#141418] border border-r-0 border-white/10 text-white/60 font-mono text-xs select-none">
                        +91
                      </span>
                      <input
                        type="tel"
                        value={(() => {
                          let p = userProfile.phone || '';
                          if (p.startsWith('+91')) p = p.slice(3);
                          else if (p.length === 12 && p.startsWith('91')) p = p.slice(2);
                          return p;
                        })()}
                        onChange={(e) => {
                          let val = e.target.value;
                          if (val.startsWith('+91')) val = val.slice(3);
                          else if (val.length === 12 && val.startsWith('91')) val = val.slice(2);
                          val = val.replace(/\D/g, '').slice(0, 10);
                          setUserProfile(prev => ({ ...prev, phone: val }));
                          saveProfileDefaults({ phone: val });
                        }}
                        placeholder="9876543210"
                        maxLength={10}
                        className="w-full px-3 py-2 rounded-r bg-[#08080a] border border-white/10 text-white focus:outline-none focus:border-red-accent font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">College / Organization</label>
                    <input
                      type="text"
                      value={userProfile.college}
                      onChange={(e) => setUserProfile(prev => ({ ...prev, college: e.target.value }))}
                      placeholder="College or Company"
                      className="w-full px-3 py-2 rounded bg-[#08080a] border border-white/10 text-white focus:outline-none focus:border-red-accent"
                    />
                  </div>
                </div>
              </div>

              {/* Teammates Card */}
              <div className="p-5 rounded-xl bg-[#111115] border border-white/10 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-red-accent" />
                    <h3 className="text-sm font-bold text-white uppercase font-mono">2. Teammates (1 - 4 Members)</h3>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {teammates.length} / 4 Members
                  </span>
                </div>

                {/* Team Name Input */}
                <div className="text-xs">
                  <label className="block text-slate-400 mb-1 font-semibold">Team Name</label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="Enter your Team Name (e.g., Quiz Masters)"
                    className="w-full px-3.5 py-2.5 rounded bg-[#08080a] border border-red-500/30 text-white font-mono text-xs focus:outline-none"
                  />
                </div>

                {/* Teammates List */}
                <div className="space-y-3 pt-2">
                  {teammates.map((member, index) => (
                    <div key={member.id} className="p-3.5 rounded-lg bg-[#09090c] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                      <span className="font-mono font-bold text-red-accent shrink-0">
                        Member #{index + 1}
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1 w-full">
                        <input
                          type="text"
                          value={member.name}
                          onChange={(e) => updateTeammate(member.id, 'name', e.target.value)}
                          placeholder="Member Name"
                          className="px-2.5 py-1.5 rounded bg-[#111115] border border-white/10 text-white text-xs"
                        />
                        <input
                          type="email"
                          value={member.email}
                          onChange={(e) => updateTeammate(member.id, 'email', e.target.value)}
                          placeholder="Member Email"
                          className="px-2.5 py-1.5 rounded bg-[#111115] border border-white/10 text-white text-xs"
                        />
                        <input
                          type="text"
                          value={member.role}
                          onChange={(e) => updateTeammate(member.id, 'role', e.target.value)}
                          placeholder="Role (e.g., Lead / Participant)"
                          className="px-2.5 py-1.5 rounded bg-[#111115] border border-white/10 text-white text-xs"
                        />
                      </div>

                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => removeTeammate(member.id)}
                          className="p-1.5 rounded text-rose-400 hover:bg-rose-950/50 transition shrink-0 cursor-pointer"
                          title="Remove teammate"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add Teammate Button */}
                {teammates.length < 4 && (
                  <button
                    type="button"
                    onClick={addTeammate}
                    className="w-full py-2.5 px-4 rounded border border-dashed border-white/20 hover:border-red-accent text-slate-300 hover:text-white font-mono text-xs transition flex items-center justify-center space-x-2 bg-white/[0.02] cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-red-accent" />
                    <span>Add Another Teammate (+{4 - teammates.length} slots left)</span>
                  </button>
                )}
              </div>

              {/* Action Button */}
              <div className="flex items-center justify-between pt-2">
                <div className="text-xs font-mono">
                  {teamSaved && (
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                      <Check className="w-4 h-4" /> Team details saved successfully!
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleSaveTeamDetails}
                  className="px-6 py-2.5 rounded-lg bg-red-accent hover:bg-red-600 text-white font-bold text-xs uppercase tracking-wider transition flex items-center space-x-2 cursor-pointer shadow-lg shadow-red-500/20"
                >
                  <Users className="w-4 h-4" />
                  <span>{isQuizEvent ? 'Save Team Details' : 'Proceed to Project Submission'}</span>
                </button>
              </div>

            </div>
          )}

          {/* TAB 3: PROJECT SUBMISSION (Only for Hackathons/Workshops) */}
          {!isQuizEvent && activeTab === 'project' && (
            <form onSubmit={handleSaveSubmission} className="space-y-6">
              
              <div className="p-5 rounded-xl bg-[#111115] border border-white/10 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center space-x-2">
                    <Code className="w-4 h-4 text-red-accent" />
                    <h3 className="text-sm font-bold text-white uppercase font-mono">3. Project Submission Form</h3>
                  </div>
                  {projectSubmission.submittedAt ? (
                    <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                      STATUS: SUBMITTED
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                      STATUS: PENDING DRAFT
                    </span>
                  )}
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Select Track</label>
                    <select
                      value={projectSubmission.track}
                      onChange={(e) => setProjectSubmission(prev => ({ ...prev, track: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded bg-[#08080a] border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-red-accent"
                    >
                      <option value="Software Track">💻 Software Track (AI, Web/Mobile, Cloud, Blockchain)</option>
                      <option value="Hardware Track">⚙️ Hardware Track (IoT, Smart Robots, Embedded Systems)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Project Title *</label>
                    <input
                      type="text"
                      required
                      value={projectSubmission.title}
                      onChange={(e) => setProjectSubmission(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g. CipherGuard AI Fraud Detector"
                      className="w-full px-3.5 py-2.5 rounded bg-[#08080a] border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-red-accent"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">GitHub Repository Link *</label>
                      <input
                        type="url"
                        required
                        value={projectSubmission.repoUrl}
                        onChange={(e) => setProjectSubmission(prev => ({ ...prev, repoUrl: e.target.value }))}
                        placeholder="https://github.com/user/project-repo"
                        className="w-full px-3.5 py-2.5 rounded bg-[#08080a] border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-red-accent"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Live Demo / Video Link</label>
                      <input
                        type="url"
                        value={projectSubmission.demoUrl}
                        onChange={(e) => setProjectSubmission(prev => ({ ...prev, demoUrl: e.target.value }))}
                        placeholder="https://my-demo-app.vercel.app or YouTube"
                        className="w-full px-3.5 py-2.5 rounded bg-[#08080a] border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-red-accent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Tech Stack Used</label>
                    <input
                      type="text"
                      value={projectSubmission.techStack}
                      onChange={(e) => setProjectSubmission(prev => ({ ...prev, techStack: e.target.value }))}
                      placeholder="e.g. React 19, Python, OpenCV, Raspberry Pi, Supabase"
                      className="w-full px-3.5 py-2.5 rounded bg-[#08080a] border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-red-accent"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Full Project Overview & Features</label>
                    <textarea
                      rows={4}
                      value={projectSubmission.description}
                      onChange={(e) => setProjectSubmission(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe how your solution works, key features, and implementation details..."
                      className="w-full px-3.5 py-2.5 rounded bg-[#08080a] border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-red-accent resize-none"
                    />
                  </div>

                </div>
              </div>

              {/* Submit Action */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <div className="text-xs text-slate-400 font-mono">
                  {projectSaved ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                      <Check className="w-4 h-4" /> All details saved successfully to your TechZen account!
                    </span>
                  ) : (
                    <span>Submissions remain editable until jury evaluations begin.</span>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto px-8 py-3 rounded-lg bg-red-accent hover:bg-red-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-500/25 transition flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Submit Project & Team Details</span>
                </button>
              </div>

            </form>
          )}

        </div>

      </div>
    </div>
  );
}
