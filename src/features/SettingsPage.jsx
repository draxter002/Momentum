import { useState, useEffect, useRef } from 'react';
import useUserStore from '../store/useUserStore';
import { exportData, importData } from '../lib/dataManager';
import { formatTime } from '../lib/dateUtils';

/**
 * Settings View - User preferences and configuration
 */
const SettingsPage = () => {
  const { user, updateSettings, loadUser } = useUserStore();
  const fileInputRef = useRef(null);
  const [settings, setSettings] = useState({
    sleepStart: '23:00',
    sleepEnd: '07:00',
    firstDayOfWeek: 'Monday',
    weeklyHoliday: null,
    timeFormat: '24h',
    blockedSlots: [],
    gracePeriodHours: 0,
    freezeTokensPerMonth: 1,
  });

  const [newBlockedSlot, setNewBlockedSlot] = useState({
    day: 'all',
    startTime: '12:00',
    endTime: '13:00',
    label: 'Lunch',
  });

  useEffect(() => {
    if (user?.settings) {
      setSettings(user.settings);
    }
  }, [user]);

  const handleSave = async () => {
    await updateSettings(settings);
    await loadUser(); // Reload user data to ensure all components get updated
    alert('Settings saved successfully!');
  };

  const addBlockedSlot = async () => {
    try {
      // Convert to time range format for storage
      const slotToAdd = {
        ...newBlockedSlot,
        time: `${newBlockedSlot.startTime}-${newBlockedSlot.endTime}`,
      };
      delete slotToAdd.startTime;
      delete slotToAdd.endTime;
      
      console.log('Adding blocked slot:', slotToAdd);
      
      const updatedSettings = {
        ...settings,
        blockedSlots: [...settings.blockedSlots, slotToAdd],
      };
      
      console.log('Updated settings:', updatedSettings);
      
      setSettings(updatedSettings);
      
      // Auto-save to database
      await updateSettings(updatedSettings);
      console.log('Settings saved to database');
      
      await loadUser();
      console.log('User reloaded');
      
      setNewBlockedSlot({
        day: 'all',
        startTime: '12:00',
        endTime: '13:00',
        label: '',
      });
      
      alert('Blocked slot added successfully!');
    } catch (error) {
      console.error('Error adding blocked slot:', error);
      alert('Failed to add blocked slot: ' + error.message);
    }
  };

  const removeBlockedSlot = async (index) => {
    const updatedSettings = {
      ...settings,
      blockedSlots: settings.blockedSlots.filter((_, i) => i !== index),
    };
    
    setSettings(updatedSettings);
    
    // Auto-save to database
    await updateSettings(updatedSettings);
    await loadUser();
  };
  
  const handleExport = async () => {
    const result = await exportData();
    if (result.success) {
      alert('Data exported successfully!');
    } else {
      alert(`Export failed: ${result.error}`);
    }
  };
  
  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const result = await importData(file);
    if (result.success) {
      alert(`Data imported successfully! ${result.recordsImported} tasks restored.`);
      await loadUser(); // Reload user data
      window.location.reload(); // Refresh the app
    } else if (result.cancelled) {
      // User cancelled
    } else {
      alert(`Import failed: ${result.error}`);
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 shadow-lg border border-blue-200">
        <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-3">
          <span className="text-5xl">⚙️</span>
          Settings
        </h1>
      </div>

      {/* Sleep Schedule */}
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200 hover:shadow-2xl transition-all">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-3">
          <span className="text-3xl">😴</span>
          Sleep Schedule
        </h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-base font-semibold text-gray-700 mb-3">
              Sleep Start
            </label>
            <input
              type="time"
              value={settings.sleepStart}
              onChange={(e) => setSettings({ ...settings, sleepStart: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sleep End
            </label>
            <input
              type="time"
              value={settings.sleepEnd}
              onChange={(e) => setSettings({ ...settings, sleepEnd: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Week Preferences */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Week Preferences</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Week Starts On
            </label>
            <select
              value={settings.firstDayOfWeek}
              onChange={(e) => setSettings({ ...settings, firstDayOfWeek: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="Monday">Monday</option>
              <option value="Sunday">Sunday</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Weekly Holiday (Optional)
            </label>
            <select
              value={settings.weeklyHoliday || ''}
              onChange={(e) => setSettings({ ...settings, weeklyHoliday: e.target.value || null })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">None</option>
              <option value="Monday">Monday</option>
              <option value="Tuesday">Tuesday</option>
              <option value="Wednesday">Wednesday</option>
              <option value="Thursday">Thursday</option>
              <option value="Friday">Friday</option>
              <option value="Saturday">Saturday</option>
              <option value="Sunday">Sunday</option>
            </select>
          </div>
        </div>
      </div>

      {/* Time Format */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Display Preferences</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Time Format
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="24h"
                checked={settings.timeFormat === '24h'}
                onChange={(e) => setSettings({ ...settings, timeFormat: e.target.value })}
                className="mr-2"
              />
              24-hour (13:00)
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="12h"
                checked={settings.timeFormat === '12h'}
                onChange={(e) => setSettings({ ...settings, timeFormat: e.target.value })}
                className="mr-2"
              />
              12-hour (1:00 PM)
            </label>
          </div>
        </div>
      </div>

      {/* Blocked Time Slots */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Blocked Time Slots</h2>
        <p className="text-sm text-gray-600 mb-4">
          Add recurring blocked times (e.g., meals, commute) that will be greyed out on your timetable.
        </p>
        
        {/* Existing Blocked Slots */}
        <div className="space-y-2 mb-4">
          {settings.blockedSlots.map((slot, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-blocked rounded-lg"
            >
              <div>
                <span className="font-medium">{slot.label || 'Blocked Time'}</span>
                <span className="text-sm text-gray-600 ml-2">
                  {slot.day === 'all' ? 'Every day' : slot.day} • 
                  {(() => {
                    const [start, end] = slot.time.split('-');
                    return `${formatTime(start, settings.timeFormat === '24h')} - ${formatTime(end, settings.timeFormat === '24h')}`;
                  })()}
                </span>
              </div>
              <button
                onClick={() => removeBlockedSlot(index)}
                className="text-red-600 hover:text-red-800 font-medium"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        {/* Add New Blocked Slot */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <input
            type="text"
            placeholder="Label (e.g., Lunch)"
            value={newBlockedSlot.label}
            onChange={(e) => setNewBlockedSlot({ ...newBlockedSlot, label: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          />
          <select
            value={newBlockedSlot.day}
            onChange={(e) => setNewBlockedSlot({ ...newBlockedSlot, day: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">Every day</option>
            <option value="Monday">Monday</option>
            <option value="Tuesday">Tuesday</option>
            <option value="Wednesday">Wednesday</option>
            <option value="Thursday">Thursday</option>
            <option value="Friday">Friday</option>
            <option value="Saturday">Saturday</option>
            <option value="Sunday">Sunday</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Start Time</label>
            <input
              type="time"
              value={newBlockedSlot.startTime}
              onChange={(e) => setNewBlockedSlot({ ...newBlockedSlot, startTime: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">End Time</label>
            <input
              type="time"
              value={newBlockedSlot.endTime}
              onChange={(e) => setNewBlockedSlot({ ...newBlockedSlot, endTime: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
        <button
          onClick={addBlockedSlot}
          className="mt-3 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
        >
          + Add Blocked Slot
        </button>
      </div>

      {/* Advanced Settings */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Advanced Settings</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Grace Period (hours after midnight to mark previous day)
            </label>
            <input
              type="number"
              min="0"
              max="6"
              value={settings.gracePeriodHours}
              onChange={(e) => setSettings({ ...settings, gracePeriodHours: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Freeze Tokens per Month
            </label>
            <input
              type="number"
              min="0"
              max="3"
              value={settings.freezeTokensPerMonth}
              onChange={(e) => setSettings({ ...settings, freezeTokensPerMonth: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        className="w-full py-3 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg"
      >
        Save Settings
      </button>

      {/* Export/Import */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Data Management</h2>
        <p className="text-sm text-gray-600 mb-4">
          Export your data as a backup or import previously exported data. All tasks, badges, and streaks will be included.
        </p>
        <div className="flex space-x-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
          >
            📥 Import Data
          </button>
          <button 
            onClick={handleExport}
            className="flex-1 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
          >
            📤 Export Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
