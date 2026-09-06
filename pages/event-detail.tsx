import { ArrowLeft, ArrowUpRight, CalendarDays, Check, Code, Copy, FileText, MapPin, Plus, Save, Send, ShieldCheck, Trash2, Upload, User, Users, GraduationCap, Link as LinkIcon } from 'lucide-react';
import { useEffect, useState, useMemo, type FormEvent, type ChangeEvent } from 'react';
import { Link, useParams, useLocation } from 'wouter';
import { useSafeUser as useUser } from '@/lib/clerk-safe';
import { SiteShell } from '@/components/site-shell';
import { INITIAL_EVENTS } from '@/mockData';
import { useEvents } from '@/context/EventContext';
import { useAuth } from '@/context/AuthContext';
import { getSavedProfileDefaults, saveProfileDefaults } from '@/utils/userDefaults';

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
  const { currentUser, isAdmin, isEmailAdmin, openAuth } = useAuth();
  const { events, setSelectedEventId, deleteEvent, showToast } = useEvents();

  const activeUserEmail = currentUser?.email || clerkUser?.emailAddresses[0]?.emailAddress || '';
  const effectiveIsAdmin = isAdmin || (isEmailAdmin ? isEmailAdmin(activeUserEmail) : false);

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

  const allowSolo = (displayEvent as any).allowSolo !== false && (displayEvent as any).allow_solo !== false && (displayEvent as any).allowSoloParticipants !== false;
  const minAllowedMembers = allowSolo ? 1 : 2;
  const maxAllowedMembers = displayEvent.maxTeamSize || (displayEvent as any).max_team_size || 4;
  const maxTeamsAllowed = (displayEvent as any).maxTeams || (displayEvent as any).max_teams || 50;

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

  // About Me State (Primary Lead / Participant) - Autofilled from saved defaults
  const savedProfileDefaults = useMemo(() => getSavedProfileDefaults(), []);

  const [userProfile, setUserProfile] = useState({
    fullName: savedProfileDefaults.fullName || '',
    email: '',
    phone: savedProfileDefaults.phone || '',
    college: savedProfileDefaults.college || '',
    role: savedProfileDefaults.role || 'Team Lead / Admin'
  });

  // Team Details State
  const [teamName, setTeamName] = useState('');
  const [participantCount, setParticipantCount] = useState(1);
  const [teammates, setTeammates] = useState<Array<{ id: number; name: string; email: string; phone: string; college: string; role: string; customRole?: string }>>([
    {
      id: 1,
      name: savedProfileDefaults.fullName || '',
      email: '',
      phone: savedProfileDefaults.phone || '',
      college: savedProfileDefaults.college || '',
      role: 'Team Lead / Admin',
      customRole: savedProfileDefaults.customRole || ''
    }
  ]);

  // Autofill Leader Details (Member #1) for the logged-in user calling upon others
  useEffect(() => {
    if (!activeUserEmail && !currentUser?.email) return;

    const defaults = getSavedProfileDefaults();

    const resolvedName = currentUser?.name || defaults.fullName || [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ') || (activeUserEmail ? activeUserEmail.split('@')[0] : '');
    const resolvedEmail = activeUserEmail || currentUser?.email || '';
    const resolvedCollege = (currentUser as any)?.college || defaults.college || '';
    const resolvedPhone = (currentUser as any)?.phone || defaults.phone || '';

    setTeammates((prev) => {
      if (prev.length > 0) {
        const first = prev[0];
        const updatedFirst = {
          ...first,
          name: first.name || resolvedName,
          email: first.email || resolvedEmail,
          college: first.college || resolvedCollege,
          phone: first.phone || resolvedPhone,
          role: 'Team Lead / Admin'
        };
        if (
          first.name !== updatedFirst.name ||
          first.email !== updatedFirst.email ||
          first.college !== updatedFirst.college ||
          first.phone !== updatedFirst.phone
        ) {
          return [updatedFirst, ...prev.slice(1)];
        }
      }
      return prev;
    });

    setUserProfile((prev) => ({
      ...prev,
      fullName: prev.fullName || resolvedName,
      email: prev.email || resolvedEmail,
      college: prev.college || resolvedCollege,
      phone: prev.phone || resolvedPhone
    }));
  }, [activeUserEmail, currentUser, clerkUser]);

  // Auto-remember college name, phone, and name as user types/edits
  useEffect(() => {
    if (teammates.length > 0) {
      const leader = teammates[0];
      if (leader.college || leader.phone || leader.name) {
        saveProfileDefaults({
          college: leader.college,
          phone: leader.phone,
          fullName: leader.name
        });
      }
    }
  }, [teammates]);

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

  const [joinModal, setJoinModal] = useState<{
    isOpen: boolean;
    step: 'confirm' | 'details';
    inviteCode: string;
    teamName: string;
    leaderName: string;
    leaderEmail: string;
    role: string;
    customRole: string;
    college: string;
    phone: string;
    isSubmitting?: boolean;
  }>({
    isOpen: false,
    step: 'confirm',
    inviteCode: '',
    teamName: '',
    leaderName: '',
    leaderEmail: '',
    role: '',
    customRole: '',
    college: '',
    phone: '',
    isSubmitting: false
  });

  const [removeModal, setRemoveModal] = useState<{
    isOpen: boolean;
    member: { id: number; name: string; email: string; college: string; role: string } | null;
    isRemoving?: boolean;
  }>({
    isOpen: false,
    member: null,
    isRemoving: false
  });

  const isUserLeader = useMemo(() => {
    const activeEmail = (activeUserEmail || currentUser?.email || userProfile.email || '').toLowerCase().trim();
    const leaderEmail = (teammates[0]?.email || '').toLowerCase().trim();
    if (!leaderEmail) return true;
    return activeEmail === leaderEmail;
  }, [activeUserEmail, currentUser?.email, userProfile.email, teammates]);

  const [isUserRegisteredInEvent, setIsUserRegisteredInEvent] = useState(false);
  const [isCheckingTeamStatus, setIsCheckingTeamStatus] = useState(true);

  // Hydrate existing team registration from Supabase database on page load / refresh
  useEffect(() => {
    if (!rawId || !activeUserEmail) {
      setIsCheckingTeamStatus(false);
      return;
    }

    let isMounted = true;
    const name = currentUser?.name || [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ') || 'TechZen Builder';
    const email = activeUserEmail;

    setUserProfile((prev) => ({ ...prev, fullName: prev.fullName || name, email: prev.email || email }));

    fetch(`/api/teams/user-team?eventId=${encodeURIComponent(rawId)}&userEmail=${encodeURIComponent(email)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted) return;
        if (data && data.isRegistered && data.team) {
          setIsUserRegisteredInEvent(true);
          setTeamInviteCode(data.team.inviteCode);
          if (data.team.teamName) setTeamName(data.team.teamName);
          if (data.team.participantCount) setParticipantCount(data.team.participantCount);
          if (data.team.teammates && data.team.teammates.length > 0) {
            setTeammates(data.team.teammates);
          }
        } else {
          // Check local storage fallback
          try {
            const savedLocalStr = localStorage.getItem(`techzen_event_submission_${rawId}_user`);
            if (savedLocalStr) {
              const savedObj = JSON.parse(savedLocalStr);
              if (savedObj && (savedObj.teamInviteCode || savedObj.teamName)) {
                setIsUserRegisteredInEvent(true);
                if (savedObj.teamInviteCode) setTeamInviteCode(savedObj.teamInviteCode);
                if (savedObj.teamName) setTeamName(savedObj.teamName);
                if (savedObj.teammates && savedObj.teammates.length > 0) {
                  setTeammates(savedObj.teammates);
                }
              } else {
                setIsUserRegisteredInEvent(false);
              }
            } else {
              setIsUserRegisteredInEvent(false);
            }
          } catch (err) {
            setIsUserRegisteredInEvent(false);
          }

          // Check if URL has ?teamInvite parameter
          const searchParams = new URLSearchParams(window.location.search);
          const inviteCodeParam = searchParams.get('teamInvite');
          if (inviteCodeParam) {
            fetch(`/api/teams/${encodeURIComponent(inviteCodeParam)}`)
              .then((res) => (res.ok ? res.json() : null))
              .then((teamData) => {
                if (teamData && isMounted) {
                  setTeamInviteCode(teamData.inviteCode);
                  if (teamData.teamName) setTeamName(teamData.teamName);
                  if (teamData.teammates) setTeammates(teamData.teammates);
                }
              })
              .catch(console.error);
          }
        }
      })
      .catch((e) => {
        console.error('Error fetching user team status from database:', e);
      })
      .finally(() => {
        if (isMounted) setIsCheckingTeamStatus(false);
      });

    return () => {
      isMounted = false;
    };
  }, [rawId, activeUserEmail, currentUser, clerkUser]);

  // Real-time instant SSE sync across devices (0 DB Read Queries on broadcast)
  useEffect(() => {
    if (!rawId) return;

    let eventSource: EventSource | null = null;
    try {
      const url = `/api/teams/stream?eventId=${encodeURIComponent(rawId)}&inviteCode=${encodeURIComponent(teamInviteCode || '')}`;
      eventSource = new EventSource(url);

      eventSource.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'TEAM_UPDATE') {
            if (msg.isWithdrawn) {
              if (activeUserEmail && msg.userEmail && msg.userEmail.toLowerCase() === activeUserEmail.toLowerCase()) {
                setIsUserRegisteredInEvent(false);
                setTeamInviteCode('');
              }
              return;
            }

            if (msg.team) {
              const team = msg.team;
              const cleanUserEmail = (activeUserEmail || '').toLowerCase().trim();

              const isMatchingTeam = teamInviteCode && team.inviteCode === teamInviteCode;
              const isMatchingUser = cleanUserEmail && (
                (team.leaderEmail && team.leaderEmail.toLowerCase().trim() === cleanUserEmail) ||
                (team.teammates || []).some((t: any) => t.email && t.email.toLowerCase().trim() === cleanUserEmail)
              );

              if (isMatchingTeam || isMatchingUser) {
                if (team.teamName) setTeamName(team.teamName);
                if (team.participantCount !== undefined) setParticipantCount(team.participantCount);
                if (Array.isArray(team.teammates)) {
                  setTeammates([...team.teammates]);
                }
                if (team.inviteCode) setTeamInviteCode(team.inviteCode);
                setIsUserRegisteredInEvent(true);

                if (rawId) {
                  localStorage.setItem(`techzen_event_submission_${rawId}_user`, JSON.stringify(team));
                }
              }
            }
          }
        } catch (err) {
          console.error('Error parsing realtime SSE update:', err);
        }
      };
    } catch (e) {
      console.error('Error connecting to SSE stream:', e);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [rawId, teamInviteCode, activeUserEmail]);

  const handleGenerateTeamCode = async () => {
    if (isUserRegisteredInEvent) {
      if (showToast) showToast('⚠️ You are already in a team for this event! You must withdraw your registration to create a new team.', 'error');
      return;
    }

    const name = currentUser?.name || userProfile.fullName || 'TechZen Builder';
    const email = activeUserEmail;
    if (!email) {
      if (showToast) showToast('🔒 Please sign in to generate a team code!', 'error');
      return;
    }

    try {
      const res = await fetch('/api/teams/generate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: rawId, userEmail: email, userName: name })
      });

      if (res.ok) {
        const data = await res.json();
        setTeamInviteCode(data.inviteCode);
        if (data.teamName) setTeamName(data.teamName);
        if (data.participantCount) setParticipantCount(data.participantCount);
        if (data.teammates && data.teammates.length > 0) setTeammates(data.teammates);
        setIsUserRegisteredInEvent(true);
        if (showToast) showToast(`✅ Unique Team Code Generated: ${data.inviteCode}`);
      }
    } catch (e) {
      console.error('Error generating team code:', e);
    }
  };

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
    const targetCount = Math.max(minAllowedMembers, Math.min(count, maxAllowedMembers));
    setParticipantCount(targetCount);
    setTeammates((prev) => {
      if (targetCount > prev.length) {
        const added = [];
        for (let i = prev.length; i < targetCount; i++) {
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
        return prev.slice(0, targetCount);
      }
    });
  };

  const handleAddTeammateSlot = () => {
    if (teammates.length >= maxAllowedMembers) {
      if (showToast) showToast(`⚠️ Maximum capacity reached (${maxAllowedMembers} members)`, 'error');
      return;
    }
    handleParticipantCountChange(teammates.length + 1);
  };

  const handleRemoveTeammateSlot = (indexToRemove: number) => {
    if (teammates.length <= minAllowedMembers) {
      const msg = allowSolo 
        ? '⚠️ Minimum 1 participant required.'
        : `⚠️ Solo participants are NOT allowed for "${displayEvent.title}". Team must have at least 2 members.`;
      setValidationError(msg);
      if (showToast) showToast(msg, 'error');
      return;
    }
    setTeammates(prev => prev.filter((_, idx) => idx !== indexToRemove));
    setParticipantCount(prev => Math.max(minAllowedMembers, prev - 1));
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

    const activeFilledMembers = teammates.filter((t) => t.email && t.email.trim()).length;
    if (!allowSolo && activeFilledMembers < 2) {
      setValidationError("⚠️ Min 2 members required! Share your Team Code with teammates to join your roster.");
      if (showToast) showToast("⚠️ Min 2 members required for team events!", 'error');
      return;
    }
    
    // Check if any active member name, email, or college name is missing
    for (let i = 0; i < teammates.length; i++) {
      const tm = teammates[i];
      if (i === 0 || tm.email) {
        if (!tm.name.trim()) {
          setValidationError(`⚠️ Full Name is compulsory for Member #${i + 1}!`);
          return;
        }
        if (!tm.email.trim()) {
          setValidationError(`⚠️ Email Address is compulsory for Member #${i + 1}!`);
          return;
        }
        if (!tm.phone || !tm.phone.trim()) {
          setValidationError(`⚠️ Phone / WhatsApp Number is compulsory for Member #${i + 1}!`);
          return;
        }
        if (!tm.college || !tm.college.trim()) {
          setValidationError(`⚠️ College / Institution Name is compulsory for Member #${i + 1}!`);
          return;
        }
      }
    }

    // Check if any joined teammate role is unselected or "Others" custom role is empty
    for (let i = 1; i < teammates.length; i++) {
      const tm = teammates[i];
      if (tm.email) {
        if (!tm.role || tm.role === '-- Select Role --') {
          setValidationError(`⚠️ Please select a role for Member #${i + 1}!`);
          return;
        }
        if (tm.role === 'Others (Type Custom Role)' && (!tm.customRole || !tm.customRole.trim())) {
          setValidationError(`⚠️ Please type the custom role for Member #${i + 1}!`);
          return;
        }
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
        setTeamInviteCode('');
        setIsUserRegisteredInEvent(false);
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

  const [isUpdatingRoster, setIsUpdatingRoster] = useState(false);

  const handleCollectiveUpdateTeamInDatabase = async () => {
    if (!teamInviteCode) {
      if (showToast) showToast('⚠️ Unique Team Code is required to update database', 'error');
      return;
    }

    if (isUserLeader && !teamName.trim()) {
      setValidationError('⚠️ Team / Project Name cannot be empty!');
      if (showToast) showToast('⚠️ Team / Project Name cannot be empty!', 'error');
      return;
    }

    setIsUpdatingRoster(true);
    try {
      const editorEmail = activeUserEmail || currentUser?.email || userProfile.email || '';
      const res = await fetch('/api/teams/update-collective', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inviteCode: teamInviteCode,
          teamName: teamName.trim(),
          teammates,
          editorEmail
        })
      });

      if (res.ok) {
        const updatedTeam = await res.json();
        setTeammates(updatedTeam.teammates);
        if (updatedTeam.teamName) setTeamName(updatedTeam.teamName);
        setValidationError('');
        if (showToast) showToast('✅ Collective Update Successful! Team Name, Roles & Colleges saved in Supabase database!');
      } else {
        const err = await res.json();
        if (showToast) showToast(`❌ Update failed: ${err.error}`, 'error');
      }
    } catch (e) {
      console.error('Collective update error:', e);
      if (showToast) showToast('❌ Network error updating team in database', 'error');
    } finally {
      setIsUpdatingRoster(false);
    }
  };

  const handleConfirmRemoveParticipant = async () => {
    if (!removeModal.member || !removeModal.member.email || !teamInviteCode) return;

    const leaderEmail = activeUserEmail || currentUser?.email || userProfile.email || '';
    setRemoveModal((prev) => ({ ...prev, isRemoving: true }));

    try {
      const res = await fetch('/api/teams/remove-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inviteCode: teamInviteCode,
          leaderEmail,
          memberEmail: removeModal.member.email
        })
      });

      if (res.ok) {
        const updatedTeam = await res.json();
        setTeammates(updatedTeam.teammates);
        setParticipantCount(updatedTeam.participantCount);
        if (showToast) showToast(`🗑️ Successfully removed ${removeModal.member.name || 'Participant'} from team!`);
        setRemoveModal({ isOpen: false, member: null, isRemoving: false });
      } else {
        const err = await res.json();
        if (showToast) showToast(`❌ Removal failed: ${err.error}`, 'error');
        setRemoveModal((prev) => ({ ...prev, isRemoving: false }));
      }
    } catch (e) {
      console.error('Remove error:', e);
      if (showToast) showToast('❌ Network error removing participant', 'error');
      setRemoveModal((prev) => ({ ...prev, isRemoving: false }));
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
    if (isUserRegisteredInEvent) {
      const msg = '⚠️ You are already registered for this event! You must withdraw your current registration before joining another team.';
      setValidationError(msg);
      if (showToast) showToast(msg, 'error');
      return;
    }

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

    try {
      // Step 1: Look up team details in database by code
      const res = await fetch(`/api/teams/${code}`);
      if (!res.ok) {
        const errData = await res.json();
        const msg = errData.error || 'Team Code non-existent or expired. Please check the code.';
        setValidationError(`❌ ${msg}`);
        if (showToast) showToast(`⚠️ ${msg}`, 'error');
        return;
      }

      const teamData = await res.json();

      // Check if team is full
      const activeMemberCount = (teamData.teammates || []).filter((t: any) => t.email && t.email.trim()).length;
      if (activeMemberCount >= maxAllowedMembers) {
        const msg = `Team Capacity Reached: Team "${teamData.teamName}" has already reached its maximum limit of ${maxAllowedMembers} members.`;
        setValidationError(`⚠️ ${msg}`);
        if (showToast) showToast(`⚠️ ${msg}`, 'error');
        return;
      }

      // Open Interactive Confirmation Modal asking "Are you sure you wanna be in [Leader Name] ([Leader Email])'s team?"
      const defaults = getSavedProfileDefaults();
      setJoinModal({
        isOpen: true,
        step: 'confirm',
        inviteCode: code,
        teamName: teamData.teamName || 'Team',
        leaderName: teamData.leaderName || 'Team Leader',
        leaderEmail: teamData.leaderEmail || 'leader@gmail.com',
        role: defaults.role || '',
        customRole: defaults.customRole || '',
        college: userProfile.college || defaults.college || '',
        phone: userProfile.phone || defaults.phone || '',
        isSubmitting: false
      });
      setValidationError('');
    } catch (e) {
      console.error(e);
      setValidationError('❌ Failed to connect to server to verify team code');
    }
  };

  const handleConfirmYesJoin = () => {
    // Move from confirmation step to role & college details step
    setJoinModal((prev) => ({ ...prev, step: 'details' }));
  };

  const handleFinalSubmitJoinTeam = async () => {
    if (!joinModal.role || joinModal.role === '-- Select Role --') {
      setValidationError('⚠️ Please select your Role in Team / Task!');
      if (showToast) showToast('⚠️ Please select your Role in Team / Task!', 'error');
      return;
    }

    if (!joinModal.phone || !joinModal.phone.trim()) {
      setValidationError('⚠️ Please enter your Phone / WhatsApp Number!');
      if (showToast) showToast('⚠️ Please enter your Phone Number!', 'error');
      return;
    }

    if (!joinModal.college.trim()) {
      setValidationError('⚠️ Please enter your College / Institution Name!');
      if (showToast) showToast('⚠️ Please enter your College Name!', 'error');
      return;
    }

    const finalRole = joinModal.role === 'Others (Type Custom Role)'
      ? (joinModal.customRole.trim() || '')
      : joinModal.role;

    const userEmail = activeUserEmail || currentUser?.email;
    const userName = currentUser?.name || userProfile.fullName || 'Team Member';

    setJoinModal((prev) => ({ ...prev, isSubmitting: true }));

    try {
      const res = await fetch('/api/teams/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inviteCode: joinModal.inviteCode,
          userEmail,
          userName,
          college: joinModal.college.trim(),
          phone: joinModal.phone.trim(),
          role: finalRole
        })
      });

      if (res.ok) {
        const updatedTeam = await res.json();
        saveProfileDefaults({
          college: joinModal.college.trim(),
          phone: joinModal.phone.trim(),
          role: joinModal.role,
          customRole: joinModal.customRole,
          fullName: userName
        });
        setTeammates(updatedTeam.teammates);
        setParticipantCount(updatedTeam.participantCount);
        if (updatedTeam.teamName) setTeamName(updatedTeam.teamName);
        setTeamInviteCode(joinModal.inviteCode);
        setIsUserRegisteredInEvent(true);

        if (rawId) {
          localStorage.setItem(`techzen_team_invite_${rawId}_${joinModal.inviteCode}`, JSON.stringify(updatedTeam));
          localStorage.setItem(`techzen_event_submission_${rawId}_user`, JSON.stringify(updatedTeam));
        }

        if (showToast) showToast(`🎉 Success! You joined ${joinModal.leaderName}'s team "${updatedTeam.teamName}"!`);
        setValidationError('');
        setJoinCodeInput('');
        setIncomingInvite(null);
        setJoinModal((prev) => ({ ...prev, isOpen: false, isSubmitting: false }));
        return;
      } else {
        const errData = await res.json();
        const msg = errData.error || 'Unable to join team.';
        setValidationError(`❌ ${msg}`);
        if (showToast) showToast(`⚠️ ${msg}`, 'error');
        setJoinModal((prev) => ({ ...prev, isSubmitting: false }));
      }
    } catch (e) {
      console.error('Join error:', e);
      setValidationError('❌ Failed to connect to server');
      setJoinModal((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  const handleJoinTeamAsMember = async () => {
    if (!currentUser) {
      if (showToast) showToast('🔒 Please sign in to join this team!', 'error');
      if (typeof openAuth === 'function') openAuth('login');
      return;
    }

    const inviteParam = new URLSearchParams(window.location.search).get('teamInvite');
    const targetInviteCode = inviteParam || teamInviteCode;
    if (targetInviteCode) {
      setJoinCodeInput(targetInviteCode);
      try {
        const res = await fetch(`/api/teams/${targetInviteCode}`);
        if (res.ok) {
          const teamData = await res.json();
          setJoinModal({
            isOpen: true,
            step: 'confirm',
            inviteCode: targetInviteCode,
            teamName: teamData.teamName || 'Team',
            leaderName: teamData.leaderName || 'Team Leader',
            leaderEmail: teamData.leaderEmail || 'leader@gmail.com',
            role: '',
            customRole: '',
            college: userProfile.college || '',
            isSubmitting: false
          });
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }
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

    if (!isUserLeader) {
      setValidationError('🔒 Access Denied: Only the Team Leader can submit or edit final Project & PPT details.');
      if (showToast) showToast('🔒 Only the Team Leader can submit project & PPT presentation!', 'error');
      return;
    }

    // Strict validation: ALL fields are compulsory
    if (!projectSubmission.title.trim()) {
      setValidationError('⚠️ Project Title is compulsory!');
      return;
    }
    if (!projectSubmission.pptUrl.trim()) {
      setValidationError('⚠️ Presentation PPT / Pitch Deck Link is compulsory! Please make sure your Google Drive link is set to Public View ("Anyone with the link can view").');
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
      <main className="bg-[#000000] text-white min-h-screen">
        
        {/* Banner Section */}
        <section className="relative overflow-hidden border-b border-white/10 bg-[#050505] py-8 px-4 sm:py-16 sm:px-8 lg:px-12">
          {displayEvent.coverImage && (
            <img src={displayEvent.coverImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-[#000000]/80 to-transparent" />
          
          <div className="relative mx-auto max-w-[1440px]">
            <div className="flex items-center justify-between gap-4 mb-4 sm:mb-6">
              <Link href="/all-events" className="inline-flex items-center gap-2 font-mono text-xs text-white/50 hover:text-[#ef2635] transition-colors">
                <ArrowLeft size={14} /> Back to all events
              </Link>

              {/* Verified Admin Delete Event Button */}
              {effectiveIsAdmin && (
                <button
                  type="button"
                  onClick={handleDeleteCurrentEvent}
                  className="bg-rose-950/80 hover:bg-rose-900 border border-rose-700/60 text-rose-300 px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-mono font-bold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer shadow-lg"
                >
                  <Trash2 size={14} /> Delete Event Post
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 font-mono text-[9px] sm:text-[10px] uppercase tracking-wider mb-3 sm:mb-4">
              <span className="bg-[#ef2635] px-2 py-0.5 sm:px-2.5 sm:py-1 text-white font-bold">{displayEvent.category}</span>
              <span className="border border-white/20 px-2 py-0.5 sm:px-2.5 sm:py-1 text-white/55">{displayEvent.format || 'ONLINE'}</span>
              <span className="border border-[#ef2635]/50 text-[#ef2635] px-2 py-0.5 sm:px-2.5 sm:py-1 font-bold">
                TEAM SIZE: UP TO {maxAllowedMembers} MEMBERS
              </span>
            </div>

            <h1 className="text-2xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white leading-tight">{displayEvent.title}</h1>
            <p className="mt-2 sm:mt-4 text-xs sm:text-base text-white/60 max-w-2xl leading-relaxed">{displayEvent.tagline || displayEvent.description}</p>
          </div>
        </section>

        {/* Tab Navigation Bar */}
        <div className="border-b border-white/10 bg-[#080808]">
          <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12 flex space-x-2 overflow-x-auto no-scrollbar whitespace-nowrap font-mono text-xs">
            <button
              onClick={() => handleTabClick('event')}
              className={`py-3.5 sm:py-4 px-4 sm:px-5 font-bold transition border-b-2 flex items-center space-x-2 shrink-0 cursor-pointer ${
                activeTab === 'event' ? 'border-[#ef2635] text-white bg-white/[0.03]' : 'border-transparent text-white/45 hover:text-white'
              }`}
            >
              <CalendarDays size={16} className="text-[#ef2635]" />
              <span>Event Info & Details</span>
            </button>

            <button
              onClick={() => handleTabClick('team')}
              className={`py-3.5 sm:py-4 px-4 sm:px-5 font-bold transition border-b-2 flex items-center space-x-2 shrink-0 cursor-pointer ${
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
                className={`py-3.5 sm:py-4 px-4 sm:px-5 font-bold transition border-b-2 flex items-center space-x-2 shrink-0 cursor-pointer ${
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
                  <div className="flex flex-wrap gap-4 text-xs font-mono text-white/60 p-4 border border-white/10 bg-[#0d0d0d] rounded-none">
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
                <div className="border border-white/15 bg-[#0a0a0a] p-6 rounded-none space-y-4">
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
                    className="w-full border border-white/20 bg-[#121212] hover:bg-[#181818] text-white font-mono text-xs py-2.5 transition flex items-center justify-center gap-2 cursor-pointer font-bold"
                  >
                    <Users size={14} className="text-[#ef2635]" />
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
              <div className="w-full border border-[#ef2635]/40 bg-[#0a0a0a] p-8 sm:p-12 rounded-none text-center space-y-6">
                <div className="w-16 h-16 rounded-none bg-[#ef2635]/15 border border-[#ef2635]/40 flex items-center justify-center mx-auto text-[#ef2635]">
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
              <div className="max-w-[1440px] mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* Left Column: Team & Member Details Forms */}
                  <div className="lg:col-span-7 space-y-8">
                    {/* Step 1: Team Name & Participant Count Selector */}
                    <div className="border border-white/10 bg-[#0a0a0a] p-6 sm:p-8 space-y-5 shadow-sm">
                      <div className="flex items-center justify-between border-b border-white/10 pb-4">
                        <div className="flex items-center gap-3">
                          <Users size={20} className="text-[#ef2635]" />
                          <h2 className="text-lg font-bold font-mono uppercase text-white">1. Team Name & Participant Count</h2>
                        </div>
                        <span className="font-mono text-xs text-white/60 font-medium">
                          Allowed: {minAllowedMembers} to {maxAllowedMembers} Members {allowSolo ? '' : '(Solo Not Allowed)'}
                        </span>
                      </div>

                      <div className="grid gap-5 sm:grid-cols-2 text-xs font-mono">
                        <div>
                          <label className="block text-white/70 mb-1.5 font-semibold flex items-center justify-between">
                            <span>Team / Project Name *</span>
                            {!isUserLeader && (
                              <span className="text-[10px] text-amber-400 font-normal bg-amber-950/60 px-2 py-0.5 border border-amber-800/40">
                                🔒 Leader Edit Only
                              </span>
                            )}
                          </label>
                          <input
                            type="text"
                            required
                            readOnly={!isUserLeader}
                            value={teamName}
                            onChange={(e) => {
                              setTeamName(e.target.value);
                              setValidationError('');
                            }}
                            placeholder="e.g. Cipher Cyber Squad"
                            className={`w-full px-3.5 py-2.5 font-mono outline-none transition ${
                              !isUserLeader
                                ? 'bg-[#0e0e0e] border border-white/5 text-white/50 cursor-not-allowed'
                                : 'bg-[#121212] border border-white/15 text-white focus:border-[#ef2635]'
                            }`}
                          />
                        </div>

                        <div>
                          <label className="block text-white/70 mb-1.5 font-semibold flex items-center justify-between">
                            <span>Event Team Capacity *</span>
                            <span className="text-[10px] text-[#ef2635] font-bold uppercase">
                              {allowSolo ? 'Solo & Team Allowed' : 'Team Only (Min 2 Members)'}
                            </span>
                          </label>
                          <div className="w-full bg-[#0e0e0e] border border-white/10 px-3.5 py-2.5 text-[#ef2635] font-mono font-bold flex items-center justify-between">
                            <span>{allowSolo ? `1 to ${maxAllowedMembers} Members Allowed` : `2 to ${maxAllowedMembers} Members Allowed`} (Max {maxTeamsAllowed} Teams Limit)</span>
                            <span className="text-[10px] bg-[#ef2635]/15 text-[#ef2635] border border-[#ef2635]/40 px-2 py-0.5 uppercase font-mono font-bold">
                              Admin Limit
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Step 2: Member Slots Dynamic Form */}
                    <div className="border border-white/10 bg-[#0a0a0a] p-6 sm:p-8 space-y-6 shadow-sm">
                      <div className="flex items-center justify-between border-b border-white/10 pb-4 flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                          <ShieldCheck size={20} className="text-[#ef2635]" />
                          <h2 className="text-lg font-bold font-mono uppercase text-white">
                            2. Member Details, Colleges & Roles ({teammates.length} Selected)
                          </h2>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={handleCollectiveUpdateTeamInDatabase}
                            disabled={isUpdatingRoster}
                            className="bg-[#ef2635] hover:bg-[#ff3d4b] text-white font-mono text-xs font-semibold px-4 py-1.5 uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                          >
                            <Save size={14} />
                            <span>{isUpdatingRoster ? 'SAVING...' : 'UPDATE TEAM DETAILS'}</span>
                          </button>
                          <span className="font-mono text-xs text-white/40">{teammates.length} / {maxAllowedMembers} Slots</span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {teammates.map((member, index) => {
                          const isLead = index === 0;
                          const isSelf = !!member.email && (member.email.toLowerCase().trim() === (activeUserEmail || currentUser?.email || userProfile.email || '').toLowerCase().trim());
                          const canEditMember = isLead ? isUserLeader : (isUserLeader || isSelf);
                          const canEditName = isLead ? isUserLeader : isSelf;

                          return (
                            <div
                              key={member.id}
                              className={`border p-5 transition rounded-none ${
                                isLead
                                  ? 'border-[#ef2635]/40 bg-[#ef2635]/[.03]'
                                  : isSelf
                                  ? 'border-[#ef2635]/30 bg-black/60'
                                  : 'border-white/10 bg-black/40'
                              }`}
                            >
                              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4 flex-wrap gap-2">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${
                                      isLead
                                        ? 'bg-[#ef2635] text-white'
                                        : 'border border-white/20 text-white/70'
                                    }`}
                                  >
                                    Member #{index + 1} {isLead && '— Team Leader'}
                                  </span>
                                  {isSelf && !isLead && (
                                    <span className="bg-[#ef2635]/20 text-[#ef2635] border border-[#ef2635]/40 px-2 py-0.5 font-mono text-[9px] font-bold uppercase">
                                      YOU (Teammate Edit Access)
                                    </span>
                                  )}
                                </div>

                                <span className="font-mono text-[10px] text-white/40 uppercase flex items-center gap-2">
                                  {isLead ? 'Primary Event Contact' : `Teammate Slot #${index + 1}`}
                                  {!isLead && isUserLeader && teammates.length > minAllowedMembers && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveTeammateSlot(index)}
                                      className="text-[10px] text-rose-400 hover:text-rose-300 font-mono flex items-center gap-1 bg-rose-950/40 hover:bg-rose-900/60 px-2 py-0.5 border border-rose-800/40 cursor-pointer"
                                      title="Remove this member slot"
                                    >
                                      <Trash2 size={12} />
                                      <span>Remove</span>
                                    </button>
                                  )}
                                </span>
                              </div>

                              <div className="grid gap-4 sm:grid-cols-2 text-xs font-mono">
                                <div>
                                  <label className="block text-white/60 mb-1 flex items-center justify-between gap-1 flex-wrap">
                                    <span>Full Name *</span>
                                    {!canEditName && (
                                      <span className="text-[9px] text-white/40 italic shrink-0">Self Edit Only</span>
                                    )}
                                  </label>
                                  <input
                                    type="text"
                                    required
                                    readOnly={!canEditName}
                                    value={member.name || ''}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setTeammates((prev) => prev.map((t) => (t.id === member.id ? { ...t, name: val } : t)));
                                      setValidationError('');
                                    }}
                                    placeholder="Builder Name"
                                    className={`w-full px-3 py-2 outline-none font-mono ${
                                      !canEditName
                                        ? 'bg-[#0e0e0e] border border-white/5 text-white/40 cursor-not-allowed'
                                        : 'bg-[#121212] border border-white/15 text-white focus:border-[#ef2635]'
                                    }`}
                                  />
                                </div>

                                <div>
                                  <label className="block text-white/60 mb-1 flex items-center justify-between gap-1 flex-wrap">
                                    <span>Email Address *</span>
                                    {(isLead || !canEditMember) && (
                                      <span className="text-[9px] text-white/40 italic shrink-0">Protected / Locked</span>
                                    )}
                                  </label>
                                  <input
                                    type="email"
                                    required
                                    readOnly={isLead || !canEditMember}
                                    value={member.email || ''}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setTeammates((prev) => prev.map((t) => (t.id === member.id ? { ...t, email: val } : t)));
                                      setValidationError('');
                                    }}
                                    placeholder="email@example.com"
                                    className={`w-full px-3 py-2 outline-none font-mono ${
                                      isLead || !canEditMember
                                        ? 'bg-[#0e0e0e] border border-white/5 text-white/40 cursor-not-allowed'
                                        : 'bg-[#121212] border border-white/15 text-white focus:border-[#ef2635]'
                                    }`}
                                  />
                                </div>

                                <div>
                                  <label className="block text-white/60 mb-1 flex items-center justify-between gap-1 flex-wrap">
                                    <span>Phone / WhatsApp *</span>
                                    {!canEditMember && (
                                      <span className="text-[9px] text-white/40 italic shrink-0">Locked</span>
                                    )}
                                  </label>
                                  <div className="flex items-center">
                                    <span className={`px-3 py-2 font-mono text-xs border border-r-0 select-none ${
                                      !canEditMember
                                        ? 'bg-[#0e0e0e] border-white/5 text-white/30'
                                        : 'bg-[#181818] border-white/15 text-white/70'
                                    }`}>
                                      +91
                                    </span>
                                    <input
                                      type="tel"
                                      required
                                      readOnly={!canEditMember}
                                      value={(() => {
                                        let p = member.phone || '';
                                        if (p.startsWith('+91')) p = p.slice(3);
                                        else if (p.length === 12 && p.startsWith('91')) p = p.slice(2);
                                        return p;
                                      })()}
                                      onChange={(e) => {
                                        let val = e.target.value;
                                        if (val.startsWith('+91')) val = val.slice(3);
                                        else if (val.length === 12 && val.startsWith('91')) val = val.slice(2);
                                        val = val.replace(/\D/g, '').slice(0, 10);
                                        setTeammates((prev) => prev.map((t) => (t.id === member.id ? { ...t, phone: val } : t)));
                                        setValidationError('');
                                        if (isLead || isSelf) {
                                          saveProfileDefaults({ phone: val });
                                        }
                                      }}
                                      placeholder="9876543210"
                                      maxLength={10}
                                      className={`w-full px-3 py-2 outline-none font-mono ${
                                        !canEditMember
                                          ? 'bg-[#0e0e0e] border border-white/5 text-white/40 cursor-not-allowed'
                                          : 'bg-[#121212] border border-white/15 text-white focus:border-[#ef2635]'
                                      }`}
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-white/60 mb-1 flex items-center justify-between gap-1 flex-wrap">
                                    <span>College Name *</span>
                                    {!canEditMember && (
                                      <span className="text-[9px] text-white/40 italic font-normal shrink-0">Locked</span>
                                    )}
                                  </label>
                                  <input
                                    type="text"
                                    required
                                    readOnly={!canEditMember}
                                    value={member.college || ''}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setTeammates((prev) => prev.map((t) => (t.id === member.id ? { ...t, college: val } : t)));
                                      setValidationError('');
                                    }}
                                    placeholder="College / Institution Name"
                                    className={`w-full px-3 py-2 outline-none font-mono ${
                                      !canEditMember
                                        ? 'bg-[#0e0e0e] border border-white/5 text-white/40 cursor-not-allowed'
                                        : 'bg-[#121212] border border-white/15 text-white focus:border-[#ef2635]'
                                    }`}
                                  />
                                </div>

                                <div className="sm:col-span-2">
                                  <label className="block text-white/60 mb-1 flex items-center justify-between gap-1 flex-wrap">
                                    <span>Role in Team / Task *</span>
                                    {!canEditMember && (
                                      <span className="text-[9px] text-white/40 italic font-normal shrink-0">Locked</span>
                                    )}
                                  </label>
                                  {!canEditMember ? (
                                    <input
                                      type="text"
                                      readOnly
                                      value={member.customRole || member.role || 'Teammate'}
                                      className="w-full px-3 py-2 bg-[#0e0e0e] border border-white/5 text-white/40 font-mono cursor-not-allowed outline-none"
                                    />
                                  ) : (
                                    <div className="space-y-1.5">
                                      <select
                                        value={member.role || ''}
                                        onChange={(e) => {
                                          const roleVal = e.target.value;
                                          setTeammates((prev) =>
                                            prev.map((t) => (t.id === member.id ? { ...t, role: roleVal } : t))
                                          );
                                          setValidationError('');
                                        }}
                                        className="w-full bg-[#121212] border border-white/15 px-3 py-2 text-white text-xs font-mono outline-none focus:border-[#ef2635]"
                                      >
                                        {TEAMMATE_ROLE_OPTIONS.map((opt) => (
                                          <option key={opt} value={opt === '-- Select Role --' ? '' : opt} className="bg-[#0a0a0a] text-white">
                                            {opt}
                                          </option>
                                        ))}
                                      </select>

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
                                          placeholder="Type custom role (e.g. DevOps)"
                                          className="w-full bg-black border border-[#ef2635]/60 px-3 py-1.5 text-white text-xs font-mono outline-none focus:border-[#ef2635]"
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

                      {!allowSolo && teammates.length < 2 && (
                        <div className="p-3.5 bg-[#0f0f12] border border-[#ef2635]/30 text-xs font-mono rounded-none mt-3 flex items-center justify-between gap-3 flex-wrap">
                          <div className="flex items-center gap-2.5 text-white/90">
                            <Users size={16} className="text-[#ef2635] shrink-0" />
                            <span>
                              <strong className="text-[#ef2635] font-bold">Team Only Event:</strong> Min 2 members required. Share your <span className="text-white font-bold underline decoration-[#ef2635]">Team Code</span> for teammates to join.
                            </span>
                          </div>
                          <span className="text-[10px] text-white/50 font-mono bg-white/5 px-2 py-0.5 border border-white/10 font-bold uppercase tracking-wider">
                            {teammates.length} / {minAllowedMembers} Members
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Validation & Save Action Bar */}
                    <div className="space-y-3 pt-2">
                      {validationError && (
                        <div className="p-3 bg-rose-950/80 border border-rose-700/80 text-rose-300 font-mono text-xs font-bold">
                          {validationError}
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="font-mono text-xs text-[#ef2635] font-bold">
                          {savedStatus}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
                          <button
                            type="button"
                            onClick={handleCollectiveUpdateTeamInDatabase}
                            disabled={isUpdatingRoster}
                            className="bg-[#ef2635] hover:bg-[#ff3d4b] text-white font-mono text-xs font-semibold px-5 py-2.5 uppercase tracking-wider transition flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(239,38,53,0.3)] disabled:opacity-50"
                          >
                            <Save size={15} />
                            <span>{isUpdatingRoster ? 'SAVING...' : 'UPDATE TEAM & ROSTER DETAILS'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleSaveTeamDetails}
                            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-mono text-xs font-semibold px-5 py-2.5 uppercase tracking-wider transition flex items-center gap-2 cursor-pointer shadow-sm"
                          >
                            <Users size={15} />
                            <span>{isQuizEvent ? 'Save Team Details' : 'Proceed to Project & PPT Submission'}</span>
                          </button>

                          {(isUserRegisteredInEvent || teamInviteCode) && (
                            <button
                              type="button"
                              onClick={handleWithdrawRegistration}
                              disabled={isWithdrawing}
                              className="border border-rose-700/80 bg-rose-950/80 hover:bg-rose-900 text-rose-300 font-mono text-xs font-bold px-5 py-2.5 uppercase tracking-wider transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                              <Trash2 size={15} />
                              <span>{isWithdrawing ? 'WITHDRAWING...' : 'WITHDRAW REGISTRATION'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Status Cards & Invite Options (Placed in Right Hand Side Vacant Space) */}
                  <div className="lg:col-span-5 space-y-6">
                    {/* Teammate Invitation Card (When opening a leader's shareable link) */}
                    {incomingInvite && (
                      <div className="border border-[#ef2635]/50 bg-black p-6 rounded-none space-y-3 animate-fadeIn">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-[#ef2635] font-mono text-xs font-bold uppercase">
                              <Users size={16} />
                              <span>Official Team Invitation</span>
                            </div>
                            <h3 className="text-base font-bold text-white font-mono">
                              You've been invited to join <span className="text-[#ef2635]">"{incomingInvite.teamName || 'Team'}"</span>
                            </h3>
                            <p className="text-xs text-white/60">
                              Team Leader: <strong className="text-white">{incomingInvite.leaderName}</strong> ({incomingInvite.leaderEmail})
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleJoinTeamAsMember}
                            className="bg-[#ef2635] hover:bg-[#ff3d4b] text-white font-mono font-bold px-6 py-3 text-xs uppercase tracking-wider transition cursor-pointer shadow-[0_0_15px_rgba(239,38,53,0.3)] shrink-0 flex items-center gap-2"
                          >
                            <span>Join Team Now</span>
                            <ArrowUpRight size={15} />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Card 1: Active Event Registration Status */}
                    {isUserRegisteredInEvent && (
                      <div className="border border-[#ef2635]/50 bg-gradient-to-r from-red-950/40 via-black/80 to-black/60 p-6 rounded-none space-y-4 shadow-[0_0_25px_rgba(239,38,53,0.15)] flex flex-col justify-between">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3 flex-wrap gap-2">
                          <div className="flex items-center gap-2 text-[#ef2635] font-mono text-xs font-bold uppercase tracking-wider">
                            <ShieldCheck size={18} />
                            <span>Active Event Registration Status</span>
                          </div>
                          <span className="text-[10px] font-mono text-white bg-[#ef2635] border border-[#ef2635] px-3 py-1 font-bold uppercase rounded-none">
                            ✓ Registered Participant
                          </span>
                        </div>

                        <div className="space-y-2 flex-1">
                          <p className="text-xs text-white/70 font-sans leading-relaxed">
                            You are registered for <strong className="text-white">{displayEvent.title}</strong> in team <strong className="text-[#ef2635] font-mono text-sm font-bold">"{teamName || 'Your Team'}"</strong>.
                          </p>
                          <p className="text-[11px] font-mono text-white/50">
                            To join another team or create a new team, you must first withdraw your current registration application below.
                          </p>
                        </div>

                        <div className="pt-2 flex justify-end">
                          <button
                            type="button"
                            onClick={handleWithdrawRegistration}
                            disabled={isWithdrawing}
                            className="w-full sm:w-auto border border-rose-700/60 bg-rose-950/70 hover:bg-rose-900 text-rose-300 font-mono text-xs font-bold px-5 py-2.5 uppercase tracking-wider transition cursor-pointer shrink-0 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(225,29,72,0.25)]"
                          >
                            <Trash2 size={14} />
                            <span>{isWithdrawing ? 'Withdrawing...' : 'Withdraw Registration'}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Card 2: Unique Leader Team Code */}
                    {teamInviteCode && (
                      <div className="border border-white/10 bg-[#0a0a0a] p-6 space-y-4 shadow-sm rounded-none flex flex-col justify-between">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3 flex-wrap gap-2">
                          <div className="flex items-center gap-2 text-white font-mono text-xs font-bold uppercase tracking-wider">
                            <ShieldCheck size={16} className="text-[#ef2635]" />
                            <span>Your Unique Team Code (Give to Teammates)</span>
                          </div>
                          <span className="text-[10px] font-mono text-[#ef2635] bg-[#ef2635]/10 border border-[#ef2635]/40 px-2.5 py-1 font-bold uppercase">
                            Leader Code
                          </span>
                        </div>

                        <p className="text-xs text-white/70 font-sans leading-relaxed flex-1">
                          Share this unique code with your teammates so they can enter it and join <strong className="text-white">{teamName || 'your team'}</strong>!
                        </p>

                        {/* Unique Code Banner */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#121212] border border-white/10 p-4">
                          <div>
                            <span className="text-[10px] text-white/50 uppercase font-mono tracking-wider block">Unique Team Code:</span>
                            <span className="text-xl font-extrabold text-[#ef2635] font-mono tracking-widest">{teamInviteCode}</span>
                          </div>
                          <button
                            type="button"
                            onClick={handleCopyTeamCode}
                            className="bg-[#ef2635] hover:bg-[#ff3d4b] text-white font-mono text-xs font-bold px-5 py-2.5 uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm shrink-0 w-full sm:w-auto"
                          >
                            {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                            <span>{copiedCode ? 'Code Copied!' : 'Copy Team Code'}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Unregistered User Options */}
                    {!isUserRegisteredInEvent && (
                      <div className="space-y-6">
                        {/* Option A: Join Existing Team via Unique Code */}
                        <div className="border border-white/10 bg-[#0a0a0a] p-6 rounded-none space-y-4">
                          <div className="flex items-center justify-between border-b border-white/10 pb-3">
                            <div className="flex items-center gap-2 text-white font-mono text-xs font-bold uppercase tracking-wider">
                              <Users size={16} className="text-[#ef2635]" />
                              <span>Join Existing Team via Unique Code</span>
                            </div>
                            <span className="text-[10px] font-mono text-white bg-white/10 border border-white/20 px-2.5 py-1 font-bold uppercase">
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
                              placeholder="ENTER TEAM CODE (e.g. TZ-EVT-USER1234)"
                              className="w-full bg-[#121212] border border-white/15 px-4 py-3 text-xs font-mono text-white placeholder-white/40 uppercase tracking-widest outline-none focus:border-[#ef2635]"
                            />
                            <button
                              type="button"
                              onClick={handleJoinByCodeSubmit}
                              className="w-full sm:w-auto bg-[#ef2635] hover:bg-[#ff3d4b] text-white font-mono text-xs font-bold px-7 py-3 uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2 shrink-0 shadow-[0_0_15px_rgba(239,38,53,0.3)]"
                            >
                              <span>Join Team</span>
                              <ArrowUpRight size={15} />
                            </button>
                          </div>
                        </div>

                        {/* Option B: Create New Team & Generate Unique Code */}
                        {!teamInviteCode && (
                          <div className="border border-[#ef2635]/40 bg-gradient-to-r from-[#ef2635]/15 via-black/80 to-black/60 p-6 rounded-none space-y-4">
                            <div className="flex items-center justify-between border-b border-white/10 pb-3">
                              <div className="flex items-center gap-2 text-[#ef2635] font-mono text-xs font-bold uppercase tracking-wider">
                                <ShieldCheck size={16} />
                                <span>Create Your Team (Team Leader)</span>
                              </div>
                              <span className="text-[10px] font-mono text-[#ef2635] bg-[#ef2635]/10 border border-[#ef2635]/40 px-2.5 py-1 font-bold uppercase">
                                Leader Option
                              </span>
                            </div>
                            <p className="text-xs text-white/70">
                              Want to register as a Team Leader? Click below to generate your database-verified Team Code and invite teammates!
                            </p>
                            <button
                              type="button"
                              onClick={handleGenerateTeamCode}
                              className="bg-[#ef2635] hover:bg-[#ff3d4b] text-white font-mono text-xs font-bold px-6 py-3 uppercase tracking-wider transition cursor-pointer flex items-center gap-2 shadow-[0_0_15px_rgba(239,38,53,0.35)]"
                            >
                              <ShieldCheck size={16} />
                              <span>Generate Unique Team Code</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          )}

          {/* TAB 3: PROJECT & PPT SUBMISSION (All fields compulsory for Hackathons) */}
          {!isQuizEvent && activeTab === 'project' && (
            !currentUser ? (
              <div className="w-full border border-[#ef2635]/40 bg-[#161214] p-8 sm:p-12 rounded-none text-center space-y-6">
                <div className="w-16 h-16 rounded-none bg-[#ef2635]/15 border border-[#ef2635]/40 flex items-center justify-center mx-auto text-[#ef2635]">
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
            ) : !isUserLeader ? (
              <div className="w-full border border-[#ef2635]/40 bg-[#0a0a0a] p-8 sm:p-12 rounded-none space-y-6 text-center shadow-xl">
                <div className="w-16 h-16 rounded-none bg-[#ef2635]/15 border border-[#ef2635]/40 flex items-center justify-center mx-auto text-[#ef2635]">
                  <ShieldCheck size={32} />
                </div>
                <div className="space-y-3">
                  <div className="font-mono text-xs text-[#ef2635] font-bold uppercase tracking-widest flex items-center justify-center gap-1.5">
                    <ShieldCheck size={16} />
                    <span>LEADER ACCESS ONLY</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold font-mono text-white uppercase">
                    Ask Your Team Admin to Fulfill Project Details
                  </h2>
                  <p className="text-sm text-white/70 max-w-lg mx-auto font-mono leading-relaxed">
                    Only your Team Admin / Leader (<strong className="text-white">{teammates[0]?.name || 'Team Leader'}</strong> — <span className="text-sky-300 font-mono">{teammates[0]?.email || 'leader@gmail.com'}</span>) has authorization to fill out and submit the project details, pitch deck presentation link, GitHub repository, and tech stack.
                  </p>
                </div>

                {projectSubmission.submittedAt ? (
                  <div className="p-3.5 bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 font-mono text-xs font-bold inline-block">
                    ✓ Project Submitted by Leader on {projectSubmission.submittedAt}
                  </div>
                ) : (
                  <p className="text-xs text-white/40 font-mono italic">
                    Please ask your Team Admin to complete and submit your team's project details before the evaluation deadline.
                  </p>
                )}
              </div>
            ) : (
              <form onSubmit={handleSaveSubmission} className="w-full space-y-8">
                <div className="border border-white/10 bg-[#0a0a0a] p-6 sm:p-8 rounded-none space-y-6 shadow-sm">
                  <div className="flex items-center gap-3 border-b border-white/10 pb-4 justify-between flex-wrap">
                    <div className="flex items-center gap-3">
                      <Code size={18} className="text-[#ef2635]" />
                      <h2 className="text-lg font-bold font-mono uppercase text-white">3. Hackathon Project & PPT Submission</h2>
                    </div>
                    {projectSubmission.submittedAt ? (
                      <span className="font-mono text-xs text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-3 py-1 font-bold rounded-none">
                        STATUS: SUBMITTED
                      </span>
                    ) : (
                      <span className="font-mono text-xs text-amber-400 bg-amber-950/80 border border-amber-800/60 px-3 py-1 font-bold rounded-none">
                        STATUS: PENDING DRAFT
                      </span>
                    )}
                  </div>

                  <div className="p-3 bg-[#121212] border border-white/10 rounded-none text-white/70 font-mono text-xs">
                    📌 <strong>Note:</strong> All submission fields marked with <span className="text-[#ef2635] font-bold">*</span> are <strong>compulsory</strong> for jury evaluation.
                  </div>

                  <fieldset className="space-y-5 text-xs font-mono">
                    <div>
                      <label className="block text-white/80 mb-1.5 font-semibold">Select Hackathon Track <span className="text-[#ef2635] font-bold">*</span></label>
                      <select
                        required
                        value={projectSubmission.track}
                        onChange={(e) => setProjectSubmission((prev) => ({ ...prev, track: e.target.value }))}
                        className="w-full bg-[#121212] border border-white/15 px-3.5 py-2.5 text-white font-mono outline-none focus:border-[#ef2635] rounded-none"
                      >
                        <option value="Software Track">💻 Software Track (AI, Web/Mobile, Cloud, Blockchain)</option>
                        <option value="Hardware Track">⚙️ Hardware Track (IoT, Smart Robots, Embedded Systems)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-white/80 mb-1.5 font-semibold">Project Title <span className="text-[#ef2635] font-bold">*</span></label>
                      <input
                        type="text"
                        required
                        value={projectSubmission.title}
                        onChange={(e) => {
                          setProjectSubmission((prev) => ({ ...prev, title: e.target.value }));
                          setValidationError('');
                        }}
                        placeholder="e.g. CipherGuard Fraud Detection System"
                        className="w-full bg-[#121212] border border-white/15 px-3.5 py-2.5 text-white font-mono outline-none focus:border-[#ef2635] rounded-none"
                      />
                    </div>

                    {/* PPT Presentation Google Drive / Deck Link Box */}
                    <div className="p-5 border border-white/10 bg-[#121212] rounded-none space-y-3">
                      <div className="flex items-center gap-2 text-sm font-mono font-bold text-[#ef2635]">
                        <FileText size={18} />
                        <span>PRESENTATION PPT / PITCH DECK DRIVE LINK <span className="text-[#ef2635] font-bold">*</span></span>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-white/80 mb-1.5 font-semibold text-xs">
                            PPT / Pitch Deck URL (Google Drive, Google Slides, Canva, Drive Link) <span className="text-[#ef2635] font-bold">*</span>
                          </label>
                          <input
                            type="url"
                            required
                            value={projectSubmission.pptUrl}
                            onChange={(e) => {
                              setProjectSubmission((prev) => ({ ...prev, pptUrl: e.target.value }));
                              setValidationError('');
                            }}
                            placeholder="https://drive.google.com/file/d/... or https://docs.google.com/presentation/d/..."
                            className="w-full bg-[#181818] border border-white/15 px-3.5 py-2.5 text-white font-mono text-xs outline-none focus:border-[#ef2635] rounded-none"
                          />
                        </div>

                        {/* Public View Permission Notice */}
                        <div className="p-3.5 bg-amber-950/40 border border-amber-500/40 text-amber-200 font-mono text-[11px] flex items-start gap-2.5 leading-relaxed shadow-sm">
                          <span className="text-amber-400 text-base font-bold shrink-0 leading-none">⚠️</span>
                          <span>
                            <strong className="text-amber-300 font-bold uppercase tracking-wider">Public View Permission Notice:</strong> Please ensure your Google Drive or Slides link access permissions are set to <strong className="text-white underline font-bold">"Anyone with the link can view" (Public Access)</strong> before submitting, so that the jury evaluation panel can open and assess your deck seamlessly.
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-white/80 mb-1.5 font-semibold">GitHub Repository URL <span className="text-[#ef2635] font-bold">*</span></label>
                        <input
                          type="url"
                          required
                          value={projectSubmission.repoUrl}
                          onChange={(e) => {
                            setProjectSubmission((prev) => ({ ...prev, repoUrl: e.target.value }));
                            setValidationError('');
                          }}
                          placeholder="https://github.com/user/project"
                          className="w-full bg-[#121212] border border-white/15 px-3.5 py-2.5 text-white font-mono outline-none focus:border-[#ef2635] rounded-none"
                        />
                      </div>

                      <div>
                        <label className="block text-white/80 mb-1.5 font-semibold">Live Demo / Video Link <span className="text-[#ef2635] font-bold">*</span></label>
                        <input
                          type="url"
                          required
                          value={projectSubmission.demoUrl}
                          onChange={(e) => {
                            setProjectSubmission((prev) => ({ ...prev, demoUrl: e.target.value }));
                            setValidationError('');
                          }}
                          placeholder="https://my-demo.vercel.app or YouTube"
                          className="w-full bg-[#121212] border border-white/15 px-3.5 py-2.5 text-white font-mono outline-none focus:border-[#ef2635] rounded-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-white/80 mb-1.5 font-semibold">Tech Stack Used <span className="text-[#ef2635] font-bold">*</span></label>
                      <input
                        type="text"
                        required
                        value={projectSubmission.techStack}
                        onChange={(e) => {
                          setProjectSubmission((prev) => ({ ...prev, techStack: e.target.value }));
                          setValidationError('');
                        }}
                        placeholder="e.g. React 19, Python, OpenCV, Raspberry Pi"
                        className="w-full bg-[#121212] border border-white/15 px-3.5 py-2.5 text-white font-mono outline-none focus:border-[#ef2635] rounded-none"
                      />
                    </div>

                    <div>
                      <label className="block text-white/80 mb-1.5 font-semibold">Detailed Description & Features <span className="text-[#ef2635] font-bold">*</span></label>
                      <textarea
                        rows={4}
                        required
                        value={projectSubmission.description}
                        onChange={(e) => {
                          setProjectSubmission((prev) => ({ ...prev, description: e.target.value }));
                          setValidationError('');
                        }}
                        placeholder="Describe what you built, architecture, challenges, and feature highlights..."
                        className="w-full bg-[#121212] border border-white/15 px-3.5 py-2.5 text-white font-mono outline-none focus:border-[#ef2635] rounded-none resize-none"
                      />
                    </div>
                  </fieldset>
                </div>

                {/* Validation Banner & Action Buttons */}
                <div className="space-y-4">
                  {validationError && (
                    <div className="p-3.5 bg-rose-950/80 border border-rose-700/80 rounded-none text-rose-300 font-mono text-xs font-bold">
                      {validationError}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="font-mono text-xs text-white/50">
                      {savedStatus ? <span className="text-emerald-400 font-bold">{savedStatus}</span> : <span>All marked fields are compulsory before final submission.</span>}
                    </div>

                    <button
                      type="submit"
                      className="w-full sm:w-auto font-mono text-xs font-semibold py-3 px-8 rounded-none uppercase tracking-wider transition flex items-center justify-center gap-2 bg-[#ef2635] hover:bg-[#ff3d4b] text-white shadow-sm cursor-pointer"
                    >
                      <Send size={15} />
                      <span>Submit Project & PPT Presentation</span>
                    </button>
                  </div>
                </div>
              </form>
            )
        )}

        </section>

      </main>

      {/* Join Team Confirmation & Member Details Modal */}
      {joinModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#0a0a0a] border border-[#ef2635]/50 rounded-none max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-[0_0_50px_rgba(239,38,53,0.25)] relative">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-none bg-[#ef2635]/20 border border-[#ef2635]/50 flex items-center justify-center text-[#ef2635]">
                  <Users size={22} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold font-mono text-white uppercase tracking-wider">
                    {joinModal.step === 'confirm' ? 'Join Team Confirmation' : 'Teammate Role & Details'}
                  </h3>
                  <p className="text-[11px] text-white/50 font-mono">Code: {joinModal.inviteCode}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setJoinModal((prev) => ({ ...prev, isOpen: false }))}
                className="text-white/40 hover:text-white transition font-bold text-lg px-2 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* STEP 1: Confirmation Prompt */}
            {joinModal.step === 'confirm' && (
              <div className="space-y-6">
                <div className="p-5 rounded-none bg-[#121212] border border-[#ef2635]/40 text-center space-y-3">
                  <p className="text-sm sm:text-base text-white font-sans leading-relaxed">
                    Are you sure you want to join <strong className="text-[#ef2635] font-mono font-bold">{joinModal.leaderName}</strong> (<span className="text-sky-300 font-mono text-xs">{joinModal.leaderEmail}</span>)'s team <strong className="text-white font-mono font-bold">"{joinModal.teamName}"</strong>?
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setJoinModal((prev) => ({ ...prev, isOpen: false }))}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-none font-mono text-xs font-bold text-white/70 border border-white/20 hover:bg-white/10 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmYesJoin}
                    className="w-full sm:w-auto px-8 py-2.5 rounded-none font-mono text-xs font-bold text-white bg-[#ef2635] hover:bg-[#ff3d4b] transition shadow-[0_0_15px_rgba(239,38,53,0.35)] cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Yes, Join Team</span>
                    <ArrowUpRight size={15} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Role & College Input Form */}
            {joinModal.step === 'details' && (
              <div className="space-y-5">
                <p className="text-xs text-white/70 font-sans">
                  Please specify your role/task and college name to complete your entry into team <strong className="text-[#ef2635]">"{joinModal.teamName}"</strong>.
                </p>

                <div className="space-y-4 font-mono text-xs">
                  {/* Role in Team Dropdown */}
                  <div>
                    <label className="block text-white/80 mb-1.5 font-semibold">Your Role in Team / Task *</label>
                    <select
                      value={joinModal.role || ''}
                      onChange={(e) => setJoinModal((prev) => ({ ...prev, role: e.target.value }))}
                      className="w-full bg-[#181818] border border-white/20 px-3.5 py-2.5 text-white outline-none focus:border-[#ef2635] rounded-none"
                    >
                      {TEAMMATE_ROLE_OPTIONS.map((r) => (
                        <option key={r} value={r === '-- Select Role --' ? '' : r}>{r}</option>
                      ))}
                    </select>

                    {joinModal.role === 'Others (Type Custom Role)' && (
                      <input
                        type="text"
                        required
                        value={joinModal.customRole}
                        onChange={(e) => setJoinModal((prev) => ({ ...prev, customRole: e.target.value }))}
                        placeholder="Type your role / task (e.g. Data Scientist, DevOps)"
                        className="w-full mt-2 bg-[#181818] border border-[#ef2635]/60 px-3.5 py-2 text-white text-xs outline-none focus:border-[#ef2635] rounded-none"
                      />
                    )}
                  </div>

                  {/* Phone / WhatsApp Number Input */}
                  <div>
                    <label className="block text-white/80 mb-1.5 font-semibold flex items-center gap-1.5">
                      <User size={14} className="text-[#ef2635]" />
                      <span>Phone / WhatsApp Number *</span>
                    </label>
                    <div className="flex items-center">
                      <span className="px-3.5 py-2.5 bg-[#222] border border-r-0 border-white/20 text-white/70 font-mono text-xs select-none">
                        +91
                      </span>
                      <input
                        type="tel"
                        required
                        value={(() => {
                          let p = joinModal.phone || '';
                          if (p.startsWith('+91')) p = p.slice(3);
                          else if (p.length === 12 && p.startsWith('91')) p = p.slice(2);
                          return p;
                        })()}
                        onChange={(e) => {
                          let val = e.target.value;
                          if (val.startsWith('+91')) val = val.slice(3);
                          else if (val.length === 12 && val.startsWith('91')) val = val.slice(2);
                          val = val.replace(/\D/g, '').slice(0, 10);
                          setJoinModal((prev) => ({ ...prev, phone: val }));
                        }}
                        placeholder="9876543210"
                        maxLength={10}
                        className="w-full bg-[#181818] border border-white/20 px-3.5 py-2.5 text-white outline-none focus:border-[#ef2635] rounded-none font-mono"
                      />
                    </div>
                  </div>

                  {/* College Name Input */}
                  <div>
                    <label className="block text-white/80 mb-1.5 font-semibold flex items-center gap-1.5">
                      <GraduationCap size={14} className="text-[#ef2635]" />
                      <span>College / Institution Name *</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={joinModal.college}
                      onChange={(e) => setJoinModal((prev) => ({ ...prev, college: e.target.value }))}
                      placeholder="Enter your College Name"
                      className="w-full bg-[#181818] border border-white/20 px-3.5 py-2.5 text-white outline-none focus:border-[#ef2635] rounded-none"
                    />
                  </div>
                </div>

                {validationError && (
                  <div className="p-3 bg-rose-950/80 border border-rose-700/80 rounded-none text-rose-300 font-mono text-xs font-bold">
                    {validationError}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setJoinModal((prev) => ({ ...prev, step: 'confirm' }))}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-none font-mono text-xs font-bold text-white/70 border border-white/20 hover:bg-white/10 transition cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleFinalSubmitJoinTeam}
                    disabled={joinModal.isSubmitting}
                    className="w-full sm:w-auto px-8 py-2.5 rounded-none font-mono text-xs font-bold text-white bg-[#ef2635] hover:bg-[#ff3d4b] transition shadow-[0_0_15px_rgba(239,38,53,0.35)] cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>{joinModal.isSubmitting ? 'Joining Team...' : 'Confirm & Join Team'}</span>
                    <Check size={15} />
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </SiteShell>
  );
}