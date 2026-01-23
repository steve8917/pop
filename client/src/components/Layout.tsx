import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useChat } from '../contexts/ChatContext';
import { useEffect, useState } from 'react';
import cityBg from '../assets/backgrounds/city-dashboard.jpg';
import {
  Home,
  Calendar,
  CalendarCheck,
  BookOpen,
  Bell,
  LogOut,
  Menu,
  X,
  Settings,
  User
} from 'lucide-react';

const Layout = () => {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAllAsRead, deleteNotification } = useNotifications();
  const { unreadCount: unreadChatCount } = useChat();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState<number | null>(null);

  const isDashboardFullBleed = location.pathname === '/dashboard';

  // Auto logout dopo 10 minuti di inattività
  useEffect(() => {
    const resetTimeout = () => {
      if (sessionTimeout) clearTimeout(sessionTimeout);

      const timeout = setTimeout(() => {
        logout();
        navigate('/login');
      }, 10 * 60 * 1000); // 10 minuti

      setSessionTimeout(timeout);
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((event) => {
      document.addEventListener(event, resetTimeout);
    });

    resetTimeout();

    return () => {
      if (sessionTimeout) clearTimeout(sessionTimeout);
      events.forEach((event) => {
        document.removeEventListener(event, resetTimeout);
      });
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', icon: Home, label: 'Dashboard' },
    { to: '/availability', icon: CalendarCheck, label: 'Disponibilità' },
    { to: '/schedule', icon: Calendar, label: 'Programma' },
    { to: '/experiences', icon: BookOpen, label: 'Esperienze' },
    { to: '/profile', icon: User, label: 'Profilo' }
  ];

  if (user?.role === 'admin') {
    navItems.push({ to: '/admin', icon: Settings, label: 'Admin' });
  }

  return (
    <div
      className="min-h-screen text-white"
      style={{
        backgroundImage:
          `linear-gradient(180deg, rgba(6,6,18,0.86) 0%, rgba(10,10,24,0.9) 50%, rgba(6,6,18,0.92) 100%), url(${cityBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="min-h-screen bg-black/55 backdrop-blur-[2px]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/25 backdrop-blur-md">
        <div className={isDashboardFullBleed ? 'w-full px-4 sm:px-6 lg:px-10' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}>
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <div className="flex items-center">
              <NavLink
                to="/dashboard"
                className="text-2xl font-bold text-white hover:text-white/90 transition-colors"
              >
                TepuApp
              </NavLink>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 relative ${
                      isActive
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                        : 'text-white/85 hover:bg-white/10'
                    }`
                  }
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                  {item.to === '/chat' && unreadChatCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                      {unreadChatCount}
                    </span>
                  )}
                </NavLink>
              ))}
            </nav>

            {/* User Actions */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors relative"
                >
                  <Bell size={24} className="text-white/90" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 rounded-xl shadow-2xl border border-white/10 bg-black/60 backdrop-blur-xl max-h-96 overflow-y-auto animate-slide-down">
                    <div className="p-4 border-b border-white/10 flex justify-between items-center">
                      <h3 className="font-semibold text-white">Notifiche</h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-sm text-purple-200 hover:text-white"
                        >
                          Segna tutte come lette
                        </button>
                      )}
                    </div>
                    <div className="divide-y">
                      {notifications.length === 0 ? (
                        <p className="p-4 text-white/60 text-center">Nessuna notifica</p>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification._id}
                            onClick={() => deleteNotification(notification._id)}
                            className={`p-4 cursor-pointer hover:bg-white/5 transition-colors ${
                              !notification.isRead ? 'bg-purple-400/10' : ''
                            }`}
                          >
                            <p className="text-sm text-white/85">{notification.message}</p>
                            <p className="text-xs text-white/50 mt-1">
                              {new Date(notification.createdAt).toLocaleString('it-IT')}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Menu */}
              <div className="hidden md:flex items-center space-x-3 pl-4 border-l border-white/10">
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-white/70">
                    {user?.gender === 'male' ? 'Fratello' : 'Sorella'}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg hover:bg-white/10 text-white/90 transition-colors"
                  title="Logout"
                >
                  <LogOut size={20} />
                </button>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden p-2 rounded-lg hover:bg-white/10 text-white"
              >
                {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {showMobileMenu && (
            <div className="md:hidden py-4 border-t animate-slide-down">
              <nav className="flex flex-col space-y-2">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setShowMobileMenu(false)}
                    className={({ isActive }) =>
                      `flex items-center space-x-2 px-4 py-3 rounded-lg transition-all relative ${
                        isActive
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                          : 'text-white/85 hover:bg-white/10'
                      }`
                    }
                  >
                    <item.icon size={20} />
                    <span>{item.label}</span>
                    {item.to === '/chat' && unreadChatCount > 0 && (
                      <span className="absolute top-2 right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                        {unreadChatCount}
                      </span>
                    )}
                  </NavLink>
                ))}
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-4 py-3 rounded-lg text-white/90 hover:bg-white/10"
                >
                  <LogOut size={20} />
                  <span>Logout</span>
                </button>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className={isDashboardFullBleed ? 'w-full p-0' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'}>
        <Outlet />
      </main>
      </div>
    </div>
  );
};

export default Layout;
