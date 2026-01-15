import { create } from 'zustand';
import { format } from 'date-fns';

/**
 * Main application store using Zustand
 */
export const useStore = create((set, get) => ({
  // UI State
  currentView: 'timetable', // 'timetable' | 'analytics' | 'settings'
  selectedDate: format(new Date(), 'yyyy-MM-dd'),
  selectedWeekStart: null, // Will be calculated based on selectedDate
  timeFormat: '24h', // '24h' | '12h'
  
  // Modal states
  isTaskModalOpen: false,
  editingTask: null,
  isOnboardingComplete: false,
  
  // Filters
  showCompletedTasks: true,
  categoryFilter: null,
  
  // Actions
  setCurrentView: (view) => set({ currentView: view }),
  
  setSelectedDate: (date) => set({ selectedDate: date }),
  
  setSelectedWeekStart: (weekStart) => set({ selectedWeekStart: weekStart }),
  
  setTimeFormat: (format) => set({ timeFormat: format }),
  
  openTaskModal: (task = null) => set({ 
    isTaskModalOpen: true, 
    editingTask: task 
  }),
  
  closeTaskModal: () => set({ 
    isTaskModalOpen: false, 
    editingTask: null 
  }),
  
  setOnboardingComplete: (complete) => set({ isOnboardingComplete: complete }),
  
  toggleShowCompleted: () => set((state) => ({ 
    showCompletedTasks: !state.showCompletedTasks 
  })),
  
  setCategoryFilter: (category) => set({ categoryFilter: category }),
}));

export default useStore;
