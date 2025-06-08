import React from 'react';

export default function HelpModal({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-[#23293a] text-white rounded-xl shadow-lg p-8 w-full max-w-2xl border border-neutral-700 relative">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-200 text-2xl"
          onClick={onClose}
        >
          &times;
        </button>
        <h1 className="text-2xl font-bold mb-4 text-blue-300">Zap⚡️ Help & Getting Started - Demo data</h1>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-blue-200 mb-2">What is Zap⚡️?</h2>
          <p>Zap⚡️ is a tool for managing and running automated and manual tests, tracking sprints, and collaborating with your team.</p>
        </div>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-blue-200 mb-2">Basic Usage</h2>
          <ol className="list-decimal ml-6 space-y-2">
            <li><b>Login:</b> Enter any email and password to access the dashboard (no validation in prototype).</li>
            <li><b>Dashboard:</b> View your assigned tasks, code coverage, and quick actions.</li>
            <li><b>Automated Test:</b>
              <ul className="list-disc ml-6">
                <li>View, run, and manage your automated test cases.</li>
                <li>Click <b>Run</b> to execute a test and view the HTML report.</li>
              </ul>
            </li>
            <li><b>Manual Test:</b> Record and save manual test steps for future automation.</li>
            <li><b>Notifications:</b> Click the <span role="img" aria-label="bell">🔔</span> bell icon to view recent activity and alerts.</li>
            <li><b>Invite Team:</b> Use the <b>Invite team</b> button in the top bar to send an invite to a teammate (demo only).</li>
            <li><b>Plans & Pricing / Buy a plan:</b> These features are coming soon!</li>
          </ol>
        </div>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-blue-200 mb-2">Tips</h2>
          <ul className="list-disc ml-6 space-y-1">
            <li>Click your profile icon <span role="img" aria-label="user">👤</span> for profile settings options.</li>
            <li>Use the sidebar to navigate between Dashboard, Activity Logs, AI Assistant, and Settings.</li>
            <li>Dark mode is enabled by default for a comfortable viewing experience.</li>
          </ul>
        </div>
        <div>
          <h2 className="text-xl font-bold text-blue-200 mb-2">Need More Help?</h2>
          <p>This is a prototype. For more information or feedback, contact Pournima Tele.</p>
        </div>
      </div>
    </div>
  );
} 