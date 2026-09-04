import { ArrowLeft, ArrowUpRight, CalendarDays, Check, Code, Copy, FileText, MapPin, Plus, Save, Send, ShieldCheck, Trash2, Upload, User, Users, GraduationCap, Link as LinkIcon } from 'lucide-react';
import { useEffect, useState, useMemo, type FormEvent, type ChangeEvent } from 'react';
import { Link, useParams, useLocation } from 'wouter';
import { useSafeUser as useUser } from '@/lib/clerk-safe';
import { SiteShell } from '@/components/site-shell';
import { INITIAL_EVENTS } from '@/mockData';
import { useEvents } from '@/context/EventContext';
import { useAuth } from '@/context/AuthContext';

// TechZen EventDetail Page with Auth Gate
function longDate(value: string) {
  try {
    return new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(value));
  } catch (e) {
    return value;
  }
}

const TEAMMATE_ROLE_OPTIONS = [
  '-- Select Role --',
  'Software Developer',
  'Hardware Specialist',
  'AI / ML Engineer',
  'UI / UX Designer',
  'Product Manager',
  'Presenter / Pitcher',
  'Research Member',
  'Others (Type Custom Role)'
];

export default function EventDetail() {
  const params = useParams<{ eventId: string }>();
  const rawId = params.eventId;
  const [, setLocation] = useLocation();
  const { user: clerkUser } = useUser();
  const { currentUser, isAdmin, ADMIN_EMAIL, openAuth } = useAuth();
  const { events, setSelectedEventId, deleteEvent, showToast } = useEvents();

  const activeUserEmail = currentUser?.email || clerkUser?.emailAddresses[0]?.emailAddress || '';
  const effectiveIsAdmin = isAdmin || activeUserEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  // Find exact target event from events list or mockData
  const displayEvent = useMemo(() => {
    return (events || []).find((e) => e.id === rawId) || INITIAL_EVENTS.find((e) => e.id === rawId) || {
      id: rawId,
      title: rawId === 'operation-cipher-2026' ? 'Operation Cipher 2026' : 'TechZen QuizVerse 2026',
      category: rawId === 'operation-cipher-2026' ? 'HACKATHON' : 'QUIZ',
      format: 'ONLINE',
      date: rawId === 'operation-cipher-2026' ? 'June 29 - July 20, 2026' : 'May 12, 2026',
      location: 'National Level Online Hackathon',
      capacity: 500,
      maxTeamSize: 4,
      registeredCount: 480,
      tags: ['Hackathon', 'Money Heist', 'Software Track', 'Hardware Track'],
      coverImage: rawId === 'operation-cipher-2026' ? '/operation-cipher.png' : '/quizverse.png',
      description: rawId === 'operation-cipher-2026'
        ? `THE PLAN. THE CODE. THE ESCAPE.\nTechZen Presents: OPERATION CIPHER — A Money Heist Themed National Level Hackathon. Powered by Unstop.\n\nheist_blueprint.sh\ncipher@techzen:~$ ./initiate_heist.sh\n[*] Connecting to TechZen Indian Hackathon Node...\n[OK] SYSTEM SECURED. ROUND 1 DETAILS LOADED:\n-> Tracks: Software Track & Hardware Track\n-> Team size: 1-4 members (Individual or Team)\n-> Location: National Level Online Hackathon\n\n💻 Software Track\nBuild web/app systems, AI bots, blockchain ledgers, or cloud security tools.\n\n⚙️ Hardware Track\nDevelop IoT, smart robots, embedded devices, or firmware controllers.\n\n🏆 Prizes & Goodies\nPrizes worth Cash + Goodies + Developer Vouchers for top performers.\n\n📜 E-Certificates\nOfficial certified credentials powered by TruScholar for all participants.\n\nTHE CODE IS READY. THE PLAN IS SET. ARE YOU IN?`
        : `TECHZEN PRESENTS: QUIZVERSE 2026\nTHINK. ANSWER. CONQUER.\n\n⏱️ 30 Minutes Quiz Duration\n🧠 30 MCQs on Core CS & Hardware Prototyping\n💡 No Negative Marking\n👥 Open to All Students\n🏆 Exciting Prizes & E-Certificates`
    };
  }, [events, rawId]);

  const maxAllowedMembers = displayEvent.maxTeamSize || 4;

  const isQuizEvent = useMemo(() => {
    return (displayEvent.category || '').toLowerCase().includes('quiz') || 
           (displayEvent.title || '').toLowerCase().includes('quiz');
  }, [displayEvent]);

  // Sync selectedEventId in context when route mounts
  useEffect(() => {
    if (rawId) {
      setSelectedEventId(rawId);
    }
  }, [rawId, setSelectedEventId]);

  const [activeTab, setActiveTab] = useState<'event' | 'team' | 'project'>('event');
  const [copiedLink, setCopiedLink] = useState(false);

  // About Me State (Primary Lead / Participant)
  const [userProfile, setUserProfile] = useState({
    fullName: '',
    email: '',
    phone: '',
    college: '',
    role: 'Team Lead / Admin'
  });

  // Team Details State
  const [teamName, setTeamName] = useState('');
  const [participantCount, setParticipantCount] = useState(1);
  const [teammates, setTeammates] = useState<Array<{ id: number; name: string; email: string; phone: string; college: string; role: string; customRole?: string }>>([
    { id: 1, name: '', email: '', phone: '', college: '', role: 'Team Lead / Admin', customRole: '' }
  ]);

  // Project Submission State (All compulsory fields for Hackathons)
  const [projectSubmission, setProjectSubmission] = useState({
    track: 'Software Track',
    title: '',
    tagline: '',
    repoUrl: '',
    demoUrl: '',
    pptUrl: '',
    pptFileName: '',
    techStack: '',
    description: '',
    submittedAt: ''
  });

  const [savedStatus, setSavedStatus] = useState('');
  const [validationError, setValidationError] = useState('');

  const [teamInviteCode, setTeamInviteCode] = useState('');
  const [copiedInviteLink, setCopiedInviteLink] = useState(false);
  const [incomingInvite, setIncomingInvite] = useState<{ inviteCode: string; teamName: string; leaderName: string; leaderEmail: string } | null>(null);

  useEffect(() => {
    if (rawId && (currentUser || clerkUser)) {
      const name = currentUser?.name || [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ') || 'TechZen Builder';
      const email = activeUserEmail;
      setUserProfile((prev) => ({ ...prev, fullName: prev.fullName || name, email: prev.email || email }));
      setTeammates((prev) => prev.map((t, idx) => (idx === 0 ? { ...t, name: name, email: email } : t)));

      // Request On-Demand Unique Team Code verified against Supabase PostgreSQL database
      fetch('/api/teams/generate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: rawId,
          userEmail: email,
          userName: name
        })
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.inviteCode) {
            setTeamInviteCode(data.inviteCode);
            if (data.teamName) setTeamName(data.teamName);
            if (data.participantCount) setParticipantCount(data.participantCount);
            if (data.teammates && data.teammates.length > 0) setTeammates(data.teammates);
          }
        })
        .catch((e) => {
          console.error('Database unique code generation error:', e);
          const cleanEmail = (email || 'leader').toLowerCase().replace(/[^a-z0-9]/g, '');
          const fallbackCode = `TZ-${rawId.substring(0, 5).toUpperCase()}-${cleanEmail.substring(0, 4).toUpperCase()}${Math.floor(1000 + Math.random() * 9000)}`;
          setTeamInviteCode((existing) => existing || fallbackCode);
        });
    }
  }, [currentUser, clerkUser, activeUserEmail, rawId]);

  // Auto-persist unique team code record to Supabase database for Team Leader
  useEffect(() => {
    if (rawId && teamInviteCode && (currentUser || clerkUser)) {
      const leaderName = currentUser?.name || userProfile.fullName || 'Team Leader';
      const leaderEmail = activeUserEmail || currentUser?.email || '';
      const finalTeamName = teamName.trim() || `${leaderName}'s Team`;

      const invitePayload = {
        eventId: rawId,
        inviteCode: teamInviteCode,
        teamName: finalTeamName,
        leaderName,
        leaderEmail,
        participantCount: teammates.length,
        teammates: teammates
      };

      localStorage.setItem(`techzen_team_invite_${rawId}_${teamInviteCode}`, JSON.stringify(invitePayload));

      fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invitePayload)
      }).catch(console.error);
    }
  }, [rawId, teamInviteCode, teamName, teammates, currentUser, clerkUser, userProfile.fullName, activeUserEmail]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleDeleteCurrentEvent = () => {
    if (window.confirm(`⚠️ ADMIN ACTION:\nAre you sure you want to delete "${displayEvent.title}"?\n\nThis will remove the event post from the site and database.`)) {
      deleteEvent(displayEvent.id);
      setLocation('/all-events');
    }
  };

  // Dynamically sync number of teammate slots based on participant count selection
  const handleParticipantCountChange = (count: number) => {
    setParticipantCount(count);
    setTeammates((prev) => {
      if (count > prev.length) {
        const added = [];
        for (let i = prev.length; i < count; i++) {
          added.push({
            id: Date.now() + i,
            name: '',
            email: '',
            phone: '',
            college: '', // Compulsory college name per member
            role: '', // Default role empty for teammates so "-- Select Role --" is prompt
            customRole: ''
          });
        }
        return [...prev, ...added];
      } else {
        return prev.slice(0, count);
      }
    });
  };

  const handleTabClick = (tab: 'event' | 'team' | 'project') => {
    if (tab !== 'event' && !currentUser) {
      setValidationError('🔒 Access Denied: You must be logged in to participate or fill out registration details. Please sign in first.');
      if (showToast) showToast('🔒 Please sign in to register for this event!', 'error');
      if (typeof openAuth === 'function') openAuth('login');
      return;
    }
    setValidationError('');
    setActiveTab(tab);
  };

  const handleSaveTeamDetails = () => {
    if (!currentUser) {
      setValidationError('🔒 Access Denied: You must be logged in to register or save team details. Please sign in first.');
      if (showToast) showToast('🔒 Please sign in to register for this event!', 'error');
      if (typeof openAuth === 'function') openAuth('login');
      return;
    }

    if (!teamName.trim()) {
      setValidationError('⚠️ Team Name is compulsory!');
      return;
    }
    
    // Check if any teammate name, email, or college name is missing
    for (let i = 0; i < teammates.length; i++) {
      const tm = teammates[i];
      if (!tm.name.trim()) {
        setValidationError(`⚠️ Full Name is compulsory for Member #${i + 1}!`);
        return;
      }
      if (!tm.email.trim()) {
        setValidationError(`⚠️ Email Address is compulsory for Member #${i + 1}!`);
        return;
      }
      if (!tm.college || !tm.college.trim()) {
        setValidationError(`⚠️ College / Institution Name is compulsory for Member #${i + 1}!`);
        return;
      }
    }

    // Check if any teammate role is unselected or "Others" custom role is empty
    for (let i = 1; i < teammates.length; i++) {
      const tm = teammates[i];
      if (!tm.role || tm.role === '-- Select Role --') {
        setValidationError(`⚠️ Please select a role for Member #${i + 1}!`);
        return;
      }
      if (tm.role === 'Others (Type Custom Role)' && (!tm.customRole || !tm.customRole.trim())) {
        setValidationError(`⚠️ Please type the custom role for Member #${i + 1}!`);
        return;
      }
    }

    setValidationError('');
    
    // Format teammates array with resolved role text
    const processedTeammates = teammates.map((t, idx) => {
      if (idx === 0) return { ...t, role: 'Team Lead / Admin' };
      const finalRole = t.role === 'Others (Type Custom Role)' ? (t.customRole?.trim() || 'Team Member') : t.role;
      return { ...t, role: finalRole };
    });

    const payload = {
      teamName: teamName.trim(),
      participantCount: processedTeammates.length,
      teammates: processedTeammates,
      userProfile,
      project: projectSubmission,
      teamInviteCode
    };

    if (rawId) {
      localStorage.setItem(`techzen_event_submission_${rawId}_user`, JSON.stringify(payload));
      if (teamInviteCode) {
        const invitePayload = {
          eventId: rawId,
          inviteCode: teamInviteCode,
          teamName: teamName.trim(),
          leaderName: currentUser?.name || userProfile.fullName,
          leaderEmail: activeUserEmail || currentUser?.email,
          participantCount: processedTeammates.length,
          teammates: processedTeammates
        };
        localStorage.setItem(`techzen_team_invite_${rawId}_${teamInviteCode}`, JSON.stringify(invitePayload));

        // Save updated team roster and all member data to Supabase PostgreSQL
        fetch('/api/teams', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(invitePayload)
        }).catch(console.error);
      }
    }
    setSavedStatus('✅ Team details & member data saved successfully to Supabase!');
    if (showToast) showToast('✅ Team details saved successfully!');
    setTimeout(() => setSavedStatus(''), 3000);

    if (!isQuizEvent) {
      setActiveTab('project');
    }
  };

  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const handleWithdrawRegistration = async () => {
    const email = activeUserEmail || currentUser?.email;
    if (!email || !rawId) return;

    if (!window.confirm('Are you sure you want to withdraw your registration for this event? This will remove your ticket and team entry.')) {
      return;
    }

    setIsWithdrawing(true);
    try {
      const res = await fetch('/api/registrations/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: rawId, userEmail: email })
      });

      if (res.ok) {
        localStorage.removeItem(`techzen_event_submission_${rawId}_user`);
        localStorage.removeItem(`techzen_team_invite_${rawId}_${teamInviteCode}`);
        setTeammates([{ id: Date.now(), name: currentUser?.name || '', email, phone: '', college: '', role: 'Team Lead / Admin', customRole: '' }]);
        setTeamName('');
        setParticipantCount(1);
        if (showToast) showToast('🗑️ Registration withdrawn successfully! You can now re-register or join another team.', 'info');
      } else {
        const err = await res.json();
        if (showToast) showToast(`❌ Withdrawal failed: ${err.error}`, 'error');
      }
    } catch (e) {
      console.error(e);
      if (showToast) showToast('❌ Network error withdrawing registration', 'error');
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleUpdateMemberInDatabase = async (memberToUpdate: Teammate) => {
    const isLead = memberToUpdate.id === teammates[0]?.id;
    const email = memberToUpdate.email || (isLead ? (activeUserEmail || currentUser?.email || userProfile.email) : '');
    if (!email || !teamInviteCode) {
      if (showToast) showToast('⚠️ Member email and Team Code are required to update database', 'error');
      return;
    }

    const finalRole = memberToUpdate.role === 'Others (Type Custom Role)'
      ? (memberToUpdate.customRole || 'Teammate')
      : (memberToUpdate.role || (isLead ? 'Team Lead / Admin' : 'Teammate'));

    const finalName = memberToUpdate.name || (isLead ? (currentUser?.name || userProfile.fullName) : '');

    try {
      const res = await fetch('/api/teams/update-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inviteCode: teamInviteCode,
          memberEmail: email,
          name: finalName,
          college: memberToUpdate.college || '',
          role: finalRole
        })
      });

      if (res.ok) {
        const updatedTeam = await res.json();
        setTeammates(updatedTeam.teammates);
        if (showToast) showToast(`✅ Updated ${finalName || 'Member'}'s profile & task in Supabase database!`);
      } else {
        const err = await res.json();
        if (showToast) showToast(`❌ Update failed: ${err.error}`, 'error');
      }
    } catch (e) {
      console.error('Update error:', e);
      if (showToast) showToast('❌ Network error updating member in database', 'error');
    }
  };

  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyTeamCode = () => {
    if (!teamInviteCode) return;
    navigator.clipboard.writeText(teamInviteCode);
    setCopiedCode(true);
    if (showToast) showToast(`📋 Unique Team Code "${teamInviteCode}" copied to clipboard!`);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  const handleCopyInviteLink = () => {
    if (!teamInviteCode) return;
    const inviteUrl = `${window.location.origin}/events/${rawId}?teamInvite=${teamInviteCode}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedInviteLink(true);
    if (showToast) showToast('🔗 Unique Team Invite Link copied to clipboard!');
    setTimeout(() => setCopiedInviteLink(false), 3000);
  };

  const handleJoinByCodeSubmit = async () => {
    const code = joinCodeInput.trim().toUpperCase();
    if (!code) {
      setValidationError('⚠️ Please enter a unique Team Code!');
      return;
    }

    if (!currentUser) {
      if (showToast) showToast('🔒 Please sign in to join this team!', 'error');
      if (typeof openAuth === 'function') openAuth('login');
      return;
    }

    const userEmail = activeUserEmail || currentUser.email;
    const userName = currentUser.name || 'Team Member';

    try {
      const res = await fetch('/api/teams/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inviteCode: code,
          userEmail,
          userName
        })
      });

      if (res.ok) {
        const updatedTeam = await res.json();
        setTeammates(updatedTeam.teammates);
        setParticipantCount(updatedTeam.participantCount);
        if (updatedTeam.teamName) setTeamName(updatedTeam.teamName);
        setTeamInviteCode(code);

        if (rawId) {
          localStorage.setItem(`techzen_team_invite_${rawId}_${code}`, JSON.stringify(updatedTeam));
          localStorage.setItem(`techzen_event_submission_${rawId}_user`, JSON.stringify(updatedTeam));
        }

        if (showToast) showToast(`🎉 Success! You joined Team "${updatedTeam.teamName}"!`);
        setValidationError('');
        setJoinCodeInput('');
        setIncomingInvite(null);
        return;
      } else {
        const errData = await res.json();
        setValidationError(`❌ ${errData.error || 'Team Code not found'}`);
      }
    } catch (e) {
      console.error(e);
      setValidationError('❌ Failed to connect to server');
    }
  };

  const handleJoinTeamAsMember = async () => {
    if (!currentUser) {
      if (showToast) showToast('🔒 Please sign in to join this team!', 'error');
      if (typeof openAuth === 'function') openAuth('login');
      return;
    }

    const userEmail = activeUserEmail || currentUser.email;
    const userName = currentUser.name || 'Team Member';
    const inviteParam = new URLSearchParams(window.location.search).get('teamInvite');
    const targetInviteCode = inviteParam || teamInviteCode;

    if (rawId && targetInviteCode) {
      try {
        const res = await fetch('/api/teams/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            inviteCode: targetInviteCode,
            userEmail,
            userName
          })
        });

        if (res.ok) {
          const updatedTeam = await res.json();
          setTeammates(updatedTeam.teammates);
          setParticipantCount(updatedTeam.participantCount);
          if (updatedTeam.teamName) setTeamName(updatedTeam.teamName);

          localStorage.setItem(`techzen_team_invite_${rawId}_${inviteParam}`, JSON.stringify(updatedTeam));
          localStorage.setItem(`techzen_event_submission_${rawId}_user`, JSON.stringify(updatedTeam));

          if (showToast) showToast(`🎉 You have successfully joined Team "${updatedTeam.teamName}" in Supabase!`);
          setIncomingInvite(null);
          return;
        }
      } catch (e) {
        console.error('Supabase join error:', e);
      }
    }

    // Local fallback if offline
    let updatedTeammates = [...teammates];
    const emptySlotIndex = updatedTeammates.findIndex((t, idx) => idx > 0 && (!t.email || !t.email.trim()));
    
    if (emptySlotIndex !== -1) {
      updatedTeammates[emptySlotIndex] = {
        ...updatedTeammates[emptySlotIndex],
        name: userName,
        email: userEmail,
        role: updatedTeammates[emptySlotIndex].role && updatedTeammates[emptySlotIndex].role !== '-- Select Role --' ? updatedTeammates[emptySlotIndex].role : 'Software Developer'
      };
    } else {
      updatedTeammates.push({
        id: Date.now(),
        name: userName,
        email: userEmail,
        phone: '',
        college: '',
        role: 'Software Developer',
        customRole: ''
      });
    }

    setTeammates(updatedTeammates);
    setParticipantCount(updatedTeammates.length);

    if (showToast) showToast(`🎉 You have joined Team "${incomingInvite?.teamName || teamName || 'the Team'}"!`);
    setIncomingInvite(null);
  };

  const handlePptFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProjectSubmission((prev) => ({
        ...prev,
        pptFileName: file.name,
        pptUrl: prev.pptUrl || `[Attached File: ${file.name}]`
      }));
      setValidationError('');
    }
  };

  const handleSaveSubmission = (e: FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!currentUser) {
      setValidationError('🔒 Access Denied: You must be logged in to submit your project for this event. Please sign in first.');
      if (showToast) showToast('🔒 Please sign in to submit your project!', 'error');
      if (typeof openAuth === 'function') openAuth('login');
      return;
    }

    // Strict validation: ALL fields are compulsory
    if (!projectSubmission.title.trim()) {
      setValidationError('⚠️ Project Title is compulsory!');
      return;
    }
    if (!projectSubmission.pptUrl.trim() && !projectSubmission.pptFileName) {
      setValidationError('⚠️ Presentation PPT / Pitch Deck submission is compulsory! Please enter a URL or upload a file.');
      return;
    }
    if (!projectSubmission.repoUrl.trim()) {
      setValidationError('⚠️ GitHub Repository URL is compulsory!');
      return;
    }
    if (!projectSubmission.demoUrl.trim()) {
      setValidationError('⚠️ Live Demo / Video Link is compulsory!');
      return;
    }
    if (!projectSubmission.techStack.trim()) {
      setValidationError('⚠️ Tech Stack Used is compulsory!');
      return;
    }
    if (!projectSubmission.description.trim()) {
      setValidationError('⚠️ Detailed Description & Features is compulsory!');
      return;
    }

    const processedTeammates = teammates.map((t, idx) => {
      if (idx === 0) return { ...t, role: 'Team Lead / Admin' };
      const finalRole = t.role === 'Others (Type Custom Role)' ? (t.customRole?.trim() || 'Team Member') : t.role;
      return { ...t, role: finalRole };
    });

    const payload = {
      teamName: teamName || `${userProfile.fullName || 'Lead'}'s Squad`,
      participantCount: processedTeammates.length,
      teammates: processedTeammates,
      userProfile,
      project: {
        ...projectSubmission,
        submittedAt: new Date().toISOString()
      }
    };
    if (rawId) {
      localStorage.setItem(`techzen_event_submission_${rawId}_user`, JSON.stringify(payload));
    }
    setProjectSubmission((prev) => ({ ...prev, submittedAt: payload.project.submittedAt }));
    setSavedStatus('🎉 All compulsory project & presentation details submitted successfully!');
    if (showToast) showToast('🎉 All project & presentation details submitted!');
    setTimeout(() => setSavedStatus(''), 4000);
  };

  return (
    <SiteShell>
      <main className="bg-[#0b0b0b] text-white min-h-screen">
        
        {/* Banner Section */}
        <section className="relative overflow-hidden border-b border-white/10 bg-[#111116] py-16 px-5 sm:px-8 lg:px-12">
          {displayEvent.coverImage && (
            <img src={displayEvent.coverImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0b] via-[#0b0b0b]/80 to-transparent" />
          
          <div className="relative mx-auto max-w-[1440px]">
            <div className="flex items-center justify-between gap-4 mb-6">
              <Link href="/all-events" className="inline-flex items-center gap-2 font-mono text-xs text-white/50 hover:text-[#ef2635] transition-colors">
                <ArrowLeft size={14} /> Back to all events
              </Link>

              {/* Verified Admin Delete Event Button */}
              {effectiveIsAdmin && (
                <button
                  type="button"
                  onClick={handleDeleteCurrentEvent}
                  className="bg-rose-950/80 hover:bg-rose-900 border border-rose-700/60 text-rose-300 px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider transition flex items-center gap-2 cursor-pointer shadow-lg"
                >
                  <Trash2 size={15} /> Delete Event Post
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[.2em] mb-4">
              <span className="bg-[#ef2635] px-2.5 py-1 text-white font-bold">{displayEvent.category}</span>
              <span className="border border-white/20 px-2.5 py-1 text-white/55">{displayEvent.format || 'ONLINE'}</span>
              <span className="border border-[#ef2635]/50 text-[#ef2635] px-2.5 py-1 font-bold">
                TEAM SIZE: UP TO {maxAllowedMembers} MEMBERS
              </span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white">{displayEvent.title}</h1>
            <p className="mt-4 text-base text-white/60 max-w-2xl">{displayEvent.tagline || displayEvent.description}</p>
          </div>
        </section>

        {/* Tab Navigation Bar */}
        <div className="border-b border-white/10 bg-[#0c0c0e]">
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12 flex space-x-2 font-mono text-xs">
            <button
              onClick={() => handleTabClick('event')}
              className={`py-4 px-5 font-bold transition border-b-2 flex items-center space-x-2 cursor-pointer ${
                activeTab === 'event' ? 'border-[#ef2635] text-white bg-white/[0.03]' : 'border-transparent text-white/45 hover:text-white'
              }`}
            >
              <CalendarDays size={16} className="text-[#ef2635]" />
              <span>Event Info & Details</span>
            </button>

            <button
              onClick={() => handleTabClick('team')}
              className={`py-4 px-5 font-bold transition border-b-2 flex items-center space-x-2 cursor-pointer ${
                activeTab === 'team' ? 'border-[#ef2635] text-white bg-white/[0.03]' : 'border-transparent text-white/45 hover:text-white'
              }`}
            >
              <Users size={16} className="text-[#ef2635]" />
              <span>Team & Members Details</span>
            </button>

            {/* Project Submission tab is ONLY for Hackathons, NOT for Quiz events */}
            {!isQuizEvent && (
              <button
                onClick={() => handleTabClick('project')}
                className={`py-4 px-5 font-bold transition border-b-2 flex items-center space-x-2 cursor-pointer ${
                  activeTab === 'project' ? 'border-[#ef2635] text-white bg-white/[0.03]' : 'border-transparent text-white/45 hover:text-white'
                }`}
              >
                <Code size={16} className="text-[#ef2635]" />
                <span>Project & PPT Submission</span>
              </button>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <section className="mx-auto max-w-[1440px] px-5 py-12 sm:px-8 lg:px-12">
          
          {/* TAB 1: EVENT INFO */}
          {activeTab === 'event' && (
            <div className="grid gap-10 md:grid-cols-[1fr_380px]">
              <div>
                <div className="space-y-6">
                  <div className="flex flex-wrap gap-4 text-xs font-mono text-white/60 p-4 border border-white/10 bg-[#121215] rounded-lg">
                    <div className="flex items-center gap-2"><CalendarDays size={16} className="text-[#ef2635]" /> {displayEvent.date}</div>
                    <div className="flex items-center gap-2"><MapPin size={16} className="text-[#ef2635]" /> {displayEvent.location}</div>
                    <div className="flex items-center gap-2 text-[#ef2635] font-bold">
                      <Users size={16} /> Team Limit: 1 - {maxAllowedMembers} Members
                    </div>
                  </div>

                  <div className="prose prose-invert max-w-none">
                    <h3 className="text-xl font-semibold text-white">About this Event</h3>
                    <p className="whitespace-pre-line text-sm text-white/70 leading-relaxed">{displayEvent.description}</p>
                  </div>
                </div>
              </div>

              <aside>
                <div className="border border-white/15 bg-[#111] p-6 rounded-lg space-y-4">
                  <h3 className="font-mono text-xs uppercase tracking-widest text-[#ef2635]">Event Registration</h3>
                  <p className="text-xs text-white/50">
                    {isQuizEvent 
                      ? 'Quiz Registration: Fill out your team name and member details below.' 
                      : 'Hackathon Registration: Register your team members, roles, and submit project details.'}
                  </p>
                  
                  <button
                    onClick={() => handleTabClick('team')}
                    className="w-full bg-[#ef2635] hover:bg-[#ff3d4b] text-white font-bold py-3 text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Fill Team Details</span>
                    <ArrowUpRight size={16} />
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('team');
                      window.scrollTo({ top: 400, behavior: 'smooth' });
                    }}
                    className="w-full border border-sky-500/40 bg-sky-950/40 hover:bg-sky-900/50 text-sky-300 font-mono text-xs py-2.5 transition flex items-center justify-center gap-2 cursor-pointer font-bold"
                  >
                    <Users size={14} />
                    <span>Join Team via Code</span>
                  </button>

                  {effectiveIsAdmin && (
                    <button
                      onClick={handleDeleteCurrentEvent}
                      className="w-full border border-rose-700/60 bg-rose-950/60 hover:bg-rose-900 text-rose-300 font-mono text-xs py-2.5 transition flex items-center justify-center gap-2 cursor-pointer font-bold"
                    >
                      <Trash2 size={14} />
                      <span>Delete Event Post</span>
                    </button>
                  )}
                </div>
              </aside>
            </div>
          )}

          {/* TAB 2: TEAM & MEMBERS DETAILS */}
          {activeTab === 'team' && (
            !currentUser ? (
              <div className="max-w-3xl mx-auto border border-[#ef2635]/40 bg-[#161214] p-8 sm:p-12 rounded-xl text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-[#ef2635]/15 border border-[#ef2635]/40 flex items-center justify-center mx-auto text-[#ef2635]">
                  <ShieldCheck size={32} />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold font-mono text-white">Authentication Required</h2>
                  <p className="text-sm text-white/60 max-w-md mx-auto">
                    You must be signed in to register your team, fill member details, or participate in <strong className="text-white">{displayEvent.title}</strong>.
                  </p>
                </div>
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button
                    onClick={() => typeof openAuth === 'function' && openAuth('login')}
                    className="bg-[#ef2635] hover:bg-[#ff3d4b] text-white font-bold px-8 py-3.5 text-xs font-mono uppercase tracking-wider transition shadow-[0_0_20px_rgba(239,38,53,0.35)] cursor-pointer"
                  >
                    Sign In / Create Account
                  </button>
                  <button
                    onClick={() => setActiveTab('event')}
                    className="border border-white/20 hover:border-white text-white/70 hover:text-white font-mono text-xs px-6 py-3.5 transition cursor-pointer"
                  >
                    Back to Event Info
                  </button>
                </div>
              </div>
            ) : (
              <div className="max-w-5xl space-y-8">

              {/* Option A: Join Existing Team via Unique Code */}
              <div className="border border-sky-500/40 bg-gradient-to-r from-sky-950/40 via-black/80 to-black/60 p-6 rounded-xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2 text-sky-400 font-mono text-xs font-bold uppercase tracking-wider">
                    <Users size={16} />
                    <span>Join Existing Team via Unique Code</span>
                  </div>
                  <span className="text-[10px] font-mono text-sky-400 bg-sky-950/70 border border-sky-800/60 px-2.5 py-1 font-bold uppercase">
                    Teammate Join Option
                  </span>
                </div>
                <p className="text-xs text-white/70 font-sans">
                  Have a Team Leader's unique code? Enter it below to join their team instantly!
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <input
                    type="text"
                    value={joinCodeInput}
                    onChange={(e) => {
                      setJoinCodeInput(e.target.value.toUpperCase());
                      setValidationError('');
                    }}
                    placeholder="ENTER TEAM CODE (e.g. TEAM-OPERAT-TANISH)"
                    className="w-full bg-black/90 border border-sky-500/40 px-4 py-3 text-xs font-mono text-white placeholder-white/40 uppercase tracking-widest outline-none focus:border-sky-400"
                  />
                  <button
                    type="button"
                    onClick={handleJoinByCodeSubmit}
                    className="w-full sm:w-auto bg-sky-600 hover:bg-sky-500 text-white font-mono text-xs font-bold px-7 py-3 uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2 shrink-0 shadow-[0_0_15px_rgba(14,165,233,0.3)]"
                  >
                    <span>Join Team</span>
                    <ArrowUpRight size={15} />
                  </button>
                </div>
              </div>

              {/* Active Registration Status & Withdraw Option */}
              <div className="border border-rose-900/60 bg-gradient-to-r from-rose-950/40 via-black/80 to-black/60 p-5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-rose-400 font-mono text-xs font-bold uppercase tracking-wider">
                    <Trash2 size={16} />
                    <span>Manage Registration / Withdraw Option</span>
                  </div>
                  <p className="text-xs text-white/60">
                    To re-register or join another team for <strong className="text-white">{displayEvent.title}</strong>, you must withdraw your existing registration first.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleWithdrawRegistration}
                  disabled={isWithdrawing}
                  className="border border-rose-700/60 bg-rose-950/70 hover:bg-rose-900 text-rose-300 font-mono text-xs font-bold px-5 py-2.5 uppercase tracking-wider transition cursor-pointer shrink-0 flex items-center gap-2 shadow-[0_0_15px_rgba(225,29,72,0.25)]"
                >
                  <Trash2 size={14} />
                  <span>{isWithdrawing ? 'Withdrawing...' : 'Withdraw Registration'}</span>
                </button>
              </div>

              {/* Teammate Invitation Card (When opening a leader's shareable link) */}
              {incomingInvite && (
                <div className="border border-emerald-500/50 bg-emerald-950/30 p-6 rounded-xl space-y-3 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold uppercase">
                        <Users size={16} />
                        <span>Official Team Invitation</span>
                      </div>
                      <h3 className="text-base font-bold text-white font-mono">
                        You've been invited to join <span className="text-emerald-400">"{incomingInvite.teamName || 'Team'}"</span>
                      </h3>
                      <p className="text-xs text-white/60">
                        Team Leader: <strong className="text-white">{incomingInvite.leaderName}</strong> ({incomingInvite.leaderEmail})
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleJoinTeamAsMember}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold px-6 py-3 text-xs uppercase tracking-wider transition cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.3)] shrink-0 flex items-center gap-2"
                    >
                      <span>Join Team Now</span>
                      <ArrowUpRight size={15} />
                    </button>
                  </div>
                </div>
              )}

              {/* Unique Leader Team Code Card */}
              {teamInviteCode && (
                <div className="border border-[#ef2635]/40 bg-gradient-to-r from-[#ef2635]/15 via-black/80 to-black/60 p-6 rounded-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2 text-[#ef2635] font-mono text-xs font-bold uppercase tracking-wider">
                      <ShieldCheck size={16} />
                      <span>Your Unique Team Code (Give to Teammates)</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/70 border border-emerald-800/60 px-2.5 py-1 font-bold uppercase">
                      Leader Code
                    </span>
                  </div>

                  <p className="text-xs text-white/70 font-sans">
                    Give this unique code to your teammates so they can enter it and join <strong className="text-white">{teamName || 'your team'}</strong>!
                  </p>

                  {/* Big Unique Code Banner */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-black/90 border border-[#ef2635]/50 p-4 rounded-lg">
                    <div>
                      <span className="text-[10px] text-white/50 uppercase font-mono tracking-wider block">Unique Team Code:</span>
                      <span className="text-xl font-extrabold text-[#ff4c59] font-mono tracking-widest">{teamInviteCode}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyTeamCode}
                      className="bg-[#ef2635] hover:bg-[#ff3d4b] text-white font-mono text-xs font-bold px-6 py-2.5 uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 shadow-[0_0_15px_rgba(239,38,53,0.3)] shrink-0"
                    >
                      {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copiedCode ? 'Code Copied!' : 'Copy Team Code'}</span>
                    </button>
                  </div>
                </div>
              )}
              
              {/* Step 1: Team Name & Participant Count Selector */}
              <div className="border border-[#ef2635]/40 bg-[#161214] p-6 sm:p-8 rounded-xl space-y-5">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <Users size={20} className="text-[#ef2635]" />
                    <h2 className="text-lg font-bold font-mono uppercase text-white">1. Team Name & Participant Count</h2>
                  </div>
                  <span className="font-mono text-xs text-[#ef2635] font-bold">
                    Allowed: 1 to {maxAllowedMembers} Members
                  </span>
                </div>

                <div className="grid gap-5 sm:grid-cols-2 text-xs">
                  <div>
                    <label className="block text-white/70 mb-1 font-semibold">Team Name *</label>
                    <input
                      type="text"
                      required
                      value={teamName}
                      onChange={(e) => {
                        setTeamName(e.target.value);
                        setValidationError('');
                      }}
                      placeholder="e.g. Cipher Cyber Squad"
                      className="w-full bg-black/70 border border-[#ef2635]/50 px-3.5 py-2.5 text-white font-mono outline-none focus:border-[#ef2635]"
                    />
                  </div>

                  <div>
                    <label className="block text-white/70 mb-1 font-semibold">How many members in your team? *</label>
                    <select
                      value={teammates.length}
                      onChange={(e) => handleParticipantCountChange(parseInt(e.target.value))}
                      className="w-full bg-black/70 border border-[#ef2635]/50 px-3.5 py-2.5 text-white font-mono font-bold outline-none focus:border-[#ef2635]"
                    >
                      {Array.from({ length: maxAllowedMembers }, (_, i) => i + 1).map((num) => (
                        <option key={num} value={num}>
                          {num} {num === 1 ? 'Participant (Solo)' : `Participants (${num} Members)`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Step 2: Member Slots Dynamic Form */}
              <div className="border border-white/10 bg-[#111116] p-6 sm:p-8 rounded-xl space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <ShieldCheck size={20} className="text-[#ef2635]" />
                    <h2 className="text-lg font-bold font-mono uppercase text-white">
                      2. Member Details, Colleges & Roles ({teammates.length} Selected)
                    </h2>
                  </div>
                  <span className="font-mono text-xs text-white/40">{teammates.length} / {maxAllowedMembers} Slots</span>
                </div>

                <div className="space-y-6">
                  {teammates.map((member, index) => {
                    const isLead = index === 0;
                    const canEdit = isLead || !!member.email;

                    return (
                      <div
                        key={member.id}
                        className={`p-5 rounded-xl border space-y-4 ${
                          isLead ? 'bg-[#1a1214] border-[#ef2635]/50' : 'bg-black/40 border-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between border-b border-white/10 pb-3 flex-wrap gap-2">
                          <div className="flex items-center gap-2 font-mono text-xs">
                            <span className={`px-2.5 py-1 rounded font-bold uppercase ${
                              isLead ? 'bg-[#ef2635] text-white' : 'bg-white/10 text-white/70'
                            }`}>
                              {isLead ? '⭐ MEMBER #1 — TEAM LEADER / ADMIN' : `MEMBER #${index + 1}`}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            {canEdit && (
                              <button
                                type="button"
                                onClick={() => handleUpdateMemberInDatabase(member)}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-[11px] font-bold px-3 py-1.5 rounded uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 shrink-0 shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                                title="Update name, college, or task in database"
                              >
                                <Save size={13} />
                                <span>UPDATE</span>
                              </button>
                            )}
                            <span className="font-mono text-[11px] text-white/40">
                              {isLead ? 'Primary Event Contact' : (member.email ? 'Teammate (Joined)' : 'Slot Pending Code')}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 font-mono text-xs">
                          {/* Full Name - Editable for Leader and Joined Members */}
                          <div>
                            <label className="block text-white/70 mb-1 font-semibold flex items-center justify-between">
                              <span>Full Name *</span>
                              {isLead ? (
                                <span className="text-[10px] text-[#ef2635] font-normal font-mono">⭐ Leader</span>
                              ) : !member.email ? (
                                <span className="text-[10px] text-sky-400 font-normal font-mono">🔒 Must Join via Code</span>
                              ) : (
                                <span className="text-[10px] text-emerald-400 font-normal font-mono">✅ Joined Member</span>
                              )}
                            </label>
                            <input
                              type="text"
                              required
                              readOnly={!canEdit}
                              value={member.name || (isLead ? (currentUser?.name || userProfile.fullName) : '')}
                              onChange={(e) => {
                                const val = e.target.value;
                                setTeammates((prev) => prev.map((t) => (t.id === member.id ? { ...t, name: val } : t)));
                                if (isLead) setUserProfile((p) => ({ ...p, fullName: val }));
                                setValidationError('');
                              }}
                              placeholder={isLead ? 'Team Leader Name' : '🔒 Must Join via Unique Team Code'}
                              className={`w-full px-3 py-2 outline-none ${
                                !canEdit
                                  ? 'bg-[#16161a] border border-white/10 text-white/40 cursor-not-allowed placeholder-white/30'
                                  : 'bg-[#111] border border-white/15 text-white focus:border-[#ef2635]'
                              }`}
                            />
                          </div>

                          {/* Email Address - Fixed (readOnly) */}
                          <div>
                            <label className="block text-white/70 mb-1 font-semibold flex items-center justify-between">
                              <span>Email Address *</span>
                              <span className="text-[10px] text-amber-400 font-normal font-mono">🔒 Fixed Email</span>
                            </label>
                            <input
                              type="email"
                              required
                              readOnly
                              value={member.email || (isLead ? (activeUserEmail || currentUser?.email || userProfile.email) : '')}
                              placeholder={isLead ? 'leader@gmail.com' : '🔒 Must Join via Unique Team Code'}
                              className="w-full px-3 py-2 outline-none bg-[#18181f] border border-white/10 text-white/60 font-mono cursor-not-allowed"
                            />
                          </div>

                          {/* College Name - Editable for Leader & Members */}
                          <div>
                            <label className="block text-white/70 mb-1 font-semibold flex items-center gap-1">
                              <GraduationCap size={13} className="text-[#ef2635]" />
                              <span>College Name *</span>
                            </label>
                            <input
                              type="text"
                              required
                              readOnly={!canEdit}
                              value={member.college || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setTeammates((prev) => prev.map((t) => (t.id === member.id ? { ...t, college: val } : t)));
                                if (isLead) setUserProfile((p) => ({ ...p, college: val }));
                                setValidationError('');
                              }}
                              placeholder="College Name"
                              className={`w-full px-3 py-2 outline-none ${
                                !canEdit
                                  ? 'bg-[#16161a] border border-white/10 text-white/40 cursor-not-allowed placeholder-white/30'
                                  : 'bg-[#111] border border-white/15 text-white focus:border-[#ef2635]'
                              }`}
                            />
                          </div>

                          {/* Task / Role in Team - Editable for Leader & Members */}
                          <div>
                            <label className="block text-white/70 mb-1 font-semibold">Role in Team / Task *</label>
                            {!canEdit ? (
                              <input
                                type="text"
                                readOnly
                                value="🔒 Must Join via Code"
                                className="w-full bg-[#16161a] border border-white/10 px-3 py-2 text-white/40 cursor-not-allowed"
                              />
                            ) : (
                              <div className="space-y-2">
                                <select
                                  value={member.role || (isLead ? 'Team Lead / Admin' : '')}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setTeammates((prev) => prev.map((t) => (t.id === member.id ? { ...t, role: val } : t)));
                                    setValidationError('');
                                  }}
                                  className="w-full bg-[#111] border border-white/15 px-3 py-2 text-white outline-none focus:border-[#ef2635]"
                                >
                                  {isLead && <option value="Team Lead / Admin">Team Lead / Admin</option>}
                                  {TEAMMATE_ROLE_OPTIONS.map((r) => (
                                    <option key={r} value={r === '-- Select Role --' ? '' : r}>{r}</option>
                                  ))}
                                </select>

                                {/* Custom Role text box if "Others (Type Custom Role)" selected */}
                                {member.role === 'Others (Type Custom Role)' && (
                                  <input
                                    type="text"
                                    required
                                    value={member.customRole || ''}
                                    onChange={(e) => {
                                      const customVal = e.target.value;
                                      setTeammates((prev) => prev.map((t) => (t.id === member.id ? { ...t, customRole: customVal } : t)));
                                      setValidationError('');
                                    }}
                                    placeholder="Type your role / task (e.g. Data Scientist, DevOps)"
                                    className="w-full bg-black/80 border border-[#ef2635]/60 px-3 py-1.5 text-white text-xs outline-none focus:border-[#ef2635]"
                                  />
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Validation & Save Action Bar */}
              <div className="space-y-3 pt-2">
                {validationError && (
                  <div className="p-3 bg-rose-950/80 border border-rose-700/80 rounded text-rose-300 font-mono text-xs font-bold">
                    {validationError}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="font-mono text-xs text-emerald-400 font-bold">
                    {savedStatus}
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveTeamDetails}
                    className="bg-[#ef2635] hover:bg-[#ff3d4b] text-white font-bold py-3 px-8 text-xs uppercase tracking-wider transition flex items-center gap-2 cursor-pointer shadow-lg shadow-red-600/20"
                  >
                    <Users size={16} />
                    <span>{isQuizEvent ? 'Save Team Details' : 'Proceed to Project & PPT Submission'}</span>
                  </button>
                </div>
              </div>

            </div>
          )
        )}

          {/* TAB 3: PROJECT & PPT SUBMISSION (All fields compulsory for Hackathons) */}
          {!isQuizEvent && activeTab === 'project' && (
            !currentUser ? (
              <div className="max-w-3xl mx-auto border border-[#ef2635]/40 bg-[#161214] p-8 sm:p-12 rounded-xl text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-[#ef2635]/15 border border-[#ef2635]/40 flex items-center justify-center mx-auto text-[#ef2635]">
                  <Code size={32} />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold font-mono text-white">Authentication Required</h2>
                  <p className="text-sm text-white/60 max-w-md mx-auto">
                    You must be signed in to submit your project, GitHub repo, live demo, or presentation PPT for <strong className="text-white">{displayEvent.title}</strong>.
                  </p>
                </div>
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button
                    onClick={() => typeof openAuth === 'function' && openAuth('login')}
                    className="bg-[#ef2635] hover:bg-[#ff3d4b] text-white font-bold px-8 py-3.5 text-xs font-mono uppercase tracking-wider transition shadow-[0_0_20px_rgba(239,38,53,0.35)] cursor-pointer"
                  >
                    Sign In / Create Account
                  </button>
                  <button
                    onClick={() => setActiveTab('event')}
                    className="border border-white/20 hover:border-white text-white/70 hover:text-white font-mono text-xs px-6 py-3.5 transition cursor-pointer"
                  >
                    Back to Event Info
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveSubmission} className="max-w-4xl space-y-8">
              <div className="border border-white/10 bg-[#111116] p-6 sm:p-8 rounded-xl space-y-6">
                <div className="flex items-center gap-3 border-b border-white/10 pb-4 justify-between">
                  <div className="flex items-center gap-3">
                    <Code size={18} className="text-[#ef2635]" />
                    <h2 className="text-lg font-bold font-mono uppercase text-white">3. Hackathon Project & PPT Submission</h2>
                  </div>
                  {projectSubmission.submittedAt ? (
                    <span className="font-mono text-xs text-emerald-400 bg-emerald-950 border border-emerald-800 px-3 py-1 font-bold">
                      STATUS: SUBMITTED
                    </span>
                  ) : (
                    <span className="font-mono text-xs text-amber-400 bg-amber-950 border border-amber-800 px-3 py-1 font-bold">
                      STATUS: PENDING DRAFT
                    </span>
                  )}
                </div>

                <div className="p-3 bg-amber-950/40 border border-amber-800/40 rounded text-amber-300 font-mono text-xs">
                  📌 <strong>Note:</strong> All submission fields marked with <span className="text-[#ef2635] font-bold">*</span> are <strong>compulsory</strong> for jury evaluation.
                </div>

                <div className="space-y-5 text-xs">
                  <div>
                    <label className="block text-white mb-1 font-semibold">Select Hackathon Track <span className="text-[#ef2635] font-bold">*</span></label>
                    <select
                      required
                      value={projectSubmission.track}
                      onChange={(e) => setProjectSubmission((prev) => ({ ...prev, track: e.target.value }))}
                      className="w-full bg-black/60 border border-white/15 px-3.5 py-2.5 text-white font-mono outline-none focus:border-[#ef2635]"
                    >
                      <option value="Software Track">💻 Software Track (AI, Web/Mobile, Cloud, Blockchain)</option>
                      <option value="Hardware Track">⚙️ Hardware Track (IoT, Smart Robots, Embedded Systems)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-white mb-1 font-semibold">Project Title <span className="text-[#ef2635] font-bold">*</span></label>
                    <input
                      type="text"
                      required
                      value={projectSubmission.title}
                      onChange={(e) => {
                        setProjectSubmission((prev) => ({ ...prev, title: e.target.value }));
                        setValidationError('');
                      }}
                      placeholder="e.g. CipherGuard Fraud Detection System"
                      className="w-full bg-black/60 border border-white/15 px-3.5 py-2.5 text-white font-mono outline-none focus:border-[#ef2635]"
                    />
                  </div>

                  {/* PPT Presentation Upload Box */}
                  <div className="p-4 border border-[#ef2635]/40 bg-[#161214] rounded-lg space-y-3">
                    <div className="flex items-center gap-2 text-sm font-mono font-bold text-[#ef2635]">
                      <FileText size={18} />
                      <span>PRESENTATION PPT / PITCH DECK SUBMISSION <span className="text-[#ef2635] font-bold">*</span></span>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-white/80 mb-1 font-semibold">PPT / Pitch Deck Link (Google Slides, Canva, Drive Link) <span className="text-[#ef2635] font-bold">*</span></label>
                        <input
                          type="url"
                          value={projectSubmission.pptUrl}
                          onChange={(e) => {
                            setProjectSubmission((prev) => ({ ...prev, pptUrl: e.target.value }));
                            setValidationError('');
                          }}
                          placeholder="https://docs.google.com/presentation/d/..."
                          className="w-full bg-black/60 border border-white/15 px-3.5 py-2.5 text-white font-mono outline-none focus:border-[#ef2635]"
                        />
                      </div>

                      <div>
                        <label className="block text-white/80 mb-1 font-semibold">Or Upload PPT File (.ppt, .pptx, .pdf) <span className="text-[#ef2635] font-bold">*</span></label>
                        <div className="relative flex items-center justify-center border border-dashed border-white/25 hover:border-[#ef2635] bg-black/40 p-2.5 text-center cursor-pointer transition">
                          <input
                            type="file"
                            accept=".ppt,.pptx,.pdf"
                            onChange={handlePptFileUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <div className="flex items-center gap-2 font-mono text-xs text-white/70">
                            <Upload size={15} className="text-[#ef2635]" />
                            <span>{projectSubmission.pptFileName || 'Choose PPT File (.ppt / .pdf)'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-white mb-1 font-semibold">GitHub Repository URL <span className="text-[#ef2635] font-bold">*</span></label>
                      <input
                        type="url"
                        required
                        value={projectSubmission.repoUrl}
                        onChange={(e) => {
                          setProjectSubmission((prev) => ({ ...prev, repoUrl: e.target.value }));
                          setValidationError('');
                        }}
                        placeholder="https://github.com/user/project"
                        className="w-full bg-black/60 border border-white/15 px-3.5 py-2.5 text-white font-mono outline-none focus:border-[#ef2635]"
                      />
                    </div>

                    <div>
                      <label className="block text-white mb-1 font-semibold">Live Demo / Video Link <span className="text-[#ef2635] font-bold">*</span></label>
                      <input
                        type="url"
                        required
                        value={projectSubmission.demoUrl}
                        onChange={(e) => {
                          setProjectSubmission((prev) => ({ ...prev, demoUrl: e.target.value }));
                          setValidationError('');
                        }}
                        placeholder="https://my-demo.vercel.app or YouTube"
                        className="w-full bg-black/60 border border-white/15 px-3.5 py-2.5 text-white font-mono outline-none focus:border-[#ef2635]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-white mb-1 font-semibold">Tech Stack Used <span className="text-[#ef2635] font-bold">*</span></label>
                    <input
                      type="text"
                      required
                      value={projectSubmission.techStack}
                      onChange={(e) => {
                        setProjectSubmission((prev) => ({ ...prev, techStack: e.target.value }));
                        setValidationError('');
                      }}
                      placeholder="e.g. React 19, Python, OpenCV, Raspberry Pi"
                      className="w-full bg-black/60 border border-white/15 px-3.5 py-2.5 text-white font-mono outline-none focus:border-[#ef2635]"
                    />
                  </div>

                  <div>
                    <label className="block text-white mb-1 font-semibold">Detailed Description & Features <span className="text-[#ef2635] font-bold">*</span></label>
                    <textarea
                      rows={4}
                      required
                      value={projectSubmission.description}
                      onChange={(e) => {
                        setProjectSubmission((prev) => ({ ...prev, description: e.target.value }));
                        setValidationError('');
                      }}
                      placeholder="Describe what you built, architecture, challenges, and feature highlights..."
                      className="w-full bg-black/60 border border-white/15 px-3.5 py-2.5 text-white font-mono outline-none focus:border-[#ef2635] resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Validation Banner & Action Buttons */}
              <div className="space-y-4">
                {validationError && (
                  <div className="p-3.5 bg-rose-950/80 border border-rose-700/80 rounded-lg text-rose-300 font-mono text-xs font-bold">
                    {validationError}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="font-mono text-xs text-white/50">
                    {savedStatus ? <span className="text-emerald-400 font-bold">{savedStatus}</span> : <span>All marked fields are compulsory before final submission.</span>}
                  </div>

                  <button
                    type="submit"
                    className="w-full sm:w-auto bg-[#ef2635] hover:bg-[#ff3d4b] text-white font-bold py-3.5 px-8 text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-600/20"
                  >
                    <Send size={16} />
                    <span>Submit Project & PPT Presentation</span>
                  </button>
                </div>
              </div>
            </form>
          )
        )}

        </section>

      </main>
    </SiteShell>
  );
}