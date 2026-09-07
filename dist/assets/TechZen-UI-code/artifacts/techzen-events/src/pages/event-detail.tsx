import { ArrowLeft, ArrowUpRight, CalendarDays, Check, Clock3, MapPin, Users } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useParams } from 'wouter';
import { useAuth, useUser } from '@clerk/react';
import { useQueryClient } from '@tanstack/react-query';
import { getGetEventQueryKey, getListEventsQueryKey, useGetEvent, useRegisterForEvent } from '@workspace/api-client-react';
import { SiteShell } from '@/components/site-shell';

function longDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

function time(value: string) {
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

export default function EventDetail() {
  const params = useParams<{ eventId: string }>();
  const eventId = Number(params.eventId);
  const queryClient = useQueryClient();
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { data: event, isLoading, isError } = useGetEvent(eventId, { query: { enabled: Number.isFinite(eventId), queryKey: getGetEventQueryKey(eventId) } });
  const register = useRegisterForEvent();
  const [form, setForm] = useState({ fullName: '', email: '', company: '', role: '', wantsUpdates: true });
  const [registered, setRegistered] = useState(false);
  const [error, setError] = useState('');

  if (isLoading) return <SiteShell><main className="mx-auto max-w-[1100px] animate-pulse px-5 py-20 sm:px-8 lg:px-12"><div className="h-3 w-24 bg-white/10" /><div className="mt-8 h-20 w-3/4 bg-white/10" /><div className="mt-5 h-4 w-1/2 bg-white/10" /><div className="mt-16 grid gap-8 md:grid-cols-[1fr_360px]"><div className="h-80 bg-white/[.06]" /><div className="h-64 bg-white/[.06]" /></div></main></SiteShell>;
  if (isError || !event) return <SiteShell><main className="mx-auto max-w-[1100px] px-5 py-28 text-center sm:px-8"><p className="font-mono text-xs uppercase tracking-widest text-[#ef2635]">404 / Event not found</p><h1 className="mt-5 text-4xl font-semibold text-white">This room doesn't exist.</h1><Link href="/" data-testid="link-back-home-error" className="mt-8 inline-flex items-center gap-2 border border-white/20 px-4 py-3 text-sm text-white hover:border-[#ef2635]"><ArrowLeft size={16} /> Back to events</Link></main></SiteShell>;
  const spotsLeft = Math.max(event.capacity - event.registeredCount, 0);
  const updateForm = (key: keyof typeof form, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const fallbackName = [user?.firstName, user?.lastName].filter(Boolean).join(' ');
    const fallbackEmail = user?.primaryEmailAddress?.emailAddress || '';
    register.mutate({ eventId, data: { ...form, fullName: form.fullName || fallbackName, email: form.email || fallbackEmail } }, {
      onSuccess: () => {
        setRegistered(true);
        void queryClient.invalidateQueries({ queryKey: getGetEventQueryKey(eventId) });
        void queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() });
      },
      onError: () => setError('We could not save your spot. You may already be registered or the room may be full.'),
    });
  };
  return (
    <SiteShell>
      <main>
        <section className="relative overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 grid-paper opacity-35" />
          <div className="relative mx-auto max-w-[1440px] px-5 pb-16 pt-12 sm:px-8 md:pb-24 md:pt-20 lg:px-12">
            <Link href="/" data-testid="link-back-events" className="focus-ring inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-white/45 transition-colors hover:text-white"><ArrowLeft size={14} /> All events</Link>
            <div className="mt-16 max-w-5xl">
              <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[.2em]"><span className="bg-[#ef2635] px-2.5 py-1 text-white">{event.category}</span><span className="border border-white/20 px-2.5 py-1 text-white/55">{event.format}</span></div>
              <h1 className="mt-7 text-balance text-5xl font-semibold leading-[.9] tracking-[-.065em] text-white sm:text-7xl md:text-8xl">{event.title}</h1>
              <p className="mt-8 max-w-2xl text-lg leading-8 text-white/55">{event.description}</p>
            </div>
            <div className="mt-14 grid gap-4 border-t border-white/10 pt-5 text-sm sm:grid-cols-3"><div className="flex items-center gap-3 text-white/60"><CalendarDays size={18} className="text-[#ef2635]" /><span>{longDate(event.date)}</span></div><div className="flex items-center gap-3 text-white/60"><Clock3 size={18} className="text-[#ef2635]" /><span>{time(event.date)} – {time(event.endDate)}</span></div><div className="flex items-center gap-3 text-white/60"><MapPin size={18} className="text-[#ef2635]" /><span>{event.location}</span></div></div>
          </div>
        </section>
        <section className="mx-auto grid max-w-[1440px] gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1fr_380px] md:py-20 lg:px-12">
          <div>
            <div className="relative min-h-[300px] overflow-hidden border border-white/10 bg-[#121212] md:min-h-[420px]">{event.imageUrl ? <img src={event.imageUrl} alt="" className="h-full min-h-[300px] w-full object-cover opacity-80 md:min-h-[420px]" /> : <div className="grid-paper h-full min-h-[300px] md:min-h-[420px]"><div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(239,38,53,.42),transparent_28%),linear-gradient(125deg,transparent_48%,rgba(239,38,53,.8)_48%,rgba(239,38,53,.8)_50%,transparent_50%)]" /><span className="absolute bottom-7 left-7 font-mono text-6xl font-medium tracking-[-.1em] text-white/10">TZ/{String(event.id).padStart(2, '0')}</span></div>}</div>
            <div className="mt-12 flex flex-wrap gap-2">{event.tags.map((tag) => <span key={tag} data-testid={`tag-event-${tag}`} className="border border-white/15 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-white/50">#{tag}</span>)}</div>
            <p className="mt-10 max-w-2xl whitespace-pre-line text-base leading-8 text-white/65">{event.description}</p>
          </div>
          <aside className="md:pt-0">
            <div className="sticky top-24 border border-white/15 bg-[#111] p-6 shadow-[0_20px_60px_rgba(0,0,0,.2)] sm:p-7">
              {registered ? <div className="py-7 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#ef2635] text-white"><Check size={25} /></div><p className="mt-6 font-mono text-[10px] uppercase tracking-[.2em] text-[#ef2635]">You're on the list</p><h2 className="mt-3 text-2xl font-semibold text-white">See you in the room.</h2><p className="mt-3 text-sm leading-6 text-white/45">A confirmation is heading to your inbox. Keep this page handy.</p><Link href="/user-portal" data-testid="link-registration-portal" className="mt-7 inline-flex items-center gap-2 border border-white/20 px-4 py-3 text-sm font-semibold text-white hover:border-[#ef2635]">View my portal <ArrowUpRight size={15} /></Link></div> : !isSignedIn ? <><p className="font-mono text-[10px] uppercase tracking-[.2em] text-[#ef2635]">Reserve your place</p><h2 className="mt-4 text-2xl font-semibold leading-tight text-white">Good rooms fill with good people.</h2><p className="mt-3 text-sm leading-6 text-white/45">Sign in to register and keep your event list in one place.</p><Link href="/sign-in" data-testid="link-sign-in-to-register" className="group mt-7 flex w-full items-center justify-center gap-2 bg-[#ef2635] px-4 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#ff3d4b]">Sign in to register <ArrowUpRight size={16} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></Link><p className="mt-4 text-center text-xs text-white/35">New here? <Link href="/sign-up" data-testid="link-sign-up-to-register" className="text-white underline decoration-[#ef2635] underline-offset-4">Create an account</Link></p></> : <><div className="flex items-start justify-between gap-4"><div><p className="font-mono text-[10px] uppercase tracking-[.2em] text-[#ef2635]">Reserve your place</p><h2 className="mt-3 text-2xl font-semibold text-white">Join the build.</h2></div><span className="flex items-center gap-1.5 font-mono text-[10px] uppercase text-white/40"><Users size={14} /> {spotsLeft} left</span></div><form onSubmit={submit} className="mt-7 space-y-4"><Field label="Full name" value={form.fullName || [user?.firstName, user?.lastName].filter(Boolean).join(' ')} onChange={(v) => updateForm('fullName', v)} placeholder="Your name" testId="input-full-name" required /><Field label="Email" value={form.email || user?.primaryEmailAddress?.emailAddress || ''} onChange={(v) => updateForm('email', v)} placeholder="you@company.com" testId="input-registration-email" type="email" required /><Field label="Company" value={form.company} onChange={(v) => updateForm('company', v)} placeholder="Where you build" testId="input-company" required /><Field label="Role" value={form.role} onChange={(v) => updateForm('role', v)} placeholder="What do you make?" testId="input-role" required /><label className="flex cursor-pointer items-start gap-3 pt-1 text-xs leading-5 text-white/50"><input type="checkbox" checked={form.wantsUpdates} onChange={(e) => updateForm('wantsUpdates', e.target.checked)} data-testid="input-wants-updates" className="mt-1 accent-[#ef2635]" />Keep me in the loop on future TechZen sessions.</label>{error && <p data-testid="status-registration-error" className="text-xs leading-5 text-[#ff6570]">{error}</p>}<button type="submit" disabled={register.isPending || spotsLeft === 0} data-testid="button-submit-registration" className="group flex w-full items-center justify-center gap-2 bg-[#ef2635] px-4 py-3.5 text-sm font-bold text-white transition-all hover:bg-[#ff3d4b] disabled:cursor-not-allowed disabled:opacity-50">{register.isPending ? 'Saving your spot…' : spotsLeft === 0 ? 'Room is full' : 'Save my spot'} {!register.isPending && spotsLeft > 0 && <ArrowUpRight size={16} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />}</button></form></>}
              <div className="mt-7 border-t border-white/10 pt-5 font-mono text-[10px] uppercase tracking-widest text-white/30">Capacity / {event.capacity} builders</div>
            </div>
          </aside>
        </section>
      </main>
    </SiteShell>
  );
}

function Field({ label, value, onChange, placeholder, testId, type = 'text', required = false }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; testId: string; type?: string; required?: boolean }) {
  return <label className="block"><span className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-white/40">{label}</span><input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required} data-testid={testId} className="focus-ring w-full border border-white/15 bg-white/[.04] px-3.5 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#ef2635]" /></label>;
}