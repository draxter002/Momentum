import { useState, useEffect } from 'react';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { getCurrentDate } from '../lib/dateUtils';
import { getBadgeColor, getBadgeEmoji } from '../lib/badgeUtils';
import analyticsRepository from '../db/analyticsRepository';
import useUserStore from '../store/useUserStore';

/**
 * Analytics View - Charts and statistics
 */
const AnalyticsPage = () => {
  const { streak } = useUserStore();
  const [view, setView] = useState('weekly'); // 'weekly' | 'monthly' | 'yearly'
  const [summaries, setSummaries] = useState([]);
  const [badgeDistribution, setBadgeDistribution] = useState(null);
  const [dayOfWeekStats, setDayOfWeekStats] = useState(null);

  useEffect(() => {
    const loadAnalytics = async () => {
      const today = getCurrentDate();
      let startDate, endDate;

      switch (view) {
        case 'weekly':
          startDate = format(subDays(new Date(), 6), 'yyyy-MM-dd');
          endDate = today;
          break;
        case 'monthly':
          startDate = format(startOfMonth(new Date()), 'yyyy-MM-dd');
          endDate = format(endOfMonth(new Date()), 'yyyy-MM-dd');
          break;
        case 'yearly':
          startDate = format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd');
          endDate = today;
          break;
        default:
          startDate = format(subDays(new Date(), 6), 'yyyy-MM-dd');
          endDate = today;
      }

      // Get real-time analytics from occurrences
      const data = await analyticsRepository.getRealTimeAnalytics(startDate, endDate);
      setSummaries(data);

      const distribution = await analyticsRepository.getRealTimeBadgeDistribution(startDate, endDate);
      setBadgeDistribution(distribution);

      const dayStats = await analyticsRepository.getRealTimeDayOfWeekAnalysis(startDate, endDate);
      setDayOfWeekStats(dayStats);
    };

    loadAnalytics();
  }, [view]);

  const averageCompletion = summaries.length > 0
    ? summaries.reduce((sum, s) => sum + s.completionRate, 0) / summaries.length
    : 0;

  return (
    <div className="space-y-8">
      {/* View Selector */}
      <div className="flex space-x-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl shadow-md p-3 border border-gray-200">
        {['weekly', 'monthly', 'yearly'].map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`flex-1 py-3 px-6 rounded-lg font-bold text-base transition-all transform hover:scale-105 capitalize ${
              view === v
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-100 shadow-sm'
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      {/* Streak Card */}
      <div className="bg-gradient-to-br from-orange-400 via-red-400 to-red-500 rounded-2xl shadow-2xl p-8 text-white transform hover:scale-105 transition-all">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold mb-3 flex items-center gap-2">
              <span className="text-4xl animate-pulse">🔥</span>
              Gold Streak
            </h3>
            <p className="text-7xl font-black drop-shadow-lg">{streak?.currentStreak || 0}</p>
            <p className="text-lg mt-3 opacity-95 font-medium">
              Longest: {streak?.longestStreak || 0} days
            </p>
          </div>
          <div className="text-right">
            <p className="text-base opacity-95 font-medium mb-2">Freeze Tokens</p>
            <p className="text-5xl drop-shadow-lg">❄️ × {streak?.freezeTokens || 0}</p>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg p-6 border-2 border-blue-200 hover:shadow-2xl transition-all transform hover:-translate-y-1">
          <h4 className="text-sm font-bold text-blue-700 mb-3 uppercase tracking-wide">Average Completion</h4>
          <p className="text-5xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {Math.round(averageCompletion)}%
          </p>
        </div>
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-lg p-6 border-2 border-gray-300 hover:shadow-2xl transition-all transform hover:-translate-y-1">
          <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Total Tasks</h4>
          <p className="text-5xl font-black text-gray-800">
            {summaries.reduce((sum, s) => sum + s.totalTasks, 0)}
          </p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl shadow-lg p-6 border-2 border-green-300 hover:shadow-2xl transition-all transform hover:-translate-y-1">
          <h4 className="text-sm font-bold text-green-700 mb-3 uppercase tracking-wide">Completed Tasks</h4>
          <p className="text-5xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            {summaries.reduce((sum, s) => sum + s.completedTasks, 0)}
          </p>
        </div>
      </div>

      {/* Badge Distribution */}
      {badgeDistribution && (
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
          <h3 className="text-2xl font-bold mb-6 text-gray-800">🏆 Badge Distribution</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {Object.entries(badgeDistribution).map(([tier, count]) => (
              <div
                key={tier}
                className="p-4 rounded-lg border-2 text-center"
                style={{
                  borderColor: getBadgeColor(tier),
                  backgroundColor: `${getBadgeColor(tier)}15`,
                }}
              >
                <div className="text-4xl mb-2">{getBadgeEmoji(tier)}</div>
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-sm text-gray-600 capitalize">{tier}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Day of Week Analysis */}
      {dayOfWeekStats && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Day of Week Performance</h3>
          <div className="space-y-3">
            {Object.entries(dayOfWeekStats).map(([day, stats]) => {
              const total = stats.gold + stats.silver + stats.bronze + stats.shameful;
              return (
                <div key={day}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{day}</span>
                    <span className="text-xs text-gray-500">
                      {stats.gold}🥇 {stats.silver}🥈 {stats.bronze}🥉
                    </span>
                  </div>
                  <div className="flex h-6 rounded-full overflow-hidden bg-gray-100">
                    {total > 0 && (
                      <>
                        <div
                          className="bg-gold"
                          style={{ width: `${(stats.gold / total) * 100}%` }}
                        />
                        <div
                          className="bg-silver"
                          style={{ width: `${(stats.silver / total) * 100}%` }}
                        />
                        <div
                          className="bg-bronze"
                          style={{ width: `${(stats.bronze / total) * 100}%` }}
                        />
                        <div
                          className="bg-shameful"
                          style={{ width: `${(stats.shameful / total) * 100}%` }}
                        />
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Days */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Performance</h3>
        <div className="space-y-2">
          {summaries.slice().reverse().slice(0, 10).map((summary) => (
            <div
              key={summary.date}
              className="flex items-center justify-between p-3 rounded-lg border"
              style={{
                borderColor: getBadgeColor(summary.badgeTier),
                backgroundColor: `${getBadgeColor(summary.badgeTier)}10`,
              }}
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{getBadgeEmoji(summary.badgeTier)}</span>
                <div>
                  <div className="font-medium">{format(new Date(summary.date), 'MMM d, yyyy')}</div>
                  <div className="text-sm text-gray-600">
                    {summary.completedTasks} / {summary.totalTasks} tasks
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  {Math.round(summary.completionRate)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
