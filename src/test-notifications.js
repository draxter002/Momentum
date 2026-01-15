import db from './db/database';
import milestoneRepository from './db/milestoneRepository';

/**
 * Test notification system
 */
async function testNotifications() {
  console.log('=== Testing Notification System ===');
  
  // Test 1: Check if tables exist
  console.log('\n1. Checking database tables...');
  console.log('Tables:', db.tables.map(t => t.name));
  
  // Test 2: Try to create a test notification
  console.log('\n2. Creating test notification...');
  try {
    const notifId = await db.notifications.add({
      userId: 1,
      type: 'test',
      title: 'Test Notification',
      message: 'This is a test notification',
      data: { test: true },
      read: false,
      createdAt: new Date().toISOString(),
    });
    console.log('Test notification created with ID:', notifId);
  } catch (error) {
    console.error('Error creating notification:', error);
  }
  
  // Test 3: Try to read notifications
  console.log('\n3. Reading notifications...');
  try {
    const notifs = await milestoneRepository.getNotifications(1);
    console.log('Notifications found:', notifs.length);
    console.log('Notifications:', notifs);
  } catch (error) {
    console.error('Error reading notifications:', error);
  }
  
  // Test 4: Check current streak
  console.log('\n4. Checking current streak...');
  try {
    const streak = await db.streaks.get(1);
    console.log('Current streak:', streak);
  } catch (error) {
    console.error('Error reading streak:', error);
  }
  
  // Test 5: Check daily summaries
  console.log('\n5. Checking daily summaries...');
  try {
    const summaries = await db.dailySummaries.toArray();
    console.log('Daily summaries:', summaries);
  } catch (error) {
    console.error('Error reading summaries:', error);
  }
  
  // Test 6: Manually trigger milestone check
  console.log('\n6. Testing milestone check...');
  try {
    const result = await milestoneRepository.checkAndAwardMilestones(0, 1, 1);
    console.log('Milestone check result:', result);
  } catch (error) {
    console.error('Error checking milestones:', error);
  }
  
  // Test 7: Check all notifications again
  console.log('\n7. Final notification check...');
  try {
    const notifs = await milestoneRepository.getNotifications(1);
    console.log('Total notifications:', notifs.length);
    const unread = await milestoneRepository.getUnreadCount(1);
    console.log('Unread count:', unread);
  } catch (error) {
    console.error('Error in final check:', error);
  }
  
  console.log('\n=== Test Complete ===');
}

// Run test when this file is imported
testNotifications();

export default testNotifications;
