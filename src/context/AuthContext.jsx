import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const ADMIN_EMAIL = 'tanishaqvermatechzen@gmail.com';

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('techzen_user');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        if (u && u.email) {
          return u;
        }
      } catch (e) {
        console.error('Error parsing saved session:', e);
      }
    }
    return null;
  });

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('techzen_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('techzen_user');
    }
  }, [currentUser]);

  const isAdmin = currentUser?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const login = async (email, password, nameOverride, roleOverride, avatarOverride) => {
    if (!email) return { success: false, error: 'Email required' };

    const cleanEmail = email.trim().toLowerCase();
    const isUserAdmin = cleanEmail === ADMIN_EMAIL.toLowerCase();

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password })
      });
      const data = await res.json();
      if (res.ok && data.id) {
        const userObj = {
          ...data,
          name: nameOverride || data.name || (isUserAdmin ? 'Tanishaq Verma (Admin)' : cleanEmail.split('@')[0]),
          role: isUserAdmin ? 'Admin / Organizer' : (roleOverride || data.role || 'Attendee'),
          avatar: avatarOverride || data.avatar
        };
        setCurrentUser(userObj);
        setAuthModalOpen(false);
        return { success: true, user: userObj };
      }
    } catch (e) {
      console.warn('API connection offline, using client auth state:', e);
    }

    const formattedName = nameOverride || (isUserAdmin 
      ? 'Tanishaq Verma (Admin)' 
      : cleanEmail.split('@')[0].replace('.', ' ').replace(/^./, str => str.toUpperCase()));

    const userToSet = {
      id: `usr-${Date.now()}`,
      name: formattedName,
      email: cleanEmail,
      role: isUserAdmin ? 'Admin / Organizer' : (roleOverride || 'Attendee'),
      bio: isUserAdmin ? 'TechZen Founder & Community Admin' : 'TechZen Community Member',
      avatar: avatarOverride || (isUserAdmin 
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'),
      techStack: isUserAdmin ? ['Admin', 'React', 'Node.js'] : ['Developer'],
      github: '',
      linkedin: ''
    };
    setCurrentUser(userToSet);
    setAuthModalOpen(false);
    return { success: true, user: userToSet };
  };

  const signup = async (userData) => {
    if (!userData || !userData.email) return { success: false, error: 'Email required' };

    const cleanEmail = userData.email.trim().toLowerCase();
    const isUserAdmin = cleanEmail === ADMIN_EMAIL.toLowerCase();

    const newUser = {
      id: `usr-${Date.now()}`,
      name: userData.name || cleanEmail.split('@')[0],
      email: cleanEmail,
      role: isUserAdmin ? 'Admin / Organizer' : (userData.role || 'Attendee'),
      bio: userData.bio || (isUserAdmin ? 'TechZen Community Admin' : 'Passionate about technology.'),
      avatar: userData.avatar || (isUserAdmin 
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'),
      techStack: userData.techStack ? (Array.isArray(userData.techStack) ? userData.techStack : userData.techStack.split(',').map(s => s.trim())) : ['Tech'],
      github: userData.github || '',
      linkedin: userData.linkedin || ''
    };

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      const data = await res.json();
      if (res.ok && data.id) {
        setCurrentUser(data);
        setAuthModalOpen(false);
        return { success: true, user: data };
      }
    } catch (e) {
      console.warn('API connection offline, using client signup state:', e);
    }

    setCurrentUser(newUser);
    setAuthModalOpen(false);
    return { success: true, user: newUser };
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('techzen_user');
  };

  const updateUserProfile = (updatedFields) => {
    setCurrentUser(prev => ({ ...prev, ...updatedFields }));
  };

  const openAuth = (mode = 'login') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const closeAuth = () => {
    setAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      isAdmin,
      ADMIN_EMAIL,
      authModalOpen,
      authMode,
      login,
      signup,
      logout,
      updateUserProfile,
      openAuth,
      closeAuth,
      setAuthMode
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
