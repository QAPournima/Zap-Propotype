import React, { useState, useRef, useEffect } from 'react';

// --- Begin Grouped Zap AI Features data ---
const PRODUCT_CATEGORIES = [
  {
    key: 'ai',
    label: 'AI+ Features',
    groups: [
      {
        icon: '🔍',
        title: 'AI for Engineering Intelligence',
        features: [
          {
            label: 'Auto-debug suggestions from logs',
            desc: 'Saves developer time by identifying issues automatically',
            icon: '🔍',
          },
          {
            label: 'Test Coverage AI Radar',
            desc: 'Detects test gaps via intelligent repo analysis',
            icon: '📈',
          },
        ],
      },
      {
        icon: '📊',
        title: 'AI for Product & Sprint Insights',
        features: [
          {
            label: 'Sprint AI Assistant',
            desc: 'Summarizes sprint status, blockers, test health for PMs',
            icon: '📊',
          },
          {
            label: 'Daily AI Summary Email',
            desc: 'Automated recap of team activity via email',
            icon: '📧',
          },
        ],
      },
      {
        icon: '🤖',
        title: 'AI-Powered Automation',
        features: [
          {
            label: 'Slack AI Bot',
            desc: 'Creates bugs and tests from Slack messages for seamless workflow',
            icon: '🤖',
          },
        ],
      },
    ],
  },
  {
    key: 'productivity',
    label: 'Productivity & Collaboration Tools',
    groups: [
      {
        icon: '📈',
        title: 'Team Visibility & Analytics',
        features: [
          {
            label: 'Team Insights Dashboard',
            desc: 'Tracks bug trends, fix velocity, and contributor stats',
            icon: '👥',
          },
          {
            label: 'Gamification',
            desc: 'Motivates users through badges and streaks',
            icon: '🏆',
          },
        ],
      },
      {
        icon: '🔄',
        title: 'Collaboration & Communication',
        features: [
          {
            label: 'Real-Time Collaboration',
            desc: 'Live-editing of test plans and configs',
            icon: '🔄',
          },
          {
            label: 'Confluence/Notion Sync',
            desc: 'Automatically pushes test reports into documentation',
            icon: '📝',
          },
        ],
      },
      {
        icon: '🛠️',
        title: 'Developer Experience & Integrations',
        features: [
          {
            label: 'VS Code Plugin',
            desc: 'Brings core features into the IDE',
            icon: '💻',
          },
          {
            label: 'Slack AI Bot',
            desc: 'Also enhances developer accessibility',
            icon: '🤖',
          },
        ],
      },
      {
        icon: '🔐',
        title: 'Access & Security',
        features: [
          {
            label: 'Advanced RBAC',
            desc: 'Granular permissions tailored to team roles',
            icon: '🔐',
          },
        ],
      },
    ],
  },
];

const categories = PRODUCT_CATEGORIES.map(c => c.label);

export default function ProductList({ open, onClose }) {
  const ref = useRef();
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);
  const selectedCatObj = PRODUCT_CATEGORIES.find(c => c.label === selectedCategory);

  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        onClose && onClose();
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) setSelectedCategory(categories[0]);
  }, [open]);

  if (!open) return null;

  return (
    <div ref={ref} className="absolute left-0 mt-2 bg-white shadow-2xl rounded-2xl border border-gray-200 z-50 min-w-[900px] max-w-5xl p-0 flex text-gray-900 animate-fade-in">
      {/* Left Category Menu */}
      <div className="w-56 border-r bg-gray-50 rounded-l-2xl flex flex-col py-6 px-4">
        {PRODUCT_CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            className={`text-left w-full mb-2 px-3 py-3 rounded-lg font-semibold text-lg transition-colors ${selectedCategory === cat.label ? 'bg-white text-blue-600 shadow border-l-4 border-blue-500' : 'text-gray-700 hover:bg-gray-100'}`}
            onClick={() => setSelectedCategory(cat.label)}
          >
            <div className={selectedCategory === cat.label ? 'text-blue-600 font-bold' : 'font-semibold'}>{cat.label}</div>
          </button>
        ))}
      </div>
      {/* Right Product Menu */}
      <div className="flex-1 flex flex-col gap-8 p-8 overflow-y-auto max-h-[80vh]">
        {selectedCatObj.groups.map((group) => (
          <div key={group.title} className="mb-2">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{group.icon}</span>
              <span className="text-base font-bold text-blue-600 uppercase tracking-wider">{group.title}</span>
            </div>
            <ul className="space-y-4">
              {group.features.map((item) => (
                <li key={item.label} className="group cursor-pointer flex items-start gap-3">
                  <span className="text-2xl mt-1">{item.icon}</span>
                  <div>
                    <div className="text-base font-semibold group-hover:text-blue-600 transition">{item.label}</div>
                    <div className="text-xs text-gray-500 group-hover:text-gray-700 transition">{item.desc}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
} 