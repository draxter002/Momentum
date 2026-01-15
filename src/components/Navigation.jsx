import { NavLink } from 'react-router-dom';

/**
 * Main navigation tabs
 */
const Navigation = () => {
  const navItems = [
    { path: '/', label: 'Timetable', icon: '📅' },
    { path: '/analytics', label: 'Analytics', icon: '📊' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <nav className="flex justify-center py-8 mb-32">
      <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 rounded-full shadow-2xl px-8 py-4 flex items-center space-x-8">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `text-5xl transition-all duration-300 transform hover:scale-125 ${
                isActive
                  ? 'opacity-100 drop-shadow-xl scale-110'
                  : 'opacity-70 hover:opacity-100'
              }`
            }
            title={item.label}
          >
            {item.icon}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;
