// Utility to load and persist user profile defaults (college, role, custom role, phone, name)
// so that details entered once in any hackathon/event are automatically remembered and pre-filled in future hackathons.

const PROFILE_DEFAULTS_KEY = 'techzen_user_profile_defaults';

export const getSavedProfileDefaults = () => {
  try {
    const savedDefaultsStr = localStorage.getItem(PROFILE_DEFAULTS_KEY);
    const savedUserStr = localStorage.getItem('techzen_user');
    const defObj = savedDefaultsStr ? JSON.parse(savedDefaultsStr) : {};
    const userObj = savedUserStr ? JSON.parse(savedUserStr) : {};
    return {
      college: defObj.college || userObj.college || '',
      role: defObj.role || userObj.role || '',
      customRole: defObj.customRole || userObj.customRole || '',
      phone: defObj.phone || userObj.phone || '',
      fullName: defObj.fullName || userObj.name || userObj.fullName || ''
    };
  } catch (e) {
    return { college: '', role: '', customRole: '', phone: '', fullName: '' };
  }
};

export const saveProfileDefaults = (data = {}) => {
  try {
    const existing = getSavedProfileDefaults();
    const updated = {
      ...existing,
      ...Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== undefined && v !== null && String(v).trim() !== '')
      )
    };
    localStorage.setItem(PROFILE_DEFAULTS_KEY, JSON.stringify(updated));

    // Sync to techzen_user if present
    const savedUserStr = localStorage.getItem('techzen_user');
    if (savedUserStr) {
      const u = JSON.parse(savedUserStr);
      if (updated.college) u.college = updated.college;
      if (updated.role) u.role = updated.role;
      if (updated.customRole) u.customRole = updated.customRole;
      if (updated.phone) u.phone = updated.phone;
      localStorage.setItem('techzen_user', JSON.stringify(u));
    }
  } catch (e) {
    console.error('Failed to save profile defaults:', e);
  }
};
