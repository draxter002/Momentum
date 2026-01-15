import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import Navigation from './Navigation';
import useUserStore from '../store/useUserStore';

/**
 * Main layout wrapper for the application
 */
const Layout = () => {
  const { loadUser } = useUserStore();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Animated gradient background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-violet-600 via-purple-500 to-pink-500 opacity-90"></div>
      <div className="fixed inset-0 -z-10 bg-gradient-to-tl from-blue-600 via-cyan-500 to-teal-400 opacity-70 mix-blend-multiply animate-gradient-slow"></div>
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-orange-400 via-red-400 to-pink-600 opacity-50 mix-blend-screen animate-pulse-slow"></div>
      
      {/* Content overlay with subtle backdrop blur */}
      <div className="relative z-0 min-h-screen flex flex-col backdrop-blur-3xl bg-white/10">
        <Header />
        <Navigation />
        <main className="flex-1 px-6 pt-8 pb-12">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default Layout;
