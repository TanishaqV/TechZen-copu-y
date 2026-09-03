import React from 'react';
import Navbar from '../components/Navbar';
import { useLocation } from 'wouter';
import { AlertCircle } from 'lucide-react';

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-slate-100 flex flex-col selection:bg-[#ef2635]">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-enter space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-accent/10 border border-red-accent/40 flex items-center justify-center text-red-accent mb-2">
          <AlertCircle className="w-6 h-6" />
        </div>

        <div className="text-xs font-mono text-red-accent font-bold uppercase tracking-widest">404 / SIGNAL LOST</div>
        <h1 className="text-4xl font-extrabold font-outfit text-white">Page Not Found</h1>
        <p className="text-xs text-zinc-400 max-w-sm leading-relaxed">
          The room or route you are looking for does not exist or has been moved.
        </p>

        <button
          onClick={() => setLocation('/')}
          className="mt-4 px-5 py-2.5 rounded bg-red-accent hover:bg-red-600 text-white font-mono text-xs font-bold uppercase tracking-wider transition shadow-lg shadow-red-500/20"
        >
          Return to Events Signal ►
        </button>
      </main>
    </div>
  );
}
