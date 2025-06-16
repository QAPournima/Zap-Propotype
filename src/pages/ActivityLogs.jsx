import React, { useState, useEffect, useRef } from 'react';
import { testCaseService } from '../services/api';

// Mock data for users and action types
const USERS = ['Alice', 'Bob', 'Charlie', 'QA Team', 'PM'];
const ACTION_TYPES = ['Created', 'Updated', 'Reviewed', 'Deleted'];
const STATUS_TYPES = ['new', 'in progress', 'done', 'cancel', 'failed'];

const ActivityLogs = ({ refreshKey, ...props }) => {
  const [testCases, setTestCases] = useState([]);
  const [mysprintActions, setMySprintActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userStory, setUserStory] = useState('');
  const [generating, setGenerating] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    testCase: true,
    bugs: true,
    userStory: true,
    automation: true,
    user: '',
    actionType: '',
    status: '',
    dateFrom: '',
    dateTo: '',
  });
  const filterRef = useRef();
  const [selected, setSelected] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 7;
  const [messages, setMessages] = useState([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdDate');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch('/activityLogs.json').then(res => res.json()).catch(() => []),
      fetch('/mysprint-actions.json').then(res => res.json()).catch(() => [])
    ])
      .then(([activityLogs, sprintActions]) => {
        setTestCases(Array.isArray(activityLogs) ? activityLogs : []);
        setMySprintActions(Array.isArray(sprintActions) ? sprintActions : []);
        setError(null);
      })
      .catch(err => {
        setError('Failed to fetch activity logs');
        setTestCases([]);
        setMySprintActions([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setFilterOpen(false);
      }
    }
    if (filterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [filterOpen]);

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenerateTestCase = async (e) => {
    e.preventDefault();
    if (!userStory.trim()) return;

    try {
      setGenerating(true);
      const response = await testCaseService.generate(userStory);
      setTestCases([...testCases, response.data]);
      setUserStory('');
      setError(null);
      const aiMsg = response.data.message;
      if (aiMsg && aiMsg.trim()) {
        setMessages(prev => [
          ...prev,
          {
            sender: 'ai',
            message: aiMsg,
            type: 'testCase'
          }
        ]);
      }
    } catch (err) {
      setError('Failed to generate test case');
      console.error('Error generating test case:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateAutomation = async (id) => {
    try {
      const response = await testCaseService.generateAutomation(id);
      setTestCases(testCases.map(tc => 
        tc.id === id ? { ...tc, automationScript: response.data } : tc
      ));
    } catch (err) {
      setError('Failed to generate automation script');
      console.error('Error generating automation script:', err);
    }
  };

  // Select all handler (for current page only)
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelected([
        ...new Set([
          ...selected,
          ...paginatedLogs.map(tc => tc.id)
        ])
      ]);
    } else {
      setSelected(selected.filter(id => !paginatedLogs.some(tc => tc.id === id)));
    }
  };

  // Select one handler
  const handleSelectOne = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  // Merge mysprintActions into logs for display
  const allLogs = [
    ...testCases,
    ...mysprintActions.map((a, i) => ({
      id: `ai-action-${i}`,
      title: `${a.action || a.issueType || 'AI Action'}${a.summary ? ': ' + a.summary : ''}`,
      description: a.jiraId ? `Jira ID: ${a.jiraId}` : '',
      "Request Type": a.issueType || 'AI Action',
      status: 'done',
      "Output Type": 'jira ticket',
      createdDate: a.timestamp ? a.timestamp.split('T')[0] : '',
      user: 'AI',
      actionType: a.action || 'Created'
    }) )
  ];

  // Filtering logic
  const filteredLogs = allLogs;

  // Sorting logic (apply after filtering, before pagination)
  const sortedLogs = [...filteredLogs].sort((a, b) => {
    let aVal = a[sortBy] || '';
    let bVal = b[sortBy] || '';
    if (sortBy === 'createdDate') {
      aVal = aVal ? new Date(aVal) : new Date(0);
      bVal = bVal ? new Date(bVal) : new Date(0);
    } else {
      aVal = aVal.toString().toLowerCase();
      bVal = bVal.toString().toLowerCase();
    }
    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedLogs.length / logsPerPage);
  const paginatedLogs = sortedLogs.slice((currentPage - 1) * logsPerPage, currentPage * logsPerPage);

  // Now you can use paginatedLogs in hooks
  useEffect(() => {
    setSelected((prev) => prev.filter(id => paginatedLogs.some(tc => tc.id === id)));
  }, [currentPage, paginatedLogs]);

  // Define handleBulkAction here
  const handleBulkAction = (action) => {
    // ... your logic ...
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-white text-gray-900 dark:bg-neutral-900 dark:text-gray-100">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4 mt-8 text-3xl">
        <h1 className="text-3xl font-bold">Activity Logs</h1>
        <div className="flex flex-col md:flex-row gap-2 md:gap-4 items-center">
          <input
            type="text"
            className="border rounded px-3 py-2 text-sm bg-white text-gray-900 border-gray-300 placeholder-gray-400 dark:bg-neutral-800 dark:text-gray-100 dark:border-neutral-700 dark:placeholder-gray-400"
            placeholder="Search logs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            className="border rounded px-2 py-2 text-sm bg-white text-gray-900 border-gray-300 dark:bg-neutral-800 dark:text-gray-100 dark:border-neutral-700"
            value={filters.user}
            onChange={e => handleFilterChange('user', e.target.value)}
          >
            <option value="">All Users</option>
            {USERS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          <select
            className="border rounded px-2 py-2 text-sm bg-white text-gray-900 border-gray-300 dark:bg-neutral-800 dark:text-gray-100 dark:border-neutral-700"
            value={filters.actionType}
            onChange={e => handleFilterChange('actionType', e.target.value)}
          >
            <option value="">All Actions</option>
            {ACTION_TYPES.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select
            className="border rounded px-2 py-2 text-sm bg-white text-gray-900 border-gray-300 dark:bg-neutral-800 dark:text-gray-100 dark:border-neutral-700"
            value={filters.status}
            onChange={e => handleFilterChange('status', e.target.value)}
          >
            <option value="">All Statuses</option>
            {STATUS_TYPES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          <input
            type="date"
            className="border rounded px-2 py-2 text-sm bg-white text-gray-900 border-gray-300 dark:bg-neutral-800 dark:text-gray-100 dark:border-neutral-700"
            value={filters.dateFrom}
            onChange={e => handleFilterChange('dateFrom', e.target.value)}
            placeholder="From"
          />
          <input
            type="date"
            className="border rounded px-2 py-2 text-sm bg-white text-gray-900 border-gray-300 dark:bg-neutral-800 dark:text-gray-100 dark:border-neutral-700"
            value={filters.dateTo}
            onChange={e => handleFilterChange('dateTo', e.target.value)}
            placeholder="To"
          />
        </div>
      </div>
      {/* Bulk Actions */}
      {selected.length > 0 && (
        <div className="flex items-center mb-2 gap-2">
          <span className="text-sm font-medium">Bulk Actions:</span>
          <button className="px-3 py-1 rounded bg-green-500 text-white text-sm font-semibold hover:bg-green-600" onClick={() => handleBulkAction('reviewed')}>Mark as Reviewed</button>
          <button className="px-3 py-1 rounded bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600" onClick={() => handleBulkAction('export')}>Export</button>
          <button className="px-3 py-1 rounded bg-red-500 text-white text-sm font-semibold hover:bg-red-600" onClick={() => handleBulkAction('delete')}>Delete</button>
        </div>
      )}
      {/* Select All and Delete Selected */}
      <div className="flex items-center mb-2">
        <input
          type="checkbox"
          className="mr-2"
          checked={paginatedLogs.length > 0 && paginatedLogs.every(tc => selected.includes(tc.id))}
          onChange={handleSelectAll}
        />
        <span className="text-sm font-medium">Select All</span>
      </div>
      <div className="bg-white rounded-lg shadow overflow-hidden dark:bg-neutral-800">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-neutral-700">
          <thead className="bg-gray-50 dark:bg-neutral-900">
            <tr>
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={paginatedLogs.length > 0 && paginatedLogs.every(tc => selected.includes(tc.id))}
                  onChange={handleSelectAll}
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                Title
              </th>
              <th
                className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider dark:text-gray-300 cursor-pointer select-none ${sortBy === 'Request Type' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500'}`}
                onClick={() => {
                  if (sortBy === 'Request Type') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  else { setSortBy('Request Type'); setSortOrder('desc'); }
                }}
              >
                Request Type <span>{sortBy === 'Request Type' ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}</span>
              </th>
              <th
                className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider dark:text-gray-300 cursor-pointer select-none ${sortBy === 'status' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500'}`}
                onClick={() => {
                  if (sortBy === 'status') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  else { setSortBy('status'); setSortOrder('desc'); }
                }}
              >
                Status <span>{sortBy === 'status' ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}</span>
              </th>
              <th
                className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider dark:text-gray-300 cursor-pointer select-none ${sortBy === 'createdDate' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500'}`}
                onClick={() => {
                  if (sortBy === 'createdDate') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  else { setSortBy('createdDate'); setSortOrder('desc'); }
                }}
              >
                Created Date <span>{sortBy === 'createdDate' ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}</span>
              </th>
              <th
                className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider dark:text-gray-300 cursor-pointer select-none ${sortBy === 'Output Type' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500'}`}
                onClick={() => {
                  if (sortBy === 'Output Type') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  else { setSortBy('Output Type'); setSortOrder('desc'); }
                }}
              >
                Output Type <span>{sortBy === 'Output Type' ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 dark:bg-neutral-800 dark:divide-neutral-700">
            {paginatedLogs.map(tc => (
              <tr key={tc.id} className="hover:bg-gray-50 dark:hover:bg-neutral-700">
                <td className="px-4 py-4">
                  <input
                    type="checkbox"
                    checked={selected.includes(tc.id)}
                    onChange={() => handleSelectOne(tc.id)}
                  />
                </td>
                <td className="px-6 py-4 whitespace-normal break-words max-w-xs">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer underline hover:text-blue-600 dark:hover:text-blue-300" title="Go to Test/Bug/User">
                    {tc.title || 'Test Case'}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {tc.description && tc.description.startsWith('Jira ID:') ? (
                      tc.description
                        .replace('Jira ID:', '')
                        .split(',')
                        .map(id => id.trim())
                        .filter(Boolean)
                        .map((id, i, arr) => (
                          <span key={id}>
                            <a
                              href={`https://your-domain.atlassian.net/browse/${id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 underline dark:text-blue-300"
                            >
                              {id}
                            </a>
                            {i < arr.length - 1 && ', '}
                          </span>
                        ))
                    ) : (
                      tc.description || ''
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-gray-100">{tc["Request Type"] || ''}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="flex items-center gap-2">
                    {/* Status Icon */}
                    {tc.status === 'new' && (
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/><path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    )}
                    {tc.status === 'in progress' && (
                      <svg className="w-4 h-4 text-blue-500 animate-spin" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                    )}
                    {tc.status === 'done' && (
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    )}
                    {tc.status === 'cancel' && (
                      <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/><path d="M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                    )}
                    {tc.status === 'failed' && (
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/><path d="M12 8v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="16" r="1" fill="currentColor"/></svg>
                    )}
                    {/* Status Badge */}
                    <span
                      className={
                        "px-2 inline-flex text-xs leading-5 font-semibold rounded-full " +
                        (tc.status === "failed"
                          ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          : tc.status === "in progress"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          : tc.status === "done"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : tc.status === "cancel"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          : tc.status === "new"
                          ? "bg-gray-200 text-gray-800 dark:bg-neutral-700 dark:text-gray-200"
                          : "bg-gray-100 text-gray-800 dark:bg-neutral-700 dark:text-gray-200")
                      }
                    >
                      {tc.status ? tc.status.charAt(0).toUpperCase() + tc.status.slice(1) : 'New'}
                    </span>
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {tc.createdDate || '2024-06-01'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {tc["Output Type"] || ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Pagination Controls */}
      <div className="flex justify-center items-center gap-2 mt-4">
        {/* Robust Pagination Component */}
        {(() => {
          if (totalPages <= 1) return null;
          // Show up to 5 page numbers, with ellipsis if needed
          const getPageNumbers = () => {
            const pages = [];
            if (totalPages <= 5) {
              for (let i = 1; i <= totalPages; i++) pages.push(i);
            } else {
              if (currentPage <= 3) {
                pages.push(1, 2, 3, 4, '...', totalPages);
              } else if (currentPage >= totalPages - 2) {
                pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
              } else {
                pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
              }
            }
            return pages;
          };
          return <>
            <button
              className="px-3 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-neutral-700 dark:text-gray-200 dark:hover:bg-neutral-600 disabled:opacity-50"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              aria-label="First Page"
            >{'<<'}</button>
            <button
              className="px-3 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-neutral-700 dark:text-gray-200 dark:hover:bg-neutral-600 disabled:opacity-50"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Previous Page"
            >{'<'}</button>
            {getPageNumbers().map((num, idx) =>
              num === '...'
                ? <span key={idx} className="px-2">...</span>
                : <button
                    key={num}
                    className={`px-3 py-1 rounded ${currentPage === num
                      ? 'bg-blue-500 text-white dark:bg-blue-600 dark:text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-neutral-700 dark:text-gray-200 dark:hover:bg-neutral-600'}`}
                    onClick={() => setCurrentPage(num)}
                  >
                    {num}
                  </button>
            )}
            <button
              className="px-3 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-neutral-700 dark:text-gray-200 dark:hover:bg-neutral-600 disabled:opacity-50"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              aria-label="Next Page"
            >{'>'}</button>
            <button
              className="px-3 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-neutral-700 dark:text-gray-200 dark:hover:bg-neutral-600 disabled:opacity-50"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              aria-label="Last Page"
            >{'>>'}</button>
          </>;
        })()}
      </div>
    </div>
  );
};

export default ActivityLogs;
