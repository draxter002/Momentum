import { useState, useEffect, useRef } from 'react';
import milestoneRepository from '../db/milestoneRepository';
import { TIER_COLORS } from '../lib/milestones';

export default function NotificationBell({ userId, refreshTrigger }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, [userId, refreshTrigger]); // Reload when refreshTrigger changes

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const loadNotifications = async () => {
    try {
      const count = await milestoneRepository.getUnreadCount(userId);
      const notifs = await milestoneRepository.getNotifications(userId);
      console.log('Loaded notifications:', { count, notifs });
      setUnreadCount(count);
      setNotifications(notifs);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    await milestoneRepository.markAsRead(notificationId);
    await loadNotifications();
  };

  const handleMarkAllAsRead = async () => {
    await milestoneRepository.markAllAsRead(userId);
    await loadNotifications();
  };

  const handleDelete = async (notificationId) => {
    await milestoneRepository.deleteNotification(notificationId);
    await loadNotifications();
  };

  const getTierColor = (tier) => {
    return TIER_COLORS[tier]?.text || 'text-gray-400';
  };

  const getTierBg = (tier) => {
    return TIER_COLORS[tier]?.bg || 'bg-gray-800';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-amber-100 rounded-lg transition-all hover:scale-110"
      >
        <svg className="w-8 h-8 text-amber-500 drop-shadow-lg" fill="currentColor" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full transform translate-x-1/2 -translate-y-1/2 animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-50 max-h-[500px] overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 border-b border-gray-700 hover:bg-gray-750 transition-colors ${
                    !notif.read ? 'bg-gray-800' : 'bg-gray-850'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`text-4xl ${!notif.read ? 'animate-bounce' : ''}`}>
                      {notif.data?.emoji || '🎉'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-sm font-semibold ${getTierColor(notif.data?.tier || 'early')}`}>
                          {(notif.data?.tier || 'milestone').toUpperCase()} MILESTONE
                        </span>
                        {!notif.read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                      </div>
                      <h4 className="text-white font-medium mb-1">{notif.data?.name || notif.title}</h4>
                      <p className="text-sm text-gray-400 mb-2">{notif.message}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {new Date(notif.createdAt).toLocaleDateString()}
                        </span>
                        {!notif.read && (
                          <button
                            onClick={() => handleMarkAsRead(notif.id)}
                            className="text-xs text-blue-400 hover:text-blue-300"
                          >
                            Mark as read
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notif.id)}
                          className="text-xs text-red-400 hover:text-red-300 ml-auto"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
