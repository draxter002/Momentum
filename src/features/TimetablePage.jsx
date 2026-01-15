import { useState, useEffect, useRef } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { getWeekDates, getCurrentDate, getCurrentTime, formatTime, isTimeSlotBlocked, generateTimeSlots, timeToMinutes, minutesToTime } from '../lib/dateUtils';
import useUserStore from '../store/useUserStore';
import taskRepository from '../db/taskRepository';
import analyticsRepository from '../db/analyticsRepository';
import TaskModal from '../components/TaskModal';
import useDailyBadgeAward from '../hooks/useDailyBadgeAward';

/**
 * Timetable View - Main weekly grid
 */
const TimetablePage = () => {
  const { user, triggerProgressRefresh } = useUserStore();
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());
  const [weekDates, setWeekDates] = useState([]);
  const [occurrences, setOccurrences] = useState([]);
  const [timeSlots] = useState(generateTimeSlots(60)); // Hourly slots
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [slotClickData, setSlotClickData] = useState(null);
  const [currentTimePosition, setCurrentTimePosition] = useState(0);
  const [taskMenuOpen, setTaskMenuOpen] = useState(null);
  const [menuPosition, setMenuPosition] = useState(null);
  const tableRef = useRef(null);
  
  // Auto-award daily badges
  useDailyBadgeAward();

  useEffect(() => {
    const firstDayOfWeek = user?.settings?.firstDayOfWeek || 'Monday';
    const dates = getWeekDates(currentWeekStart, firstDayOfWeek);
    setWeekDates(dates);
  }, [currentWeekStart, user]);

  useEffect(() => {
    loadOccurrences();
  }, [weekDates]);
  
  useEffect(() => {
    // Reload occurrences when modal closes after saving
    if (!isTaskModalOpen) {
      loadOccurrences();
    }
  }, [isTaskModalOpen]);
  
  // Update current time indicator position
  useEffect(() => {
    const updateTimeIndicator = () => {
      const currentTime = getCurrentTime();
      const minutes = timeToMinutes(currentTime);
      // Calculate percentage for horizontal movement (1440 minutes in a day)
      // Need to account for the day column width
      const percentage = (minutes / 1440) * 100;
      setCurrentTimePosition(percentage);
    };
    
    updateTimeIndicator();
    const interval = setInterval(updateTimeIndicator, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (taskMenuOpen) {
        setTaskMenuOpen(null);
      }
    };
    
    if (taskMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [taskMenuOpen]);
  
  const loadOccurrences = async () => {
    if (weekDates.length === 0) return;
    
    try {
      const startDate = format(new Date(weekDates[0]), 'yyyy-MM-dd');
      const endDate = format(new Date(weekDates[6]), 'yyyy-MM-dd');
      const data = await taskRepository.getOccurrences(startDate, endDate);
    
    // Populate with task details
    const withTasks = await Promise.all(
      data.map(async (occ) => {
        const task = await taskRepository.getById(occ.taskId);
        return { ...occ, task };
      })
    );
    
      setOccurrences(withTasks);
    } catch (error) {
      console.error('Failed to load occurrences:', error);
      setOccurrences([]);
    }
  };

  const goToPreviousWeek = () => {
    setCurrentWeekStart(subDays(currentWeekStart, 7));
  };

  const goToNextWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, 7));
  };

  const goToToday = () => {
    setCurrentWeekStart(new Date());
  };

  const isSlotBlocked = (date, time) => {
    if (!user?.settings) return false;
    return isTimeSlotBlocked(
      format(date, 'yyyy-MM-dd'),
      time,
      user.settings.blockedSlots || [],
      user.settings.sleepStart,
      user.settings.sleepEnd
    );
  };

  const getOccurrencesForSlot = (date, time) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const slotStartMinutes = timeToMinutes(time);
    const slotEndMinutes = slotStartMinutes + 60; // Each slot is 1 hour
    
    return occurrences.filter(occ => {
      if (occ.scheduledDate !== dateStr) return false;
      
      const taskStartMinutes = timeToMinutes(occ.scheduledTime);
      const taskDuration = occ.task?.duration || 60; // Default 60 minutes
      const taskEndMinutes = taskStartMinutes + taskDuration;
      
      // Check if this slot overlaps with the task's time range
      return (
        (taskStartMinutes >= slotStartMinutes && taskStartMinutes < slotEndMinutes) || // Task starts in this slot
        (taskEndMinutes > slotStartMinutes && taskEndMinutes <= slotEndMinutes) || // Task ends in this slot
        (taskStartMinutes <= slotStartMinutes && taskEndMinutes >= slotEndMinutes) // Task spans entire slot
      );
    });
  };

  // Calculate what percentage of a slot is filled by a task
  const getSlotFillPercentage = (task, slotTime) => {
    if (!task) return 0;
    
    const slotStartMinutes = timeToMinutes(slotTime);
    const slotEndMinutes = slotStartMinutes + 60;
    const taskStartMinutes = timeToMinutes(task.scheduledTime);
    const taskDuration = task.task?.duration || 60;
    const taskEndMinutes = taskStartMinutes + taskDuration;
    
    // Calculate overlap
    const overlapStart = Math.max(slotStartMinutes, taskStartMinutes);
    const overlapEnd = Math.min(slotEndMinutes, taskEndMinutes);
    const overlapMinutes = Math.max(0, overlapEnd - overlapStart);
    
    return (overlapMinutes / 60) * 100; // Return percentage
  };

  // Calculate where in the slot the task starts (left offset percentage)
  const getSlotStartOffset = (task, slotTime) => {
    if (!task) return 0;
    
    const slotStartMinutes = timeToMinutes(slotTime);
    const taskStartMinutes = timeToMinutes(task.scheduledTime);
    
    // If task starts after this slot begins, calculate offset
    if (taskStartMinutes > slotStartMinutes) {
      const offsetMinutes = taskStartMinutes - slotStartMinutes;
      return (offsetMinutes / 60) * 100; // Return percentage
    }
    
    return 0; // Task started in previous slot
  };

  const handleCompleteTask = async (occurrenceId, isCompleted) => {
    if (isCompleted) {
      await taskRepository.uncompleteOccurrence(occurrenceId);
    } else {
      await taskRepository.completeOccurrence(occurrenceId);
    }
    await loadOccurrences();
    triggerProgressRefresh();
    
    // Recalculate today's badge and streak
    const today = getCurrentDate();
    const occurrence = occurrences.find(occ => occ.id === occurrenceId);
    if (occurrence && occurrence.scheduledDate === today) {
      await analyticsRepository.recalculateDailyBadge(today);
      const { refreshStreak } = useUserStore.getState();
      await refreshStreak();
    }
  };
  
  const handleOpenTaskModal = () => {
    setEditingTask(null);
    setSlotClickData(null);
    setIsTaskModalOpen(true);
  };
  
  const handleSlotClick = (date, time) => {
    setSlotClickData({
      date: format(date, 'yyyy-MM-dd'),
      time: time
    });
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };
  
  const handleCloseTaskModal = () => {
    setIsTaskModalOpen(false);
    setEditingTask(null);
    setSlotClickData(null);
  };
  
  const handleSaveTask = async () => {
    await loadOccurrences();
  };

  const handleEditTask = async (occurrence) => {
    const task = await taskRepository.getById(occurrence.taskId);
    setEditingTask({
      ...task,
      occurrenceId: occurrence.id,
      scheduledDate: occurrence.scheduledDate,
      scheduledTime: occurrence.scheduledTime,
    });
    setSlotClickData(null);
    setTaskMenuOpen(null);
    setIsTaskModalOpen(true);
  };

  const handleDeleteTask = async (taskId) => {
    if (confirm('Are you sure you want to delete this task?')) {
      await taskRepository.delete(taskId);
      await loadOccurrences();
      triggerProgressRefresh();
      setTaskMenuOpen(null);
    }
  };

  const toggleTaskMenu = (occurrenceId, event) => {
    event.stopPropagation();
    if (taskMenuOpen === occurrenceId) {
      setTaskMenuOpen(null);
      setMenuPosition(null);
    } else {
      const btn = event.currentTarget;
      const rect = btn.getBoundingClientRect();
      
      // Menu dimensions
      const menuWidth = 150;
      const menuHeight = 100;
      
      // Position menu right of the button, accounting for scroll
      let left = rect.right + window.scrollX + 8;
      let top = rect.top + window.scrollY - 5;
      
      // Check if menu would overflow right edge of viewport
      if (left + menuWidth > window.innerWidth + window.scrollX) {
        // Position to the left of the button instead
        left = rect.left + window.scrollX - menuWidth - 8;
      }
      
      // If still would overflow left edge, position within viewport
      if (left < window.scrollX) {
        left = window.scrollX + 10;
      }
      
      // Check if menu would overflow bottom edge
      if (top + menuHeight > window.innerHeight + window.scrollY) {
        // Position above the button instead
        top = rect.top + window.scrollY - menuHeight;
      }
      
      // Ensure menu doesn't go off top of screen
      if (top < window.scrollY) {
        top = rect.bottom + window.scrollY + 4;
      }
      
      setMenuPosition({ left, top });
      setTaskMenuOpen(occurrenceId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Week Navigation */}
      <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm p-6">
        <button
          onClick={goToPreviousWeek}
          className="px-6 py-3 bg-white hover:bg-gray-50 rounded-lg transition-all shadow-sm hover:shadow-md font-medium text-gray-700 flex items-center gap-2"
        >
          <span className="text-lg">←</span> Previous
        </button>
        
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-1">
            {weekDates.length > 0 && (
              <>
                {format(weekDates[0], 'MMM d')} - {format(weekDates[6], 'MMM d, yyyy')}
              </>
            )}
          </h2>
          <button
            onClick={goToToday}
            className="text-sm text-primary hover:text-blue-700 font-medium transition-colors"
          >
            📅 Jump to Today
          </button>
        </div>
        
        <button
          onClick={goToNextWeek}
          className="px-6 py-3 bg-white hover:bg-gray-50 rounded-lg transition-all shadow-sm hover:shadow-md font-medium text-gray-700 flex items-center gap-2"
        >
          Next <span className="text-lg">→</span>
        </button>
      </div>

      {/* Add Task Button */}
      <button
        onClick={handleOpenTaskModal}
        className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
      >
        ✨ Add New Task
      </button>

      {/* Timetable Grid */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden relative border border-gray-200">
        <div className="overflow-x-auto">
          <table ref={tableRef} className="w-full relative" style={{ borderCollapse: 'collapse', borderSpacing: 0 }}>
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-300">
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 w-32 sticky left-0 bg-gradient-to-r from-gray-50 to-gray-100 z-10 border-r-2 border-gray-300">
                  📆 Day
                </th>
                {timeSlots.map((time, index) => (
                  <th
                    key={index}
                    className="px-3 py-4 text-center text-xs font-semibold text-gray-600 min-w-[100px] border-l border-gray-200"
                  >
                    <div className="font-bold">{formatTime(time, user?.settings?.timeFormat === '24h')}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weekDates.map((date, dateIndex) => {
                const isCurrentDay = format(date, 'yyyy-MM-dd') === getCurrentDate();
                return (
                  <tr key={dateIndex} className="border-b border-gray-200 hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-6 text-sm font-bold sticky left-0 z-10 border-r-2 border-gray-300 bg-white">
                      <div className="flex items-center gap-3">
                        <div className={`w-16 h-16 rounded-full flex flex-col items-center justify-center shadow-lg transition-all ${
                          isCurrentDay 
                            ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white scale-110 animate-pulse-slow shadow-blue-300' 
                            : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 hover:scale-105'
                        }`}>
                          <div className="text-xs uppercase font-bold tracking-wide">{format(date, 'EEE')}</div>
                          <div className="text-2xl font-black">{format(date, 'd')}</div>
                        </div>
                      </div>
                    </td>
                    {timeSlots.map((time, timeIndex) => {
                      const blocked = isSlotBlocked(date, time);
                      const slotOccurrences = getOccurrencesForSlot(date, time);
                      const hasTask = slotOccurrences.length > 0;
                      
                      // Sort tasks by start time for proper left-to-right rendering
                      const sortedTasks = slotOccurrences.sort((a, b) => {
                        const aStart = timeToMinutes(a.scheduledTime);
                        const bStart = timeToMinutes(b.scheduledTime);
                        return aStart - bStart;
                      });
                      
                      return (
                        <td
                          key={`${dateIndex}-${timeIndex}`}
                          className={`transition-all relative border-l border-gray-200 ${
                            blocked 
                              ? 'bg-gradient-to-br from-indigo-50 to-purple-50' 
                              : !hasTask 
                                ? 'hover:bg-blue-100 cursor-pointer'
                                : ''
                          }`}
                          style={{
                            minHeight: '80px',
                            overflow: 'visible',
                            position: 'relative',
                          }}
                          onClick={() => {
                            if (blocked) return;
                            if (!hasTask) {
                              handleSlotClick(date, time);
                            }
                          }}
                        >
                          {blocked ? (
                            <div className="flex items-center justify-center h-full min-h-[80px] text-2xl opacity-50">🌙</div>
                          ) : hasTask ? (
                            <div className="absolute inset-0 flex">
                              {(() => {
                                const slotStartMinutes = timeToMinutes(time);
                                const slotEndMinutes = slotStartMinutes + 60;
                                let currentPosition = 0; // Track position in percentage
                                const elements = [];
                                
                                sortedTasks.forEach((task, idx) => {
                                  const taskStartMinutes = timeToMinutes(task.scheduledTime);
                                  const taskDuration = task.task?.duration || 60;
                                  const taskEndMinutes = taskStartMinutes + taskDuration;
                                  
                                  // Calculate where this task starts and ends within the slot
                                  const taskStartInSlot = Math.max(0, taskStartMinutes - slotStartMinutes);
                                  const taskEndInSlot = Math.min(60, taskEndMinutes - slotStartMinutes);
                                  const taskStartPercent = (taskStartInSlot / 60) * 100;
                                  const taskWidthPercent = ((taskEndInSlot - taskStartInSlot) / 60) * 100;
                                  
                                  // Add empty space before task if needed
                                  if (taskStartPercent > currentPosition) {
                                    const emptyWidth = taskStartPercent - currentPosition;
                                    elements.push(
                                      <div 
                                        key={`empty-${idx}`}
                                        className="bg-white hover:bg-blue-50 cursor-pointer flex items-center justify-center"
                                        style={{ width: `${emptyWidth}%` }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const emptySpaceTime = minutesToTime(slotStartMinutes + (currentPosition / 100) * 60);
                                          handleSlotClick(date, emptySpaceTime);
                                        }}
                                      >
                                        {emptyWidth > 30 && (
                                          <div className="text-gray-400 text-sm opacity-0 hover:opacity-100 transition-opacity">
                                            + Click
                                          </div>
                                        )}
                                      </div>
                                    );
                                  }
                                  
                                  // Check if this is the starting slot and last slot for this task
                                  const isStartSlot = taskStartMinutes >= slotStartMinutes && taskStartMinutes < slotEndMinutes;
                                  const nextTime = timeIndex < timeSlots.length - 1 ? timeSlots[timeIndex + 1] : null;
                                  const nextOccurrences = nextTime ? getOccurrencesForSlot(date, nextTime) : [];
                                  const isLastSlot = nextOccurrences.length === 0 || !nextOccurrences.find(o => o.id === task.id);
                                  
                                  // Render the task with tooltip
                                  const taskStartTime = formatTime(task.scheduledTime, user?.settings?.timeFormat === '24h');
                                  const taskEndTime = formatTime(minutesToTime(taskStartMinutes + taskDuration), user?.settings?.timeFormat === '24h');
                                  const tooltipText = `${task.task?.title || 'Task'}\n${taskStartTime} - ${taskEndTime}`;
                                  
                                  elements.push(
                                    <div 
                                      key={`task-${task.id}`}
                                      className={`flex items-center justify-center cursor-pointer hover:opacity-90 relative ${
                                        task.completed ? 'bg-gradient-to-br from-green-400 to-emerald-500' : ''
                                      }`}
                                      style={{
                                        width: `${taskWidthPercent}%`,
                                        backgroundColor: task.completed ? undefined : task.task?.color,
                                        height: '100%',
                                      }}
                                      title={tooltipText}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (taskMenuOpen !== task.id) {
                                          handleCompleteTask(task.id, task.completed);
                                        }
                                      }}
                                    >
                                      {isStartSlot && taskWidthPercent >= 15 && (
                                        <span className={`font-bold text-center text-white drop-shadow-lg truncate px-1 ${
                                          task.completed ? 'line-through' : ''
                                        } ${taskWidthPercent < 30 ? 'text-[10px]' : 'text-xs'}`}>
                                          {task.completed && '✓ '}
                                          {task.task?.title || 'Task'}
                                        </span>
                                      )}
                                      {isLastSlot && (
                                        <button
                                          id={`menu-btn-${task.id}`}
                                          className="absolute top-1 right-1 text-white hover:bg-white/30 rounded p-1 transition-colors flex-shrink-0 z-20 bg-black/20"
                                          onClick={(e) => toggleTaskMenu(task.id, e)}
                                        >
                                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16">
                                            <circle cx="8" cy="3" r="1.5"/>
                                            <circle cx="8" cy="8" r="1.5"/>
                                            <circle cx="8" cy="13" r="1.5"/>
                                          </svg>
                                        </button>
                                      )}
                                    </div>
                                  );
                                  
                                  currentPosition = taskStartPercent + taskWidthPercent;
                                });
                                
                                // Add remaining empty space if any
                                if (currentPosition < 100) {
                                  const emptyWidth = 100 - currentPosition;
                                  elements.push(
                                    <div 
                                      key="empty-end"
                                      className="flex-1 bg-white hover:bg-blue-50 cursor-pointer border-l border-gray-200 flex items-center justify-center"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const emptySpaceTime = minutesToTime(slotStartMinutes + (currentPosition / 100) * 60);
                                        handleSlotClick(date, emptySpaceTime);
                                      }}
                                    >
                                      {emptyWidth > 30 && (
                                        <div className="text-gray-400 text-sm opacity-0 hover:opacity-100 transition-opacity">
                                          + Click
                                        </div>
                                      )}
                                    </div>
                                  );
                                }
                                
                                return elements;
                              })()}
                            </div>
                          ) : (
                            <div className="flex items-center justify-center h-full min-h-[80px] text-gray-400 text-sm opacity-0 hover:opacity-100 transition-opacity">
                              + Click to add
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
          
        </div>
      </div>
      
      {/* Render menu outside table to prevent positioning issues */}
      {taskMenuOpen && menuPosition && (
        <>
          {/* Invisible backdrop to catch clicks */}
          <div 
            className="fixed inset-0"
            style={{ zIndex: 9998 }}
            onClick={() => {
              setTaskMenuOpen(null);
              setMenuPosition(null);
            }}
          />
          {/* Menu */}
          <div 
            className="fixed bg-white rounded-lg shadow-xl border border-gray-200 min-w-[120px] overflow-hidden"
            style={{
              zIndex: 9999,
              left: `${menuPosition.left}px`,
              top: `${menuPosition.top}px`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 transition-colors flex items-center gap-2"
              onClick={(e) => {
                e.stopPropagation();
                const taskOcc = occurrences.find(occ => occ.id === taskMenuOpen);
                if (taskOcc) handleEditTask(taskOcc);
              }}
            >
              <span>✏️</span>
              <span>Edit</span>
            </button>
            <button
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 border-t border-gray-200"
              onClick={(e) => {
                e.stopPropagation();
                const taskOcc = occurrences.find(occ => occ.id === taskMenuOpen);
                if (taskOcc) handleDeleteTask(taskOcc.taskId);
              }}
            >
              <span>🗑️</span>
              <span>Delete</span>
            </button>
          </div>
        </>
      )}
      
      {/* Task Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={handleCloseTaskModal}
        task={editingTask}
        slotData={slotClickData}
        onSave={handleSaveTask}
      />
    </div>
  );
};

export default TimetablePage;
