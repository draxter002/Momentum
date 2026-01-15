import { useEffect, useState } from 'react';
import { getCurrentDate } from '../lib/dateUtils';
import { getBadgeEmoji } from '../lib/badgeUtils';
import analyticsRepository from '../db/analyticsRepository';
import useUserStore from '../store/useUserStore';
import NotificationBell from './NotificationBell';
import MilestoneModal from './MilestoneModal';

/**
 * Application header with daily progress bar and streak
 */
const Header = () => {
  const { streak, progressRefreshTrigger } = useUserStore();
  const [todaySummary, setTodaySummary] = useState(null);
  const [completionRate, setCompletionRate] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }));
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const userId = 1; // Default user ID

  useEffect(() => {
    const loadTodayProgress = async () => {
      const today = getCurrentDate();
      
      // Always calculate real-time progress from occurrences
      const stats = await analyticsRepository.calculateCompletionRate(today);
      if (stats) {
        setCompletionRate(stats.rate);
        
        // Calculate real-time badge tier based on current completion rate
        const badgeTier = analyticsRepository.getBadgeTier(stats.rate);
        
        // Always use real-time badge tier, not saved summary
        setTodaySummary({
          date: today,
          totalTasks: stats.total,
          completedTasks: stats.completed,
          completionRate: stats.rate,
          badgeTier: badgeTier, // Always use calculated badge tier
        });
      } else {
        setCompletionRate(0);
        setTodaySummary(null);
      }
    };

    loadTodayProgress();
    
    // Refresh every 10 seconds for real-time updates
    const interval = setInterval(loadTodayProgress, 10000);
    return () => clearInterval(interval);
  }, [progressRefreshTrigger]);

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const badgeEmoji = todaySummary ? getBadgeEmoji(todaySummary.badgeTier) : '';

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-white via-blue-50 to-indigo-50 shadow-lg border-b-2 border-blue-200">
      <div className="px-3 md:px-6 py-3 md:py-4">
        <div className="flex flex-col md:flex-row items-center md:justify-between gap-3 md:gap-6">
          {/* Logo */}
          <div className="flex items-center space-x-3 min-w-fit">
            <div className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              ⏰ MOMENTUM
            </div>
          </div>

          {/* Daily Progress Bar */}
          <div className="flex-1 w-full md:max-w-xl">
            <div className="flex items-center space-x-2 md:space-x-4">
              <span className="text-sm md:text-base font-semibold text-gray-700 whitespace-nowrap min-w-fit">
                Today: {Math.round(completionRate)}%
              </span>
              <div className="flex-1 bg-gray-300 rounded-full h-3 md:h-4 overflow-hidden shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-700 ease-out shadow-lg"
                  style={{ width: `${Math.min(completionRate, 100)}%` }}
                />
              </div>
              {badgeEmoji && (
                <span className="text-2xl md:text-3xl drop-shadow-lg animate-bounce" title={todaySummary?.badgeTier}>
                  {badgeEmoji}
                </span>
              )}
            </div>
          </div>

          {/* Right Side: Current Time + Streak + Profile */}
          <div className="flex items-center gap-2 md:gap-4 min-w-fit">
            {/* Current Time */}
            <div className="flex items-center gap-1 md:gap-1.5 px-2 md:px-2.5 py-2 md:py-2.5 rounded-lg md:rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-md min-w-[80px] md:min-w-[100px]">
              <span className="text-base md:text-lg">🕐</span>
              <div className="flex flex-col">
                <span className="text-[8px] md:text-[9px] font-medium uppercase tracking-wide text-blue-700">Now</span>
                <span className="text-sm md:text-base font-black text-blue-600 whitespace-nowrap">
                  {currentTime}
                </span>
              </div>
            </div>
            
            {/* Gold Streak */}
            <div className={`flex items-center gap-2 md:gap-3 px-3 md:px-5 py-2 md:py-3 rounded-lg md:rounded-xl border-2 shadow-lg hover:shadow-xl transition-all hover:scale-105 ${
              (streak?.currentStreak || 0) > 0 
                ? 'bg-gradient-to-br from-amber-100 via-yellow-100 to-orange-100 border-amber-300 animate-pulse-slow' 
                : 'bg-gray-100 border-gray-300 opacity-60'
            }`}>
              <span className={`text-2xl md:text-3xl ${
                (streak?.currentStreak || 0) > 0 ? 'animate-pulse filter drop-shadow-lg' : 'grayscale'
              }`}>🔥</span>
              <div className="flex flex-col">
                <span className={`text-[10px] md:text-xs font-medium uppercase tracking-wide ${
                  (streak?.currentStreak || 0) > 0 ? 'text-amber-700' : 'text-gray-500'
                }`}>Streak</span>
                <span className={`text-xl md:text-2xl font-black ${
                  (streak?.currentStreak || 0) > 0 ? 'text-orange-600' : 'text-gray-500'
                }`}>
                  {streak?.currentStreak || 0}
                </span>
              </div>
            </div>

            {/* Notification Bell */}
            <NotificationBell userId={userId} refreshTrigger={progressRefreshTrigger} />

            {/* Profile Icon */}
            <button 
              onClick={() => setShowMilestoneModal(true)}
              className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-full flex items-center justify-center hover:from-blue-700 hover:to-indigo-800 transition-all shadow-lg hover:shadow-xl hover:scale-110 transform"
              title="Profile"
            >
              <span className="text-xl md:text-2xl">👤</span>
            </button>
          </div>
        </div>
      </div>

      {/* Milestone Modal */}
      <MilestoneModal
        isOpen={showMilestoneModal}
        onClose={() => setShowMilestoneModal(false)}
        userId={userId}
        currentStreak={streak?.currentStreak || 0}
      />
    </header>
  );
};

export default Header;
