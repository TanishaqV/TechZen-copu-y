import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useEvents } from '../context/EventContext';
import { LogOut, ArrowUpRight } from 'lucide-react';

export default function Navbar() {
  const { currentUser, isAdmin, openAuth, logout, ADMIN_EMAIL } = useAuth();
  const { activeTab, setActiveTab, setCreateEventModalOpen, showToast } = useEvents();

  const handlePostEventClick = () => {
    if (!currentUser) {
      openAuth('login');
      return;
    }

    if (!isAdmin) {
      showToast('🔒 Restricted: Events can only be posted by admin accounts', 'info');
      return;
    }

    setCreateEventModalOpen(true);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#070709] border-b border-zinc-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Left Logo: Small TZ mark + TECHZEN text */}
          <div 
            onClick={() => { setActiveTab('events'); window.location.hash = ''; }}
            className="flex items-center space-x-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-full bg-[#0a0a0c] border-2 border-red-accent flex items-center justify-center font-bold text-white shadow-md shadow-red-500/20 group-hover:scale-105 transition-transform">
              <span className="text-white font-black text-xs">T</span>
              <span className="text-red-accent font-black text-xs -ml-0.5">Z</span>
            </div>

            <div className="flex items-center font-outfit font-black tracking-widest text-lg uppercase">
              <span className="text-white">TECH</span>
              <span className="text-red-accent">ZEN</span>
            </div>
          </div>

          {/* Center Links */}
          <div className="flex items-center space-x-6 sm:space-x-8 text-xs font-medium text-zinc-300">
            <button
              onClick={() => { setActiveTab('events'); window.location.hash = ''; }}
              className={`hover:text-white transition tracking-wide ${activeTab === 'events' ? 'text-white font-bold' : ''}`}
            >
              Events
            </button>

            <button
              onClick={() => {
                if (currentUser) {
                  setActiveTab('my-tickets'); 
                  window.location.hash = '#tickets';
                } else {
                  openAuth('login');
                }
              }}
              className={`hover:text-white transition tracking-wide ${activeTab === 'my-tickets' ? 'text-white font-bold' : ''}`}
            >
              Our code
            </button>

            {/* Host Roster (Admin only) */}
            {isAdmin && (
              <button
                onClick={() => { setActiveTab('host-dashboard'); window.location.hash = '#dashboard'; }}
                className={`hover:text-white transition tracking-wide text-red-accent font-bold ${activeTab === 'host-dashboard' ? 'text-white' : ''}`}
              >
                Host Roster
              </button>
            )}

            {/* Auth status or Sign in */}
            {currentUser ? (
              <div className="flex items-center space-x-3 pl-3 border-l border-zinc-800">
                <button
                  onClick={() => { setActiveTab('profile'); window.location.hash = '#profile'; }}
                  className="flex items-center space-x-2 focus:outline-none"
                >
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-full border border-red-accent object-cover"
                  />
                  <span className="hidden md:inline text-xs font-semibold text-white">{currentUser.name}</span>
                </button>
                <button
                  onClick={logout}
                  title="Sign Out"
                  className="text-xs text-zinc-400 hover:text-red-400 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => openAuth('login')}
                className="hover:text-white transition tracking-wide"
              >
                Sign in
              </button>
            )}

          </div>

          {/* Right Red Solid Button: Join the community ↗ */}
          <div>
            {isAdmin ? (
              <button
                onClick={handlePostEventClick}
                className="px-4 py-2.5 rounded-sm bg-red-accent hover:bg-red-600 text-white text-xs font-bold tracking-wide transition shadow-md shadow-red-500/20 active:scale-95 flex items-center space-x-1"
              >
                <span>Post Event</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => {
                  if (!currentUser) openAuth('signup');
                  else showToast(`Events can only be posted by admin (${ADMIN_EMAIL})`, 'info');
                }}
                className="px-4.5 py-2.5 rounded-sm bg-red-accent hover:bg-red-600 text-white text-xs font-bold tracking-wide transition shadow-md shadow-red-500/20 active:scale-95 flex items-center space-x-1"
              >
                <span>Join the community</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
