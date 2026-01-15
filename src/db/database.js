import Dexie from 'dexie';

export const db = new Dexie('ProgressTrackerDB');

// Schema version 1
db.version(1).stores({
  // User profile and settings
  users: '++id, email',
  
  // Tasks with recurrence support
  tasks: 'id, userId, title, [userId+deletedAt], createdAt',
  
  // Recurrence rules for recurring tasks
  recurrenceRules: 'id, taskId, startDate',
  
  // Materialized occurrences (instances of tasks on specific dates)
  occurrences: 'id, taskId, [scheduledDate+scheduledTime], [taskId+scheduledDate], [completed+scheduledDate]',
  
  // Daily summaries with badges and streaks
  dailySummaries: 'date, [badgeTier+date], userId',
  
  // Badge history
  badges: '++id, userId, [userId+date], date',
  
  // Streak tracking
  streaks: 'userId',
  
  // Milestone achievements
  milestones: '++id, userId, days, achievedAt',
  
  // Notifications
  notifications: '++id, userId, read, createdAt',
  
  // Schema metadata for migrations
  meta: 'key'
});

// Initialize default user on first run
db.on('ready', async () => {
  const userCount = await db.users.count();
  if (userCount === 0) {
    const now = new Date().toISOString();
    await db.users.add({
      id: 1,
      email: null,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      settings: {
        sleepStart: '23:00',
        sleepEnd: '07:00',
        firstDayOfWeek: 'Monday', // Monday or Sunday
        weeklyHoliday: null, // e.g., 'Sunday'
        timeFormat: '24h', // 24h or 12h
        blockedSlots: [
          // { day: 'all', time: '12:00-13:00', label: 'Lunch' }
        ],
        gracePeriodHours: 0, // Hours after midnight to mark previous day
        freezeTokensPerMonth: 1,
      },
      createdAt: now,
      updatedAt: now,
    });
    
    // Initialize streak
    await db.streaks.add({
      userId: 1,
      currentStreak: 0,
      longestStreak: 0,
      lastCompletionDate: null,
      freezeTokens: 0,
      lastTokenRefresh: now,
    });
    
    // Set schema version in meta
    await db.meta.put({ key: 'schemaVersion', value: 1 });
  }
});

export default db;
