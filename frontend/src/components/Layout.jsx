import { Outlet } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import Notification from '../pages/Notification'; // ensure correct path

const Layout = () => {
  const { user, logout } = useAuth();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const containerRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowUserDropdown(false);
        setShowNotifications(false);
      }
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm p-4 flex justify-end">
          <div className="flex items-center space-x-4" ref={containerRef}>
            {/* Notification bell (opens dropdown popover) */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications((v) => !v);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Notifications"
              >
                <span className="text-xl">🔔</span>
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2">
                  {/* Render Notification as embedded (no internal bell) */}
                  <Notification embedded />
                </div>
              )}
            </div>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown((v) => !v)}
                className="flex items-center space-x-2 hover:bg-gray-100 p-2 rounded-lg"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="text-gray-700">{user?.name || 'User'}</span>
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-10">
                  <div className="px-4 py-2 border-b">
                    <p className="text-sm text-gray-500">Signed in as</p>
                    <p className="font-medium text-gray-900 break-words">{user?.email}</p>
                  </div>
                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
