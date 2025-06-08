import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { label: 'Dashboard', icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M13 5v6h6" /></svg>
  ), link: '/' },
  { label: 'Activity Logs', icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-6a2 2 0 012-2h2a2 2 0 012 2v6m-6 0h6" /></svg>
  ), link: '/activitylogs' },
  { label: 'Settings', icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
  ), link: '/settings' },
];

function Layout({ children }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mainCollapsed, setMainCollapsed] = useState(false);
  const handleLogout = () => {
    // TODO: Add real logout logic here
    window.location.href = '/login';
  };
  return (
    <div className="flex min-h-screen h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`transition-all duration-300 z-20 ${sidebarOpen ? 'w-64' : 'w-28'} h-screen md:static md:h-screen relative bg-gradient-to-br from-gray-900 to-gray-800 shadow-2xl rounded-r-3xl flex flex-col items-center py-6`}>
        {/* Logo and Toggle Button Row */}
        <div className="flex flex-col w-full px-4 mb-8">
          <div className="flex items-center justify-between w-full">
            <div className={`transition-all duration-300 font-extrabold text-2xl text-white tracking-tight ${!sidebarOpen ? 'opacity-0 w-0' : 'opacity-100 w-auto'}`}>Zap⚡️</div>
            <button
              className="ml-auto bg-gray-800 border border-gray-700 rounded-full shadow p-2 hover:bg-gray-700 transition-colors"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
            >
              {sidebarOpen ? (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
              )}
            </button>
          </div>
          {/* Debug logout button at the top for testing */}
          <div className="w-full mt-4">
            <button
              style={{ background: 'red', color: 'white', width: '100%', padding: '12px', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px' }}
              onClick={handleLogout}
            >
              LOGOUT TEST
            </button>
          </div>
        </div>
        {/* Navigation */}
        <nav className="flex flex-col gap-4 w-full px-2 flex-1">
          {navItems.map((item) => {
            const active = location.pathname === item.link;
            return (
              <Link
                key={item.label}
                to={item.link}
                className={`flex items-center gap-4 py-2 px-2 rounded-full transition-all font-medium group ${active ? 'bg-gradient-to-r from-gray-700 to-gray-800 shadow-lg' : 'hover:bg-gray-700/60'} ${sidebarOpen ? 'justify-start' : 'justify-center'}`}
              >
                <span className={`flex items-center justify-center rounded-full ${active ? 'bg-white/20' : 'bg-gray-700/60'} w-12 h-12 transition-all`}>
                  {item.icon}
                </span>
                <span className={`text-lg text-white transition-all duration-200 ${sidebarOpen ? 'opacity-100 ml-2' : 'opacity-0 ml-0 w-0 overflow-hidden'}`}>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-gradient-to-br from-blue-50 to-white transition-all duration-300 relative">
        {!mainCollapsed && (
          <>
            <button
              className="absolute top-4 right-4 z-20 p-2 rounded hover:bg-gray-200"
              onClick={() => setMainCollapsed(true)}
              title="Collapse"
            >
              {/* Chevron Left icon */}
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            {children}
          </>
        )}
        {mainCollapsed && (
          <button
            className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 p-2 rounded bg-white shadow"
            onClick={() => setMainCollapsed(false)}
            title="Expand"
          >
            {/* Chevron Right icon */}
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
        )}
      </main>
    </div>
  );
}

export default Layout; 
