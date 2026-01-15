import db from './database';
import { format, parseISO, subDays } from 'date-fns';
import milestoneRepository from './milestoneRepository';

/**
 * Analytics Repository - Calculate badges, streaks, and statistics
 */

const BADGE_TIERS = {
  GOLD: { name: 'gold', min: 80, max: 100, color: '#FFD700' },
  SILVER: { name: 'silver', min: 70, max: 79.5, color: '#C0C0C0' },
  BRONZE: { name: 'bronze', min: 60, max: 69.5, color: '#CD7F32' },
  SHAMEFUL: { name: 'shameful', min: 0, max: 59.5, color: '#6B7280' },
};

export const analyticsRepository = {
  /**
   * Calculate completion rate for a specific date
   */
  async calculateCompletionRate(date) {
    const occurrences = await db.occurrences
      .where('scheduledDate')
      .equals(date)
      .toArray();
    
    if (occurrences.length === 0) return null;
    
    const completed = occurrences.filter(o => o.completed).length;
    const total = occurrences.length;
    
    return {
      completed,
      total,
      rate: (completed / total) * 100,
    };
  },
  
  /**
   * Determine badge tier based on completion rate
   */
  getBadgeTier(completionRate) {
    if (completionRate >= BADGE_TIERS.GOLD.min) return BADGE_TIERS.GOLD.name;
    if (completionRate >= BADGE_TIERS.SILVER.min) return BADGE_TIERS.SILVER.name;
    if (completionRate >= BADGE_TIERS.BRONZE.min) return BADGE_TIERS.BRONZE.name;
    return BADGE_TIERS.SHAMEFUL.name;
  },
  
  /**
   * Award daily badge and create summary
   */
  async awardDailyBadge(date, userId = 1) {
    const stats = await this.calculateCompletionRate(date);
    
    if (!stats) return null;
    
    const badgeTier = this.getBadgeTier(stats.rate);
    
    // Create daily summary
    const summary = {
      date,
      userId,
      totalTasks: stats.total,
      completedTasks: stats.completed,
      completionRate: Math.round(stats.rate * 10) / 10, // Round to 1 decimal
      badgeTier,
      createdAt: new Date().toISOString(),
    };
    
    await db.dailySummaries.put(summary);
    
    // Create badge record
    const badge = {
      userId,
      date,
      tier: badgeTier,
      awardedAt: new Date().toISOString(),
    };
    
    await db.badges.add(badge);
    
    // Update streak
    await this.updateStreak(date, badgeTier, userId);
    
    return { summary, badge };
  },

  /**
   * Recalculate daily badge based on current completion rate
   */
  async recalculateDailyBadge(date, userId = 1) {
    const stats = await this.calculateCompletionRate(date);
    
    if (!stats) {
      // No tasks for today, remove any existing summary
      await db.dailySummaries.delete(date);
      return null;
    }
    
    const badgeTier = this.getBadgeTier(stats.rate);
    const existingSummary = await db.dailySummaries.get(date);
    
    // Update or create summary
    const summary = {
      date,
      userId,
      totalTasks: stats.total,
      completedTasks: stats.completed,
      completionRate: Math.round(stats.rate * 10) / 10,
      badgeTier,
      createdAt: existingSummary?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await db.dailySummaries.put(summary);
    
    // Update streak if badge tier changed
    if (!existingSummary || existingSummary.badgeTier !== badgeTier) {
      await this.updateStreak(date, badgeTier, userId);
    }
    
    return summary;
  },
  
  /**
   * Update user's streak based on new badge
   */
  async updateStreak(date, badgeTier, userId = 1) {
    const streak = await db.streaks.get(userId);
    if (!streak) return;
    
    const yesterday = format(subDays(parseISO(date), 1), 'yyyy-MM-dd');
    const yesterdaySummary = await db.dailySummaries.get(yesterday);
    
    let newStreak = streak.currentStreak;
    
    // Gold streak logic - only gold badges count
    if (badgeTier === 'gold') {
      if (yesterdaySummary && yesterdaySummary.badgeTier === 'gold') {
        // Continue streak
        newStreak = streak.currentStreak + 1;
      } else if (streak.currentStreak === 0 || !streak.lastCompletionDate) {
        // Start new streak
        newStreak = 1;
      } else {
        // Check if we can use freeze token
        const daysSinceLastGold = Math.floor(
          (parseISO(date) - parseISO(streak.lastCompletionDate)) / (1000 * 60 * 60 * 24)
        );
        
        if (daysSinceLastGold === 2 && streak.freezeTokens > 0) {
          // Apply freeze for 1-day gap
          newStreak = streak.currentStreak + 1;
          await db.streaks.update(userId, {
            freezeTokens: streak.freezeTokens - 1,
          });
        } else {
          // Reset streak
          newStreak = 1;
        }
      }
      
      // Update streak
      const oldStreak = streak.currentStreak;
      await db.streaks.update(userId, {
        currentStreak: newStreak,
        longestStreak: Math.max(newStreak, streak.longestStreak),
        lastCompletionDate: date,
      });
      
      // Check for milestone achievements
      if (newStreak > oldStreak) {
        await milestoneRepository.checkAndAwardMilestones(oldStreak, newStreak, userId);
      }
    } else {
      // Non-gold badge breaks streak
      if (streak.currentStreak > 0) {
        await db.streaks.update(userId, {
          currentStreak: 0,
          lastCompletionDate: date,
        });
      }
    }
  },
  
  /**
   * Get current streak
   */
  async getStreak(userId = 1) {
    return db.streaks.get(userId);
  },
  
  /**
   * Get daily summary
   */
  async getDailySummary(date) {
    return db.dailySummaries.get(date);
  },
  
  /**
   * Get summaries for date range
   */
  async getSummaries(startDate, endDate) {
    return db.dailySummaries
      .where('date')
      .between(startDate, endDate, true, true)
      .toArray();
  },
  
  /**
   * Get badge distribution
   */
  async getBadgeDistribution(startDate, endDate) {
    const summaries = await this.getSummaries(startDate, endDate);
    
    const distribution = {
      gold: 0,
      silver: 0,
      bronze: 0,
      shameful: 0,
    };
    
    summaries.forEach(s => {
      if (distribution[s.badgeTier] !== undefined) {
        distribution[s.badgeTier]++;
      }
    });
    
    return distribution;
  },
  
  /**
   * Get day-of-week analysis
   */
  async getDayOfWeekAnalysis(startDate, endDate) {
    const summaries = await this.getSummaries(startDate, endDate);
    
    const dayStats = {
      Monday: { gold: 0, silver: 0, bronze: 0, shameful: 0 },
      Tuesday: { gold: 0, silver: 0, bronze: 0, shameful: 0 },
      Wednesday: { gold: 0, silver: 0, bronze: 0, shameful: 0 },
      Thursday: { gold: 0, silver: 0, bronze: 0, shameful: 0 },
      Friday: { gold: 0, silver: 0, bronze: 0, shameful: 0 },
      Saturday: { gold: 0, silver: 0, bronze: 0, shameful: 0 },
      Sunday: { gold: 0, silver: 0, bronze: 0, shameful: 0 },
    };
    
    summaries.forEach(s => {
      const dayName = format(parseISO(s.date), 'EEEE');
      if (dayStats[dayName]) {
        dayStats[dayName][s.badgeTier]++;
      }
    });
    
    return dayStats;
  },
  
  /**
   * Refresh freeze tokens (monthly)
   */
  async refreshFreezeTokens(userId = 1) {
    const user = await db.users.get(userId);
    const streak = await db.streaks.get(userId);
    
    if (!user || !streak) return;
    
    const tokensPerMonth = user.settings.freezeTokensPerMonth || 1;
    const maxTokens = 3;
    
    await db.streaks.update(userId, {
      freezeTokens: Math.min(streak.freezeTokens + tokensPerMonth, maxTokens),
      lastTokenRefresh: new Date().toISOString(),
    });
  },

  /**
   * Get real-time analytics from occurrences for date range
   */
  async getRealTimeAnalytics(startDate, endDate) {
    const occurrences = await db.occurrences
      .where('scheduledDate')
      .between(startDate, endDate, true, true)
      .toArray();
    
    // Group by date
    const dateMap = {};
    occurrences.forEach(occ => {
      if (!dateMap[occ.scheduledDate]) {
        dateMap[occ.scheduledDate] = {
          date: occ.scheduledDate,
          totalTasks: 0,
          completedTasks: 0,
          completionRate: 0,
          badgeTier: 'shameful'
        };
      }
      dateMap[occ.scheduledDate].totalTasks++;
      if (occ.completed) {
        dateMap[occ.scheduledDate].completedTasks++;
      }
    });
    
    // Calculate completion rates and badge tiers
    const summaries = Object.values(dateMap).map(day => {
      day.completionRate = day.totalTasks > 0 
        ? (day.completedTasks / day.totalTasks) * 100 
        : 0;
      day.badgeTier = this.getBadgeTier(day.completionRate);
      return day;
    });
    
    return summaries.sort((a, b) => a.date.localeCompare(b.date));
  },

  /**
   * Get real-time badge distribution from occurrences
   */
  async getRealTimeBadgeDistribution(startDate, endDate) {
    const summaries = await this.getRealTimeAnalytics(startDate, endDate);
    
    const distribution = {
      gold: 0,
      silver: 0,
      bronze: 0,
      shameful: 0,
    };
    
    summaries.forEach(s => {
      if (distribution[s.badgeTier] !== undefined) {
        distribution[s.badgeTier]++;
      }
    });
    
    return distribution;
  },

  /**
   * Get real-time day-of-week analysis from occurrences
   */
  async getRealTimeDayOfWeekAnalysis(startDate, endDate) {
    const summaries = await this.getRealTimeAnalytics(startDate, endDate);
    
    const dayStats = {
      Monday: { gold: 0, silver: 0, bronze: 0, shameful: 0 },
      Tuesday: { gold: 0, silver: 0, bronze: 0, shameful: 0 },
      Wednesday: { gold: 0, silver: 0, bronze: 0, shameful: 0 },
      Thursday: { gold: 0, silver: 0, bronze: 0, shameful: 0 },
      Friday: { gold: 0, silver: 0, bronze: 0, shameful: 0 },
      Saturday: { gold: 0, silver: 0, bronze: 0, shameful: 0 },
      Sunday: { gold: 0, silver: 0, bronze: 0, shameful: 0 },
    };
    
    summaries.forEach(s => {
      const dayName = format(parseISO(s.date), 'EEEE');
      if (dayStats[dayName]) {
        dayStats[dayName][s.badgeTier]++;
      }
    });
    
    return dayStats;
  },
};

export default analyticsRepository;
