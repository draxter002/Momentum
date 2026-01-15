import { create } from 'zustand';
import db from '../db/database';

/**
 * User settings store with Dexie integration
 */
export const useUserStore = create((set, get) => ({
  user: null,
  streak: null,
  isLoading: true,
  progressRefreshTrigger: 0,
  
  // Load user data from Dexie
  loadUser: async () => {
    try {
      const user = await db.users.get(1);
      const streak = await db.streaks.get(1);
      set({ user, streak, isLoading: false });
    } catch (error) {
      console.error('Failed to load user:', error);
      set({ isLoading: false });
    }
  },
  
  // Update user settings
  updateSettings: async (settings) => {
    try {
      const user = get().user;
      if (!user) return;
      
      const updatedSettings = {
        ...user.settings,
        ...settings,
      };
      
      await db.users.update(user.id, {
        settings: updatedSettings,
        updatedAt: new Date().toISOString(),
      });
      
      set({
        user: {
          ...user,
          settings: updatedSettings,
        },
      });
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  },
  
  // Get setting value
  getSetting: (key, defaultValue = null) => {
    const user = get().user;
    return user?.settings?.[key] ?? defaultValue;
  },
  
  // Refresh streak data
  refreshStreak: async () => {
    try {
      const streak = await db.streaks.get(1);
      set({ streak });
    } catch (error) {
      console.error('Failed to refresh streak:', error);
    }
  },
  
  // Trigger progress bar refresh
  triggerProgressRefresh: () => {
    set({ progressRefreshTrigger: get().progressRefreshTrigger + 1 });
  },
}));

export default useUserStore;
