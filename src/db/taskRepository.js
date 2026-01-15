import { v4 as uuidv4 } from 'uuid';
import db from './database';
import { addDays, parseISO, format, startOfDay } from 'date-fns';

/**
 * Task Repository - CRUD operations for tasks
 */

export const taskRepository = {
  /**
   * Create a new task with optional recurrence
   */
  async create(taskData) {
    const now = new Date().toISOString();
    const taskId = uuidv4();
    
    const task = {
      id: taskId,
      userId: 1, // Default user
      title: taskData.title,
      description: taskData.description || '',
      color: taskData.color || '#2563EB',
      duration: taskData.duration, // in minutes
      category: taskData.category || null,
      createdAt: now,
      updatedAt: now,
      version: 1,
      deletedAt: null,
    };
    
    await db.tasks.add(task);
    
    // Handle recurrence
    if (taskData.recurrence) {
      await this.createRecurrence(taskId, taskData.recurrence, taskData.startTime);
    } else {
      // Single occurrence
      await this.createOccurrence(taskId, taskData.date, taskData.startTime, taskData.duration);
    }
    
    return task;
  },
  
  /**
   * Create recurrence rule and generate occurrences
   */
  async createRecurrence(taskId, recurrence, startTime) {
    const recurrenceId = uuidv4();
    const now = new Date().toISOString();
    
    const rule = {
      id: recurrenceId,
      taskId,
      type: recurrence.type, // 'once', 'daily', 'specific_days', 'weekly'
      days: recurrence.days || [], // For specific_days: ['Monday', 'Wednesday']
      startDate: recurrence.startDate || format(new Date(), 'yyyy-MM-dd'),
      endDate: recurrence.endDate || null,
      until: recurrence.until || null,
      exceptions: [], // ISO dates to skip
      createdAt: now,
    };
    
    await db.recurrenceRules.add(rule);
    
    // Materialize occurrences for next 90 days
    await this.materializeOccurrences(taskId, rule, startTime);
  },
  
  /**
   * Materialize task occurrences based on recurrence rule
   */
  async materializeOccurrences(taskId, rule, startTime) {
    const task = await db.tasks.get(taskId);
    if (!task) return;
    
    console.log('Materializing occurrences for task:', { taskId, rule, startTime });
    
    const startDate = parseISO(rule.startDate);
    const endLimit = rule.endDate ? parseISO(rule.endDate) : addDays(new Date(), 90);
    const occurrences = [];
    
    let currentDate = startDate;
    const today = startOfDay(new Date());
    
    while (currentDate <= endLimit) {
      let shouldCreate = false;
      
      switch (rule.type) {
        case 'daily':
          shouldCreate = true;
          break;
          
        case 'specific_days': {
          const dayName = format(currentDate, 'EEEE');
          shouldCreate = rule.days.includes(dayName);
          console.log(`Checking specific_days: ${format(currentDate, 'yyyy-MM-dd')} (${dayName}) - should create: ${shouldCreate}`, rule.days);
          break;
        }
          
        case 'weekly': {
          const dayName = format(currentDate, 'EEEE');
          shouldCreate = rule.days.includes(dayName);
          console.log(`Checking weekly: ${format(currentDate, 'yyyy-MM-dd')} (${dayName}) - should create: ${shouldCreate}`, rule.days);
          break;
        }
          
        default:
          break;
      }
      
      // Check if date is in exceptions
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      if (shouldCreate && !rule.exceptions.includes(dateStr)) {
        occurrences.push({
          id: uuidv4(),
          taskId,
          scheduledDate: dateStr,
          scheduledTime: startTime,
          instanceDate: `${dateStr}T${startTime}`,
          completed: false,
          completedAt: null,
          skipped: false,
          isException: false,
        });
      }
      
      currentDate = addDays(currentDate, 1);
    }
    
    console.log(`Created ${occurrences.length} occurrences for task ${taskId}:`, occurrences.slice(0, 10));
    
    if (occurrences.length > 0) {
      await db.occurrences.bulkAdd(occurrences);
    }
  },
  
  /**
   * Create a single occurrence
   */
  async createOccurrence(taskId, date, startTime, duration) {
    const occurrence = {
      id: uuidv4(),
      taskId,
      scheduledDate: date,
      scheduledTime: startTime,
      instanceDate: `${date}T${startTime}`,
      completed: false,
      completedAt: null,
      skipped: false,
      isException: false,
    };
    
    await db.occurrences.add(occurrence);
    return occurrence;
  },
  
  /**
   * Get all tasks for a user
   */
  async getAll(userId = 1) {
    return db.tasks
      .where({ userId, deletedAt: null })
      .toArray();
  },
  
  /**
   * Get task by ID
   */
  async getById(taskId) {
    return db.tasks.get(taskId);
  },
  
  /**
   * Update task
   */
  async update(taskId, updates) {
    const task = await db.tasks.get(taskId);
    if (!task) throw new Error('Task not found');
    
    await db.tasks.update(taskId, {
      ...updates,
      updatedAt: new Date().toISOString(),
      version: task.version + 1,
    });
  },
  
  /**
   * Soft delete task and all its occurrences
   */
  async delete(taskId) {
    // Soft delete the task
    await db.tasks.update(taskId, {
      deletedAt: new Date().toISOString(),
    });
    
    // Delete all occurrences for this task
    const occurrences = await db.occurrences
      .where('taskId')
      .equals(taskId)
      .toArray();
    
    const occurrenceIds = occurrences.map(occ => occ.id);
    await db.occurrences.bulkDelete(occurrenceIds);
  },
  
  /**
   * Get occurrences for a date range
   */
  async getOccurrences(startDate, endDate) {
    return db.occurrences
      .where('scheduledDate')
      .between(startDate, endDate, true, true)
      .toArray();
  },
  
  /**
   * Get occurrences for a specific date
   */
  async getOccurrencesByDate(date) {
    return db.occurrences
      .where('scheduledDate')
      .equals(date)
      .toArray();
  },
  
  /**
   * Mark occurrence as complete
   */
  async completeOccurrence(occurrenceId) {
    await db.occurrences.update(occurrenceId, {
      completed: true,
      completedAt: new Date().toISOString(),
    });
  },
  
  /**
   * Mark occurrence as incomplete
   */
  async uncompleteOccurrence(occurrenceId) {
    await db.occurrences.update(occurrenceId, {
      completed: false,
      completedAt: null,
    });
  },
};

export default taskRepository;
