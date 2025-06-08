import React, { useState, useEffect } from 'react';
import { jiraService } from '../services/jiraService';

const JiraIntegration = ({ type, id, onLink, onStatusUpdate }) => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [jiraKey, setJiraKey] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [newIssue, setNewIssue] = useState({
    summary: '',
    description: '',
    priority: 'Medium',
    type: type === 'bug' ? 'Bug' : 'Task'
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await jiraService.getSettings();
      setSettings(data);
    } catch (err) {
      setError('Failed to load Jira settings');
    } finally {
      setLoading(false);
    }
  };

  const handleLink = async () => {
    try {
      const result = await jiraService.linkToJira(type, id, jiraKey);
      onLink(result);
      setShowLinkModal(false);
      setJiraKey('');
    } catch (err) {
      setError('Failed to link to Jira');
    }
  };

  const handleCreate = async () => {
    try {
      const result = await jiraService.createIssue(newIssue);
      const linkResult = await jiraService.linkToJira(type, id, result.key);
      onLink(linkResult);
      setShowCreateModal(false);
      setNewIssue({
        summary: '',
        description: '',
        priority: 'Medium',
        type: type === 'bug' ? 'Bug' : 'Task'
      });
    } catch (err) {
      setError('Failed to create Jira issue');
    }
  };

  const handleSearch = async () => {
    try {
      const results = await jiraService.searchIssues(searchQuery);
      setSearchResults(results);
    } catch (err) {
      setError('Failed to search Jira issues');
    }
  };

  if (loading) return <div>Loading Jira integration...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!settings?.enabled) return null;

  return (
    <div className="space-y-4">
      {/* Link to Jira Button */}
      <button
        onClick={() => setShowLinkModal(true)}
        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Link to Jira
      </button>

      {/* Create in Jira Button */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="ml-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
      >
        <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
        Create in Jira
      </button>

      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Link to Jira Issue</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Jira Key</label>
                <input
                  type="text"
                  value={jiraKey}
                  onChange={(e) => setJiraKey(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="e.g., PROJ-123"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowLinkModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLink}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Create Jira Issue</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Summary</label>
                <input
                  type="text"
                  value={newIssue.summary}
                  onChange={(e) => setNewIssue({ ...newIssue, summary: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={newIssue.description}
                  onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows="3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Priority</label>
                <select
                  value={newIssue.priority}
                  onChange={(e) => setNewIssue({ ...newIssue, priority: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Modal */}
      {showLinkModal && (
        <div className="mt-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Search Jira issues..."
            />
            <button
              onClick={handleSearch}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Search
            </button>
          </div>
          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2">
              {searchResults.map((issue) => (
                <div
                  key={issue.key}
                  className="flex items-center justify-between p-2 border rounded hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    setJiraKey(issue.key);
                    setSearchResults([]);
                  }}
                >
                  <div>
                    <div className="font-medium">{issue.key}</div>
                    <div className="text-sm text-gray-500">{issue.summary}</div>
                  </div>
                  <div className="text-sm text-gray-500">{issue.status}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default JiraIntegration; 