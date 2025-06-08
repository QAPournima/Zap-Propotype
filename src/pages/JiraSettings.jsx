import React, { useState, useEffect } from 'react';
import { jiraService } from '../services/jiraService';

const JiraSettings = () => {
  const [settings, setSettings] = useState({
    enabled: false,
    baseUrl: '',
    apiToken: '',
    projectKey: '',
    syncEnabled: true,
    autoLinkEnabled: false,
    defaultAssignee: '',
    statusMapping: {
      'To Do': 'open',
      'In Progress': 'in_progress',
      'Done': 'completed'
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      await jiraService.updateSettings(settings);
      setSuccess('Settings updated successfully');
    } catch (err) {
      setError('Failed to update settings');
    }
  };

  const handleStatusMappingChange = (jiraStatus, zapStatus) => {
    setSettings(prev => ({
      ...prev,
      statusMapping: {
        ...prev.statusMapping,
        [jiraStatus]: zapStatus
      }
    }));
  };

  if (loading) return <div>Loading settings...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow px-5 py-6 sm:px-6">
          <div className="border-b border-gray-200 pb-5">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Jira Integration Settings</h3>
            <p className="mt-2 max-w-4xl text-sm text-gray-500">
              Configure your Jira integration settings to enable seamless synchronization between Zap and Jira.
            </p>
          </div>

          {error && (
            <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="mt-4 bg-green-50 border-l-4 border-green-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">{success}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="enabled"
                checked={settings.enabled}
                onChange={(e) => setSettings(prev => ({ ...prev, enabled: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="enabled" className="ml-2 block text-sm text-gray-900">
                Enable Jira Integration
              </label>
            </div>

            <div>
              <label htmlFor="baseUrl" className="block text-sm font-medium text-gray-700">
                Jira Base URL
              </label>
              <input
                type="url"
                id="baseUrl"
                value={settings.baseUrl}
                onChange={(e) => setSettings(prev => ({ ...prev, baseUrl: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="https://your-domain.atlassian.net"
              />
            </div>

            <div>
              <label htmlFor="apiToken" className="block text-sm font-medium text-gray-700">
                API Token
              </label>
              <input
                type="password"
                id="apiToken"
                value={settings.apiToken}
                onChange={(e) => setSettings(prev => ({ ...prev, apiToken: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="projectKey" className="block text-sm font-medium text-gray-700">
                Project Key
              </label>
              <input
                type="text"
                id="projectKey"
                value={settings.projectKey}
                onChange={(e) => setSettings(prev => ({ ...prev, projectKey: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="e.g., PROJ"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="syncEnabled"
                checked={settings.syncEnabled}
                onChange={(e) => setSettings(prev => ({ ...prev, syncEnabled: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="syncEnabled" className="ml-2 block text-sm text-gray-900">
                Enable Two-way Sync
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="autoLinkEnabled"
                checked={settings.autoLinkEnabled}
                onChange={(e) => setSettings(prev => ({ ...prev, autoLinkEnabled: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="autoLinkEnabled" className="ml-2 block text-sm text-gray-900">
                Auto-link New Items
              </label>
            </div>

            <div>
              <label htmlFor="defaultAssignee" className="block text-sm font-medium text-gray-700">
                Default Assignee
              </label>
              <input
                type="text"
                id="defaultAssignee"
                value={settings.defaultAssignee}
                onChange={(e) => setSettings(prev => ({ ...prev, defaultAssignee: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="username@example.com"
              />
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Status Mapping</h4>
              <div className="space-y-4">
                {Object.entries(settings.statusMapping).map(([jiraStatus, zapStatus]) => (
                  <div key={jiraStatus} className="flex items-center space-x-4">
                    <span className="text-sm text-gray-500 w-24">{jiraStatus}</span>
                    <select
                      value={zapStatus}
                      onChange={(e) => handleStatusMappingChange(jiraStatus, e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Save Settings
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default JiraSettings; 