import React, { useEffect, useState, useRef } from 'react';
import { settingsService } from '../services/api';
import Modal from '../components/Modal';
import { useNavigate } from 'react-router-dom';

const STATUS_OPTIONS = ['To Do', 'In Progress', 'Done'];
const ACTION_OPTIONS = ['Create Test Case', 'Create Bug', 'Create Sub Task'];
const EXECUTE_OPTIONS = ['Yes', 'No'];
const AUTOMATION_OPTIONS = ['Yes', 'No'];
const PROJECT_OPTIONS = ['Smoke', 'Sanity', 'Regression', 'None'];

// Column config for visibility toggle
const ALL_COLUMNS = [
  { key: 'id', label: 'ID', default: true },
  { key: 'summary', label: 'Summary', default: true },
  { key: 'type', label: 'Type', default: true },
  { key: 'status', label: 'Status', default: true },
  { key: 'assignee', label: 'Assignee', default: true },
  { key: 'action', label: 'Action', default: true },
  { key: 'jiraId', label: 'Jira id', default: true },
  { key: 'executeTest', label: 'Execute Test', default: true },
];

export default function MySprint() {
  console.log('MySprint component rendered');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sprint, setSprint] = useState(null);
  const [editIssues, setEditIssues] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [extraFields, setExtraFields] = useState([]);
  const [processingRows, setProcessingRows] = useState({});
  const [rowError, setRowError] = useState({});
  const [mysprintActions, setMySprintActions] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInput, setModalInput] = useState('');
  const [pendingAction, setPendingAction] = useState(null);
  const [pendingIdx, setPendingIdx] = useState(null);
  const navigate = useNavigate();
  const [redirectMsg, setRedirectMsg] = useState('');
  const [visibleColumns, setVisibleColumns] = useState(
    ALL_COLUMNS.filter(col => col.default).map(col => col.key)
  );
  const [colDropdownOpen, setColDropdownOpen] = useState(false);
  const colDropdownRef = useRef();
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const totalPages = Math.ceil(editIssues.length / rowsPerPage);
  const paginatedRows = editIssues.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');

  useEffect(() => {
    fetch('/jiraProjects.json')
      .then(res => res.json())
      .then(data => {
        setProjects(data);
        if (data.length > 0) {
          setSelectedProject(data[0].id);
          fetchSprintForProject(data[0].id);
        }
      })
      .catch(() => {
        setProjects([{ id: 'mock', name: 'Mock Project' }]);
        setSelectedProject('mock');
        fetchSprintForProject('mock');
      });
  }, []);

  useEffect(() => {
    const fetchSprint = async () => {
      setLoading(true);
      setError(null);
      try {
        const [sprintRes, actionsRes] = await Promise.all([
          fetch('/mysprint.json'),
          fetch('/mysprint-actions.json')
        ]);
        if (!sprintRes.ok) throw new Error('Failed to fetch sprint');
        const sprintData = await sprintRes.json();
        const actionsData = actionsRes.ok ? await actionsRes.json() : [];
        setMySprintActions(actionsData);
        const mergedExtraFields = (sprintData.issues || []).map(issue => {
          const found = actionsData.filter(a => a.parentKey === issue.id);
          const jiraIds = found.map(a => a.jiraId).filter(Boolean);
          return {
            action: '',
            jiraId: jiraIds.join(','),
            jiraIdList: jiraIds,
            executeTest: '',
            automationTest: '',
            automationProject: ''
          };
        });
        setSprint(sprintData);
        setEditIssues(sprintData.issues || []);
        setExtraFields(mergedExtraFields);
        setProcessingRows({});
        setRowError({});
      } catch (err) {
        setError(err.message || 'Failed to load sprint');
      } finally {
        setLoading(false);
      }
    };
    fetchSprint();
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClick(e) {
      if (colDropdownRef.current && !colDropdownRef.current.contains(e.target)) {
        setColDropdownOpen(false);
      }
    }
    if (colDropdownOpen) {
      document.addEventListener('mousedown', handleClick);
    } else {
      document.removeEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [colDropdownOpen]);

  const handleIssueChange = (idx, field, value) => {
    setEditIssues(issues => issues.map((issue, i) => i === idx ? { ...issue, [field]: value } : issue));
  };

  const handleExtraChange = async (idx, field, value) => {
    setExtraFields(fields => fields.map((f, i) => i === idx ? { ...f, [field]: value } : f));
    if (['Create Bug', 'Create Sub Task'].includes(value)) {
      setPendingAction(value);
      setPendingIdx(idx);
      setModalOpen(true);
      return;
    }
    if (field === 'action' && ['Create Test Case', 'Create Bug', 'Create Sub Task'].includes(value)) {
      setProcessingRows(rows => ({ ...rows, [idx]: true }));
      setRowError(errs => ({ ...errs, [idx]: undefined }));
      try {
        const issueKey = editIssues[idx]?.id;
        const res = await fetch('/api/ai/create-issue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ issueKey, action: value })
        });
        if (!res.ok) throw new Error((await res.json()).error || 'Failed to create issue');
        const data = await res.json();
        setExtraFields(fields => fields.map((f, i) =>
          i === idx
            ? {
                ...f,
                jiraId: data.jiraId,
                jiraIdList: f.jiraIdList ? [...f.jiraIdList, data.jiraId] : [data.jiraId]
              }
            : f
        ));
        setProcessingRows(rows => {
          const updated = { ...rows };
          delete updated[idx];
          return updated;
        });
      } catch (err) {
        setRowError(errs => ({ ...errs, [idx]: 'Failed to create issue. Retry?' }));
        setProcessingRows(rows => {
          const updated = { ...rows };
          delete updated[idx];
          return updated;
        });
      }
    }
  };

  const handleModalSubmit = async () => {
    if (pendingAction && pendingIdx !== null) {
      setModalOpen(false);
      setProcessingRows(rows => ({ ...rows, [pendingIdx]: true }));
      setRowError(errs => ({ ...errs, [pendingIdx]: undefined }));
      try {
        const issueKey = editIssues[pendingIdx]?.id;
        const res = await fetch('/api/ai/create-issue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ issueKey, action: pendingAction, userInput: modalInput })
        });
        if (!res.ok) throw new Error((await res.json()).error || 'Failed to create issue');
        const data = await res.json();
        setExtraFields(fields => fields.map((f, i) =>
          i === pendingIdx
            ? {
                ...f,
                jiraId: data.jiraId,
                jiraIdList: f.jiraIdList ? [...f.jiraIdList, data.jiraId] : [data.jiraId]
              }
            : f
        ));
      } catch (err) {
        setRowError(errs => ({ ...errs, [pendingIdx]: 'Failed to create issue. Retry?' }));
      } finally {
        setProcessingRows(rows => {
          const updated = { ...rows };
          delete updated[pendingIdx];
          return updated;
        });
        setModalInput('');
        setPendingAction(null);
        setPendingIdx(null);
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg('');
    try {
      for (let i = 0; i < editIssues.length; i++) {
        const issue = editIssues[i];
        await fetch('/api/jira/issues/' + issue.id, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: issue.status,
            assignee: issue.assignee
          }),
        });
      }
      setSaveMsg('Jira issues updated!');
      setTimeout(() => setSaveMsg(''), 2000);
    } catch (err) {
      setSaveMsg('Failed to update Jira issues');
    } finally {
      setSaving(false);
    }
  };

  const handleExecuteTestChange = async (idx, value) => {
    setExtraFields(fields => fields.map((f, i) => {
      const type = (editIssues[i]?.type || '').toLowerCase();
      if (i === idx && type === 'test') {
        return { ...f, executeTest: value, jiraId: editIssues[i]?.id, jiraIdList: [editIssues[i]?.id] };
      }
      return i === idx ? { ...f, executeTest: value } : f;
    }));
    if (value === 'Yes') {
      const type = (editIssues[idx]?.type || '').toLowerCase();
      const jiraId =
        type === 'test'
          ? editIssues[idx]?.id
          : extraFields[idx]?.jiraIdList?.[0] || 'NO_ID';
      const testCaseName = encodeURIComponent(editIssues[idx]?.summary || '');
      navigate(`/live-test/${jiraId}?fromMySprint=1&name=${testCaseName}&manual=1`);
    }
  };

  // Add handler for project change
  const handleProjectChange = async (e) => {
    const projectId = e.target.value;
    setSelectedProject(projectId);
    if (projectId) {
      const res = await fetch('/api/jira/project', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
      const data = await res.json();
      if (data.success) {
        // Fetch the latest projectId from settings to ensure sync
        settingsService.getApplicationSettings().then(appSettings => {
          const latestProjectId = appSettings?.jira?.projectId || projectId;
          fetchSprintForProject(latestProjectId);
        });
      }
    }
  };

  // Fetch sprint and actions from public folder
  const fetchSprintForProject = async (projectId) => {
    setLoading(true);
    setError(null);
    try {
      const [sprintRes, actionsRes] = await Promise.all([
        fetch('/mysprint.json'),
        fetch('/mysprint-actions.json')
      ]);
      if (!sprintRes.ok) throw new Error('Failed to fetch sprint');
      const sprintData = await sprintRes.json();
      const actionsData = actionsRes.ok ? await actionsRes.json() : [];
      setMySprintActions(actionsData);
      const mergedExtraFields = (sprintData.issues || []).map(issue => {
        const found = actionsData.filter(a => a.parentKey === issue.id);
        const jiraIds = found.map(a => a.jiraId).filter(Boolean);
        return {
          action: '',
          jiraId: jiraIds.join(','),
          jiraIdList: jiraIds,
          executeTest: '',
          automationTest: '',
          automationProject: ''
        };
      });
      setSprint(sprintData);
      setEditIssues(sprintData.issues || []);
      setExtraFields(mergedExtraFields);
      setProcessingRows({});
      setRowError({});
    } catch (err) {
      setError(err.message || 'Failed to load sprint');
    } finally {
      setLoading(false);
    }
  };

  // Helper to retry fetching settings and sprint
  const retryFetchSettings = () => {
    setError(null);
    setLoading(true);
    fetchJiraProjects();
    settingsService.getApplicationSettings()
      .then(appSettings => {
        setSelectedProject(appSettings?.jira?.projectId || '');
        if (appSettings?.jira?.projectId) {
          fetchSprintForProject(appSettings.jira.projectId);
        }
      })
      .catch(err => {
        setError('Please check your project integration and try again.');
      })
      .finally(() => setLoading(false));
  };

  // Add new function fetchJiraProjects
  const fetchJiraProjects = () => {
    fetch('/api/jira/projects')
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok: ' + res.status);
        return res.json();
      })
      .then(data => setProjects(data))
      .catch(err => {
        setProjects([]);
      });
  };

  console.log('Projects state before render:', projects);

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-neutral-900 dark:text-gray-100 flex flex-col p-8">
      <div className="w-full px-8 pt-2">
        <h2 className="mt-4 text-2xl font-bold mb-8">My Sprint</h2>
        {/* Jira Project Selector Dropdown - moved below the page title */}
        {console.log('Dropdown projects:', projects)}
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="jira-project-select" style={{ marginRight: 8 }}>Jira Project:</label>
          <select
            id="jira-project-select"
            value={selectedProject}
            onChange={handleProjectChange}
            className="rounded px-3 py-2 border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
            style={{ minWidth: 220 }}
          >
            <option value="">Select Jira Project</option>
            {projects.map(p => (
              <option key={p.id || p.key} value={p.id || p.key}>{p.name}</option>
            ))}
          </select>
        </div>
        {loading ? (
          <div className="text-gray-400 dark:text-gray-300">Loading current sprint...</div>
        ) : error ? (
          <div className="text-white text-lg flex flex-col items-start gap-4">
            <div>
              <span className="font-bold text-2xl">{error}</span>
            </div>
            <button
              onClick={retryFetchSettings}
              className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : sprint ? (
          <>
            <div className="mb-2 p-4 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-sm w-full">
              <div className="flex items-center gap-4 mb-2">
                <span className="text-xl font-bold text-blue-600 dark:text-blue-300">{sprint.name}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ml-2 ${sprint.state === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-200 text-gray-800 dark:bg-neutral-700 dark:text-gray-200'}`}>{sprint.state}</span>
              </div>
              <div className="flex flex-wrap items-center gap-6 text-gray-700 dark:text-gray-200 mb-1">
                <span>Start: <b>{sprint.startDate ? new Date(sprint.startDate).toLocaleDateString() : '-'}</b></span>
                <span>End: <b>{sprint.endDate ? new Date(sprint.endDate).toLocaleDateString() : '-'}</b></span>
              </div>
              <div className="text-gray-500 dark:text-gray-400 text-sm mt-2">Goal: {sprint.goal || 'No goal set for this sprint.'}</div>
            </div>
          </>
        ) : (
          <div className="text-gray-400 dark:text-gray-300">No active sprint found for your project.</div>
        )}
      </div>
      {/* Table is now outside the centered container for full width */}
      {sprint && !error && (
        <div className="w-screen ml-8 mr-8 pr-12 overflow-x-auto mt-12 mb-16">
          {/* Column visibility dropdown */}
          <div className="relative mb-4">
            <button
              className="px-4 py-2 bg-gray-200 dark:bg-neutral-800 rounded shadow text-gray-900 dark:text-gray-100 font-semibold hover:bg-gray-300 dark:hover:bg-neutral-700"
              onClick={() => setColDropdownOpen(v => !v)}
            >
              Columns
            </button>
            {colDropdownOpen && (
              <div ref={colDropdownRef} className="absolute left-0 mt-2 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded shadow-lg z-50 p-4 min-w-[200px]">
                {ALL_COLUMNS.map(col => (
                  <label key={col.key} className="flex items-center gap-2 py-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibleColumns.includes(col.key)}
                      onChange={e => {
                        if (e.target.checked) {
                          setVisibleColumns(cols => [...cols, col.key]);
                        } else {
                          setVisibleColumns(cols => cols.filter(k => k !== col.key));
                        }
                      }}
                    />
                    <span>{col.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <table className="min-w-full divide-y divide-gray-200 dark:divide-neutral-700">
            <thead className="bg-gray-50 dark:bg-neutral-900">
              <tr>
                {ALL_COLUMNS.filter(col => visibleColumns.includes(col.key)).map(col => (
                  <th
                    key={col.key}
                    className={`px-4 py-2 text-left font-semibold ${['id','summary','type','status','assignee'].includes(col.key) ? 'bg-[#1A1E1D] text-white' : ''}`}
                  >
                    {col.label}
                  </th>
                ))}
                <th className="w-11"></th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-neutral-900 divide-y divide-gray-200 dark:divide-neutral-700">
              {paginatedRows.map((issue, idx) => {
                // Determine allowed actions based on issue type
                let allowedActions = [];
                let actionDisabled = false;
                let executeTestDisabled = false;
                let jiraIdEditable = false;
                const type = (issue.type || '').toLowerCase();
                if (type === 'user story' || type === 'story') {
                  allowedActions = ACTION_OPTIONS;
                } else if (type === 'bug') {
                  allowedActions = ['Create Sub Task'];
                } else if (type === 'task') {
                  allowedActions = ['Create Bug', 'Create Sub Task'];
                } else if (type === 'test') {
                  allowedActions = [];
                  actionDisabled = true;
                  jiraIdEditable = true;
                } else {
                  allowedActions = [];
                  actionDisabled = true;
                }
                // For Test type, allow Execute Test, for others keep as is
                if (type === 'test') {
                  executeTestDisabled = false;
                }
                return (
                  <tr key={issue.id} className="hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors">
                    {ALL_COLUMNS.filter(col => visibleColumns.includes(col.key)).map(col => {
                      switch (col.key) {
                        case 'id':
                          return <td key="id" className="px-4 py-2 font-mono bg-[#1A1E1D] text-white">{issue.id}</td>;
                        case 'summary':
                          return <td key="summary" className="px-4 py-2 whitespace-normal break-words max-w-xs bg-[#1A1E1D] text-white">{issue.summary}</td>;
                        case 'type':
                          return <td key="type" className="px-4 py-2 bg-[#1A1E1D] text-white">{issue.type}</td>;
                        case 'status':
                          return <td key="status" className="px-4 py-2 bg-[#1A1E1D] text-white">
                            <select
                              className="rounded px-2 py-1 border border-gray-300 dark:border-neutral-700 bg-[#1A1E1D] text-white dark:bg-neutral-900 dark:text-gray-100"
                              value={issue.status}
                              onChange={e => handleIssueChange(idx, 'status', e.target.value)}
                            >
                              {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                          </td>;
                        case 'assignee':
                          return <td key="assignee" className="px-4 py-2 bg-[#1A1E1D] text-white">
                            <input
                              className="rounded px-2 py-1 border border-gray-300 dark:border-neutral-700 bg-[#1A1E1D] text-white dark:bg-neutral-900 dark:text-gray-100"
                              value={issue.assignee}
                              onChange={e => handleIssueChange(idx, 'assignee', e.target.value)}
                            />
                          </td>;
                        case 'action':
                          return <td key="action" className="px-4 py-2">
                            <select
                              className="rounded px-2 py-1 border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100"
                              value={extraFields[idx]?.action || ''}
                              onChange={e => handleExtraChange(idx, 'action', e.target.value)}
                              disabled={actionDisabled || allowedActions.length === 0}
                            >
                              <option value="">Select</option>
                              {allowedActions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                          </td>;
                        case 'jiraId':
                          return <td key="jiraId" className="px-4 py-2 whitespace-normal break-words max-w-xs">
                            <div className="flex flex-wrap items-center gap-2">
                              {extraFields[idx]?.jiraIdList && extraFields[idx].jiraIdList.length > 0 ? (
                                extraFields[idx].jiraIdList.map((id, i) => (
                                  <React.Fragment key={id}>
                                    <a
                                      href={`https://your-domain.atlassian.net/browse/${id}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 underline dark:text-blue-300"
                                    >
                                      {id}
                                    </a>
                                    {(i < extraFields[idx].jiraIdList.length - 1) && ((i + 1) % 3 === 0 ? <br /> : ', ')}
                                  </React.Fragment>
                                ))
                              ) : (
                                <input
                                  className={`rounded px-2 py-1 border bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 ${processingRows[idx] ? 'border-blue-400 bg-blue-50 dark:bg-blue-950 animate-pulse' : 'border-gray-300 dark:border-neutral-700'} ${rowError[idx] ? 'border-red-500 bg-red-50 dark:bg-red-900' : ''}`}
                                  value={extraFields[idx]?.jiraId || ''}
                                  onChange={e => handleExtraChange(idx, 'jiraId', e.target.value)}
                                  disabled={processingRows[idx] || (!jiraIdEditable && !processingRows[idx])}
                                />
                              )}
                              {processingRows[idx] && (
                                <span className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></span>
                              )}
                              {rowError[idx] && (
                                <button
                                  className="text-xs text-red-500 underline ml-2"
                                  onClick={() => handleExtraChange(idx, 'action', 'Create Test Case')}
                                >Retry</button>
                              )}
                            </div>
                          </td>;
                        case 'executeTest':
                          return <td key="executeTest" className="px-4 py-2">
                            <select
                              className="rounded px-2 py-1 border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100"
                              value={extraFields[idx]?.executeTest || ''}
                              onChange={e => handleExecuteTestChange(idx, e.target.value)}
                              disabled={type !== 'test' && false}
                            >
                              <option value="">Select</option>
                              {EXECUTE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                          </td>;
                        default:
                          return null;
                      }
                    })}
                    <td className="w-11"></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="flex gap-4 mt-8 items-center ml-8">
            <button
              className="px-6 py-2 rounded bg-blue-500 text-white font-semibold hover:bg-blue-600 disabled:opacity-60 shadow"
              onClick={handleSave}
              disabled={saving}
            >{saving ? 'Saving...' : 'Save Sprint'}</button>
            {saveMsg && <span className="text-sm text-green-400 dark:text-green-300">{saveMsg}</span>}
          </div>
          {redirectMsg && <div className="text-blue-500 font-semibold my-4 ml-8">{redirectMsg}</div>}
          {/* Pagination Controls */}
          <div className="flex justify-center items-center gap-2 mt-4">
            <button
              className="px-3 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-neutral-700 dark:text-gray-200 dark:hover:bg-neutral-600 disabled:opacity-50"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              aria-label="First Page"
            >
              &#171;
            </button>
            <button
              className="px-3 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-neutral-700 dark:text-gray-200 dark:hover:bg-neutral-600 disabled:opacity-50"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              aria-label="Previous Page"
            >
              &#8249;
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                className={`px-3 py-1 rounded ${currentPage === i + 1
                  ? 'bg-blue-500 text-white dark:bg-blue-600 dark:text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-neutral-700 dark:text-gray-200 dark:hover:bg-neutral-600'}`}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button
              className="px-3 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-neutral-700 dark:text-gray-200 dark:hover:bg-neutral-600 disabled:opacity-50"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              aria-label="Next Page"
            >
              &#8250;
            </button>
            <button
              className="px-3 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-neutral-700 dark:text-gray-200 dark:hover:bg-neutral-600 disabled:opacity-50"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              aria-label="Last Page"
            >
              &#187;
            </button>
          </div>
        </div>
      )}
      {/* Modal for Bug/Sub Task details */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={pendingAction} width="max-w-xl">
        <textarea
          className="w-full border rounded p-2 mb-4 bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-neutral-700 placeholder-gray-400 dark:placeholder-gray-400"
          rows={6}
          placeholder={`Enter details for ${pendingAction}...`}
          value={modalInput}
          onChange={e => setModalInput(e.target.value)}
        />
        {modalInput.trim().length < 100 && (
          <div className="text-red-500 text-sm mb-2">Please enter at least 100 characters</div>
        )}
        <div className="flex gap-4 justify-end mt-2">
          <button className="px-4 py-2 rounded bg-gray-300 text-gray-800 dark:bg-neutral-700 dark:text-gray-100" onClick={() => setModalOpen(false)}>Cancel</button>
          <button className="px-4 py-2 rounded bg-blue-600 text-white" onClick={handleModalSubmit} disabled={modalInput.trim().length < 100}>Submit</button>
        </div>
      </Modal>
    </div>
  );
} 
