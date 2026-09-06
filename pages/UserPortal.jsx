import React from 'react';
import Navbar from '../components/Navbar';
import UserProfile from '../components/UserProfile';
import HostDashboard from '../components/HostDashboard';
import { useAuth } from '../context/AuthContext';

export default function UserPortal() {
  const { currentUser, isAdmin } = useAuth();

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-slate-100 flex flex-col selection:bg-[#ef2635]">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full animate-enter space-y-10">
        
        {/* Host Dashboard if Admin */}
        {isAdmin && (
          <div className="space-y-4">
            <HostDashboard />
          </div>
        )}

        {/* User Passes & Profile */}
        <UserProfile />

      </main>
    </div>
  );
}
