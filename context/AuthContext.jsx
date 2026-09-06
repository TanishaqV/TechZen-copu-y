import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const ADMIN_EMAILS = [
  'tanishaqvermatechzen@gmail.com',
  'ishaan.m1608@gmail.com',
  'techzen.innovation@gmail.com'
];

export const ADMIN_EMAIL = ADMIN_EMAILS[0];

export const isEmailAdmin = (email) => {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return ADMIN_EMAILS.some(admin => admin.toLowerCase() === clean);
};

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

  const isAdmin = isEmailAdmin(currentUser?.email);

  const getAdminDefaultName = (email) => {
    const clean = email.trim().toLowerCase();
    if (clean === 'ishaan.m1608@gmail.com') return 'Ishaan M (Admin)';
    if (clean === 'techzen.innovation@gmail.com') return 'TechZen Innovation (Admin)';
    return 'Tanishaq Verma (Admin)';
  };

  const login = async (email, password, nameOverride, roleOverride, avatarOverride) => {
    if (!email) return { success: false, error: 'Email required' };

    const cleanEmail = email.trim().toLowerCase();
    const isUserAdmin = isEmailAdmin(cleanEmail);

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
          name: nameOverride || data.name || (isUserAdmin ? getAdminDefaultName(cleanEmail) : cleanEmail.split('@')[0]),
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
      ? getAdminDefaultName(cleanEmail) 
      : cleanEmail.split('@')[0].replace('.', ' ').replace(/^./, str => str.toUpperCase()));

    const userToSet = {
      id: `usr-${Date.now()}`,
      name: formattedName,
      email: cleanEmail,
      role: isUserAdmin ? 'Admin / Organizer' : (roleOverride || 'Attendee'),
      bio: isUserAdmin ? 'TechZen Community Admin' : 'TechZen Community Member',
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
    const isUserAdmin = isEmailAdmin(cleanEmail);

    const newUser = {
      id: `usr-${Date.now()}`,
      name: userData.name || (isUserAdmin ? getAdminDefaultName(cleanEmail) : cleanEmail.split('@')[0]),
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
      ADMIN_EMAILS,
      ADMIN_EMAIL,
      isEmailAdmin,
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

