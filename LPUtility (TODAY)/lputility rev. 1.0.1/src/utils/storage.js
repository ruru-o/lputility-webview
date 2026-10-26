/**
 * Local Storage and Session State Management
 */

const STORAGE_KEYS = {
  USER_PROFILE: 'lputility_profile',
  SCHEDULE_COURSES: 'lputility_schedule_courses',
  SELECTED_PACKAGES: 'lputility_selected_packages',
  CUSTOM_BUNDLES: 'lputility_custom_bundles',
  THEME_MODE: 'lputility_theme',
};

export function getStoredProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    if (!raw) {
      return {
        isGuest: true,
        displayName: 'Guest Student',
        email: 'guest@local.device',
        avatar: '🎓',
      };
    }
    return JSON.parse(raw);
  } catch {
    return {
      isGuest: true,
      displayName: 'Guest Student',
      email: 'guest@local.device',
      avatar: '🎓',
    };
  }
}

export function saveProfile(profile) {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
  } catch (err) {
    console.error('Failed to save user profile:', err);
  }
}

export function getStoredCourses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SCHEDULE_COURSES);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveStoredCourses(courses) {
  try {
    localStorage.setItem(STORAGE_KEYS.SCHEDULE_COURSES, JSON.stringify(courses));
  } catch (err) {
    console.error('Failed to save courses:', err);
  }
}

export function getStoredSelectedPackages() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SELECTED_PACKAGES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStoredSelectedPackages(packageIds) {
  try {
    localStorage.setItem(STORAGE_KEYS.SELECTED_PACKAGES, JSON.stringify(packageIds));
  } catch (err) {
    console.error('Failed to save selected packages:', err);
  }
}

export function exportBackupJson(courses, selectedPackages) {
  const data = {
    appName: 'LPUtility',
    exportedAt: new Date().toISOString(),
    courses,
    selectedPackages,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `lputility-backup-${Date.now()}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
