import db from '../db/database';

/**
 * Data export and import utilities
 */

export const exportData = async () => {
  try {
    const data = {
      version: 1,
      exportDate: new Date().toISOString(),
      users: await db.users.toArray(),
      tasks: await db.tasks.toArray(),
      recurrenceRules: await db.recurrenceRules.toArray(),
      occurrences: await db.occurrences.toArray(),
      dailySummaries: await db.dailySummaries.toArray(),
      badges: await db.badges.toArray(),
      streaks: await db.streaks.toArray(),
    };

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `momentum-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return { success: true };
  } catch (error) {
    console.error('Export failed:', error);
    return { success: false, error: error.message };
  }
};

export const importData = async (file) => {
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    
    // Validate data structure
    if (!data.version || !data.users || !data.tasks) {
      throw new Error('Invalid backup file format');
    }
    
    // Confirm with user before overwriting
    const confirmed = window.confirm(
      'This will replace all existing data. Are you sure you want to continue?'
    );
    
    if (!confirmed) {
      return { success: false, cancelled: true };
    }
    
    // Clear existing data
    await db.users.clear();
    await db.tasks.clear();
    await db.recurrenceRules.clear();
    await db.occurrences.clear();
    await db.dailySummaries.clear();
    await db.badges.clear();
    await db.streaks.clear();
    
    // Import data
    if (data.users.length > 0) await db.users.bulkAdd(data.users);
    if (data.tasks.length > 0) await db.tasks.bulkAdd(data.tasks);
    if (data.recurrenceRules.length > 0) await db.recurrenceRules.bulkAdd(data.recurrenceRules);
    if (data.occurrences.length > 0) await db.occurrences.bulkAdd(data.occurrences);
    if (data.dailySummaries.length > 0) await db.dailySummaries.bulkAdd(data.dailySummaries);
    if (data.badges.length > 0) await db.badges.bulkAdd(data.badges);
    if (data.streaks.length > 0) await db.streaks.bulkAdd(data.streaks);
    
    return { success: true, recordsImported: data.tasks.length };
  } catch (error) {
    console.error('Import failed:', error);
    return { success: false, error: error.message };
  }
};

export default {
  exportData,
  importData,
};
