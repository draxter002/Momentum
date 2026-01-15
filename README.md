# ⏰ MOMENTUM

A powerful daily task tracking application with gamification elements to help you build consistent habits and maintain productivity streaks.

![MOMENTUM](https://img.shields.io/badge/version-1.0.0-blue.svg)
![React](https://img.shields.io/badge/React-19.2.0-61dafb.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

✨ Features

📅 **Smart Timetable**
- **7×24 weekly grid view** with hourly time slots
- **Drag-and-drop task creation** by clicking on time slots
- **Multiple overlapping tasks** displayed side-by-side in the same time slot
- **Mid-slot start times** with precise percentage-based positioning (e.g., tasks starting at 4:30 PM)
- **Recurring tasks** support (daily, weekly, specific days)
- **Task continuation** across multiple time slots with visual indicators
- **Hover tooltips** showing full task details and time ranges
- **Overlap detection** with warnings when creating conflicting tasks
- **Current time indicator** (red line) showing where you are now
- **Blocked time slots** for sleep schedule and custom routines (meals, commute, etc.)
- **Color-coded tasks** with customizable colors
- **Week navigation** (previous/next arrows and today button)

### 🏆 **Gamification & Motivation**
- **Daily badges** based on task completion percentage:
  - 🥇 **Gold** (100% completion)
  - 🥈 **Silver** (70-99% completion)
  - 🥉 **Bronze** (50-69% completion)
  - 💩 **Shameful** (Below 50%)
- **Gold streak tracking** - consecutive days of 100% completion
- **30+ milestone achievements** with 4 tiers:
  - 🌱 **Early** (1-7 days)
  - 🔥 **Intermediate** (14-60 days)
  - 💎 **Advanced** (90-365 days)
  - 👑 **Legendary** (500-2000 days)
- **Repeatable milestones** with count badges (×2, ×3, etc.)
- **Real-time progress bar** in sticky header
- **Streak animations** and visual effects
- **Freeze tokens** to maintain streaks during breaks

### 📊 **Analytics Dashboard**
- **Weekly completion chart** with interactive date range navigation
- **Badge distribution** showing gold/silver/bronze breakdown
- **Streak history** visualization
- **Completion trends** over time
- **Task statistics** and insights
- **Day-of-week analysis** with completion rate patterns

### ⚙️ **Customizable Settings**
- **Time format** toggle (12h/24h) - applied throughout the app
- **First day of week** preference (Monday/Sunday)
- **Weekly holiday** selection
- **Sleep schedule** with automatic time slot blocking
- **Custom blocked time slots** with separate start/end time pickers (auto-formatted to your preference)
- **Grace period** for late-night task marking
- **Freeze tokens** allocation control
- **Data export/import** functionality for backups
- **Auto-save** for blocked slots (no manual save needed)

### 🔔 **Smart Notifications**
- **Milestone achievement** notifications with celebratory modals
- **Notification bell** with unread count badge
- **Achievement history** tracking
- **Auto-dismissal** for old notifications
- **Real-time updates** when milestones are earned

### 🎯 **User Experience**
- **Sticky header** that scrolls with you (progress bar, time, streak, notifications, profile)
- **Three-dot menu** on tasks (positioned on the last slot for multi-slot tasks)
- **Empty space clickable** for quick task creation
- **Time format consistency** across all displays (timetable, tooltips, settings)
- **Responsive design** with gradient animated backgrounds
- **Smooth animations** and transitions
- **Intuitive task editing** with pre-filled forms

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ and npm

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/momentum.git
   cd momentum/progress-track
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The production-ready files will be in the `dist` folder.

### Preview Production Build

```bash
npm run preview
```

## 🏗️ Tech Stack

- **Frontend Framework:** React 19.2.0
- **Routing:** React Router 7.12.0
- **State Management:** Zustand 5.0.9
- **Database:** Dexie (IndexedDB wrapper) 4.2.1
- **Styling:** Tailwind CSS 4.1.18
- **Date Handling:** date-fns 4.1.0
- **Charts:** Recharts 3.6.0
- **Build Tool:** Vite 5.1.1
- **Drag & Drop:** @dnd-kit/core 6.3.1
- **Recurrence Rules:** rrule 2.8.1
- **UUID Generation:** uuid 13.0.0

## 📁 Project Structure

```
progress-track/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Header.jsx       # Progress bar, streak, profile (sticky)
│   │   ├── Navigation.jsx   # Tab navigation
│   │   ├── Footer.jsx       # App footer
│   │   ├── Layout.jsx       # Main layout wrapper
│   │   ├── TaskModal.jsx    # Task creation/editing dialog with overlap detection
│   │   ├── MilestoneModal.jsx # Achievement display with count badges
│   │   └── NotificationBell.jsx # Notification system
│   ├── features/            # Main application pages
│   │   ├── TimetablePage.jsx # Weekly task grid with advanced rendering
│   │   ├── AnalyticsPage.jsx # Statistics dashboard
│   │   └── SettingsPage.jsx  # User preferences with auto-save
│   ├── db/                  # Database layer (Dexie)
│   │   ├── database.js      # Schema v2 with milestone counts
│   │   ├── taskRepository.js # Task CRUD with recurrence
│   │   ├── analyticsRepository.js # Stats calculations
│   │   ├── milestoneRepository.js # Achievement tracking
│   │   └── notificationRepository.js
│   ├── store/               # Zustand state management
│   │   └── useUserStore.js  # Global user state
│   ├── lib/                 # Utility functions
│   │   ├── dateUtils.js     # Date/time helpers with format support
│   │   ├── badgeUtils.js    # Badge calculation logic
│   │   ├── milestones.js    # 30+ milestone definitions
│   │   └── dataManager.js   # Export/import functionality
│   ├── utils/               # Additional utilities
│   │   └── dbInspector.js   # Database debugging tools
│   ├── hooks/               # Custom React hooks
│   │   └── useDailyBadgeAward.js
│   ├── App.jsx              # Main application component
│   ├── index.css            # Global styles
│   └── main.jsx             # Entry point
├── public/                  # Static assets
├── index.html               # HTML entry point
├── vite.config.js           # Vite configuration
├── tailwind.config.js       # Tailwind CSS configuration
├── package.json             # Dependencies
└── README.md                # This file
```

## 💾 Database Schema

The app uses **IndexedDB** (via Dexie) for client-side data persistence:

### Tables

- **users** (v1) - User profile and settings
  - Settings include: sleepStart, sleepEnd, timeFormat, blockedSlots, gracePeriodHours, etc.
  
- **tasks** (v1) - Task definitions
  - Fields: id, userId, title, description, duration, color, category, recurrence, deletedAt
  
- **occurrences** (v1) - Materialized task instances for specific dates
  - Fields: id, taskId, scheduledDate, scheduledTime, completed, completedAt
  - Indexed by: [scheduledDate+scheduledTime], [taskId+scheduledDate], [completed+scheduledDate]
  
- **recurrenceRules** (v1) - Recurrence patterns
  - Types: daily, specific_days, weekly
  - Fields: id, taskId, type, days[], startDate, endDate, exceptions[]
  
- **dailySummaries** (v1) - Daily completion statistics
  - Fields: date, userId, totalTasks, completedTasks, completionRate, badgeTier
  
- **badges** (v1) - Badge achievement history
  - Fields: id, userId, date, tier, createdAt
  
- **streaks** (v1) - Gold streak tracking
  - Fields: userId, currentStreak, longestStreak, lastCompletionDate, freezeTokens
  
- **milestones** (v2) - Achievement records with repeat counts
  - Fields: id, userId, days, tier, achievedAt, count, lastAchievedAt
  
- **notifications** (v1) - User notifications
  - Fields: id, userId, type, title, message, read, createdAt

### Database Versioning

The app uses Dexie's versioning system. Currently on **version 2** with migration support for milestone counts.

## 🎮 How to Use

### Creating Tasks

1. Navigate to the **Timetable** tab
2. Click on any time slot to open the task creation modal
3. Fill in task details:
   - **Title** (required)
   - **Description** (optional)
   - **Duration** (in minutes)
   - **Color** (for visual organization)
   - **Recurrence** (once, daily, specific days, weekly)
4. Click **"Create Task"**
5. If the task overlaps with existing tasks, you'll get a warning with the option to proceed

### Editing Tasks

1. Click the **three-dot menu** (⋮) on any task
2. Select **"Edit"**
3. Modify task details
4. Overlap detection works for edits too (excludes the current task from conflict check)

### Completing Tasks

1. Click the **three-dot menu** (⋮) on a task
2. Select **"Mark as Complete"** or **"Mark as Incomplete"**
3. Your daily progress bar updates instantly
4. Achieve 100% completion to earn a gold badge and extend your streak

### Managing Recurring Tasks

- **Daily tasks** repeat every day automatically
- **Specific days** lets you choose which days of the week (e.g., Mon, Wed, Fri)
- **Weekly tasks** repeat once per week on the same day
- The system generates occurrences for a 90-day window
- Edit the parent task to update all future occurrences

### Tracking Progress

- **Header bar** (sticky) shows real-time completion percentage
- **Current time** displayed with 🕐 icon (updates every second)
- **Streak counter** shows consecutive gold badge days
- **Analytics tab** displays weekly trends and historical data
- **Profile icon** opens milestone achievements modal
- **Notification bell** shows recent accomplishments with unread count

### Viewing Milestones

1. Click the **profile icon** (👤) in the header
2. View all 30+ milestones organized by tier
3. Achieved milestones show:
   - ✓ Green checkmark badge
   - ×N count badge (top-left) if earned multiple times
   - Last claimed date
4. Locked milestones appear grayed out

### Customizing Settings

- **Time Format:** Switch between 12h/24h display (updates everywhere instantly)
- **Blocked Slots:** 
  - Click "+ Add Blocked Slot"
  - Choose label, day, start time, end time
  - Auto-saves immediately (no Save button needed)
  - Remove with one click
- **Sleep Schedule:** Define sleep hours (auto-blocks timetable slots with 🌙 icon)
- **Data Management:** Export JSON backup or import previous data

### Using Blocked Time Slots

1. Go to **Settings** tab
2. Scroll to **"Blocked Time Slots"** section
3. Add slots for recurring routines:
   - **Label:** "Lunch", "Commute", "Gym", etc.
   - **Day:** All days or specific day
   - **Start/End Time:** Use HTML5 time pickers
4. Blocked slots appear on timetable with gradient background and 🌙 emoji
5. Cannot create tasks in blocked slots

## 🐛 Debug Tools

Built-in console utilities for development (loaded automatically):

```javascript
// Inspect user settings and blocked slots
await window.inspectUserSettings()

// View all tasks and occurrences
await window.inspectTasks()

// Delete all occurrences for a specific task
window.deleteTaskOccurrences(taskId)

// Reset entire database (prompts for confirmation)
window.resetDatabase()
```

Access these from your browser's console (F12).

## 🚢 Deployment

### Deploy on Render

1. Push your code to **GitHub**, **GitLab**, or **Bitbucket**
2. Create account on [render.com](https://render.com)
3. Click **"New +"** → **"Static Site"**
4. Connect your Git repository
5. Configure build settings:
   - **Name:** `momentum`
   - **Branch:** `main`
   - **Root Directory:** `progress-track` (or leave empty if at root)
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
6. Click **"Create Static Site"**
7. Wait 2-3 minutes for build
8. Your app will be live at `https://your-app-name.onrender.com`

**Features on Render:**
- ✅ Free SSL certificate (HTTPS)
- ✅ Auto-deploys on git push
- ✅ CDN distribution
- ✅ No environment variables needed (all client-side)

### Deploy on Vercel

```bash
npm install -g vercel
vercel
```

Follow prompts. Vercel auto-detects Vite configuration.

### Deploy on Netlify

1. Connect repository to Netlify
2. Build settings auto-detected
3. Deploy!

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with ❤️ using **React** and **Vite**
- **Dexie.js** for seamless IndexedDB integration
- **Tailwind CSS** for beautiful, responsive design
- **Recharts** for data visualization
- **date-fns** for robust date handling
- Emoji icons for engaging gamification elements

## 🐞 Known Issues & Limitations

- IndexedDB is browser-specific (data doesn't sync across devices without export/import)
- Maximum 90-day window for recurring task occurrences (auto-regenerates as needed)
- Freeze tokens are calculated monthly (not configurable per-streak)

## 🔮 Future Enhancements

- Mobile app version (React Native)
- Cloud sync for multi-device support
- Task categories and filtering
- Pomodoro timer integration
- Team/shared timetables
- AI-powered task suggestions
- Calendar integration (Google Calendar, Outlook)

## 📧 Support

For questions, bug reports, or feature requests:
- Open an issue on GitHub
- Reach out via email (if provided)

---

**Happy tracking! 🎯 Build your streak, achieve your goals!**


### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The app will run at http://localhost:5173

## 📁 Project Structure

```
progress-track/
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── Header.jsx      # Progress bar & badge display
│   │   ├── Navigation.jsx  # Tab navigation
│   │   ├── Layout.jsx      # Main layout wrapper
│   │   ├── Footer.jsx      # Footer with credits
│   │   └── TaskModal.jsx   # Task creation/edit form
│   ├── features/           # Main feature pages
│   │   ├── TimetablePage.jsx    # 7×24 grid view
│   │   ├── AnalyticsPage.jsx    # Stats & charts
│   │   └── SettingsPage.jsx     # Preferences
│   ├── db/                 # Database layer (Dexie)
│   │   ├── database.js          # Schema definition
│   │   ├── taskRepository.js    # Task CRUD operations
│   │   └── analyticsRepository.js # Badge/streak logic
│   ├── lib/                # Utility functions
│   │   ├── dateUtils.js         # Date/time helpers
│   │   ├── badgeUtils.js        # Badge tier calculations
│   │   └── dataManager.js       # Export/import
│   ├── hooks/              # Custom React hooks
│   │   └── useDailyBadgeAward.js # Auto badge awards
│   ├── store/              # Zustand state management
│   │   ├── useStore.js          # UI state
│   │   └── useUserStore.js      # User settings
│   ├── App.jsx             # Main app component
│   ├── main.jsx            # Entry point
│   └── index.css           # Global styles (Tailwind)
├── public/
│   └── manifest.json       # PWA manifest
├── vite.config.js          # Vite configuration
├── tailwind.config.js      # Tailwind CSS config
└── package.json            # Dependencies
```

## 🗄️ Database Schema

The app uses **Dexie.js** (IndexedDB wrapper) with 7 tables:

1. **users** - User profile and settings
2. **tasks** - Task definitions with recurrence rules
3. **recurrenceRules** - Recurrence patterns (daily, weekly, etc.)
4. **occurrences** - Materialized task instances (90-day horizon)
5. **dailySummaries** - Daily completion stats and badge awards
6. **badges** - Badge history log
7. **streaks** - Streak tracking with freeze tokens

## 🎨 Technology Stack

- **React 19.2** - UI framework
- **Vite 7.2** - Build tool & dev server
- **Dexie.js 4.2** - IndexedDB wrapper for local storage
- **Zustand 5.0** - State management
- **React Router 7.12** - Client-side routing
- **Tailwind CSS 4.1** - Utility-first styling
- **date-fns 4.1** - Date manipulation
- **Recharts 3.6** - Charting library (for future graphs)
- **Vite PWA Plugin** - Progressive Web App support

## 📝 Usage Guide

### Creating a Task

1. Click the **"+ Add Task"** button on the Timetable page
2. Fill in task details:
   - Title (required)
   - Description (optional)
   - Start date & time
   - Duration (in minutes)
   - Color (8 presets available)
3. Configure recurrence (optional):
   - **Once** - Single occurrence
   - **Daily** - Every day
   - **Specific Days** - Select days (e.g., MWF)
   - **Weekly** - Once per week
4. Click **"Create Task"**

### Completing Tasks

- Click any task on the timetable grid to mark it complete
- Completed tasks show with a checkmark
- Completion updates your daily progress bar instantly

### Viewing Analytics

- Navigate to the **Analytics** tab
- View badge distribution across all time
- See day-of-week performance patterns
- Check recent daily performance

### Configuring Settings

- Navigate to the **Settings** tab
- Set sleep schedule (blocks overnight hours)
- Add custom blocked slots (lunch, commute, etc.)
- Toggle 12h/24h time format
- Configure grace period and freeze tokens
- Export data for backup

## 🔧 Configuration

### Sleep Schedule
Automatically blocks time slots during sleep hours (default: 11 PM - 7 AM)

### Blocked Slots
Add recurring blocked slots for:
- Lunch breaks
- Commute times
- Meetings
- Any routine that shouldn't have tasks

### Badge Thresholds
- **Platinum**: 100% completion
- **Gold**: 80-99% completion
- **Silver**: 70-79% completion
- **Bronze**: 60-69% completion
- **Shameful**: <60% completion

### Streak Rules
- Consecutive days of earning Gold or Platinum badges
- 1 freeze token per month to skip a single day
- Resets to 0 if gap exceeds freeze token coverage

## 🐛 Troubleshooting

### Dev Server Won't Start
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Database Errors
- Open browser DevTools → Application → IndexedDB
- Delete "ProgressTrackerDB" database
- Refresh page (will recreate with defaults)

### Styles Not Loading
```bash
# Reinstall Tailwind PostCSS plugin
npm install @tailwindcss/postcss
```

## 🚧 Future Enhancements

- [ ] Drag & drop task repositioning
- [ ] Trend graphs with Recharts
- [ ] Task edit functionality
- [ ] Task deletion with confirmation
- [ ] Onboarding flow for new users
- [ ] Dark mode theme
- [ ] Push notifications for task reminders
- [ ] Multi-user support with sync
- [ ] Mobile app (React Native)

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🤝 Contributing

Contributions welcome! Please open an issue or submit a pull request.

---

**Built with ❤️ using React, Vite, and Dexie.js**
