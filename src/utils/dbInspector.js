import db from '../db/database';

/**
 * Inspect user settings
 */
export async function inspectUserSettings() {
  console.log('=== USER SETTINGS INSPECTION ===');
  const user = await db.users.get(1);
  console.log('User settings:', user?.settings);
  console.log('Blocked slots:', user?.settings?.blockedSlots);
  return user?.settings;
}

/**
 * Inspect all tasks and occurrences in the database
 */
export async function inspectTasks() {
  console.log('=== DATABASE INSPECTION ===');
  
  const tasks = await db.tasks.toArray();
  const activeTasks = tasks.filter(t => !t.deletedAt);
  console.log(`Total tasks: ${tasks.length}, Active: ${activeTasks.length}`);
  console.table(activeTasks.map(t => ({ id: t.id, title: t.title, color: t.color, duration: t.duration })));
  
  const occurrences = await db.occurrences.toArray();
  console.log(`\nTotal occurrences: ${occurrences.length}`);
  
  // Group occurrences by task
  const byTask = {};
  for (const occ of occurrences) {
    if (!byTask[occ.taskId]) {
      byTask[occ.taskId] = [];
    }
    byTask[occ.taskId].push(occ);
  }
  
  console.log('\nOccurrences grouped by task:');
  for (const [taskId, occs] of Object.entries(byTask)) {
    const task = activeTasks.find(t => t.id === taskId);
    console.group(`Task: ${task?.title || 'Unknown'}`);
    console.log(`  Task ID: ${taskId}`);
    console.log(`  Total occurrences: ${occs.length}`);
    console.log(`  First 10 dates:`, occs.slice(0, 10).map(o => `${o.scheduledDate} ${o.scheduledTime}`));
    console.groupEnd();
  }
  
  const recurrenceRules = await db.recurrenceRules.toArray();
  console.log('\nRecurrence rules:');
  console.table(recurrenceRules.map(r => ({ 
    id: r.id, 
    taskId: r.taskId, 
    type: r.type, 
    days: r.days?.join(', '), 
    startDate: r.startDate 
  })));
  
  return { tasks: activeTasks, occurrences, recurrenceRules };
}

/**
 * Delete all occurrences for a specific task
 */
export async function deleteTaskOccurrences(taskId) {
  const occurrences = await db.occurrences.where('taskId').equals(taskId).toArray();
  console.log(`Deleting ${occurrences.length} occurrences for task ${taskId}`);
  await db.occurrences.where('taskId').equals(taskId).delete();
  console.log('Done');
}

/**
 * Reset the entire database - USE WITH CAUTION
 */
export async function resetDatabase() {
  if (!confirm('This will delete ALL data. Are you sure?')) return;
  console.log('Deleting database...');
  await db.delete();
  console.log('Database deleted. Reloading page...');
  window.location.reload();
}

// Make functions available in browser console
if (typeof window !== 'undefined') {
  window.inspectTasks = inspectTasks;
  window.inspectUserSettings = inspectUserSettings;
  window.deleteTaskOccurrences = deleteTaskOccurrences;
  window.resetDatabase = resetDatabase;
  console.log('📊 Database utilities loaded:');
  console.log('  • window.inspectTasks() - Show all tasks and occurrences');
  console.log('  • window.inspectUserSettings() - Show user settings including blocked slots');
  console.log('  • window.deleteTaskOccurrences(taskId) - Delete all occurrences for a task');
  console.log('  • window.resetDatabase() - Delete all data and reinitialize');
}
