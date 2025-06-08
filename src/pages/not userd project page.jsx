import React, { useState, useEffect } from 'react';

const SUPPORTED_TOOLS = [
  { name: 'Jira', desc: 'Atlassian Jira integration' },
  { name: 'TestRail', desc: 'TestRail integration' },
  { name: 'TFS', desc: 'Azure DevOps / TFS integration' },
  { name: 'GitHub', desc: 'GitHub integration' },
  { name: 'GitLab', desc: 'GitLab integration' },
  { name: 'Bitbucket', desc: 'Bitbucket integration' },
  { name: 'Azure DevOps', desc: 'Azure DevOps integration' },
];

export default function Live() {
  const [showImport, setShowImport] = useState(false);
  const [showAddIntegration, setShowAddIntegration] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newProject, setNewProject] = useState({ title: '', desc: '' });
  const [integration, setIntegration] = useState({ tool: '', users: '', details: '' });
  const [view, setView] = useState('projects');

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    fetch('/api/projectmgt')
      .then(res => res.json())
      .then(data => {
        setProjects(data);
      })
      .catch(err => {
        setProjects([]);
      })
      .finally(() => setLoading(false));
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProject.title) return;
    const maxId = projects.reduce((max, p) => {
      const num = parseInt((p.id || '').replace('PR-', ''), 10);
      return num > max ? num : max;
    }, 0);
    const newProj = {
      id: `PR-${maxId + 1}`,
      title: newProject.title,
      desc: newProject.desc,
      tag: "Zap Project",
      tagType: "NA",
      created: new Date().toISOString(),
      lastUpdate: new Date().toISOString(),
      activity: 'Active',
      status: 'In Progress',
    };
    await fetch('/api/projectmgt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProj),
    });
    setShowCreateProject(false);
    setNewProject({ title: '', desc: '' });
    await fetchProjects();
  };

  const handleImportProject = async (tool) => {
    const maxId = projects.reduce((max, p) => {
      const num = parseInt((p.id || '').replace('PR-', ''), 10);
      return num > max ? num : max;
    }, 0);
    const newProj = {
      id: `PR-${maxId + 1}`,
      title: `${tool.name} Imported Project`,
      desc: `${tool.desc}`,
      tag: "Import",
      tagType: tool.name,
      created: new Date().toISOString(),
      lastUpdate: new Date().toISOString(),
      activity: 'Imported',
      status: 'Imported',
    };
    await fetch('/api/projectmgt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProj),
    });
    await fetchProjects();
    setView('projects');
  };

  const handleUpdateProject = async (id, updatedProject) => {
    await fetch(`/api/projectmgt/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedProject),
    });
    await fetchProjects();
  };

  const handleDeleteProject = async (id) => {
    await fetch(`/api/projectmgt/${id}`, {
      method: 'DELETE'
    });
    await fetchProjects();
  };

  const handleToggleStatus = async (project) => {
    const updatedStatus = project.status === 'Active' ? 'Disabled' : 'Active';
    const updatedProject = { ...project, status: updatedStatus };
    await handleUpdateProject(project.id, updatedProject);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* All Projects Table View */}
      {view === 'projects' && (
        <>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">All Projects</h1>
            <div className="flex gap-2">
              <button
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-100"
                onClick={() => setView('importTools')}
              >
                Quick Import
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
                onClick={() => setShowCreateProject(true)}
              >
                Create Project
              </button>
            </div>
          </div>
          {/* No projects message */}
          {projects.length === 0 && !showCreateProject && (
            <div className="flex flex-col items-center justify-center h-96 text-gray-500">
              <p className="mb-6 text-lg">It's quiet here 🧐 please add a new project to get started.</p>
            </div>
          )}
          {/* Projects Table - only show if there are projects */}
          {projects.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b text-gray-500 text-xs uppercase">
                    <th className="px-6 py-3 text-left">ID</th>
                    <th className="px-6 py-3 text-left">Project Title</th>
                    <th className="px-6 py-3 text-left">Tag</th>
                    <th className="px-6 py-3 text-left">Tag Type</th>
                    <th className="px-6 py-3 text-left">Created Date</th>
                    <th className="px-6 py-3 text-left">last Update</th>
                    <th className="px-6 py-3 text-left">Activity</th>
                    <th className="px-6 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((proj) => (
                    <tr key={proj.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 font-mono text-sm text-gray-700">{proj.id}</td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{proj.title}</div>
                        <div className="text-xs text-gray-500">{proj.desc}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{proj.tag}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{proj.tagType}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{formatDate(proj.createddate || proj.created)}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{formatDate(proj.lastUpdate)}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{proj.activity}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <button
                          onClick={() => handleToggleStatus(proj)}
                          className={`px-3 py-1 rounded ${proj.status === 'Active' ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-700'}`}
                        >
                          {proj.status === 'Active' ? 'Enabled' : 'Disabled'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      {/* Import Tools Full Page View - only show if view is importTools and not when create project is open */}
      {view === 'importTools' && !showCreateProject && (
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-2xl mx-auto mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Import Tools</h2>
            <button
              className="text-gray-400 hover:text-gray-700 text-2xl"
              onClick={() => setView('projects')}
              title="Back"
            >
              &larr;
            </button>
          </div>
          <ul className="mb-6 space-y-3">
            {SUPPORTED_TOOLS.map((tool) => (
              <li key={tool.name} className="flex items-center justify-between border-b pb-2">
                <div>
                  <span className="font-semibold">{tool.name}</span>
                  <span className="block text-xs text-gray-500">{tool.desc}</span>
                </div>
                <button
                  className="ml-4 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  onClick={() => handleImportProject(tool)}
                >
                  Import
                </button>
              </li>
            ))}
          </ul>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => setShowAddIntegration(true)}
          >
            Add Integration
          </button>
        </div>
      )}
      {/* Add Integration Modal */}
      {showAddIntegration && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl"
              onClick={() => setShowAddIntegration(false)}
              title="Close"
            >
              &times;
            </button>
            <h2 className="text-lg font-bold mb-4">Add New Integration</h2>
            <form
              onSubmit={e => {
                e.preventDefault();
                setShowAddIntegration(false);
                setView('projects');
                setIntegration({ tool: '', users: '', details: '' });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-1">Tool Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={integration.tool}
                  onChange={e => setIntegration({ ...integration, tool: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">User Number</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={integration.users}
                  onChange={e => setIntegration({ ...integration, users: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Details</label>
                <textarea
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={integration.details}
                  onChange={e => setIntegration({ ...integration, details: e.target.value })}
                  rows={3}
                  required
                />
              </div>
              <div className="flex gap-4 justify-end mt-4">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                  onClick={() => setShowAddIntegration(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Create Project Modal */}
      {showCreateProject && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl"
              onClick={() => setShowCreateProject(false)}
              title="Close"
            >
              &times;
            </button>
            <h2 className="text-lg font-bold mb-4">Create New Project</h2>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Project Title</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={newProject.title}
                  onChange={e => setNewProject({ ...newProject, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={newProject.desc}
                  onChange={e => setNewProject({ ...newProject, desc: e.target.value })}
                  rows={3}
                  required
                />
              </div>
              <div className="flex gap-4 justify-end mt-4">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                  onClick={() => setShowCreateProject(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 