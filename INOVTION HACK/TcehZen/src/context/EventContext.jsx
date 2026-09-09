import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { INITIAL_EVENTS, INITIAL_REGISTRATIONS } from '../mockData';
import { useAuth } from './AuthContext';
import confetti from 'canvas-confetti';

const EventContext = createContext();

export function EventProvider({ children }) {
  // EventProvider is mounted inside AuthProvider; fall back safely if it ever isn't.
  const auth = useAuth();
  const openAuth = auth?.openAuth;

  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [registrations, setRegistrations] = useState(INITIAL_REGISTRATIONS);

  const [selectedEventId, setSelectedEventId] = useState(null);
  const [activeTicket, setActiveTicket] = useState(null);
  const [activeTab, setActiveTab] = useState('events');
  const [createEventModalOpen, setCreateEventModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [toastMessage, setToastMessage] = useState(null);

  // Fetch events from Supabase PostgreSQL API
  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch('/api/events');
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setEvents(data);
          }
        }
      } catch (e) {
        console.warn('API offline, falling back to local events:', e);
      }
    }

    async function fetchRegistrations() {
      try {
        const savedUserStr = localStorage.getItem('techzen_user') || localStorage.getItem('techzen_admin_auth');
        if (!savedUserStr) return; // Skip request for unauthenticated guests to avoid 401 console warnings

        let headers = {};
        try {
          const userObj = JSON.parse(savedUserStr);
          const email = userObj.email || userObj.userEmail || 'tanishaqvermatechzen@gmail.com';
          const token = userObj.id || 'admin-secret-session';
          headers = {
            'x-user-email': email,
            'Authorization': `Bearer ${token}`
          };
        } catch (e) {}

        const res = await fetch('/api/registrations', { headers });
        if (res.ok) {
          const data = await res.json();
          if (data) {
            setRegistrations(data);
          }
        }
      } catch (e) {
        console.warn('API offline, falling back to local registrations:', e);
      }
    }

    fetchEvents();
    fetchRegistrations();
  }, []);

  // Hash routing listener for direct share links
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#event/')) {
        const eventId = hash.replace('#event/', '');
        setSelectedEventId(eventId);
      } else if (hash === '#dashboard') {
        setActiveTab('host-dashboard');
      } else if (hash === '#tickets') {
        setActiveTab('my-tickets');
      } else if (hash === '#profile') {
        setActiveTab('profile');
      } else if (hash === '#create') {
        setCreateEventModalOpen(true);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const toastTimerRef = useRef(null);

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      toastTimerRef.current = null;
      setToastMessage(null);
    }, 4000);
  };

  useEffect(() => () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
  }, []);

  const createEvent = async (newEventData, currentUser) => {
    const newEvent = {
      id: `event-${Date.now()}`,
      title: newEventData.title,
      tagline: newEventData.tagline || 'Community event hosted on TechZen',
      category: newEventData.category,
      badge: newEventData.badge || newEventData.category,
      date: newEventData.date,
      time: newEventData.time,
      locationType: newEventData.locationType,
      location: newEventData.location,
      capacity: parseInt(newEventData.capacity) || 100,
      maxTeamSize: parseInt(newEventData.maxTeamSize) || 4,
      allowSolo: newEventData.allowSolo !== undefined ? newEventData.allowSolo : true,
      rsvpCount: 0,
      coverImage: newEventData.coverImage || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      hostName: currentUser?.name || 'TechZen Community',
      hostAvatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      hostRole: currentUser?.role || 'Community Host',
      description: newEventData.description,
      tags: newEventData.tags ? (Array.isArray(newEventData.tags) ? newEventData.tags : newEventData.tags.split(',').map(t => t.trim())) : [newEventData.category],
      agenda: newEventData.agenda || [
        { time: 'Start', title: 'Registration & Coffee', speaker: 'Host' },
        { time: 'Keynote', title: newEventData.title, speaker: 'Speaker' }
      ],
      customQuestions: newEventData.customQuestions || []
    };

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': currentUser?.email || 'tanishaqvermatechzen@gmail.com',
          'Authorization': 'Bearer admin-secret-session'
        },
        body: JSON.stringify(newEvent)
      });
      if (res.ok) {
        const savedEvent = await res.json();
        setEvents(prev => [savedEvent, ...prev]);
        setCreateEventModalOpen(false);
        showToast(`🎉 Event "${savedEvent.title}" saved to Supabase!`);
        return savedEvent;
      }
    } catch (e) {
      console.warn('API error, saving locally:', e);
    }

    setEvents(prev => [newEvent, ...prev]);
    setCreateEventModalOpen(false);
    showToast(`🎉 Event "${newEvent.title}" published!`);
    return newEvent;
  };

  const deleteEvent = async (eventId, adminUserEmail) => {
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'x-user-email': adminUserEmail || 'tanishaqvermatechzen@gmail.com',
          'Authorization': 'Bearer admin-secret-session'
        }
      });

      // A reachable server that refused the delete must not look like a success:
      // dropping the row locally would hide an event that still exists upstream.
      const endpointMissing =
        res.status === 404 || res.status === 405 || res.status === 501 ||
        !(res.headers.get('content-type') || '').includes('application/json');
      if (!res.ok && !endpointMissing) {
        showToast('Could not delete that event - the server refused the request.', 'error');
        return { success: false };
      }
    } catch (e) {
      console.warn('API error deleting event:', e);
    }
    setEvents(prev => prev.filter(e => e.id !== eventId));
    setRegistrations(prev => prev.filter(r => r.eventId !== eventId));
    if (selectedEventId === eventId) setSelectedEventId(null);
    showToast('Event deleted', 'info');
    return { success: true };
  };

  const registerForEvent = async (eventId, answers, user) => {
    const targetEvent = events.find(e => e.id === eventId);
    if (!targetEvent) return { success: false, error: 'Event not found' };

    if (!user || !user.id || !user.email) {
      if (typeof openAuth === 'function') openAuth('login');
      showToast('🔒 Please sign in to register for events!', 'error');
      return { success: false, error: 'Authentication required. Please log in first.' };
    }

    const existing = registrations.find(r => r.eventId === eventId && r.userId === user.id);
    if (existing) {
      setActiveTicket(existing);
      showToast('You are already registered for this event!', 'info');
      return { success: true, ticket: existing };
    }

    const ticketCode = `TZ-${targetEvent.category.substring(0, 2).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const newRegistration = {
      id: `reg-${Date.now()}`,
      eventId,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      registeredAt: new Date().toISOString(),
      answers: answers || {},
      ticketCode,
      checkedIn: false
    };

    try {
      const res = await fetch('/api/registrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user.email,
          'x-user-id': user.id
        },
        body: JSON.stringify(newRegistration)
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(`❌ Registration Failed: ${data.error || 'Server rejected registration'}`, 'error');
        return { success: false, error: data.error || 'Registration rejected by server' };
      }

      setRegistrations(prev => [data, ...prev]);
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, rsvpCount: (e.rsvpCount || 0) + 1 } : e));
      
      try { confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } }); } catch (err) {}
      setActiveTicket(data);
      showToast(`🎟️ RSVP confirmed! Digital pass generated.`);
      return { success: true, ticket: data };
    } catch (e) {
      console.error('API connection offline:', e);
      showToast('❌ Unable to connect to registration server. Please try again.', 'error');
      return { success: false, error: 'Network error connecting to registration server' };
    }
  };

  const isUserRegistered = (eventId, userId) => {
    if (!userId) return false;
    return registrations.some(r => r.eventId === eventId && r.userId === userId);
  };

  const getUserRegistrations = (userId) => {
    return registrations.filter(r => r.userId === userId);
  };

  const getEventRegistrations = (eventId) => {
    return registrations.filter(r => r.eventId === eventId);
  };

  // Parses the free-form `date` strings used across TechZen events
  // ("May 12, 2026", "June 29 - July 20, 2026", "2026-06-29") into a real Date.
  const parseEventDate = (dateStr) => {
    if (!dateStr) return null;
    const raw = String(dateStr).trim();

    let parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) {
      // Date ranges: keep the start, borrowing the year from the end when omitted.
      const year = raw.match(/\b(\d{4})\b/);
      const start = raw.split(/\s*(?:-|–|—|\bto\b)\s*/i)[0].replace(/,\s*$/, '').trim();
      if (start) {
        parsed = new Date(/\b\d{4}\b/.test(start) || !year ? start : `${start}, ${year[1]}`);
      }
    }
    if (Number.isNaN(parsed.getTime())) return null;

    // No clock time in the source string -> default to a sensible 10:00 UTC slot.
    if (!/\d{1,2}:\d{2}/.test(raw)) parsed.setUTCHours(10, 0, 0, 0);
    return parsed;
  };

  const toICSDate = (date) => {
    const pad = (n) => String(n).padStart(2, '0');
    return (
      `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
      `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
    );
  };

  // RFC 5545 requires backslashes, semicolons, commas and newlines to be escaped.
  const escapeICS = (value) =>
    String(value ?? '')
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\r?\n/g, '\\n');

  const downloadCalendarFile = (event) => {
    if (!event) return;

    const start = parseEventDate(event.date);
    if (!start) {
      showToast(`Could not read the date for "${event.title}".`, 'error');
      return;
    }
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

    const icsData = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//TechZen Community Events//EN',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `UID:${event.id || `techzen-${Date.now()}`}@techzen.community`,
      `DTSTAMP:${toICSDate(new Date())}`,
      `SUMMARY:${escapeICS(event.title)}`,
      `DESCRIPTION:${escapeICS(event.description)}`,
      `LOCATION:${escapeICS(event.location)}`,
      `DTSTART:${toICSDate(start)}`,
      `DTEND:${toICSDate(end)}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${String(event.title || 'techzen-event').replace(/\s+/g, '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    showToast('Calendar invitation downloaded!');
  };

  return (
    <EventContext.Provider value={{
      events,
      registrations,
      selectedEventId,
      setSelectedEventId,
      activeTicket,
      setActiveTicket,
      activeTab,
      setActiveTab,
      createEventModalOpen,
      setCreateEventModalOpen,
      searchQuery,
      setSearchQuery,
      selectedCategory,
      setSelectedCategory,
      toastMessage,
      showToast,
      createEvent,
      deleteEvent,
      registerForEvent,
      isUserRegistered,
      getUserRegistrations,
      getEventRegistrations,
      downloadCalendarFile
    }}>
      {children}
    </EventContext.Provider>
  );
}

export function useEvents() {
  return useContext(EventContext);
}
