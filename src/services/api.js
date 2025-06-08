import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Test Cases
export const testCaseService = {
  getAll: () => api.get('/api/test-cases'),
  getById: (id) => api.get(`/api/test-cases/${id}`),
  create: (data) => api.post('/api/test-cases', data),
  update: (id, data) => api.put(`/api/test-cases/${id}`, data),
  delete: (id) => api.delete(`/api/test-cases/${id}`),
  generate: (userStory) => api.post('/api/test-cases/generate', userStory),
  generateAutomation: (id) => api.post(`/api/test-cases/${id}/automation`),
};

// Bugs
export const bugService = {
  getAll: () => api.get('/api/bugs'),
  getById: (id) => api.get(`/api/bugs/${id}`),
  create: (data) => api.post('/api/bugs', data),
  update: (id, data) => api.put(`/api/bugs/${id}`, data),
  delete: (id) => api.delete(`/api/bugs/${id}`),
  generate: (description, imageUrls) => api.post('/api/bugs/generate', { description, imageUrls }),
};

// Settings
export const settingsService = {
  get: () => api.get('/api/settings'),
  update: (data) => api.put('/api/settings', data),
  testJiraConnection: (config) => api.post('/api/settings/test-jira', config),
  getApplicationSettings: () => fetch('/api/applicationsettings').then(res => res.json()),

  // New mock settings endpoints
  getProfile: () => fetch('/api/settings/profile').then(res => res.json()),
  updateProfile: (data) => fetch('/api/settings/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),

  getNotifications: () => fetch('/api/settings/notifications').then(res => res.json()),
  updateNotifications: (data) => fetch('/api/settings/notifications', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),

  getIntegrations: () => fetch('/api/settings/integrations').then(res => res.json()),
  updateIntegrations: (data) => fetch('/api/settings/integrations', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),

  getTheme: () => fetch('/api/settings/theme').then(res => res.json()),
  updateTheme: (data) => fetch('/api/settings/theme', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),

  getOnboarding: () => fetch('/api/settings/onboarding').then(res => res.json()),
  updateOnboarding: (data) => fetch('/api/settings/onboarding', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
};

// AI Chat
export const chatService = {
  sendMessage: (message) => api.post('/api/chat', { message }),
  getHistory: () => api.get('/api/chat/history'),
  generateUserStory: (fileName) => api.post('/api/chat/generate-user-story', { fileName }),
  generateTestCase: (fileName) => api.post('/api/chat/generate-test-case', { fileName }),
  generateAutomationScript: (testCaseId) => api.post('/api/chat/generate-automation', { testCaseId }),
  linkToJira: (content) => api.post('/api/chat/link-to-jira', { content }),
  downloadAsPDF: (content) => api.post('/api/chat/download-pdf', { content }),
  uploadDocument: (formData) =>
    api.post('/api/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// Project Management (Mock)
export const projectMgtService = {
  getAllProjects: () => fetch('http://localhost:4000/api/projectmgt').then(res => res.json()),
  addProject: (project) => fetch('http://localhost:4000/api/projectmgt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(project),
  }).then(res => res.json()),
};

export default api; 
