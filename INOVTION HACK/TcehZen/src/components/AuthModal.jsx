import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../context/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';
import { X } from 'lucide-react';

export default function AuthModal() {
  const [location, setLocation] = useLocation();
  const { authModalOpen, closeAuth, authMode, setAuthMode, login, signup } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('Attendee');
  const [error, setError] = useState('');

  const isSignInPath = location.startsWith('/sign-in');
  const isSignUpPath = location.startsWith('/sign-up');
  
  // Show modal if explicitly opened OR if current URL is /sign-in or /sign-up
  const isOpen = authModalOpen || isSignInPath || isSignUpPath;

  const currentMode = isSignUpPath ? 'signup' : (isSignInPath ? 'login' : authMode);

  const handleClose = () => {
    closeAuth();
    if (isSignInPath || isSignUpPath) {
      setLocation('/');
    }
  };

  const handleAuthSuccess = async (emailToUse, pwd, nameToUse, roleToUse, avatarToUse) => {
    try {
      const result = (currentMode === 'login' || !nameToUse)
        ? await login(emailToUse, pwd || 'google-auth', nameToUse, roleToUse, avatarToUse)
        : await signup({ name: nameToUse, email: emailToUse, role: roleToUse || 'Attendee', avatar: avatarToUse });

      // Keep the modal open on failure so the user can see why and retry.
      if (result && result.success === false) {
        setError(result.error || 'Authentication failed. Please try again.');
        return;
      }

      closeAuth();
      if (isSignInPath || isSignUpPath) {
        setLocation('/');
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError('Something went wrong signing you in. Please try again.');
    }
  };

  // Google OAuth Login Handler - Fetches actual Google user account info
  const googleLoginTrigger = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
        });
        const googleUser = await userInfoRes.json();
        if (googleUser && googleUser.email) {
          const userEmail = googleUser.email;
          const userName = googleUser.name || googleUser.email.split('@')[0];
          const userAvatar = googleUser.picture;
          await handleAuthSuccess(userEmail, 'google-oauth', userName, 'Attendee', userAvatar);
          return;
        }
      } catch (e) {
        console.error('Failed to fetch Google user profile:', e);
      }

      // If user typed email in form, use that
      if (email) {
        await handleAuthSuccess(email, 'google-oauth', name || email.split('@')[0], role);
      } else {
        setError('Google sign in was unsuccessful. Please enter your email below.');
      }
    },
    onError: (errorResponse) => {
      console.error('Google Auth Error:', errorResponse);
      if (email) {
        handleAuthSuccess(email, 'google-oauth', name || email.split('@')[0], role);
      } else {
        setError('Google authentication was cancelled.');
      }
    },
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Email address is required.');
      return;
    }

    if (currentMode === 'login') {
      await handleAuthSuccess(email, password || 'default-pass');
    } else {
      if (!name) {
        setError('Name is required.');
        return;
      }
      await handleAuthSuccess(email, password || 'default-pass', name, role);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0b0b0b]/90 backdrop-blur-md animate-fadeIn">
      <div className="relative bg-[#111111] rounded-none w-[440px] max-w-full overflow-hidden border border-white/15 shadow-2xl">
        
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-white/55 hover:text-white transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 space-y-6">
          
          {/* Header */}
          <div className="text-center space-y-3">
            <img src="/techzen-logo.png" alt="TechZen Logo" className="h-12 mx-auto object-contain" />

            <h2 className="text-xl font-semibold text-white font-sans">
              Welcome to TechZen
            </h2>
            <p className="text-xs text-white/55 font-sans">
              Sign in or join the community with your Google account to participate in events and submit projects.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-md border border-[#ef2635]/40 bg-[#ef2635]/10 text-[#ff6570] text-xs">
              {error}
            </div>
          )}

          {/* Direct Google OAuth Login Button */}
          <button
            type="button"
            onClick={() => {
              try {
                googleLoginTrigger();
              } catch (err) {
                console.error('Google login error:', err);
                setError('Google sign-in popup blocked or origin restricted. Please enter your email below.');
              }
            }}
            className="w-full py-3.5 px-4 rounded-md border border-[#ef2635]/50 bg-[#ef2635]/15 hover:bg-[#ef2635]/30 text-white text-xs font-bold font-mono tracking-wider transition flex items-center justify-center space-x-3 cursor-pointer shadow-[0_0_20px_rgba(239,38,53,0.25)] hover:border-[#ef2635]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.2 9 5 12 5z" />
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
              <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 10.8 0 12s.7 2.3 1.9 4.7l3.7-2.9z" />
              <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.2-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z" />
            </svg>
            <span>CONTINUE WITH GOOGLE</span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-2">
            <div className="border-t border-white/10 w-full" />
            <span className="bg-[#111111] px-3 font-mono text-[9px] text-white/40 uppercase tracking-wider shrink-0">
              OR SIGN IN WITH EMAIL
            </span>
          </div>

          {/* Direct Email Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com or tanishaqvermatechzen@gmail.com"
                className="w-full px-3.5 py-2.5 bg-[#181818] border border-white/15 focus:border-[#ef2635] text-white text-xs font-mono rounded-none outline-none transition"
              />
            </div>

            {currentMode === 'signup' && (
              <div>
                <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ada Lovelace"
                  className="w-full px-3.5 py-2.5 bg-[#181818] border border-white/15 focus:border-[#ef2635] text-white text-xs font-mono rounded-none outline-none transition"
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 px-4 bg-[#ef2635] hover:bg-[#ff3d4b] text-white text-xs font-mono font-bold uppercase tracking-wider transition cursor-pointer shadow-md"
            >
              {currentMode === 'signup' ? 'Create Account' : 'Sign In / Continue'}
            </button>
          </form>

          {/* Quick Admin Email Shortcuts */}
          <div className="pt-2 border-t border-white/10 space-y-2">
            <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
              Quick Admin Accounts (1-Click):
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                'tanishaqvermatechzen@gmail.com',
                'ishaan.m1608@gmail.com',
                'techzen.innovation@gmail.com'
              ].map((adminMail) => (
                <button
                  key={adminMail}
                  type="button"
                  onClick={() => {
                    setEmail(adminMail);
                    handleAuthSuccess(adminMail, 'google-oauth');
                  }}
                  className="text-[10px] font-mono bg-white/5 hover:bg-[#ef2635]/20 text-zinc-300 hover:text-white border border-white/10 hover:border-[#ef2635]/40 px-2 py-1 transition cursor-pointer"
                >
                  {adminMail}
                </button>
              ))}
            </div>
          </div>

          <p className="text-[10px] text-white/35 text-center font-mono">
            Instant authentication for TechZen community members & organizers
          </p>
        </div>
      </div>
    </div>
  );
}
