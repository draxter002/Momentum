import { useEffect } from 'react';
import { getCurrentDate } from '../lib/dateUtils';
import analyticsRepository from '../db/analyticsRepository';
import useUserStore from '../store/useUserStore';

/**
 * Custom hook to automatically award daily badges at midnight
 */
export const useDailyBadgeAward = () => {
  const { refreshStreak } = useUserStore();

  useEffect(() => {
    const checkAndAwardBadge = async () => {
      const today = getCurrentDate();
      const summary = await analyticsRepository.getDailySummary(today);
      
      // Award badge if not already awarded for today
      if (!summary) {
        const stats = await analyticsRepository.calculateCompletionRate(today);
        if (stats && stats.total > 0) {
          await analyticsRepository.awardDailyBadge(today);
          await refreshStreak();
        }
      }
    };

    // Check on mount
    checkAndAwardBadge();

    // Calculate time until next midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();

    // Set timeout for midnight check
    const midnightTimeout = setTimeout(() => {
      checkAndAwardBadge();
      
      // Set up daily interval after first midnight
      const dailyInterval = setInterval(checkAndAwardBadge, 24 * 60 * 60 * 1000);
      
      return () => clearInterval(dailyInterval);
    }, timeUntilMidnight);

    return () => clearTimeout(midnightTimeout);
  }, [refreshStreak]);
};

export default useDailyBadgeAward;
