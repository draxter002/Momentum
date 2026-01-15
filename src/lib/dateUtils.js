import { 
  format, 
  parseISO, 
  startOfWeek, 
  endOfWeek, 
  addDays, 
  isSameDay,
  startOfDay,
  setHours,
  setMinutes,
  isWithinInterval,
} from 'date-fns';

/**
 * Date utility functions
 */

/**
 * Get the start of week based on user preference
 */
export const getWeekStart = (date, firstDayOfWeek = 'Monday') => {
  const weekStartDay = firstDayOfWeek === 'Sunday' ? 0 : 1;
  return startOfWeek(date, { weekStartsOn: weekStartDay });
};

/**
 * Get the end of week based on user preference
 */
export const getWeekEnd = (date, firstDayOfWeek = 'Monday') => {
  const weekStartDay = firstDayOfWeek === 'Sunday' ? 0 : 1;
  return endOfWeek(date, { weekStartsOn: weekStartDay });
};

/**
 * Get array of dates for the current week
 */
export const getWeekDates = (date, firstDayOfWeek = 'Monday') => {
  const start = getWeekStart(date, firstDayOfWeek);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
};

/**
 * Format time for display (12h or 24h)
 */
export const formatTime = (time, use24Hour = true) => {
  // time is in format "HH:mm"
  const [hours, minutes] = time.split(':').map(Number);
  const date = setMinutes(setHours(new Date(), hours), minutes);
  return format(date, use24Hour ? 'HH:mm' : 'h:mm a');
};

/**
 * Get day name from date
 */
export const getDayName = (date, short = false) => {
  return format(parseISO(date), short ? 'EEE' : 'EEEE');
};

/**
 * Check if date is today
 */
export const isToday = (date) => {
  return isSameDay(parseISO(date), new Date());
};

/**
 * Parse time string to minutes since midnight
 */
export const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Convert minutes since midnight to time string
 */
export const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

/**
 * Get current time as "HH:mm"
 */
export const getCurrentTime = () => {
  return format(new Date(), 'HH:mm');
};

/**
 * Get current date as "yyyy-MM-dd"
 */
export const getCurrentDate = () => {
  return format(new Date(), 'yyyy-MM-dd');
};

/**
 * Check if time slot is blocked (sleep or routine)
 */
export const isTimeSlotBlocked = (date, time, blockedSlots, sleepStart, sleepEnd) => {
  const dayName = format(parseISO(date), 'EEEE');
  const timeMinutes = timeToMinutes(time);
  
  // Check sleep schedule
  const sleepStartMinutes = timeToMinutes(sleepStart);
  const sleepEndMinutes = timeToMinutes(sleepEnd);
  
  if (sleepStartMinutes > sleepEndMinutes) {
    // Sleep spans midnight
    if (timeMinutes >= sleepStartMinutes || timeMinutes < sleepEndMinutes) {
      return true;
    }
  } else {
    if (timeMinutes >= sleepStartMinutes && timeMinutes < sleepEndMinutes) {
      return true;
    }
  }
  
  // Check blocked slots
  for (const slot of blockedSlots) {
    if (slot.day !== 'all' && slot.day !== dayName) continue;
    
    const [slotStart, slotEnd] = slot.time.split('-');
    const slotStartMinutes = timeToMinutes(slotStart);
    const slotEndMinutes = timeToMinutes(slotEnd);
    
    if (timeMinutes >= slotStartMinutes && timeMinutes < slotEndMinutes) {
      return true;
    }
  }
  
  return false;
};

/**
 * Generate hourly time slots for a day
 */
export const generateTimeSlots = (intervalMinutes = 60) => {
  const slots = [];
  for (let i = 0; i < 24 * 60; i += intervalMinutes) {
    slots.push(minutesToTime(i));
  }
  return slots;
};

export default {
  getWeekStart,
  getWeekEnd,
  getWeekDates,
  formatTime,
  getDayName,
  isToday,
  timeToMinutes,
  minutesToTime,
  getCurrentTime,
  getCurrentDate,
  isTimeSlotBlocked,
  generateTimeSlots,
};
