import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useEvents } from '../context/EventContext';
import { INITIAL_EVENTS } from '../mockData';
import { 
  Users, Search, Calendar, PlusCircle, CheckCircle2, FileSpreadsheet, Share2, 
  ExternalLink, FileText, Code, Link as LinkIcon, Mail, User, ShieldCheck, ChevronDown, ChevronUp, Copy, Check, Trash2, GraduationCap, Edit3, History, Clock, FileEdit, X, ShieldAlert 
} from 'lucide-react';

export default function HostDashboard() {
  const { currentUser, isAdmin, ADMIN_EMAIL } = useAuth();
  const { events: contextEvents, getEventRegistrations, setCreateEventModalOpen, deleteEvent, showToast } = useEvents();

  const allEvents = (contextEvents && contextEvents.length > 0) ? contextEvents : INITIAL_EVENTS;
  const [selectedDashboardEventId, setSelectedDashboardEventId] = useState(allEvents[0]?.id || 'operation-cipher-2026');
  const [attendeeSearch, setAttendeeSearch] = useState('');
  const [expandedAttendeeId, setExpandedAttendeeId] = useState(null);
  const [copiedLink, setCopiedLink] = useState('');
  
  // Admin view tab: 'roster' or 'audit'
  const [adminTab, setAdminTab] = useState('roster');

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditSearch, setAuditSearch] = useState('');

  // Inline Edit Modal State for participant/team registrations
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({
    teamName: '',
    userName: '',
    userEmail: '',
    pptUrl: '',
    repoUrl: '',
    college: '',
    role: ''
  });

  const selectedEvent = allEvents.find(e => e.id === selectedDashboardEventId) || allEvents[0];
  
  // Combine db registrations with local team/project submissions
  const [combinedRoster, setCombinedRoster] = useState([]);

  // Fetch Audit Logs on Mount
  const fetchAuditLogs = async () => {
    try {
      const res = await fetch('/api/audit-logs');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setAuditLogs(data);
          return;
        }
      }
    } catch (err) {
      console.warn('Audit log fetch notice:', err);
    }

    // LocalStorage fallback for audit logs
    try {
      const savedLogs = localStorage.getItem('techzen_audit_logs');
      if (savedLogs) {
        setAuditLogs(JSON.parse(savedLogs));
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const recordAuditLog = async (action, details, targetUser) => {
    const adminName = currentUser?.name || (currentUser?.email ? currentUser.email.split('@')[0] : 'Admin');
    const adminEmail = currentUser?.email || ADMIN_EMAIL || 'tanishaqvermatechzen@gmail.com';
    const editorFormatted = `${adminName} (Admin) [${adminEmail}]`;

    const newLog = {
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      action,
      details,
      targetUser: targetUser || 'Participant',
      editedBy: editorFormatted,
      timestamp: new Date().toISOString()
    };

    // Save locally
    const updated = [newLog, ...auditLogs];
    setAuditLogs(updated);
    try {
      localStorage.setItem('techzen_audit_logs', JSON.stringify(updated.slice(0, 100)));
    } catch (e) {}

    // Post to server
    try {
      await fetch('/api/audit-logs', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-email': adminEmail
        },
        body: JSON.stringify({
          action,
          details,
          targetUser: targetUser || 'Participant',
          editedBy: editorFormatted
        })
      });
    } catch (err) {
      console.warn('Post audit log notice:', err);
    }
  };

  useEffect(() => {
    if (!selectedEvent) return;

    // 1. Fetch backend registrations for selected event
    const regList = getEventRegistrations(selectedEvent.id) || [];
    
    // 2. Scan localStorage for submission details
    const localSubmissions = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`techzen_event_submission_${selectedEvent.id}`)) {
        try {
          const parsed = JSON.parse(localStorage.getItem(key) || '{}');
          if (parsed && (parsed.teamName || parsed.userProfile?.fullName)) {
            localSubmissions.push(parsed);
          }
        } catch (e) {
          console.error(e);
        }
      }
    }

    // 3. Build roster strictly from real registrations / submissions
    if (regList.length > 0) {
      const mapped = regList.map((reg, idx) => {
        const sub = localSubmissions[idx] || localSubmissions[0] || {};
        return {
          id: reg.id || `reg_${idx}`,
          ticketCode: reg.ticketCode || `TZ-${1000 + idx}`,
          userName: reg.userName || sub.userProfile?.fullName || 'TechZen Participant',
          userEmail: reg.userEmail || sub.userProfile?.email || 'participant@techzen.dev',
          registeredAt: reg.registeredAt || new Date().toISOString(),
          teamName: sub.teamName || `${reg.userName || 'Builder'}'s Team`,
          teammates: sub.teammates || [
            { id: 1, name: reg.userName, email: reg.userEmail, college: sub.userProfile?.college || 'N/A', role: 'Team Lead' }
          ],
          project: sub.project || null
        };
      });
      setCombinedRoster(mapped);
    } else if (localSubmissions.length > 0) {
      const mappedLocals = localSubmissions.map((sub, i) => ({
        id: `local_${i}`,
        ticketCode: `TZ-SUB-${8000 + i}`,
        userName: sub.userProfile?.fullName || 'Submitted Lead',
        userEmail: sub.userProfile?.email || 'user@techzen.dev',
        registeredAt: new Date().toISOString(),
        teamName: sub.teamName || 'Submitted Squad',
        teammates: sub.teammates || [],
        project: sub.project || null
      }));
      setCombinedRoster(mappedLocals);
    } else {
      setCombinedRoster([]);
    }
  }, [selectedEvent, contextEvents, getEventRegistrations]);

  const filteredRoster = combinedRoster.filter(item => {
    const q = attendeeSearch.toLowerCase();
    const matchLead = item.userName.toLowerCase().includes(q) || item.userEmail.toLowerCase().includes(q) || item.ticketCode.toLowerCase().includes(q);
    const matchTeam = item.teamName.toLowerCase().includes(q);
    const matchMembers = item.teammates?.some(m => m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q) || m.college?.toLowerCase().includes(q));
    const matchProject = item.project?.title?.toLowerCase().includes(q) || item.project?.pptUrl?.toLowerCase().includes(q);
    return matchLead || matchTeam || matchMembers || matchProject;
  });

  const filteredAuditLogs = auditLogs.filter(log => {
    const q = auditSearch.toLowerCase();
    return (
      (log.action || '').toLowerCase().includes(q) ||
      (log.details || '').toLowerCase().includes(q) ||
      (log.targetUser || '').toLowerCase().includes(q) ||
      (log.editedBy || '').toLowerCase().includes(q)
    );
  });

  const handleDeleteEventClick = (eventId, eventTitle) => {
    if (window.confirm(`⚠️ ADMIN WARNING:\nAre you sure you want to permanently delete "${eventTitle}"?\n\nThis will remove the event post and all associated attendee registrations from TechZen.`)) {
      recordAuditLog('Event Post Deleted', `Admin deleted event "${eventTitle}" (ID: ${eventId})`, 'Event Catalog');
      deleteEvent(eventId);
      if (selectedDashboardEventId === eventId) {
        const remaining = allEvents.filter(e => e.id !== eventId);
        if (remaining.length > 0) setSelectedDashboardEventId(remaining[0].id);
      }
    }
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setEditForm({
      teamName: item.teamName || '',
      userName: item.userName || '',
      userEmail: item.userEmail || '',
      pptUrl: item.project?.pptUrl || '',
      repoUrl: item.project?.repoUrl || '',
      college: item.teammates?.[0]?.college || '',
      role: item.teammates?.[0]?.role || ''
    });
  };

  const handleSaveRosterEdit = async (e) => {
    e.preventDefault();
    if (!editingItem) return;

    // Track what changed
    const changes = [];
    if (editForm.teamName !== editingItem.teamName) changes.push(`Team Name: "${editingItem.teamName}" → "${editForm.teamName}"`);
    if (editForm.userName !== editingItem.userName) changes.push(`Lead Name: "${editingItem.userName}" → "${editForm.userName}"`);
    if (editForm.userEmail !== editingItem.userEmail) changes.push(`Lead Email: "${editingItem.userEmail}" → "${editForm.userEmail}"`);
    if (editForm.pptUrl !== (editingItem.project?.pptUrl || '')) changes.push(`PPT Deck URL updated`);

    const editDetailsSummary = changes.length > 0 ? changes.join('; ') : 'Participant registration details modified by Admin';

    // Update roster state locally
    const updatedRoster = combinedRoster.map(r => {
      if (r.id === editingItem.id) {
        const updatedTeammates = Array.isArray(r.teammates) ? [...r.teammates] : [];
        if (updatedTeammates[0]) {
          updatedTeammates[0] = {
            ...updatedTeammates[0],
            name: editForm.userName,
            email: editForm.userEmail,
            college: editForm.college || updatedTeammates[0].college
          };
        }
        return {
          ...r,
          teamName: editForm.teamName,
          userName: editForm.userName,
          userEmail: editForm.userEmail,
          teammates: updatedTeammates,
          project: {
            ...r.project,
            pptUrl: editForm.pptUrl,
            repoUrl: editForm.repoUrl
          }
        };
      }
      return r;
    });

    setCombinedRoster(updatedRoster);

    // Record Audit Log Entry
    await recordAuditLog(
      'Registration Edited by Admin',
      editDetailsSummary,
      `${editForm.userName} (${editForm.userEmail})`
    );

    setEditingItem(null);
    showToast('✅ Registration edit saved and recorded in Admin Audit Log!');
  };

  const exportCSV = () => {
    if (!selectedEvent || filteredRoster.length === 0) {
      showToast('No roster entries to export!', 'info');
      return;
    }

    const headers = [
      'Pass Code', 'Team Name', 'Lead Name', 'Lead Email', 
      'Member 1 Name', 'Member 1 Email', 'Member 1 College', 'Member 1 Role',
      'Member 2 Name', 'Member 2 Email', 'Member 2 College', 'Member 2 Role',
      'Member 3 Name', 'Member 3 Email', 'Member 3 College', 'Member 3 Role',
      'Member 4 Name', 'Member 4 Email', 'Member 4 College', 'Member 4 Role',
      'Track', 'Project Title', 'PPT Presentation URL', 'PPT File Name', 'GitHub Repo URL', 'Live Demo URL', 'Tech Stack'
    ];

    const rows = filteredRoster.map(r => {
      const m1 = r.teammates[0] || {};
      const m2 = r.teammates[1] || {};
      const m3 = r.teammates[2] || {};
      const m4 = r.teammates[3] || {};
      const p = r.project || {};

      return [
        r.ticketCode,
        `"${r.teamName}"`,
        `"${r.userName}"`,
        r.userEmail,
        `"${m1.name || ''}"`, m1.email || '', `"${m1.college || 'N/A'}"`, `"${m1.role || ''}"`,
        `"${m2.name || ''}"`, m2.email || '', `"${m2.college || 'N/A'}"`, `"${m2.role || ''}"`,
        `"${m3.name || ''}"`, m3.email || '', `"${m3.college || 'N/A'}"`, `"${m3.role || ''}"`,
        `"${m4.name || ''}"`, m4.email || '', `"${m4.college || 'N/A'}"`, `"${m4.role || ''}"`,
        `"${p.track || 'N/A'}"`,
        `"${p.title || 'N/A'}"`,
        `"${p.pptUrl || 'N/A'}"`,
        `"${p.pptFileName || 'N/A'}"`,
        `"${p.repoUrl || 'N/A'}"`,
        `"${p.demoUrl || 'N/A'}"`,
        `"${p.techStack || 'N/A'}"`
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${selectedEvent.title.replace(/\s+/g, '_')}_Complete_Roster.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('✅ Detailed CSV exported with all Member Names, Emails, Colleges, Roles & PPT Links!');
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(text);
    showToast(`Copied ${label} to clipboard!`);
    setTimeout(() => setCopiedLink(''), 2500);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-2xl bg-[#111116] border border-[#ef2635]/40 shadow-xl">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#ef2635] uppercase">
            <ShieldCheck size={16} /> OFFICIAL ADMIN CONTROL PANEL
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white mt-1 font-mono uppercase">
            Participant PPTs, Teams & Audit Log
          </h1>
          <p className="text-xs text-white/50 mt-1">
            Manage registrations, track all admin edits made to attendee records, inspect presentation PPT decks, or post new events.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setCreateEventModalOpen(true)}
            className="px-5 py-3 rounded-lg bg-[#ef2635] hover:bg-[#ff3d4b] text-white font-bold text-xs uppercase tracking-wider transition flex items-center space-x-2 shrink-0 cursor-pointer shadow-lg shadow-red-500/20"
          >
            <PlusCircle size={16} />
            <span>Post Detailed Event</span>
          </button>
        </div>
      </div>

      {/* Main Tab Toggle: Roster vs Audit History */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-4 font-mono text-xs">
        <button
          type="button"
          onClick={() => setAdminTab('roster')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition font-bold cursor-pointer ${
            adminTab === 'roster'
              ? 'bg-[#ef2635] text-white shadow-md'
              : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10'
          }`}
        >
          <Users size={15} />
          <span>Participant Submissions & PPT Roster</span>
          <span className="bg-black/40 px-2 py-0.5 rounded text-[10px] ml-1">
            {filteredRoster.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setAdminTab('audit')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition font-bold cursor-pointer ${
            adminTab === 'audit'
              ? 'bg-[#ef2635] text-white shadow-md'
              : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10'
          }`}
        >
          <History size={15} />
          <span>Registration Edit History & Audit Logs</span>
          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded text-[10px] ml-1">
            {auditLogs.length} Edits Tracked
          </span>
        </button>
      </div>

      {/* VIEW 1: PARTICIPANT ROSTER */}
      {adminTab === 'roster' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left: Events Selector Sidebar */}
          <div className="lg:col-span-4 space-y-3">
            <h2 className="text-xs font-mono font-bold text-[#ef2635] uppercase tracking-widest">Select Event Roster</h2>
            
            <div className="space-y-2.5">
              {allEvents.map((ev) => {
                const dbCount = getEventRegistrations(ev.id).length;
                const isSelected = ev.id === selectedDashboardEventId;
                const categoryBadge = (ev.category === 'QUIZ' || ev.badge === 'TECH QUIZ' || (ev.title || '').toLowerCase().includes('quiz')) ? 'QUIZ' : 'HACKATHON';

                return (
                  <div
                    key={ev.id}
                    onClick={() => setSelectedDashboardEventId(ev.id)}
                    className={`p-4 rounded-xl cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-[#181214] border-[#ef2635] shadow-lg shadow-red-500/10'
                        : 'bg-[#0f0f12] hover:bg-[#15151a] border-white/10'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-[#ef2635] text-white uppercase">
                          {categoryBadge}
                        </span>
                        <h3 className="text-sm font-bold text-white mt-1.5 line-clamp-1">{ev.title}</h3>
                      </div>

                      {/* Delete button per event card */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteEventClick(ev.id, ev.title);
                        }}
                        title="Delete Event Post"
                        className="p-1.5 rounded text-rose-500/60 hover:text-rose-400 hover:bg-rose-950/60 transition cursor-pointer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/10 text-xs font-mono text-white/50">
                      <span>{ev.date}</span>
                      <span className="font-bold text-[#ef2635]">{dbCount} Registrations</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Detailed Participant & Submission Table */}
          <div className="lg:col-span-8 space-y-4">
            {selectedEvent ? (
              <div className="p-6 sm:p-8 rounded-2xl bg-[#0f0f12] border border-white/10 space-y-6 shadow-2xl">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
                  <div>
                    <div className="text-[10px] font-mono font-bold text-[#ef2635] uppercase tracking-widest">
                      EVENT SUBMISSIONS & PARTICIPANTS
                    </div>
                    <h2 className="text-2xl font-bold text-white font-mono mt-0.5">{selectedEvent.title}</h2>
                    <div className="text-xs text-white/50 mt-1">
                      Showing <strong className="text-white">{filteredRoster.length}</strong> total team submissions.
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleDeleteEventClick(selectedEvent.id, selectedEvent.title)}
                      className="px-3.5 py-2.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-700/60 text-rose-300 font-bold text-xs font-mono uppercase tracking-wider transition flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Trash2 size={16} />
                      <span>Delete Event</span>
                    </button>

                    <button
                      onClick={exportCSV}
                      className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs font-mono uppercase tracking-wider transition flex items-center space-x-1.5 cursor-pointer shadow-lg shadow-emerald-600/20"
                    >
                      <FileSpreadsheet size={16} />
                      <span>Export Full CSV</span>
                    </button>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    placeholder="Search by Team Name, Lead Name, Teammate Email, College, or PPT Link..."
                    value={attendeeSearch}
                    onChange={(e) => setAttendeeSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 text-xs font-mono rounded-xl bg-black/60 border border-white/15 text-white outline-none focus:border-[#ef2635]"
                  />
                </div>

                {/* Roster Cards / Table */}
                {filteredRoster.length > 0 ? (
                  <div className="space-y-4">
                    {filteredRoster.map((item) => {
                      const isExpanded = expandedAttendeeId === item.id;
                      const isQuiz = (selectedEvent.category || '').toLowerCase().includes('quiz') || (selectedEvent.title || '').toLowerCase().includes('quiz');

                      return (
                        <div key={item.id} className="border border-white/10 bg-[#141419] rounded-xl p-5 space-y-4 transition hover:border-white/20">
                          
                          {/* Row Header */}
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2 font-mono text-xs">
                                <span className="bg-[#ef2635]/20 text-[#ef2635] border border-[#ef2635]/40 px-2 py-0.5 rounded font-bold">
                                  {item.ticketCode}
                                </span>
                                <span className="text-white font-bold text-base font-sans">
                                  👥 Team: <strong className="text-[#ef2635]">{item.teamName}</strong>
                                </span>
                              </div>
                              
                              <div className="flex flex-wrap items-center gap-3 text-xs text-white/60 mt-1 font-mono">
                                <span className="flex items-center gap-1">
                                  <User size={13} className="text-[#ef2635]" /> Lead: <strong className="text-white">{item.userName}</strong>
                                </span>
                                <span className="flex items-center gap-1">
                                  <Mail size={13} className="text-[#ef2635]" /> {item.userEmail}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-start sm:self-auto">
                              {/* Edit Registration Button */}
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(item)}
                                className="px-3 py-1.5 rounded bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-mono text-xs flex items-center gap-1 transition cursor-pointer"
                              >
                                <Edit3 size={13} />
                                <span>Edit Registration</span>
                              </button>

                              <button
                                onClick={() => setExpandedAttendeeId(isExpanded ? null : item.id)}
                                className="px-3.5 py-1.5 rounded bg-black/40 border border-white/15 text-white/70 hover:text-white font-mono text-xs flex items-center gap-1.5 transition cursor-pointer"
                              >
                                <span>{isExpanded ? 'Hide Details' : 'View Full Details & PPT'}</span>
                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </button>
                            </div>
                          </div>

                          {/* Quick Badges for PPT & GitHub */}
                          {item.project && !isQuiz && (
                            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10 font-mono text-xs">
                              {item.project.pptUrl && (
                                <a
                                  href={item.project.pptUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 bg-[#ef2635]/15 hover:bg-[#ef2635]/30 text-[#ef2635] border border-[#ef2635]/40 px-3 py-1 rounded font-bold transition"
                                >
                                  <FileText size={14} />
                                  <span>Presentation PPT Link</span>
                                  <ExternalLink size={12} />
                                </a>
                              )}

                              {item.project.pptFileName && (
                                <span className="inline-flex items-center gap-1.5 bg-purple-950/60 text-purple-300 border border-purple-800 px-3 py-1 rounded">
                                  <FileText size={14} />
                                  <span>Attached: {item.project.pptFileName}</span>
                                </span>
                              )}

                              {item.project.repoUrl && (
                                <a
                                  href={item.project.repoUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-white/80 border border-white/15 px-3 py-1 rounded transition"
                                >
                                  <Code size={14} className="text-[#ef2635]" />
                                  <span>GitHub Repo</span>
                                  <ExternalLink size={12} />
                                </a>
                              )}
                            </div>
                          )}

                          {/* Expanded Full Details Section */}
                          {isExpanded && (
                            <div className="mt-4 pt-4 border-t border-white/10 space-y-5 text-xs font-mono bg-black/40 p-4 rounded-lg">
                              
                              {/* Teammates Table */}
                              <div>
                                <h4 className="text-white font-bold uppercase mb-2 text-xs flex items-center gap-1.5 text-[#ef2635]">
                                  <Users size={14} /> Registered Team Members ({item.teammates?.length || 1} Members):
                                </h4>
                                <div className="grid gap-2 sm:grid-cols-2">
                                  {item.teammates?.map((m, idx) => (
                                    <div key={idx} className="p-3 bg-[#111116] border border-white/10 rounded flex items-center justify-between">
                                      <div>
                                        <span className="text-[#ef2635] font-bold block">#{idx + 1} {m.name || 'Member'}</span>
                                        <span className="text-white/60 block text-[11px]">{m.email || 'No email'}</span>
                                        {m.college && (
                                          <span className="text-amber-400/90 block text-[11px] flex items-center gap-1 mt-0.5">
                                            <GraduationCap size={12} /> {m.college}
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-white/70 self-start">{m.role || 'Member'}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Project & PPT Full Details (For Hackathons) */}
                              {item.project && !isQuiz && (
                                <div className="space-y-3 pt-3 border-t border-white/10">
                                  <h4 className="text-white font-bold uppercase text-xs flex items-center gap-1.5 text-[#ef2635]">
                                    <FileText size={14} /> Project & Presentation Deck Details:
                                  </h4>

                                  <div className="space-y-2 bg-[#111116] p-3.5 border border-white/10 rounded">
                                    <div>
                                      <span className="text-white/40 block">Track:</span>
                                      <span className="text-white font-bold">{item.project.track || 'Software Track'}</span>
                                    </div>

                                    <div>
                                      <span className="text-white/40 block">Project Title:</span>
                                      <span className="text-white font-bold text-sm">{item.project.title || 'N/A'}</span>
                                    </div>

                                    {/* PPT Presentation URL & Direct Copy */}
                                    <div>
                                      <span className="text-white/40 block">Presentation PPT / Pitch Deck Link:</span>
                                      {item.project.pptUrl ? (
                                        <div className="flex items-center gap-2 mt-1">
                                          <a href={item.project.pptUrl} target="_blank" rel="noreferrer" className="text-[#ef2635] font-bold underline truncate">
                                            {item.project.pptUrl}
                                          </a>
                                          <button
                                            type="button"
                                            onClick={() => copyToClipboard(item.project.pptUrl, 'PPT Link')}
                                            className="p-1 bg-white/10 hover:bg-white/20 text-white rounded cursor-pointer shrink-0"
                                          >
                                            {copiedLink === item.project.pptUrl ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                                          </button>
                                        </div>
                                      ) : (
                                        <span className="text-white/40 italic">No PPT link submitted</span>
                                      )}
                                    </div>

                                    {/* GitHub Repo */}
                                    <div>
                                      <span className="text-white/40 block">GitHub Repository:</span>
                                      {item.project.repoUrl ? (
                                        <a href={item.project.repoUrl} target="_blank" rel="noreferrer" className="text-sky-400 font-bold underline truncate block mt-0.5">
                                          {item.project.repoUrl}
                                        </a>
                                      ) : (
                                        <span className="text-white/40 italic">No repo submitted</span>
                                      )}
                                    </div>

                                    {/* Tech Stack */}
                                    {item.project.techStack && (
                                      <div>
                                        <span className="text-white/40 block">Tech Stack:</span>
                                        <span className="text-white">{item.project.techStack}</span>
                                      </div>
                                    )}

                                    {/* Overview */}
                                    {item.project.description && (
                                      <div>
                                        <span className="text-white/40 block">Description:</span>
                                        <p className="text-white/70 whitespace-pre-line leading-relaxed">{item.project.description}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                            </div>
                          )}

                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-16 border border-dashed border-white/15 rounded-xl bg-black/30 space-y-2 font-mono">
                    <div className="text-white/60 font-bold text-sm">No live registrations yet</div>
                    <p className="text-white/30 text-xs">Waiting for real participant team registrations and PPT submissions.</p>
                  </div>
                )}

              </div>
            ) : (
              <div className="text-center py-16 text-white/40 font-mono">
                Select an event to inspect roster.
              </div>
            )}
          </div>

        </div>
      )}

      {/* VIEW 2: AUDIT LOGS & EDIT HISTORY */}
      {adminTab === 'audit' && (
        <div className="p-6 sm:p-8 rounded-2xl bg-[#0f0f12] border border-white/10 space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest">
                <History size={14} /> LIVE REGISTRATION EDIT AUDIT TRAIL
              </div>
              <h2 className="text-2xl font-bold text-white font-mono mt-0.5">Admin Edit History & Logs</h2>
              <p className="text-xs text-white/50 mt-1">
                Every edit performed by an admin on participant registrations, team details, or PPT deck links is permanently logged here with the edit name and admin credentials.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded font-bold">
                {auditLogs.length} Total Edits Logged
              </span>
            </div>
          </div>

          {/* Search Audit Logs */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Filter audit logs by edit action, admin email, participant name, or edit details..."
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 text-xs font-mono rounded-xl bg-black/60 border border-white/15 text-white outline-none focus:border-[#ef2635]"
            />
          </div>

          {/* Audit Logs Feed / Table */}
          {filteredAuditLogs.length > 0 ? (
            <div className="space-y-3">
              {filteredAuditLogs.map((log) => (
                <div key={log.id} className="p-4 bg-[#141419] border border-white/10 hover:border-[#ef2635]/40 rounded-xl space-y-2 font-mono transition">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                        EDIT MARKED
                      </span>
                      <h4 className="text-white font-bold text-sm font-sans">{log.action}</h4>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-white/50">
                      <Clock size={13} className="text-[#ef2635]" />
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2 text-xs pt-1">
                    <div>
                      <span className="text-white/40 block text-[10px] uppercase">Exact Edit Made:</span>
                      <p className="text-amber-300 font-bold leading-relaxed">{log.details}</p>
                    </div>

                    <div className="space-y-1 sm:text-right">
                      <div>
                        <span className="text-white/40 text-[10px] uppercase block">Admin Who Performed Edit:</span>
                        <span className="text-[#ef2635] font-bold">{log.editedBy}</span>
                      </div>

                      {log.targetUser && (
                        <div>
                          <span className="text-white/40 text-[10px] uppercase block">Target Participant / Registration:</span>
                          <span className="text-white font-semibold">{log.targetUser}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border border-dashed border-white/15 rounded-xl bg-black/30 space-y-2 font-mono">
              <History size={24} className="mx-auto text-white/30" />
              <div className="text-white/60 font-bold text-sm">No audit logs found</div>
              <p className="text-white/30 text-xs">Admin registration edits and modifications will automatically appear here.</p>
            </div>
          )}
        </div>
      )}

      {/* EDIT REGISTRATION MODAL */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#111116] border border-[#ef2635]/50 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl p-6 sm:p-8 space-y-6">
            
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <div className="text-[10px] font-mono font-bold text-[#ef2635] uppercase tracking-widest flex items-center gap-1.5">
                  <FileEdit size={14} /> ADMIN REGISTRATION EDITOR
                </div>
                <h3 className="text-xl font-bold text-white font-mono mt-0.5">Edit Participant Registration</h3>
              </div>

              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="p-1.5 text-white/50 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveRosterEdit} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-white/60 mb-1 font-bold uppercase text-[10px]">Team Name</label>
                <input
                  type="text"
                  required
                  value={editForm.teamName}
                  onChange={(e) => setEditForm({ ...editForm, teamName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-black/60 border border-white/15 rounded-lg text-white outline-none focus:border-[#ef2635]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/60 mb-1 font-bold uppercase text-[10px]">Team Lead Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.userName}
                    onChange={(e) => setEditForm({ ...editForm, userName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-black/60 border border-white/15 rounded-lg text-white outline-none focus:border-[#ef2635]"
                  />
                </div>

                <div>
                  <label className="block text-white/60 mb-1 font-bold uppercase text-[10px]">Team Lead Email</label>
                  <input
                    type="email"
                    required
                    value={editForm.userEmail}
                    onChange={(e) => setEditForm({ ...editForm, userEmail: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-black/60 border border-white/15 rounded-lg text-white outline-none focus:border-[#ef2635]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/60 mb-1 font-bold uppercase text-[10px]">College / Institute</label>
                <input
                  type="text"
                  value={editForm.college}
                  onChange={(e) => setEditForm({ ...editForm, college: e.target.value })}
                  placeholder="e.g. TechZen Institute of Technology"
                  className="w-full px-3.5 py-2.5 bg-black/60 border border-white/15 rounded-lg text-white outline-none focus:border-[#ef2635]"
                />
              </div>

              <div>
                <label className="block text-white/60 mb-1 font-bold uppercase text-[10px]">Presentation PPT Deck Link</label>
                <input
                  type="url"
                  value={editForm.pptUrl}
                  onChange={(e) => setEditForm({ ...editForm, pptUrl: e.target.value })}
                  placeholder="https://drive.google.com/file/d/..."
                  className="w-full px-3.5 py-2.5 bg-black/60 border border-white/15 rounded-lg text-white outline-none focus:border-[#ef2635]"
                />
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-[11px] text-amber-300 flex items-start gap-2">
                <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                <span>Saving will permanently log this edit in the Audit Trail with your Admin name ({currentUser?.name || 'Admin'}).</span>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-[#ef2635] hover:bg-[#ff3d4b] text-white font-bold cursor-pointer shadow-lg shadow-red-500/20"
                >
                  Save & Record Audit Log
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
