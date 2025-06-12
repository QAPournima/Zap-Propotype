import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import HelpModal from './HelpModal';
import ScrollingMessage from './ScrollingMessage';

export default function TopNavBar() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'New test run completed successfully.' },
    { id: 2, text: 'Bug created: Login page error.' },
    { id: 3, text: 'Sprint review meeting at 3 PM.' },
  ]);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSent, setInviteSent] = useState(false);
  const [showPlans, setShowPlans] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const notifRef = useRef();
  const profileRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    if (!showNotifications) return;
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  useEffect(() => {
    if (!showProfileMenu) return;
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfileMenu]);

  const handleClearNotifications = () => setNotifications([]);
  const handleSendInvite = (e) => {
    e.preventDefault();
    setInviteSent(true);
    setTimeout(() => {
      setShowInvite(false);
      setInviteSent(false);
      setInviteEmail('');
    }, 1200);
  };

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-[100]">
        <ScrollingMessage />
      </div>
      <nav className="fixed top-10 left-0 right-0 bg-[#1A1E1D] text-white flex items-center justify-between px-6 h-14 shadow z-50">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold tracking-wide">Zap⚡️</h1>
          <div className="hidden md:flex gap-8 ml-8 items-center">
            <Link to="/zap-ai-features" className="hover:text-blue-300">Zap AI Features</Link>
            <Link to="/my-sprint" className="hover:text-blue-300">My Sprint</Link>
            <Link to="/live-test" className="hover:text-blue-300">Live Test</Link>
            <Link to="/AutomationTest" className="hover:text-blue-300">Automated Test</Link>
          </div>
        </div>
        <div className="flex items-center gap-4 relative">
          <div className="relative" ref={notifRef}>
            <button onClick={() => setShowNotifications((v) => !v)} className="relative focus:outline-none">
              <span role="img" aria-label="notifications">🔔</span>
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs px-1">{notifications.length}</span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 rounded shadow-lg z-50 border border-neutral-700 bg-[#23293a] text-white" style={{ minWidth: '18rem' }}>
                <div className="p-3 border-b border-neutral-700 font-bold flex items-center justify-between bg-[#23293a]">
                  <span>Notifications</span>
                  <button
                    className="text-xs text-blue-400 hover:underline px-2 py-1 rounded disabled:text-neutral-500"
                    onClick={handleClearNotifications}
                    disabled={notifications.length === 0}
                  >
                    Clear All
                  </button>
                </div>
                <ul className="max-h-60 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <li className="px-4 py-6 text-center text-neutral-400 text-sm bg-[#23293a]">No notifications</li>
                  ) : (
                    notifications.map(n => (
                      <li key={n.id} className="px-4 py-2 border-b border-neutral-700 last:border-b-0 hover:bg-[#31384a] text-sm transition-colors">
                        {n.text}
                      </li>
                    ))
                  )}
                </ul>
                <button className="w-full text-center py-2 text-blue-400 hover:underline bg-[#23293a] rounded-b border-t border-neutral-700" onClick={() => setShowNotifications(false)}>
                  Close
                </button>
              </div>
            )}
          </div>
          <button className="hover:text-blue-300" onClick={() => setShowInvite(true)}>Invite team</button>
          <button className="hover:text-blue-300" onClick={() => setShowPlans(true)}>Plans & Pricing</button>
          <button className="hover:text-blue-300" title="Help" onClick={() => setShowHelp(true)}><span role="img" aria-label="help">❓</span></button>
          <div className="relative" ref={profileRef}>
            <button className="hover:text-blue-300" title="Account" onClick={() => navigate('/settings')}><span role="img" aria-label="user">👤</span></button>
          </div>
          <button className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600" onClick={() => setShowPlans(true)}>Buy a plan</button>
        </div>
        {/* Invite Team Popup */}
        {showInvite && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
            <div className="bg-[#23293a] text-white rounded-xl shadow-lg p-8 w-full max-w-md border border-neutral-700">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Invite Team Member</h2>
                <button className="text-gray-400 hover:text-gray-200 text-2xl" onClick={() => setShowInvite(false)}>&times;</button>
              </div>
              {inviteSent ? (
                <div className="text-green-400 text-center py-8">Invitation sent!</div>
              ) : (
                <form onSubmit={handleSendInvite} className="space-y-4">
                  <label className="block font-medium">Email Address</label>
                  <input
                    type="email"
                    className="w-full border rounded px-3 py-2 bg-[#181c23] text-white border-neutral-700 placeholder-gray-400"
                    placeholder="team@email.com"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    required
                  />
                  <div className="flex gap-2 justify-end mt-4">
                    <button type="button" className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700" onClick={() => setShowInvite(false)}>Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Send</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
        {/* Plans & Pricing Popup */}
        {showPlans && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
            <div className="bg-[#23293a] text-white rounded-xl shadow-lg p-8 w-full max-w-sm border border-neutral-700 flex flex-col items-center">
              <h2 className="text-xl font-bold mb-4">Plans & Pricing</h2>
              <img
                src="/images/coming-soon.gif"
                alt="Coming soon"
                className="mb-4 rounded"
                style={{ width: '120px', height: '120px', objectFit: 'cover' }}
              />
              <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" onClick={() => setShowPlans(false)}>Close</button>
            </div>
          </div>
        )}
        <HelpModal open={showHelp} onClose={() => setShowHelp(false)} />
      </nav>
    </>
  );
} 
