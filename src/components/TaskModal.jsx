import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { getCurrentDate, timeToMinutes } from '../lib/dateUtils';
import taskRepository from '../db/taskRepository';

/**
 * Task Creation/Edit Modal
 */
const TaskModal = ({ isOpen, onClose, task, slotData, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: getCurrentDate(),
    startTime: '09:00',
    duration: 60,
    color: '#2563EB',
    category: '',
    recurrence: {
      type: 'once', // 'once' | 'daily' | 'specific_days' | 'weekly'
      days: [], // ['Monday', 'Wednesday', 'Friday']
      startDate: getCurrentDate(),
      endDate: null,
    },
  });

  const [showRecurrence, setShowRecurrence] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState(null);

  const recurrenceInfo = {
    daily: 'Task repeats every day automatically',
    specific_days: 'Choose specific days of the week (e.g., Mon, Wed, Fri)',
    weekly: 'Task repeats once per week on the same day'
  };

  useEffect(() => {
    if (task) {
      // Edit mode - populate form with existing task
      setFormData({
        title: task.title,
        description: task.description || '',
        date: task.scheduledDate || task.date || getCurrentDate(),
        startTime: task.scheduledTime || task.startTime || '09:00',
        duration: task.duration || 60,
        color: task.color || '#2563EB',
        category: task.category || '',
        recurrence: task.recurrence || {
          type: 'once',
          days: [],
          startDate: getCurrentDate(),
          endDate: null,
        },
      });
      setShowRecurrence(task.recurrence?.type !== 'once');
    } else if (slotData) {
      // Create mode from slot click - pre-fill date and time
      setFormData({
        title: '',
        description: '',
        date: slotData.date,
        startTime: slotData.time,
        duration: 60,
        color: '#2563EB',
        category: '',
        recurrence: {
          type: 'once',
          days: [],
          startDate: slotData.date,
          endDate: null,
        },
      });
      setShowRecurrence(false);
    } else {
      // Create mode - reset form
      setFormData({
        title: '',
        description: '',
        date: getCurrentDate(),
        startTime: '09:00',
        duration: 60,
        color: '#2563EB',
        category: '',
        recurrence: {
          type: 'once',
          days: [],
          startDate: getCurrentDate(),
          endDate: null,
        },
      });
      setShowRecurrence(false);
    }
  }, [task, slotData, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('Please enter a task title');
      return;
    }

    try {
      const taskData = {
        title: formData.title,
        description: formData.description,
        date: formData.date,
        startTime: formData.startTime,
        duration: formData.duration,
        color: formData.color,
        category: formData.category || null,
        recurrence: showRecurrence && formData.recurrence.type !== 'once'
          ? formData.recurrence
          : null,
      };

      // Check for overlaps before creating/updating task
      const overlapping = await checkForOverlaps(
        taskData.date, 
        taskData.startTime, 
        taskData.duration,
        task?.id // Exclude current task when editing
      );
      
      if (overlapping.length > 0) {
        const overlapTitles = overlapping.map(t => `"${t.task?.title}"`).join(', ');
        const confirmed = confirm(
          `This task overlaps with existing task(s): ${overlapTitles}.\n\n` +
          `Do you want to ${task ? 'update' : 'create'} this task anyway?`
        );
        
        if (!confirmed) {
          return;
        }
      }

      // Update existing task or create new one
      if (task) {
        await taskRepository.update(task.id, taskData);
      } else {
        await taskRepository.create(taskData);
      }
      
      if (onSave) onSave();
      onClose();
    } catch (error) {
      console.error('Failed to save task:', error);
      alert('Failed to save task. Please try again.');
    }
  };

  const checkForOverlaps = async (date, startTime, duration, excludeTaskId = null) => {
    try {
      // Get all occurrences for the date
      const occurrences = await taskRepository.getOccurrencesByDate(date);
      
      // Populate with task details
      const withTasks = await Promise.all(
        occurrences.map(async (occ) => {
          const task = await taskRepository.getById(occ.taskId);
          return { ...occ, task };
        })
      );
      
      const newTaskStartMinutes = timeToMinutes(startTime);
      const newTaskEndMinutes = newTaskStartMinutes + duration;
      
      // Filter for overlapping tasks
      return withTasks.filter(occ => {
        // Skip the task being edited
        if (excludeTaskId && occ.taskId === excludeTaskId) {
          return false;
        }
        
        const existingStartMinutes = timeToMinutes(occ.scheduledTime);
        const existingDuration = occ.task?.duration || 60;
        const existingEndMinutes = existingStartMinutes + existingDuration;
        
        // Check if times overlap
        return (
          (newTaskStartMinutes >= existingStartMinutes && newTaskStartMinutes < existingEndMinutes) ||
          (newTaskEndMinutes > existingStartMinutes && newTaskEndMinutes <= existingEndMinutes) ||
          (newTaskStartMinutes <= existingStartMinutes && newTaskEndMinutes >= existingEndMinutes)
        );
      });
    } catch (error) {
      console.error('Error checking for overlaps:', error);
      return [];
    }
  };

  const handleRecurrenceTypeChange = (type) => {
    setFormData({
      ...formData,
      recurrence: {
        ...formData.recurrence,
        type,
        days: type === 'specific_days' || type === 'weekly' ? [] : formData.recurrence.days,
      },
    });
  };

  const toggleDay = (day) => {
    const days = formData.recurrence.days.includes(day)
      ? formData.recurrence.days.filter(d => d !== day)
      : [...formData.recurrence.days, day];
    
    setFormData({
      ...formData,
      recurrence: {
        ...formData.recurrence,
        days,
      },
    });
  };

  const predefinedColors = [
    { name: 'Blue', value: '#2563EB' },
    { name: 'Green', value: '#10B981' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Orange', value: '#F59E0B' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Teal', value: '#14B8A6' },
    { name: 'Indigo', value: '#6366F1' },
  ];

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border-2 border-gray-200 transform transition-all scale-100 hover:scale-[1.01]">
        <div className="sticky top-0 bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-200 px-8 py-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-3">
              <span className="text-4xl">✨</span>
              {task ? 'Edit Task' : 'Create New Task'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-red-600 text-3xl leading-none transition-all hover:scale-125 transform"
            >
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Task Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Task Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Study Mathematics"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add notes or details..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration (minutes)
            </label>
            <select
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>1 hour</option>
              <option value={90}>1.5 hours</option>
              <option value={120}>2 hours</option>
              <option value={180}>3 hours</option>
              <option value={240}>4 hours</option>
            </select>
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color Tag
            </label>
            <div className="grid grid-cols-4 gap-2">
              {predefinedColors.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: color.value })}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formData.color === color.value
                      ? 'border-gray-800 scale-105'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                >
                  <span className="text-white font-medium text-xs">{color.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category (Optional)
            </label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="e.g., Work, Study, Exercise"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Recurrence Toggle */}
          <div className="border-t border-gray-200 pt-6">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={showRecurrence}
                onChange={(e) => setShowRecurrence(e.target.checked)}
                className="w-5 h-5 text-primary rounded focus:ring-2 focus:ring-primary"
              />
              <span className="font-medium text-gray-700">Repeat this task</span>
            </label>
          </div>

          {/* Recurrence Options */}
          {showRecurrence && (
            <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Repeat Pattern
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['daily', 'specific_days', 'weekly'].map((type) => (
                    <div key={type} className="relative">
                      <button
                        type="button"
                        onClick={() => handleRecurrenceTypeChange(type)}
                        className={`w-full py-2 pr-8 pl-4 rounded-lg font-medium capitalize transition-colors ${
                          formData.recurrence.type === type
                            ? 'bg-primary text-white'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        {type.replace('_', ' ')}
                      </button>
                      {/* Info Icon */}
                      <div 
                        className="absolute top-1/2 right-2 transform -translate-y-1/2 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold cursor-help hover:bg-blue-600 transition-colors shadow-md z-10"
                        onMouseEnter={() => setActiveTooltip(type)}
                        onMouseLeave={() => setActiveTooltip(null)}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveTooltip(activeTooltip === type ? null : type);
                        }}
                      >
                        i
                      </div>
                      {/* Tooltip */}
                      {activeTooltip === type && (
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-20 whitespace-nowrap">
                          {recurrenceInfo[type]}
                          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Day Selection for specific_days only */}
              {formData.recurrence.type === 'specific_days' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Days
                  </label>
                  <div className="grid grid-cols-7 gap-2">
                    {weekDays.map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`py-2 px-1 rounded-lg text-xs font-medium transition-colors ${
                          formData.recurrence.days.includes(day)
                            ? 'bg-primary text-white'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        {day.substring(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Start and End Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.recurrence.startDate}
                    onChange={(e) => setFormData({
                      ...formData,
                      recurrence: { ...formData.recurrence, startDate: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.recurrence.endDate || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      recurrence: { ...formData.recurrence, endDate: e.target.value || null }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md"
            >
              {task ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
