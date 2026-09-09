import { useState, useEffect } from 'react';
import { INITIAL_EVENTS } from '../mockData';

export function getGetEventQueryKey(id) {
  return ['event', id];
}

export function getListEventsQueryKey() {
  return ['events'];
}

export function getGetMySummaryQueryKey() {
  return ['my-summary'];
}

export function getListMyRegistrationsQueryKey() {
  return ['my-registrations'];
}

export function useListEvents() {
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const fetchEvents = async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await fetch('/api/events');
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setEvents(data.map(e => ({
            ...e,
            format: e.locationType || e.format || 'IN PERSON',
            imageUrl: e.coverImage || e.imageUrl,
            registeredCount: e.rsvpCount || e.registeredCount || 0,
            capacity: e.capacity || 120,
            tags: e.tags || ['Tech', 'Community']
          })));
        }
      }
    } catch (err) {
      console.warn('API connection offline, using default events:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return { data: events, isLoading, isError, refetch: fetchEvents };
}

export function useGetEvent(eventId, options = {}) {
  const { data: events, isLoading, isError } = useListEvents();
  // Returns undefined for an unknown id so callers can show a not-found state,
  // rather than silently rendering an unrelated event.
  const event = events?.find(e => String(e.id) === String(eventId));
  return { data: event, isLoading, isError };
}

export function useRegisterForEvent() {
  const [isPending, setIsPending] = useState(false);

  const mutate = async ({ eventId, data }, callbacks = {}) => {
    setIsPending(true);
    try {
      const payload = {
        id: `reg-${Date.now()}`,
        eventId: String(eventId),
        userId: `usr-${Date.now()}`,
        userName: data.fullName || 'TechZen Builder',
        userEmail: data.email || 'builder@techzen.dev',
        ticketCode: `TZ-BUILDER-${Math.floor(100000 + Math.random() * 900000)}`,
        answers: data
      };

      const res = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        const err = new Error(detail.error || `Registration failed (${res.status})`);
        console.warn('Registration rejected by server:', err.message);
        if (callbacks.onError) callbacks.onError(err);
        return;
      }

      const saved = await res.json().catch(() => payload);
      if (callbacks.onSuccess) callbacks.onSuccess(saved);
    } catch (err) {
      console.warn('Registration API error:', err);
      if (callbacks.onError) callbacks.onError(err);
    } finally {
      setIsPending(false);
    }
  };

  return { mutate, isPending };
}

export function useGetMySummary() {
  const { data: events } = useListEvents();
  return {
    data: {
      nextEvent: events?.[0] || null,
      registeredCount: events ? events.length : 1
    },
    isLoading: false
  };
}

export function useListMyRegistrations() {
  const { data: events } = useListEvents();
  const [registrations, setRegistrations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchRegs() {
      setIsLoading(true);
      try {
        let email = '';
        const savedUserStr = localStorage.getItem('techzen_user');
        if (savedUserStr) {
          const u = JSON.parse(savedUserStr);
          email = u?.email || '';
        }
        if (email) {
          const res = await fetch(`/api/registrations?email=${encodeURIComponent(email)}`, {
            headers: { 'x-user-email': email }
          });
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
              setRegistrations(data);
              return;
            }
          }
        }
      } catch (e) {
        console.warn('Failed to fetch user registrations:', e);
      } finally {
        setIsLoading(false);
      }

      // Fallback
      if (events) {
        setRegistrations(events.slice(0, 2).map((e, idx) => ({
          id: `reg-${idx + 1}`,
          eventId: e.id,
          event: e,
          registeredAt: new Date().toISOString()
        })));
      }
    }
    fetchRegs();
  }, [events]);

  return {
    data: registrations,
    isLoading,
    isError: false
  };
}
