import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Tooltip } from 'react-tooltip';

const Spinner = () => (
  <svg className="animate-spin h-5 w-5 text-white inline-block ml-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
  </svg>
);

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [userRole, setUserRole] = useState('developer'); // In a real app, this would come from auth context
  const [modal, setModal] = useState({ type: null, data: null });
  const [aiIndex, setAiIndex] = useState(0);
  const [activityIndex, setActivityIndex] = useState(0);
  const [reviewIndex, setReviewIndex] = useState(0);
  const CARD_PAGE_SIZE = 3;
  const [taskForm, setTaskForm] = useState({ issueId: '', summary: '', detail: '' });
  const [storyForm, setStoryForm] = useState({ issueId: '', summary: '', detail: '' });
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bugForm, setBugForm] = useState({ issueId: '', summary: '', detail: '' });

  useEffect(() => {
    axios.get('/dashboard.json')
      .then(res => {
        setDashboardData(res.data);
        setError(null);
      })
      .catch(() => {
        setError('Failed to load dashboard data');
        setDashboardData(null);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded dark:bg-red-900 dark:border-red-700 dark:text-red-200">
          {error}
        </div>
      </div>
    );
  }

  const { aiSuggestions, recentActivity, pendingReviews, quickStats, roleBasedStats } = dashboardData;
  const roleStats = roleBasedStats[userRole];

  // Role-based quick actions and stats
  const quickActionsByRole = {
    developer: [
      { icon: '🔀', label: 'Create Pull Request' },
      { icon: '🧪', label: 'Generate Unit Test' },
      { icon: '📊', label: 'View Code Coverage' },
      { icon: '🤖', label: 'Ask Zap AI for code help' },
      { icon: '📝', label: 'Create Task' },
    ],
    qa: [
      { icon: '🧪', label: 'Generate Test Case' },
      { icon: '🐞', label: 'Log Bug' },
      { icon: '⚙️', label: 'Start Automation Run' },
      { icon: '☑️', label: 'Manual Test Checklist' },
      { icon: '🤖', label: 'Ask Zap AI for test ideas' },
    ],
    pm: [
      { icon: '📊', label: 'Summarize Sprint' },
      { icon: '📝', label: 'Assign Task' },
      { icon: '📈', label: 'Generate Report' },
      { icon: '🤖', label: 'Ask Zap AI for project insights' },
      { icon: '📚', label: 'Create User Story' },
    ],
  };

  const statsByRole = {
    developer: [
      { label: 'Assigned Tasks', value: roleStats?.assignedTasks, icon: '🗂️', color: 'bg-blue-100 text-blue-600' },
      { label: 'Completed Tasks', value: roleStats?.completedTasks, icon: '✅', color: 'bg-green-100 text-green-600' },
      { label: 'Code Coverage', value: roleStats?.codeCoverage + '%', icon: '📊', color: 'bg-purple-100 text-purple-600' },
      { label: 'Open PRs', value: roleStats?.openPRs, icon: '🔀', color: 'bg-yellow-100 text-yellow-600' },
      { label: 'Code Reviews', value: roleStats?.codeReviews, icon: '📝', color: 'bg-pink-100 text-pink-600' },
    ],
    qa: [
      { label: 'Assigned Tasks', value: roleStats?.assignedTasks, icon: '🗂️', color: 'bg-blue-100 text-blue-600' },
      { label: 'Test Cases Created', value: roleStats?.testCasesCreated, icon: '🧪', color: 'bg-blue-100 text-blue-600' },
      { label: 'Bugs Reported', value: roleStats?.bugsReported, icon: '🐞', color: 'bg-red-100 text-red-600' },
      { label: 'Test Coverage', value: roleStats?.testCoverage + '%', icon: '📊', color: 'bg-green-100 text-green-600' },
      { label: 'Automation Scripts', value: roleStats?.automationScripts, icon: '⚙️', color: 'bg-yellow-100 text-yellow-600' },
      { label: 'Failed Tests', value: roleStats?.failedTests, icon: '❌', color: 'bg-pink-100 text-pink-600' },
    ],
    pm: [
      { label: 'Assigned Tasks', value: roleStats?.assignedTasks, icon: '🗂️', color: 'bg-blue-100 text-blue-600' },
      { label: 'Active Sprints', value: roleStats?.activeSprints, icon: '🏃', color: 'bg-blue-100 text-blue-600' },
      { label: 'Completed Sprints', value: roleStats?.completedSprints, icon: '✅', color: 'bg-green-100 text-green-600' },
      { label: 'Team Velocity', value: roleStats?.teamVelocity, icon: '🚀', color: 'bg-purple-100 text-purple-600' },
      { label: 'Risk Items', value: roleStats?.riskItems, icon: '⚠️', color: 'bg-yellow-100 text-yellow-600' },
      { label: 'Blockers', value: roleStats?.blockers, icon: '⛔', color: 'bg-red-100 text-red-600' },
    ],
  };

  // For 'All' role: aggregate stats and show only important cards
  let allAssignedTasks = 0, allCompletedTasks = 0, allCodeCoverage = 0, codeCoverageCount = 0;
  Object.values(roleBasedStats).forEach(stats => {
    if (typeof stats.assignedTasks === 'number') allAssignedTasks += stats.assignedTasks;
    if (typeof stats.completedTasks === 'number') allCompletedTasks += stats.completedTasks;
    if (typeof stats.codeCoverage === 'number') { allCodeCoverage += stats.codeCoverage; codeCoverageCount++; }
  });
  const avgCodeCoverage = codeCoverageCount ? Math.round(allCodeCoverage / codeCoverageCount) : 'N/A';

  const allSummaryStats = [
    {
      label: 'Assigned Tasks',
      value: allAssignedTasks,
      icon: '🗂️',
      color: 'bg-blue-100 text-blue-600',
      onClick: () => setModal({ type: 'breakdown', data: { stat: 'Assigned Tasks', values: Object.entries(roleBasedStats).map(([role, stats]) => ({ role, value: stats.assignedTasks })) } })
    },
    {
      label: 'Completed Tasks',
      value: allCompletedTasks,
      icon: '✅',
      color: 'bg-green-100 text-green-600',
      onClick: () => setModal({ type: 'breakdown', data: { stat: 'Completed Tasks', values: Object.entries(roleBasedStats).map(([role, stats]) => ({ role, value: stats.completedTasks })) } })
    },
    {
      label: 'Code Coverage',
      value: avgCodeCoverage + '%',
      icon: '📊',
      color: 'bg-purple-100 text-purple-600',
      onClick: () => setModal({ type: 'breakdown', data: { stat: 'Code Coverage', values: Object.entries(roleBasedStats).map(([role, stats]) => ({ role, value: stats.codeCoverage + '%' })) } })
    }
  ];

  const allQuickActions = [
    { icon: '🤖', label: 'Ask Zap AI Help' },
    { icon: '📊', label: 'View Code Coverage' },
  ];

  // Handle Quick Action click
  const handleQuickAction = (label) => {
    if (label === 'Create Task') setModal({ type: 'createTask' });
    else if (label === 'Create User Story') setModal({ type: 'createStory' });
    else if (label === 'Log Bug') setModal({ type: 'createBug' });
    // ... existing modal logic ...
  };

  // Mock submit handlers
  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormSuccess('');
    setFormError('');
    try {
      const response = await axios.post('/api/ai/task', {
        issueId: taskForm.issueId,
        summary: taskForm.summary,
        detail: taskForm.detail
      });
      setFormSuccess(`Task ${response.data.key} created successfully!`);
      setTaskForm({ issueId: '', summary: '', detail: '' });
      axios.get('/dashboard.json')
        .then(res => {
          setDashboardData(res.data);
          setError(null);
        })
        .catch(() => {
          setError('Failed to load dashboard data');
          setDashboardData(null);
        });
    } catch (err) {
      console.error('AI/Jira error:', err.response?.data?.error || err.message);
      if (err.response?.data?.error && err.response.data.error.includes('Incorrect API key')) {
        setFormError('Failed to generate task with AI. Please check your OpenAI API key in settings.');
      } else if (err.response?.status === 401) {
        setFormError('Authentication failed. Please check your API keys.');
      } else {
        setFormError('Failed to create task. Please try again or contact support.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleStorySubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormSuccess('');
    setFormError('');
    try {
      const response = await axios.post('/api/ai/story', {
        issueId: storyForm.issueId,
        summary: storyForm.summary,
        detail: storyForm.detail
      });
      setFormSuccess(`User Story ${response.data.key} created successfully!`);
      setStoryForm({ issueId: '', summary: '', detail: '' });
      axios.get('/dashboard.json')
        .then(res => {
          setDashboardData(res.data);
          setError(null);
        })
        .catch(() => {
          setError('Failed to load dashboard data');
          setDashboardData(null);
        });
    } catch (err) {
      console.error('AI/Jira error:', err.response?.data?.error || err.message);
      if (err.response?.data?.error && err.response.data.error.includes('Incorrect API key')) {
        setFormError('Failed to generate user story with AI. Please check your OpenAI API key in settings.');
      } else if (err.response?.status === 401) {
        setFormError('Authentication failed. Please check your API keys.');
      } else {
        setFormError('Failed to create user story. Please try again or contact support.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleBugSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormSuccess('');
    setFormError('');
    try {
      const response = await axios.post('/api/ai/bug', {
        issueId: bugForm.issueId,
        summary: bugForm.summary,
        detail: bugForm.detail
      });
      setFormSuccess(`Bug ${response.data.key} created successfully!`);
      setBugForm({ issueId: '', summary: '', detail: '' });
      axios.get('/dashboard.json')
        .then(res => {
          setDashboardData(res.data);
          setError(null);
        })
        .catch(() => {
          setError('Failed to load dashboard data');
          setDashboardData(null);
        });
    } catch (err) {
      console.error('AI/Jira error:', err.response?.data?.error || err.message);
      if (err.response?.data?.error && err.response.data.error.includes('Incorrect API key')) {
        setFormError('Failed to generate bug with AI. Please check your OpenAI API key in settings.');
      } else if (err.response?.status === 401) {
        setFormError('Authentication failed. Please check your API keys.');
      } else {
        setFormError('Failed to create bug. Please try again or contact support.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 dark:text-gray-100">
      <main className="p-6">
        {/* Role Switcher - now more visible */}
        <div className="flex items-center justify-center mb-8 gap-3">
          <span className="text-2xl text-purple-600">👤</span>
          <label htmlFor="role-switcher" className="font-bold text-lg text-gray-800 dark:text-gray-100">Select Role:</label>
          <select
            id="role-switcher"
            value={userRole}
            onChange={e => setUserRole(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400 shadow bg-white text-gray-900 dark:bg-neutral-800 dark:text-gray-100 dark:border-neutral-700"
            style={{ minWidth: 140 }}
          >
            <option value="all">All</option>
            <option value="developer">Developer</option>
            <option value="qa">QA</option>
            <option value="pm">PM</option>
          </select>
        </div>

        {/* Smart Widgets Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* AI Suggestions Widget */}
          <div className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 dark:to-neutral-900 rounded-2xl shadow-2xl p-6 flex flex-col relative transition-transform duration-200 hover:-translate-y-1 hover:shadow-3xl" style={{ minHeight: 220 }}>
            <div className="flex items-center mb-2">
              <span className="text-2xl mr-2">🤖</span>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">AI Suggestions</h2>
              <div className="ml-auto flex gap-2">
                <button
                  className="rounded-full bg-white shadow px-2 py-1 text-lg hover:bg-blue-100 dark:bg-neutral-800 dark:text-gray-100 dark:hover:bg-blue-900 disabled:opacity-40"
                  onClick={() => setAiIndex(Math.max(0, aiIndex - 1))}
                  disabled={aiIndex === 0}
                  aria-label="Previous"
                >&lt;</button>
                <button
                  className="rounded-full bg-white shadow px-2 py-1 text-lg hover:bg-blue-100 dark:bg-neutral-800 dark:text-gray-100 dark:hover:bg-blue-900 disabled:opacity-40"
                  onClick={() => setAiIndex(Math.min(aiSuggestions.length - CARD_PAGE_SIZE, aiIndex + 1))}
                  disabled={aiIndex >= aiSuggestions.length - CARD_PAGE_SIZE}
                  aria-label="Next"
                >&gt;</button>
              </div>
            </div>
            <ul className="text-gray-700 dark:text-gray-200 text-sm space-y-2">
              {aiSuggestions.slice(aiIndex, aiIndex + CARD_PAGE_SIZE).map((suggestion) => (
                <li
                  key={suggestion.id}
                  className="flex items-start gap-2 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900 rounded px-2 py-1 transition"
                  onClick={() => setModal({ type: 'ai', data: suggestion })}
                  data-tip="Click for details"
                >
                  <span className={`px-2 py-1 rounded text-xs ${
                    suggestion.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                    suggestion.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  }`}>
                    {suggestion.priority}
                  </span>
                  <span>{suggestion.title}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Recent Activity Widget */}
          <div className="bg-gradient-to-br from-green-50 to-white dark:from-green-950 dark:to-neutral-900 rounded-2xl shadow-2xl p-6 flex flex-col relative transition-transform duration-200 hover:-translate-y-1 hover:shadow-3xl" style={{ minHeight: 220 }}>
            <div className="flex items-center mb-2">
              <span className="text-2xl mr-2">🕒</span>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Activity</h2>
              <div className="ml-auto flex gap-2">
                <button
                  className="rounded-full bg-white shadow px-2 py-1 text-lg hover:bg-green-100 dark:bg-neutral-800 dark:text-gray-100 dark:hover:bg-green-900 disabled:opacity-40"
                  onClick={() => setActivityIndex(Math.max(0, activityIndex - 1))}
                  disabled={activityIndex === 0}
                  aria-label="Previous"
                >&lt;</button>
                <button
                  className="rounded-full bg-white shadow px-2 py-1 text-lg hover:bg-green-100 dark:bg-neutral-800 dark:text-gray-100 dark:hover:bg-green-900 disabled:opacity-40"
                  onClick={() => setActivityIndex(Math.min(recentActivity.length - CARD_PAGE_SIZE, activityIndex + 1))}
                  disabled={activityIndex >= recentActivity.length - CARD_PAGE_SIZE}
                  aria-label="Next"
                >&gt;</button>
              </div>
            </div>
            <ul className="text-gray-700 dark:text-gray-200 text-sm space-y-2">
              {recentActivity.slice(activityIndex, activityIndex + CARD_PAGE_SIZE).map((activity) => (
                <li
                  key={activity.id}
                  className="flex items-start gap-2 cursor-pointer hover:bg-green-100 dark:hover:bg-green-900 rounded px-2 py-1 transition"
                  onClick={() => setModal({ type: 'activity', data: activity })}
                  data-tip="Click for details"
                >
                  <span className={`px-2 py-1 rounded text-xs ${
                    activity.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    activity.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                    'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  }`}>
                    {activity.status}
                  </span>
                  <div>
                    <div>{activity.title}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{activity.user}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Pending Reviews Widget */}
          <div className="bg-gradient-to-br from-yellow-50 to-white dark:from-yellow-950 dark:to-neutral-900 rounded-2xl shadow-2xl p-6 flex flex-col relative transition-transform duration-200 hover:-translate-y-1 hover:shadow-3xl" style={{ minHeight: 220 }}>
            <div className="flex items-center mb-2">
              <span className="text-2xl mr-2">⏳</span>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Pending Reviews</h2>
              <div className="ml-auto flex gap-2">
                <button
                  className="rounded-full bg-white shadow px-2 py-1 text-lg hover:bg-yellow-100 dark:bg-neutral-800 dark:text-gray-100 dark:hover:bg-yellow-900 disabled:opacity-40"
                  onClick={() => setReviewIndex(Math.max(0, reviewIndex - 1))}
                  disabled={reviewIndex === 0}
                  aria-label="Previous"
                >&lt;</button>
                <button
                  className="rounded-full bg-white shadow px-2 py-1 text-lg hover:bg-yellow-100 dark:bg-neutral-800 dark:text-gray-100 dark:hover:bg-yellow-900 disabled:opacity-40"
                  onClick={() => setReviewIndex(Math.min(pendingReviews.length - CARD_PAGE_SIZE, reviewIndex + 1))}
                  disabled={reviewIndex >= pendingReviews.length - CARD_PAGE_SIZE}
                  aria-label="Next"
                >&gt;</button>
              </div>
            </div>
            <ul className="text-gray-700 dark:text-gray-200 text-sm space-y-2">
              {pendingReviews.slice(reviewIndex, reviewIndex + CARD_PAGE_SIZE).map((review) => (
                <li
                  key={review.id}
                  className="flex items-start gap-2 cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-900 rounded px-2 py-1 transition"
                  onClick={() => setModal({ type: 'review', data: review })}
                  data-tip="Click for details"
                >
                  <span className="px-2 py-1 rounded text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                    {review.type}
                  </span>
                  <div>
                    <div>{review.title}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Assigned to: {review.assignedTo}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Quick Stats Grid - role-based */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {(userRole === 'all' ? allSummaryStats : statsByRole[userRole]).map((stat, idx) => (
            <div
              key={stat.label}
              className={`bg-white dark:bg-neutral-800 rounded-xl shadow-sm p-6 flex items-center ${stat.color} cursor-pointer hover:shadow-lg transition`}
              onClick={stat.onClick}
            >
              <div className={`p-3 rounded-full ${stat.color} text-2xl`}>{stat.icon}</div>
              <div className="ml-4">
                <h2 className="text-sm font-medium text-gray-600 dark:text-gray-300">{stat.label}</h2>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions - role-based */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {(userRole === 'all' ? allQuickActions : quickActionsByRole[userRole]).map((action, idx) => (
              <button
                key={action.label}
                className="flex flex-col items-center justify-center space-y-2 bg-white dark:bg-neutral-800 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow text-lg font-medium"
                data-tip={action.label}
                onClick={() => handleQuickAction(action.label)}
              >
                <span className="text-3xl">{action.icon}</span>
                <span className="text-gray-900 dark:text-gray-100 font-medium">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </main>
      <Tooltip effect="solid" />
      {/* Modal for details */}
      {modal.type && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-lg p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {modal.type === 'ai' && 'AI Suggestion Details'}
                {modal.type === 'activity' && 'Activity Details'}
                {modal.type === 'review' && 'Pending Review Details'}
              </h2>
              <button className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl" onClick={() => setModal({ type: null, data: null })}>&times;</button>
            </div>
            <div className="space-y-2">
              {modal.type === 'ai' && (
                <>
                  <div><b>Title:</b> {modal.data.title}</div>
                  <div><b>Type:</b> {modal.data.type}</div>
                  <div><b>Priority:</b> {modal.data.priority}</div>
                  <div><b>Confidence:</b> {modal.data.confidence}</div>
                </>
              )}
              {modal.type === 'activity' && (
                <>
                  <div><b>Title:</b> {modal.data.title}</div>
                  <div><b>Status:</b> {modal.data.status}</div>
                  <div><b>User:</b> {modal.data.user}</div>
                  <div><b>Timestamp:</b> {new Date(modal.data.timestamp).toLocaleString()}</div>
                </>
              )}
              {modal.type === 'review' && (
                <>
                  <div><b>Title:</b> {modal.data.title}</div>
                  <div><b>Type:</b> {modal.data.type}</div>
                  <div><b>Assigned To:</b> {modal.data.assignedTo}</div>
                  <div><b>Status:</b> {modal.data.status}</div>
                  <div><b>Timestamp:</b> {new Date(modal.data.timestamp).toLocaleString()}</div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Modal for breakdown by user/role */}
      {modal.type === 'breakdown' && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-lg p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{modal.data.stat} Breakdown</h2>
              <button className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl" onClick={() => setModal({ type: null, data: null })}>&times;</button>
            </div>
            <div className="space-y-2">
              {modal.data.values.map((item, idx) => (
                <div key={item.role} className="flex justify-between border-b py-1">
                  <span className="font-semibold capitalize">{item.role}</span>
                  <span>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* Modal for Create Task (Dev) */}
      {modal.type === 'createTask' && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-lg p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Create Task</h2>
              <button className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl" onClick={() => { setModal({ type: null }); setFormSuccess(''); setFormError(''); }}>&times;</button>
            </div>
            <form onSubmit={handleTaskSubmit} className="space-y-4">
              <div>
                <label className="block font-medium">Issue ID (optional, to link)</label>
                <input className="w-full border rounded px-3 py-2 bg-white text-gray-900 border-gray-300 placeholder-gray-400 dark:bg-neutral-800 dark:text-gray-100 dark:border-neutral-700 dark:placeholder-gray-400" value={taskForm.issueId} onChange={e => setTaskForm(f => ({ ...f, issueId: e.target.value }))} />
              </div>
              <div>
                <label className="block font-medium">Summary</label>
                <input className="w-full border rounded px-3 py-2 bg-white text-gray-900 border-gray-300 placeholder-gray-400 dark:bg-neutral-800 dark:text-gray-100 dark:border-neutral-700 dark:placeholder-gray-400" value={taskForm.summary} onChange={e => setTaskForm(f => ({ ...f, summary: e.target.value }))} required />
              </div>
              <div>
                <label className="block font-medium">Detail</label>
                <textarea className="w-full border rounded px-3 py-2 bg-white text-gray-900 border-gray-300 placeholder-gray-400 dark:bg-neutral-800 dark:text-gray-100 dark:border-neutral-700 dark:placeholder-gray-400" value={taskForm.detail} onChange={e => setTaskForm(f => ({ ...f, detail: e.target.value }))} required />
              </div>
              {formSuccess && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded dark:bg-green-900 dark:border-green-700 dark:text-green-200">{formSuccess}</div>}
              {formError && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded dark:bg-red-900 dark:border-red-700 dark:text-red-200">{formError}</div>}
              <div className="flex gap-4 justify-end mt-4">
                <button type="button" className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 dark:bg-neutral-700 dark:text-gray-200 dark:hover:bg-neutral-600" onClick={() => { setModal({ type: null }); setFormSuccess(''); setFormError(''); }}>Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded flex items-center justify-center hover:bg-blue-600 dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700" disabled={submitting}>
                  {submitting ? (<><span>Creating...</span><Spinner /></>) : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal for Create User Story (PM) */}
      {modal.type === 'createStory' && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-lg p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Create User Story (Jira)</h2>
              <button className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl" onClick={() => { setModal({ type: null }); setFormSuccess(''); setFormError(''); }}>&times;</button>
            </div>
            <form onSubmit={handleStorySubmit} className="space-y-4">
              <div>
                <label className="block font-medium">Issue ID (optional, to link)</label>
                <input className="w-full border rounded px-3 py-2 bg-white text-gray-900 border-gray-300 placeholder-gray-400 dark:bg-neutral-800 dark:text-gray-100 dark:border-neutral-700 dark:placeholder-gray-400" value={storyForm.issueId} onChange={e => setStoryForm(f => ({ ...f, issueId: e.target.value }))} />
              </div>
              <div>
                <label className="block font-medium">Summary</label>
                <input className="w-full border rounded px-3 py-2 bg-white text-gray-900 border-gray-300 placeholder-gray-400 dark:bg-neutral-800 dark:text-gray-100 dark:border-neutral-700 dark:placeholder-gray-400" value={storyForm.summary} onChange={e => setStoryForm(f => ({ ...f, summary: e.target.value }))} required />
              </div>
              <div>
                <label className="block font-medium">Detail</label>
                <textarea className="w-full border rounded px-3 py-2 bg-white text-gray-900 border-gray-300 placeholder-gray-400 dark:bg-neutral-800 dark:text-gray-100 dark:border-neutral-700 dark:placeholder-gray-400" value={storyForm.detail} onChange={e => setStoryForm(f => ({ ...f, detail: e.target.value }))} required />
              </div>
              {formSuccess && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded dark:bg-green-900 dark:border-green-700 dark:text-green-200">{formSuccess}</div>}
              {formError && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded dark:bg-red-900 dark:border-red-700 dark:text-red-200">{formError}</div>}
              <div className="flex gap-4 justify-end mt-4">
                <button type="button" className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 dark:bg-neutral-700 dark:text-gray-200 dark:hover:bg-neutral-600" onClick={() => { setModal({ type: null }); setFormSuccess(''); setFormError(''); }}>Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded flex items-center justify-center hover:bg-blue-600 dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700" disabled={submitting}>
                  {submitting ? (<><span>Creating...</span><Spinner /></>) : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal for Log Bug */}
      {modal.type === 'createBug' && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-lg p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Log Bug (Jira)</h2>
              <button className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl" onClick={() => { setModal({ type: null }); setFormSuccess(''); setFormError(''); }}>&times;</button>
            </div>
            <form onSubmit={handleBugSubmit} className="space-y-4">
              <div>
                <label className="block font-medium">Issue ID (optional, to link)</label>
                <input className="w-full border rounded px-3 py-2 bg-white text-gray-900 border-gray-300 placeholder-gray-400 dark:bg-neutral-800 dark:text-gray-100 dark:border-neutral-700 dark:placeholder-gray-400" value={bugForm.issueId} onChange={e => setBugForm(f => ({ ...f, issueId: e.target.value }))} />
              </div>
              <div>
                <label className="block font-medium">Summary</label>
                <input className="w-full border rounded px-3 py-2 bg-white text-gray-900 border-gray-300 placeholder-gray-400 dark:bg-neutral-800 dark:text-gray-100 dark:border-neutral-700 dark:placeholder-gray-400" value={bugForm.summary} onChange={e => setBugForm(f => ({ ...f, summary: e.target.value }))} required />
              </div>
              <div>
                <label className="block font-medium">Detail</label>
                <textarea className="w-full border rounded px-3 py-2 bg-white text-gray-900 border-gray-300 placeholder-gray-400 dark:bg-neutral-800 dark:text-gray-100 dark:border-neutral-700 dark:placeholder-gray-400" value={bugForm.detail} onChange={e => setBugForm(f => ({ ...f, detail: e.target.value }))} required />
              </div>
              {formSuccess && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded dark:bg-green-900 dark:border-green-700 dark:text-green-200">{formSuccess}</div>}
              {formError && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded dark:bg-red-900 dark:border-red-700 dark:text-red-200">{formError}</div>}
              <div className="flex gap-4 justify-end mt-4">
                <button type="button" className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 dark:bg-neutral-700 dark:text-gray-200 dark:hover:bg-neutral-600" onClick={() => { setModal({ type: null }); setFormSuccess(''); setFormError(''); }}>Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded flex items-center justify-center hover:bg-blue-600 dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700" disabled={submitting}>
                  {submitting ? (<><span>Creating...</span><Spinner /></>) : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 
