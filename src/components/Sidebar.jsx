import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';

const Sidebar = ({ collapsed, setCollapsed }) => {
  const location = useLocation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    // Clear session/localStorage
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/login';
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  return (
    <aside
      className={`fixed top-14 left-0 bottom-0 bg-[#1A1E1D] h-[calc(100vh-56px)] flex flex-col text-white transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'}`}
    >
      {/* Collapse/Expand Toggle */}
      <div className="flex items-center justify-end px-2 mb-2">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#23293a] transition"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg
            className={`w-5 h-5 transition-transform ${collapsed ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      <nav className="flex-1 p-2">
        <ul className="space-y-2">
          <li>
            <Link
              to="/dashboard"
              className={`flex items-center p-2 rounded-lg ${isActive('/dashboard') ? 'bg-[#23293a]' : 'hover:bg-[#23293a]'} ${collapsed ? 'justify-center' : ''}`}
            >
              <img src="/images/Dashboard_icon.png" alt="Dashboard" className="w-6 h-6 mr-0" />
              {!collapsed && <span className="ml-3 text-white">Dashboard</span>}
            </Link>
          </li>
          <li>
            <Link
              to="/activity"
              className={`flex items-center p-2 rounded-lg ${isActive('/activity') ? 'bg-[#23293a]' : 'hover:bg-[#23293a]'} ${collapsed ? 'justify-center' : ''}`}
            >
              <img src="/images/activity_icon.png" alt="Activity" className="w-6 h-6 mr-0" />
              {!collapsed && <span className="ml-3 text-white">Activity Logs</span>}
            </Link>
          </li>
          <li>
            <Link
              to="/ai-chatbot-assistan"
              className={`flex items-center p-2 rounded-lg ${isActive('/ai-chatbot-assistan') ? 'bg-[#23293a]' : 'hover:bg-[#23293a]'} ${collapsed ? 'justify-center' : ''}`}
            >
              <img src="/images/AIChatbotAssistan.png" alt="AIChatbotAssistan" className="w-6 h-6 mr-0" />
              {!collapsed && <span className="ml-3 text-white">AI Assistant</span>}
            </Link>
          </li>
                    <li>
            <Link
              to="/MLanalytics"
              className={`flex items-center p-2 rounded-lg ${isActive('/MLanalytics') ? 'bg-[#23293a]' : 'hover:bg-[#23293a]'} ${collapsed ? 'justify-center' : ''}`}
            >
              <img src="/images/analysis.png" alt="MLanalytics" className="w-6 h-6 mr-0" />
              {!collapsed && <span className="ml-3 text-white">ML Analytics</span>}
            </Link>
          </li>
          <li>
            <Link
              to="/settings"
              className={`flex items-center p-2 rounded-lg ${isActive('/settings') ? 'bg-[#23293a]' : 'hover:bg-[#23293a]'} ${collapsed ? 'justify-center' : ''}`}
            >
              <img src="/images/setting_icon.png" alt="Settings" className="w-6 h-6 mr-0" />
              {!collapsed && <span className="ml-3 text-white">Settings</span>}
            </Link>
          </li>
          <li>
            <Link
              to="/contactus"
              className={`flex items-center p-2 rounded-lg ${isActive('/contactus') ? 'bg-[#23293a]' : 'hover:bg-[#23293a]'} ${collapsed ? 'justify-center' : ''}`}
            >
              <img src="/images/contact_icon.png" alt="Contact Us" className="w-6 h-6 mr-0" />
              {!collapsed && <span className="ml-3 text-white">Contact Us</span>}
            </Link>
          </li>
        </ul>
      </nav>
      {/* Logout Button at the Bottom */}
      <div className="p-2 mb-4">
        <button
          onClick={handleLogout}
          className={`flex items-center w-full p-2 rounded-lg hover:bg-[#23293a] transition-colors font-medium ${collapsed ? 'justify-center' : ''}`}
        >
          <img src="/images/logout.png" alt="Logout" className="w-6 h-6 mr-0" />
          {!collapsed && <span className="ml-3 text-white">Logout</span>}
        </button>
      </div>
      {/* Confirmation Dialog */}
      {showLogoutConfirm &&
        createPortal(
          <div
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60"
            style={{ zIndex: 9999 }}
          >
            <div
              style={{
                background: '#232323',
                color: '#fff',
                borderRadius: '10px',
                padding: '32px 24px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
                minWidth: '320px',
                maxWidth: '90vw',
                textAlign: 'center',
                position: 'relative',
                zIndex: 10000,
              }}
            >
              <p style={{ fontSize: '1.5rem', marginBottom: '24px' }}>Are you sure you want to logout?</p>
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                <button
                  onClick={confirmLogout}
                  style={{
                    padding: '12px 28px',
                    background: '#e53935',
                    color: '#fff',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Logout
                </button>
                <button
                  onClick={cancelLogout}
                  style={{
                    padding: '12px 28px',
                    background: '#444',
                    color: '#fff',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      }
    </aside>
  );
};

export default Sidebar; 
