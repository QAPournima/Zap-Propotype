import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000/api';

export const jiraService = {
  // Get Jira settings
  getSettings: async () => {
    const response = await axios.get(`${API_BASE_URL}/settings/jira`);
    return response.data;
  },

  // Update Jira settings
  updateSettings: async (settings) => {
    const response = await axios.put(`${API_BASE_URL}/settings/jira`, settings);
    return response.data;
  },

  // Link a test case or bug to Jira
  linkToJira: async (type, id, jiraKey) => {
    const response = await axios.post(`${API_BASE_URL}/jira/link`, { type, id, jiraKey });
    return response.data;
  },

  // Bulk link multiple items to Jira
  bulkLinkToJira: async (items) => {
    const response = await axios.post(`${API_BASE_URL}/jira/bulk-link`, { items });
    return response.data;
  },

  // Get Jira issue details
  getIssueDetails: async (key) => {
    const response = await axios.get(`${API_BASE_URL}/jira/issues/${key}`);
    return response.data;
  },

  // Update Jira issue status
  updateIssueStatus: async (key, status) => {
    const response = await axios.put(`${API_BASE_URL}/jira/issues/${key}/status`, { status });
    return response.data;
  },

  // Create a new Jira issue
  createIssue: async (issueData) => {
    const response = await axios.post(`${API_BASE_URL}/jira/issues`, issueData);
    return response.data;
  },

  // Search Jira issues
  searchIssues: async (query) => {
    const response = await axios.get(`${API_BASE_URL}/jira/search`, { params: { query } });
    return response.data;
  }
}; 