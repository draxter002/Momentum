import { useState, useEffect } from 'react';
import { format, subDays, addDays, startOfMonth, endOfMonth, eachDayOfInterval, startOfYear, parseISO, startOfWeek, endOfWeek, eachWeekOfInterval, getWeek } from 'date-fns';
import { getCurrentDate } from '../lib/dateUtils';
import { getBadgeColor, getBadgeEmoji } from '../lib/badgeUtils';
import analyticsRepository from '../db/analyticsRepository';
import milestoneRepository from '../db/milestoneRepository';
import useUserStore from '../store/useUserStore';

/**
 * Analytics View - Charts and statistics
 */
const AnalyticsPage = () => {
  const { streak } = useUserStore();
  const [view, setView] = useState('weekly'); // 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  const [summaries, setSummaries] = useState([]);
  const [badgeDistribution, setBadgeDistribution] = useState(null);
  const [periodStats, setPeriodStats] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null); // For drill-down in monthly view
  const [monthDetailData, setMonthDetailData] = useState(null);
  const [selectedQuarter, setSelectedQuarter] = useState(null); // For drill-down in quarterly view
  const [quarterDetailData, setQuarterDetailData] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null); // For drill-down in yearly view
  const [yearDetailData, setYearDetailData] = useState(null);
  const [selectedWeekStart, setSelectedWeekStart] = useState(null); // For week navigation in weekly view

  useEffect(() => {
    const loadAnalytics = async () => {
      const today = getCurrentDate();
      let startDate, endDate;
      let periodStartDate, periodEndDate; // For badge distribution

      switch (view) {
        case 'weekly':
          if (selectedWeekStart) {
            startDate = selectedWeekStart;
            endDate = format(addDays(new Date(selectedWeekStart), 6), 'yyyy-MM-dd');
          } else {
            startDate = format(subDays(new Date(), 6), 'yyyy-MM-dd');
            endDate = today;
          }
          periodStartDate = startDate;
          periodEndDate = endDate;
          break;
        case 'monthly':
          // Get data for the entire current year to show all months for period stats
          startDate = format(startOfYear(new Date()), 'yyyy-MM-dd');
          endDate = today;
          // But badge distribution should only show current month
          periodStartDate = format(startOfMonth(new Date()), 'yyyy-MM-dd');
          periodEndDate = format(endOfMonth(new Date()), 'yyyy-MM-dd');
          break;
        case 'quarterly':
          // Get data for the current year to show quarters
          startDate = format(startOfYear(new Date()), 'yyyy-MM-dd');
          endDate = today;
          // Badge distribution for current quarter only
          const currentMonth = new Date().getMonth();
          const currentQuarter = Math.floor(currentMonth / 3);
          const quarterStartMonth = currentQuarter * 3;
          periodStartDate = format(new Date(new Date().getFullYear(), quarterStartMonth, 1), 'yyyy-MM-dd');
          periodEndDate = format(new Date(new Date().getFullYear(), quarterStartMonth + 3, 0), 'yyyy-MM-dd');
          break;
        case 'yearly':
          // Get data from last 5 years for period stats
          startDate = format(new Date(new Date().getFullYear() - 4, 0, 1), 'yyyy-MM-dd');
          endDate = today;
          // Badge distribution for current year only
          periodStartDate = format(startOfYear(new Date()), 'yyyy-MM-dd');
          periodEndDate = format(new Date(new Date().getFullYear(), 11, 31), 'yyyy-MM-dd');
          break;
        default:
          startDate = format(subDays(new Date(), 6), 'yyyy-MM-dd');
          endDate = today;
          periodStartDate = startDate;
          periodEndDate = endDate;
      }

      // Get real-time analytics from occurrences
      const data = await analyticsRepository.getRealTimeAnalytics(startDate, endDate);
      setSummaries(data);

      // Get badge distribution for the specific period
      const distribution = await analyticsRepository.getRealTimeBadgeDistribution(periodStartDate, periodEndDate);
      setBadgeDistribution(distribution);

      // Get period-specific stats based on view
      let periodStats;
      switch (view) {
        case 'weekly':
          periodStats = await analyticsRepository.getRealTimeDayOfWeekAnalysis(startDate, endDate);
          break;
        case 'monthly':
          periodStats = await analyticsRepository.getRealTimeMonthAnalysis(startDate, endDate);
          break;
        case 'quarterly':
          periodStats = await analyticsRepository.getRealTimeQuarterAnalysis(startDate, endDate);
          break;
        case 'yearly':
          periodStats = await analyticsRepository.getRealTimeYearAnalysis(startDate, endDate);
          break;
        default:
          periodStats = await analyticsRepository.getRealTimeDayOfWeekAnalysis(startDate, endDate);
      }
      setPeriodStats(periodStats);
    };

    loadAnalytics();
  }, [view, selectedWeekStart]);

  // Refresh month detail data when summaries change (for real-time updates)
  useEffect(() => {
    if (selectedMonth && view === 'monthly') {
      handleMonthClick(selectedMonth);
    }
  }, [summaries]);

  const averageCompletion = summaries.length > 0
    ? summaries.reduce((sum, s) => sum + s.completionRate, 0) / summaries.length
    : 0;

  const handleMonthClick = async (monthName) => {
    // Get month number from name
    const monthMap = {
      January: 0, February: 1, March: 2, April: 3, May: 4, June: 5,
      July: 6, August: 7, September: 8, October: 9, November: 10, December: 11
    };
    const monthIndex = monthMap[monthName];
    const year = new Date().getFullYear();
    
    const monthStart = new Date(year, monthIndex, 1);
    const monthEnd = new Date(year, monthIndex + 1, 0);
    const startDate = format(monthStart, 'yyyy-MM-dd');
    const endDate = format(monthEnd, 'yyyy-MM-dd');
    
    const data = await analyticsRepository.getRealTimeAnalytics(startDate, endDate);
    const distribution = await analyticsRepository.getRealTimeBadgeDistribution(startDate, endDate);
    
    // Calculate weeks in the month
    const weeks = eachWeekOfInterval(
      { start: monthStart, end: monthEnd },
      { weekStartsOn: 1 } // Start week on Monday
    );
    
    // Group data by week
    const weeklyData = weeks.map((weekStart, index) => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      const weekEndCapped = weekEnd > monthEnd ? monthEnd : weekEnd;
      
      const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEndCapped });
      const weekData = daysInWeek.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const dayData = data.find(d => d.date === dateStr);
        return {
          date: dateStr,
          dayName: format(day, 'EEEE'),
          shortDay: format(day, 'EEE'),
          dayNumber: format(day, 'd'),
          ...dayData,
          completed: dayData?.completedTasks || 0,
          total: dayData?.totalTasks || 0,
          rate: dayData?.completionRate || 0,
          badge: dayData?.badgeTier || 'shameful'
        };
      });
      
      return {
        weekNumber: index + 1,
        weekStart: format(weekStart, 'MMM d'),
        weekEnd: format(weekEndCapped, 'MMM d'),
        days: weekData
      };
    });
    
    setMonthDetailData({
      monthName,
      data,
      distribution,
      startDate,
      endDate,
      weeklyData
    });
    setSelectedMonth(monthName);
  };

  const handleBackToMonthly = () => {
    setSelectedMonth(null);
    setMonthDetailData(null);
  };

  const handleQuarterClick = async (quarterName) => {
    // Parse quarter name like "Q1 (Jan-Mar)"
    const quarterNum = parseInt(quarterName.charAt(1));
    const year = new Date().getFullYear();
    
    // Calculate quarter date range
    const startMonth = (quarterNum - 1) * 3; // 0, 3, 6, 9
    const endMonth = startMonth + 2; // 2, 5, 8, 11
    
    const quarterStart = new Date(year, startMonth, 1);
    const quarterEnd = new Date(year, endMonth + 1, 0); // Last day of end month
    const startDate = format(quarterStart, 'yyyy-MM-dd');
    const endDate = format(quarterEnd, 'yyyy-MM-dd');
    
    // Get data for the quarter
    const data = await analyticsRepository.getRealTimeAnalytics(startDate, endDate);
    const distribution = await analyticsRepository.getRealTimeBadgeDistribution(startDate, endDate);
    
    // Calculate average daily completion
    const avgCompletion = data.length > 0
      ? data.reduce((sum, d) => sum + d.completionRate, 0) / data.length
      : 0;
    
    // Group data by month
    const monthlyBreakdown = {};
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    
    // Initialize months in this quarter
    for (let i = startMonth; i <= endMonth; i++) {
      monthNames[i] && (monthlyBreakdown[monthNames[i]] = {
        gold: 0,
        silver: 0,
        bronze: 0,
        shameful: 0,
        totalDays: 0,
        avgCompletion: 0,
        completionSum: 0
      });
    }
    
    // Populate monthly data
    data.forEach(d => {
      const monthName = format(parseISO(d.date), 'MMMM');
      if (monthlyBreakdown[monthName]) {
        monthlyBreakdown[monthName][d.badgeTier]++;
        monthlyBreakdown[monthName].totalDays++;
        monthlyBreakdown[monthName].completionSum += d.completionRate;
      }
    });
    
    // Calculate average completion per month
    Object.keys(monthlyBreakdown).forEach(month => {
      const monthData = monthlyBreakdown[month];
      if (monthData.totalDays > 0) {
        monthData.avgCompletion = monthData.completionSum / monthData.totalDays;
      }
    });
    
    setQuarterDetailData({
      quarterName,
      year,
      data,
      distribution,
      avgCompletion,
      monthlyBreakdown,
      startDate,
      endDate
    });
    setSelectedQuarter(quarterName);
  };

  const handleBackToQuarterly = () => {
    setSelectedQuarter(null);
    setQuarterDetailData(null);
  };

  const handleYearClick = async (yearStr) => {
    const year = parseInt(yearStr);
    
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31);
    const startDate = format(yearStart, 'yyyy-MM-dd');
    const endDate = format(yearEnd, 'yyyy-MM-dd');
    
    // Get data for the year
    const data = await analyticsRepository.getRealTimeAnalytics(startDate, endDate);
    const distribution = await analyticsRepository.getRealTimeBadgeDistribution(startDate, endDate);
    
    // Get milestones achieved in this year
    const allMilestones = await milestoneRepository.getAllMilestones();
    const yearMilestones = allMilestones.filter(m => {
      if (!m.achievedAt) return false;
      const achievedYear = new Date(m.achievedAt).getFullYear();
      return achievedYear === year;
    });
    
    // Find best and worst days
    const daysWithData = data.filter(d => d.totalTasks > 0);
    let bestDays = [];
    let worstDays = [];
    
    if (daysWithData.length > 0) {
      const maxRate = Math.max(...daysWithData.map(d => d.completionRate));
      const minRate = Math.min(...daysWithData.map(d => d.completionRate));
      bestDays = daysWithData.filter(d => d.completionRate === maxRate);
      worstDays = daysWithData.filter(d => d.completionRate === minRate);
    }
    
    // Calculate monthly breakdown
    const monthlyBreakdown = {};
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    
    monthNames.forEach(month => {
      monthlyBreakdown[month] = {
        gold: 0,
        silver: 0,
        bronze: 0,
        shameful: 0
      };
    });
    
    data.forEach(d => {
      const monthName = format(parseISO(d.date), 'MMMM');
      if (monthlyBreakdown[monthName]) {
        monthlyBreakdown[monthName][d.badgeTier]++;
      }
    });
    
    setYearDetailData({
      year,
      data,
      distribution,
      milestones: yearMilestones,
      bestDays,
      worstDays,
      monthlyBreakdown,
      startDate,
      endDate
    });
    setSelectedYear(yearStr);
  };

  const handleBackToYearly = () => {
    setSelectedYear(null);
    setYearDetailData(null);
  };

  const handlePreviousWeek = () => {
    const currentStart = selectedWeekStart ? new Date(selectedWeekStart) : subDays(new Date(), 6);
    const newStart = format(subDays(currentStart, 7), 'yyyy-MM-dd');
    setSelectedWeekStart(newStart);
  };

  const handleNextWeek = () => {
    const currentStart = selectedWeekStart ? new Date(selectedWeekStart) : subDays(new Date(), 6);
    const newStart = format(addDays(currentStart, 7), 'yyyy-MM-dd');
    setSelectedWeekStart(newStart);
  };

  const handleDateChange = (e) => {
    const selectedDate = new Date(e.target.value);
    const weekStart = format(subDays(selectedDate, 6), 'yyyy-MM-dd');
    setSelectedWeekStart(weekStart);
  };

  const handleCurrentWeek = () => {
    setSelectedWeekStart(null);
  };

  const handleViewChange = (newView) => {
    setView(newView);
    setSelectedWeekStart(null); // Reset week selection when changing views
  };

  return (
    <div className="space-y-8">
      {/* View Selector */}
      <div className="flex space-x-2 md:space-x-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl shadow-md p-2 md:p-3 border border-gray-200">
        {['weekly', 'monthly', 'quarterly', 'yearly'].map((v) => (
          <button
            key={v}
            onClick={() => handleViewChange(v)}
            className={`flex-1 py-2 md:py-3 px-3 md:px-6 rounded-lg font-bold text-sm md:text-base transition-all transform hover:scale-105 capitalize ${
              view === v
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-100 shadow-sm'
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      {/* Week Navigation Controls (only for weekly view) */}
      {view === 'weekly' && (
        <div className="bg-white rounded-lg shadow-md p-3 md:p-4 border border-gray-200">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 md:gap-4">
            <button
              onClick={handlePreviousWeek}
              className="px-3 md:px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 text-sm md:text-base"
            >
              <span>←</span> Previous Week
            </button>
            
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-4">
              <div className="flex items-center gap-2">
                <label className="text-xs md:text-sm font-medium text-gray-700 whitespace-nowrap">Jump to date:</label>
                <input
                  type="date"
                  onChange={handleDateChange}
                  className="flex-1 md:flex-initial px-2 md:px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <button
                onClick={handleCurrentWeek}
                className="px-3 md:px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm md:text-base"
              >
                Current Week
              </button>
            </div>
            
            <button
              onClick={handleNextWeek}
              className="px-3 md:px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 text-sm md:text-base"
            >
              Next Week <span>→</span>
            </button>
          </div>
          
          {selectedWeekStart && (
            <div className="mt-3 text-center text-xs md:text-sm text-gray-600">
              Viewing week: {format(new Date(selectedWeekStart), 'MMM d, yyyy')} - {format(addDays(new Date(selectedWeekStart), 6), 'MMM d, yyyy')}
            </div>
          )}
        </div>
      )}

      {/* Streak Card */}
      <div className="bg-gradient-to-br from-orange-400 via-red-400 to-red-500 rounded-xl shadow-lg p-4 md:p-6 text-white transition-shadow hover:shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg md:text-xl font-bold mb-2 flex items-center gap-2">
              <span className="text-2xl md:text-3xl animate-pulse">🔥</span>
              Gold Streak
            </h3>
            <p className="text-4xl md:text-5xl font-black drop-shadow-lg">{streak?.currentStreak || 0}</p>
            <p className="text-xs md:text-sm mt-2 opacity-95 font-medium">
              Longest: {streak?.longestStreak || 0} days
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs md:text-sm opacity-95 font-medium mb-1">Freeze Tokens</p>
            <p className="text-3xl md:text-4xl drop-shadow-lg">❄️ × {streak?.freezeTokens || 0}</p>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg p-4 md:p-6 border-2 border-blue-200 hover:shadow-2xl transition-all transform hover:-translate-y-1">
          <h4 className="text-xs md:text-sm font-bold text-blue-700 mb-2 md:mb-3 uppercase tracking-wide">Average Completion</h4>
          <p className="text-4xl md:text-5xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {Math.round(averageCompletion)}%
          </p>
        </div>
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-lg p-4 md:p-6 border-2 border-gray-300 hover:shadow-2xl transition-all transform hover:-translate-y-1">
          <h4 className="text-xs md:text-sm font-bold text-gray-700 mb-2 md:mb-3 uppercase tracking-wide">Total Tasks</h4>
          <p className="text-4xl md:text-5xl font-black text-gray-800">
            {summaries.reduce((sum, s) => sum + s.totalTasks, 0)}
          </p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl shadow-lg p-4 md:p-6 border-2 border-green-300 hover:shadow-2xl transition-all transform hover:-translate-y-1">
          <h4 className="text-xs md:text-sm font-bold text-green-700 mb-2 md:mb-3 uppercase tracking-wide">Completed Tasks</h4>
          <p className="text-4xl md:text-5xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            {summaries.reduce((sum, s) => sum + s.completedTasks, 0)}
          </p>
        </div>
      </div>

      {/* Badge Distribution */}
      {badgeDistribution && !selectedMonth && !selectedQuarter && !selectedYear && (
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

      {/* Period Analysis */}
      {periodStats && !selectedMonth && !selectedQuarter && !selectedYear && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">
            {view === 'weekly' && 'Day of Week Performance'}
            {view === 'monthly' && 'Monthly Performance (Click to view details)'}
            {view === 'quarterly' && 'Quarterly Performance (Click to view details)'}
            {view === 'yearly' && 'Yearly Performance (Click to view details)'}
          </h3>
          <div className="space-y-3">
            {Object.entries(periodStats).map(([period, stats]) => {
              const total = stats.gold + stats.silver + stats.bronze + stats.shameful;
              const isClickable = view === 'monthly' || view === 'quarterly' || view === 'yearly';
              return (
                <div 
                  key={period}
                  onClick={() => {
                    if (view === 'monthly') handleMonthClick(period);
                    if (view === 'quarterly') handleQuarterClick(period);
                    if (view === 'yearly') handleYearClick(period);
                  }}
                  className={isClickable ? 'cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors' : ''}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{period}</span>
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

      {/* Month Detail View */}
      {selectedMonth && monthDetailData && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold">{selectedMonth} {new Date().getFullYear()} - Weekly Breakdown</h3>
              <button
                onClick={handleBackToMonthly}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
              >
                ← Back to Monthly View
              </button>
            </div>

            {/* Month Badge Distribution */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {Object.entries(monthDetailData.distribution).map(([tier, count]) => (
                <div
                  key={tier}
                  className="p-3 rounded-lg border-2 text-center"
                  style={{
                    borderColor: getBadgeColor(tier),
                    backgroundColor: `${getBadgeColor(tier)}15`,
                  }}
                >
                  <div className="text-3xl mb-1">{getBadgeEmoji(tier)}</div>
                  <div className="text-xl font-bold">{count}</div>
                  <div className="text-xs text-gray-600 capitalize">{tier}</div>
                </div>
              ))}
            </div>

            {/* Best and Worst Days */}
            {(() => {
              const daysWithData = monthDetailData.data.filter(d => d.totalTasks > 0);
              if (daysWithData.length === 0) return null;
              
              const maxRate = Math.max(...daysWithData.map(d => d.completionRate));
              const minRate = Math.min(...daysWithData.map(d => d.completionRate));
              
              const bestDays = daysWithData.filter(d => d.completionRate === maxRate);
              const worstDays = daysWithData.filter(d => d.completionRate === minRate);
              
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {/* Best Days */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border-2 border-green-300">
                    <h4 className="font-bold text-green-700 mb-3 flex items-center gap-2">
                      <span className="text-2xl">🏆</span>
                      Best Day{bestDays.length > 1 ? 's' : ''} of the Month
                    </h4>
                    <div className="space-y-2">
                      {bestDays.map(day => (
                        <div key={day.date} className="flex items-center justify-between bg-white rounded-lg p-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{getBadgeEmoji(day.badgeTier)}</span>
                            <span className="font-medium text-sm">
                              {format(parseISO(day.date), 'EEE, MMM d')}
                            </span>
                          </div>
                          <span className="text-lg font-bold text-green-600">
                            {Math.round(day.completionRate)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Worst Days */}
                  <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-lg p-4 border-2 border-red-300">
                    <h4 className="font-bold text-red-700 mb-3 flex items-center gap-2">
                      <span className="text-2xl">📉</span>
                      Worst Day{worstDays.length > 1 ? 's' : ''} of the Month
                    </h4>
                    <div className="space-y-2">
                      {worstDays.map(day => (
                        <div key={day.date} className="flex items-center justify-between bg-white rounded-lg p-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{getBadgeEmoji(day.badgeTier)}</span>
                            <span className="font-medium text-sm">
                              {format(parseISO(day.date), 'EEE, MMM d')}
                            </span>
                          </div>
                          <span className="text-lg font-bold text-red-600">
                            {Math.round(day.completionRate)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Weekly Grids */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {monthDetailData.weeklyData && monthDetailData.weeklyData.map((week) => (
              <div key={week.weekNumber} className="bg-white rounded-lg shadow-md p-5 border border-gray-200">
                <h4 className="font-bold text-lg mb-4 text-gray-700">
                  Week {week.weekNumber}: {week.weekStart} - {week.weekEnd}
                </h4>
                <div className="space-y-3">
                  {week.days.map((day) => {
                    const hasData = day.total > 0;
                    return (
                      <div key={day.date}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm w-12">{day.shortDay}</span>
                            <span className="text-xs text-gray-500">{day.dayNumber}</span>
                            {hasData && (
                              <>
                                <span className="text-lg">{getBadgeEmoji(day.badge)}</span>
                                <span className="text-xs text-gray-600">
                                  {day.completed}/{day.total} tasks
                                </span>
                              </>
                            )}
                          </div>
                          {hasData && (
                            <span className="text-sm font-bold text-gray-700">
                              {Math.round(day.rate)}%
                            </span>
                          )}
                        </div>
                        <div className="flex h-4 rounded-full overflow-hidden bg-gray-100">
                          {hasData ? (
                            <div
                              className="transition-all"
                              style={{
                                width: `${day.rate}%`,
                                backgroundColor: getBadgeColor(day.badge)
                              }}
                            />
                          ) : (
                            <div className="w-full flex items-center justify-center">
                              <span className="text-xs text-gray-400">No tasks</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quarter Detail View */}
      {selectedQuarter && quarterDetailData && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold">
                {quarterDetailData.quarterName} {quarterDetailData.year} - Monthly Breakdown
              </h3>
              <button
                onClick={handleBackToQuarterly}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
              >
                ← Back to Quarterly View
              </button>
            </div>

            {/* Quarter Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border-2 border-purple-300">
                <h4 className="text-sm font-bold text-purple-700 mb-2 uppercase tracking-wide">
                  Avg Daily Completion
                </h4>
                <p className="text-4xl font-black text-purple-700">
                  {Math.round(quarterDetailData.avgCompletion)}%
                </p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border-2 border-blue-300">
                <h4 className="text-sm font-bold text-blue-700 mb-2 uppercase tracking-wide">
                  Total Days Tracked
                </h4>
                <p className="text-4xl font-black text-blue-700">
                  {quarterDetailData.data.length}
                </p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border-2 border-green-300">
                <h4 className="text-sm font-bold text-green-700 mb-2 uppercase tracking-wide">
                  Gold Days
                </h4>
                <p className="text-4xl font-black text-green-700">
                  {quarterDetailData.distribution.gold}
                </p>
              </div>
            </div>

            {/* Quarter Badge Distribution */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-3">Badge Distribution for Quarter</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(quarterDetailData.distribution).map(([tier, count]) => (
                  <div
                    key={tier}
                    className="p-3 rounded-lg border-2 text-center"
                    style={{
                      borderColor: getBadgeColor(tier),
                      backgroundColor: `${getBadgeColor(tier)}15`,
                    }}
                  >
                    <div className="text-3xl mb-1">{getBadgeEmoji(tier)}</div>
                    <div className="text-xl font-bold">{count}</div>
                    <div className="text-xs text-gray-600 capitalize">{tier}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Monthly Breakdown */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h4 className="text-lg font-semibold mb-4">Monthly Breakdown</h4>
            <div className="space-y-4">
              {Object.entries(quarterDetailData.monthlyBreakdown).map(([monthName, stats]) => {
                const total = stats.gold + stats.silver + stats.bronze + stats.shameful;
                return (
                  <div key={monthName} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-bold text-lg">{monthName}</h5>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600">
                          Avg: <span className="font-bold">{Math.round(stats.avgCompletion)}%</span>
                        </span>
                        <span className="text-sm text-gray-600">
                          Days: <span className="font-bold">{stats.totalDays}</span>
                        </span>
                      </div>
                    </div>
                    
                    {/* Badge counts */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500">
                        {stats.gold}🥇 {stats.silver}🥈 {stats.bronze}🥉 {stats.shameful}😔
                      </span>
                    </div>
                    
                    {/* Progress bar */}
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
        </div>
      )}

      {/* Year Detail View */}
      {selectedYear && yearDetailData && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold">{yearDetailData.year} - Year in Review</h3>
              <button
                onClick={handleBackToYearly}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
              >
                ← Back to Yearly View
              </button>
            </div>

            {/* Year Badge Distribution */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-3">Badge Distribution for {yearDetailData.year}</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(yearDetailData.distribution).map(([tier, count]) => (
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

            {/* Milestones Achieved */}
            {yearDetailData.milestones && yearDetailData.milestones.length > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-3">🏆 Milestones Achieved in {yearDetailData.year}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {yearDetailData.milestones.map((milestone, idx) => (
                    <div
                      key={idx}
                      className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg p-4 border-2 border-yellow-300 shadow-md"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-4xl">{milestone.emoji}</span>
                        <div>
                          <div className="font-bold text-gray-800">{milestone.name}</div>
                          <div className="text-sm text-gray-600">{milestone.days} days streak</div>
                          <div className="text-xs text-gray-500">
                            {format(new Date(milestone.achievedAt), 'MMM d, yyyy')}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Best and Worst Days */}
            {yearDetailData.bestDays.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Best Days */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border-2 border-green-300">
                  <h4 className="font-bold text-green-700 mb-3 flex items-center gap-2">
                    <span className="text-2xl">🏆</span>
                    Best Day{yearDetailData.bestDays.length > 1 ? 's' : ''} of {yearDetailData.year}
                  </h4>
                  <div className="space-y-2">
                    {yearDetailData.bestDays.slice(0, 5).map(day => (
                      <div key={day.date} className="flex items-center justify-between bg-white rounded-lg p-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{getBadgeEmoji(day.badgeTier)}</span>
                          <span className="font-medium text-sm">
                            {format(parseISO(day.date), 'EEE, MMM d')}
                          </span>
                        </div>
                        <span className="text-lg font-bold text-green-600">
                          {Math.round(day.completionRate)}%
                        </span>
                      </div>
                    ))}
                    {yearDetailData.bestDays.length > 5 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{yearDetailData.bestDays.length - 5} more days with {Math.round(yearDetailData.bestDays[0].completionRate)}%
                      </div>
                    )}
                  </div>
                </div>

                {/* Worst Days */}
                <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-lg p-4 border-2 border-red-300">
                  <h4 className="font-bold text-red-700 mb-3 flex items-center gap-2">
                    <span className="text-2xl">📉</span>
                    Worst Day{yearDetailData.worstDays.length > 1 ? 's' : ''} of {yearDetailData.year}
                  </h4>
                  <div className="space-y-2">
                    {yearDetailData.worstDays.slice(0, 5).map(day => (
                      <div key={day.date} className="flex items-center justify-between bg-white rounded-lg p-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{getBadgeEmoji(day.badgeTier)}</span>
                          <span className="font-medium text-sm">
                            {format(parseISO(day.date), 'EEE, MMM d')}
                          </span>
                        </div>
                        <span className="text-lg font-bold text-red-600">
                          {Math.round(day.completionRate)}%
                        </span>
                      </div>
                    ))}
                    {yearDetailData.worstDays.length > 5 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{yearDetailData.worstDays.length - 5} more days with {Math.round(yearDetailData.worstDays[0].completionRate)}%
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Monthly Breakdown */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h4 className="text-lg font-semibold mb-4">Monthly Breakdown</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(yearDetailData.monthlyBreakdown).map(([monthName, stats]) => {
                const total = stats.gold + stats.silver + stats.bronze + stats.shameful;
                return (
                  <div key={monthName} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h5 className="font-bold text-base mb-2">{monthName}</h5>
                    
                    {/* Badge counts */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-600">
                        {stats.gold}🥇 {stats.silver}🥈 {stats.bronze}🥉
                      </span>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="flex h-4 rounded-full overflow-hidden bg-gray-100">
                      {total > 0 ? (
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
                      ) : (
                        <div className="w-full flex items-center justify-center">
                          <span className="text-xs text-gray-400">No data</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
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
