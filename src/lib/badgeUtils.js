/**
 * Badge and streak utilities
 */

export const BADGE_TIERS = {
  PLATINUM: { name: 'platinum', min: 95, color: '#E5E4E2', emoji: '💎' },
  GOLD: { name: 'gold', min: 80, color: '#FFD700', emoji: '🥇' },
  SILVER: { name: 'silver', min: 70, color: '#C0C0C0', emoji: '🥈' },
  BRONZE: { name: 'bronze', min: 60, color: '#CD7F32', emoji: '🥉' },
  SHAMEFUL: { name: 'shameful', min: 0, color: '#6B7280', emoji: '😔' },
};

export const STREAK_MILESTONES = [
  { days: 1, title: 'First Flame', emoji: '🔥' },
  { days: 2, title: 'Spark Keeper', emoji: '✨' },
  { days: 3, title: 'Triple Threat', emoji: '⚡' },
  { days: 5, title: 'High Five Hero', emoji: '🖐️' },
  { days: 7, title: 'Seven Samurai', emoji: '⚔️' },
  { days: 10, title: 'Perfect Ten', emoji: '💯' },
  { days: 14, title: 'Fortnight Fighter', emoji: '🛡️' },
  { days: 21, title: 'Habit Forger', emoji: '🔨' },
  { days: 30, title: 'Monthly Master', emoji: '👑' },
  { days: 45, title: 'Six Week Sultan', emoji: '🏰' },
  { days: 50, title: 'Half Century', emoji: '🎯' },
  { days: 60, title: 'Two Month Titan', emoji: '🏔️' },
  { days: 75, title: 'Quarter Year Champion', emoji: '🏆' },
  { days: 90, title: 'Seasonal Sage', emoji: '🧙' },
  { days: 100, title: 'Centurion', emoji: '💪' },
  { days: 125, title: 'Consistency King/Queen', emoji: '👸' },
  { days: 150, title: 'Five Month Phoenix', emoji: '🔥' },
  { days: 180, title: 'Semester Supreme', emoji: '📚' },
  { days: 200, title: 'Bicentennial Boss', emoji: '💼' },
  { days: 250, title: 'Elite Executor', emoji: '⭐' },
  { days: 270, title: 'Nine Month Noble', emoji: '🎖️' },
  { days: 300, title: 'Triple Century Legend', emoji: '🌟' },
  { days: 365, title: 'The Unstoppable', emoji: '🚀' },
  { days: 400, title: 'Quadruple Century Conqueror', emoji: '🗡️' },
  { days: 500, title: 'Half Millennium Monarch', emoji: '👑' },
  { days: 730, title: 'Biennial Beast', emoji: '🦁' },
  { days: 1000, title: 'The Eternal Flame', emoji: '🔥' },
  { days: 1095, title: 'Three Year Overlord', emoji: '👹' },
  { days: 1500, title: 'Immortal', emoji: '♾️' },
  { days: 2000, title: 'The Legend', emoji: '🏅' },
];

/**
 * Get badge tier from completion rate
 */
export const getBadgeTier = (completionRate) => {
  if (completionRate >= BADGE_TIERS.PLATINUM.min) return BADGE_TIERS.PLATINUM.name;
  if (completionRate >= BADGE_TIERS.GOLD.min) return BADGE_TIERS.GOLD.name;
  if (completionRate >= BADGE_TIERS.SILVER.min) return BADGE_TIERS.SILVER.name;
  if (completionRate >= BADGE_TIERS.BRONZE.min) return BADGE_TIERS.BRONZE.name;
  return BADGE_TIERS.SHAMEFUL.name;
};

/**
 * Get badge color from tier name
 */
export const getBadgeColor = (tierName) => {
  const tier = Object.values(BADGE_TIERS).find(t => t.name === tierName);
  return tier?.color || BADGE_TIERS.SHAMEFUL.color;
};

/**
 * Get badge emoji from tier name
 */
export const getBadgeEmoji = (tierName) => {
  const tier = Object.values(BADGE_TIERS).find(t => t.name === tierName);
  return tier?.emoji || BADGE_TIERS.SHAMEFUL.emoji;
};

/**
 * Get current streak milestone
 */
export const getStreakMilestone = (streakDays) => {
  // Find the highest milestone achieved
  const achieved = [...STREAK_MILESTONES]
    .reverse()
    .find(m => streakDays >= m.days);
  return achieved || null;
};

/**
 * Get next streak milestone
 */
export const getNextStreakMilestone = (streakDays) => {
  return STREAK_MILESTONES.find(m => m.days > streakDays) || null;
};

/**
 * Get all achieved milestones
 */
export const getAchievedMilestones = (streakDays) => {
  return STREAK_MILESTONES.filter(m => streakDays >= m.days);
};

export default {
  BADGE_TIERS,
  STREAK_MILESTONES,
  getBadgeTier,
  getBadgeColor,
  getBadgeEmoji,
  getStreakMilestone,
  getNextStreakMilestone,
  getAchievedMilestones,
};
