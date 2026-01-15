import db from './database';
import { MILESTONES, checkNewMilestone, getAchievedMilestones } from '../lib/milestones';

/**
 * Milestone Repository - Track and manage milestone achievements
 */

export const milestoneRepository = {
  /**
   * Check and award new milestones
   */
  async checkAndAwardMilestones(oldStreak, newStreak, userId = 1) {
    console.log('Checking milestones:', { oldStreak, newStreak, userId });
    const newMilestone = checkNewMilestone(oldStreak, newStreak);
    
    if (newMilestone) {
      console.log('New milestone achieved!', newMilestone);
      // Award milestone
      await db.milestones.add({
        userId,
        days: newMilestone.days,
        name: newMilestone.name,
        emoji: newMilestone.emoji,
        tier: newMilestone.tier,
        achievedAt: new Date().toISOString(),
      });
      
      // Create notification
      const notification = await db.notifications.add({
        userId,
        type: 'milestone',
        title: `🎉 Milestone Achieved!`,
        message: `You've reached ${newMilestone.days} ${newMilestone.days === 1 ? 'day' : 'days'}: ${newMilestone.name}!`,
        data: {
          emoji: newMilestone.emoji,
          name: newMilestone.name,
          tier: newMilestone.tier,
          days: newMilestone.days,
        },
        read: false,
        createdAt: new Date().toISOString(),
      });
      
      console.log('Notification created:', notification);
      
      return newMilestone;
    } else {
      console.log('No new milestone for this streak increase');
    }
    
    return null;
  },
  
  /**
   * Get all milestones for user
   */
  async getAllMilestones(userId = 1) {
    const achieved = await db.milestones
      .where({ userId })
      .toArray();
    
    const achievedDays = new Set(achieved.map(m => m.days));
    
    return MILESTONES.map(milestone => ({
      ...milestone,
      achieved: achievedDays.has(milestone.days),
      achievedAt: achieved.find(a => a.days === milestone.days)?.achievedAt,
    }));
  },
  
  /**
   * Get unread notification count
   */
  async getUnreadCount(userId = 1) {
    const notifs = await db.notifications
      .where('userId')
      .equals(userId)
      .toArray();
    return notifs.filter(n => !n.read).length;
  },
  
  /**
   * Get all notifications
   */
  async getNotifications(userId = 1) {
    return db.notifications
      .where('userId')
      .equals(userId)
      .reverse()
      .sortBy('createdAt');
  },
  
  /**
   * Mark notification as read
   */
  async markAsRead(notificationId) {
    await db.notifications.update(notificationId, { read: true });
  },
  
  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId = 1) {
    const notifications = await db.notifications
      .where('userId')
      .equals(userId)
      .toArray();
    const unread = notifications.filter(n => !n.read);
    const updates = unread.map(n => 
      db.notifications.update(n.id, { read: true })
    );
    await Promise.all(updates);
  },
  
  /**
   * Delete notification
   */
  async deleteNotification(notificationId) {
    await db.notifications.delete(notificationId);
  },
};

export default milestoneRepository;
