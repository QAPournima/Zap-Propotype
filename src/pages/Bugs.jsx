import React, { useState, useEffect } from 'react';
import { bugService, settingsService } from '../services/api';

const Bugs = () => {
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [jiraConfig, setJiraConfig] = useState(null);
  const [jiraStatus, setJiraStatus] = useState({}); // { bugId: { status, assignee } }
  const [linkingJira, setLinkingJira] = useState(null); // bugId being linked
  const [jiraIssueKey, setJiraIssueKey] = useState('');

  useEffect(() => {
    fetchBugs();
    // Fetch Jira config from settings
    settingsService.getApplicationSettings().then(cfg => setJiraConfig(cfg.jira));
  }, []);

  const fetchBugs = async () => {
    try {
      setLoading(true);
      const response = await bugService.getAll();
      setBugs(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch bugs');
      console.error('Error fetching bugs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setImages([...images, ...files]);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleGenerateBug = async (e) => {
    e.preventDefault();
    if (!description.trim()) return;

    try {
      setGenerating(true);
      const formData = new FormData();
      formData.append('description', description);
      images.forEach((image) => {
        formData.append('images', image);
      });

      const response = await bugService.generate(description, images);
      setBugs([...bugs, response.data]);
      setDescription('');
      setImages([]);
      setError(null);
    } catch (err) {
      setError('Failed to generate bug report');
      console.error('Error generating bug report:', err);
    } finally {
      setGenerating(false);
    }
  };

  // Mock: fetch Jira status for a bug
  const fetchJiraStatus = async (bugId) => {
    // In real app, call backend or Jira API
    setJiraStatus(s => ({ ...s, [bugId]: { status: 'To Do', assignee: 'Jane Doe' } }));
  };

  const handleLinkToJira = (bugId) => {
    setLinkingJira(bugId);
    setJiraIssueKey('');
  };

  const handleConfirmLink = (bugId) => {
    // In real app, call backend to link
    setJiraStatus(s => ({ ...s, [bugId]: { status: 'To Do', assignee: 'Jane Doe', issueKey: jiraIssueKey } }));
    setLinkingJira(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Bugs</h1>
        <button
          onClick={() => document.getElementById('generateModal').classList.remove('hidden')}
          className="btn-primary"
        >
          Report New Bug
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Priority
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Jira
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {bugs.map((bug) => (
              <tr key={bug.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{bug.title}</div>
                  <div className="text-sm text-gray-500">{bug.description}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    bug.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                    bug.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {bug.priority}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                    Open
                  </span>
                </td>
                {/* Jira Integration Column */}
                <td className="px-6 py-4 whitespace-nowrap">
                  {jiraStatus[bug.id] ? (
                    <div>
                      <div className="text-xs text-blue-700 font-semibold">{jiraStatus[bug.id].status}</div>
                      <div className="text-xs text-gray-500">{jiraStatus[bug.id].assignee}</div>
                      {jiraStatus[bug.id].issueKey && (
                        <a href={`${jiraConfig?.url}browse/${jiraStatus[bug.id].issueKey}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 underline">{jiraStatus[bug.id].issueKey}</a>
                      )}
                    </div>
                  ) : (
                    <button className="text-blue-600 hover:text-blue-900 text-xs" onClick={() => handleLinkToJira(bug.id)}>
                      Link to Jira
                    </button>
                  )}
                  {/* Link to Jira Modal */}
                  {linkingJira === bug.id && (
                    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                      <div className="bg-white rounded-lg shadow-lg p-6 w-96">
                        <h3 className="text-lg font-bold mb-4">Link Bug to Jira</h3>
                        <input
                          className="w-full border rounded px-3 py-2 mb-4"
                          placeholder="Enter Jira Issue Key (e.g. QA-123)"
                          value={jiraIssueKey}
                          onChange={e => setJiraIssueKey(e.target.value)}
                        />
                        <div className="flex gap-4 justify-end">
                          <button className="px-4 py-2 bg-gray-200 rounded" onClick={() => setLinkingJira(null)}>Cancel</button>
                          <button className="px-4 py-2 bg-blue-500 text-white rounded" onClick={() => handleConfirmLink(bug.id)} disabled={!jiraIssueKey}>Link</button>
                        </div>
                      </div>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button className="text-primary-600 hover:text-primary-900 mr-4">Edit</button>
                  <button className="text-red-600 hover:text-red-900">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Generate Bug Report Modal */}
      <div id="generateModal" className="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div className="mt-3">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Generate Bug Report</h3>
            <form onSubmit={handleGenerateBug}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input w-full h-32"
                  placeholder="Describe the bug..."
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Screenshots
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                      >
                        <span>Upload files</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          multiple
                          accept="image/*"
                          onChange={handleImageUpload}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                  </div>
                </div>

                {images.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {images.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => document.getElementById('generateModal').classList.add('hidden')}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={generating}
                >
                  {generating ? 'Generating...' : 'Generate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Bugs; 