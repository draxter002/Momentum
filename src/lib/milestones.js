/**
 * Gold Streak Milestones Configuration
 */

export const MILESTONES = [
  // Early Achievements (Building Momentum)
  { days: 1, name: "First Flame", emoji: "🔥", tier: "early" },
  { days: 2, name: "Spark Keeper", emoji: "✨", tier: "early" },
  { days: 3, name: "Triple Threat", emoji: "⚡", tier: "early" },
  { days: 5, name: "High Five Hero", emoji: "🙌", tier: "early" },
  { days: 7, name: "Seven Samurai", emoji: "🗡️", tier: "early" },
  { days: 10, name: "Perfect Ten", emoji: "💯", tier: "early" },
  { days: 14, name: "Fortnight Fighter", emoji: "⚔️", tier: "early" },
  
  // Intermediate Achievements (Establishing Habits)
  { days: 21, name: "Habit Forger", emoji: "🔨", tier: "intermediate" },
  { days: 30, name: "Thirty & Thriving", emoji: "🌟", tier: "intermediate" },
  { days: 45, name: "Six Week Sultan", emoji: "👑", tier: "intermediate" },
  { days: 50, name: "Half Century", emoji: "🎯", tier: "intermediate" },
  { days: 60, name: "Two Month Titan", emoji: "💪", tier: "intermediate" },
  { days: 75, name: "Quarter Year Champion", emoji: "🏆", tier: "intermediate" },
  
  // Advanced Achievements (True Dedication)
  { days: 90, name: "Three Month Maestro", emoji: "🎼", tier: "advanced" },
  { days: 125, name: "Consistency King/Queen", emoji: "👸", tier: "advanced" },
  { days: 150, name: "Five Month Phoenix", emoji: "🦅", tier: "advanced" },
  { days: 180, name: "Semester Supreme", emoji: "📚", tier: "advanced" },
  { days: 200, name: "Bicentennial Boss", emoji: "💼", tier: "advanced" },
  { days: 250, name: "Elite Executor", emoji: "⚜️", tier: "advanced" },
  { days: 270, name: "Nine Month Noble", emoji: "🎖️", tier: "advanced" },
  
  // Legendary Achievements (Elite Status)
  { days: 300, name: "Triple Century Legend", emoji: "🌠", tier: "legendary" },
  { days: 365, name: "Year Long Yaksha", emoji: "🐉", tier: "legendary" },
  { days: 400, name: "Quadruple Century Conqueror", emoji: "⚡", tier: "legendary" },
  { days: 500, name: "Half Millennium Monarch", emoji: "👑", tier: "legendary" },
  { days: 730, name: "Biennial Beast", emoji: "🦁", tier: "legendary" },
  { days: 1000, name: "The Eternal Flame", emoji: "🔥", tier: "legendary" },
  { days: 1095, name: "Three Year Overlord", emoji: "💀", tier: "legendary" },
  { days: 1500, name: "Immortal", emoji: "∞", tier: "legendary" },
  { days: 2000, name: "The Legend", emoji: "🌌", tier: "legendary" },
];

export const TIER_COLORS = {
  early: {
    border: '#3B82F6',
    bg: 'from-blue-100 to-blue-200',
    text: 'text-blue-700',
    glow: 'shadow-blue-400',
  },
  intermediate: {
    border: '#8B5CF6',
    bg: 'from-purple-100 to-purple-200',
    text: 'text-purple-700',
    glow: 'shadow-purple-400',
  },
  advanced: {
    border: '#F59E0B',
    bg: 'from-amber-100 to-amber-200',
    text: 'text-amber-700',
    glow: 'shadow-amber-400',
  },
  legendary: {
    border: '#EF4444',
    bg: 'from-red-100 via-orange-100 to-yellow-100',
    text: 'text-red-700',
    glow: 'shadow-red-400',
  },
};

/**
 * Get milestone for current streak
 */
export const getCurrentMilestone = (currentStreak) => {
  return MILESTONES
    .slice()
    .reverse()
    .find(m => currentStreak >= m.days);
};

/**
 * Get next milestone
 */
export const getNextMilestone = (currentStreak) => {
  return MILESTONES.find(m => currentStreak < m.days);
};

/**
 * Get all achieved milestones
 */
export const getAchievedMilestones = (currentStreak) => {
  return MILESTONES.filter(m => currentStreak >= m.days);
};

/**
 * Check if a new milestone was just achieved
 */
export const checkNewMilestone = (oldStreak, newStreak) => {
  const oldMilestones = getAchievedMilestones(oldStreak);
  const newMilestones = getAchievedMilestones(newStreak);
  
  if (newMilestones.length > oldMilestones.length) {
    return newMilestones[newMilestones.length - 1];
  }
  
  return null;
};
