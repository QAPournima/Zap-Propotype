const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const { Configuration, OpenAIApi } = require('openai');
const OpenAI = require('openai');

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

const ACTIVITY_LOGS_FILE = path.join(__dirname, 'data', 'activityLogs.json');
const APP_SETTINGS_FILE = path.join(__dirname, 'data', 'applicationsettings.json');
const PROJECT_MGT_FILE = path.join(__dirname, 'data', 'projectmgt.json');
const PROFILE_SETTINGS_FILE = path.join(__dirname, 'data', 'profileSettings.json');
const NOTIFICATION_SETTINGS_FILE = path.join(__dirname, 'data', 'notificationSettings.json');
const INTEGRATION_SETTINGS_FILE = path.join(__dirname, 'data', 'integrationSettings.json');
const THEME_SETTINGS_FILE = path.join(__dirname, 'data', 'themeSettings.json');
const ONBOARDING_SETTINGS_FILE = path.join(__dirname, 'data', 'onboardingSettings.json');
const JIRA_SETTINGS_FILE = path.join(__dirname, 'data', 'jiraSettings.json');
const PROMPTS_FILE = path.join(__dirname, 'data', 'openai-prompts.json');
const MYSPRINT_ACTIONS_FILE = path.join(__dirname, 'data', 'mysprint-actions.json');

// Ensure the data directory exists
const ensureDataDir = async () => {
  const dataDir = path.join(__dirname, 'data');
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir);
  }
};

// Initialize activity logs file if it doesn't exist
const initActivityLogs = async () => {
  try {
    await fs.access(ACTIVITY_LOGS_FILE);
  } catch {
    await fs.writeFile(ACTIVITY_LOGS_FILE, JSON.stringify([], null, 2));
  }
};

// Ensure the project management file exists
const initProjectMgt = async () => {
  try {
    await fs.access(PROJECT_MGT_FILE);
  } catch {
    await fs.writeFile(PROJECT_MGT_FILE, JSON.stringify([], null, 2));
  }
};

// Initialize Jira settings file if it doesn't exist
const initJiraSettings = async () => {
  try {
    await fs.access(JIRA_SETTINGS_FILE);
  } catch {
    const defaultSettings = {
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
    };
    await fs.writeFile(JIRA_SETTINGS_FILE, JSON.stringify(defaultSettings, null, 2));
  }
};

// Ensure mysprint-actions.json exists
const initMySprintActions = async () => {
  try {
    await fs.access(MYSPRINT_ACTIONS_FILE);
  } catch {
    await fs.writeFile(MYSPRINT_ACTIONS_FILE, JSON.stringify([], null, 2));
  }
};

// Get all activity logs
app.get('/api/activity-logs', async (req, res) => {
  try {
    const data = await fs.readFile(ACTIVITY_LOGS_FILE, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    console.error('Error reading activity logs:', error);
    res.status(500).json({ error: 'Failed to read activity logs' });
  }
});

// Add new activity log
app.post('/api/activity-logs', async (req, res) => {
  try {
    const data = await fs.readFile(ACTIVITY_LOGS_FILE, 'utf8');
    const logs = JSON.parse(data);
    const newLog = {
      ...req.body,
      id: logs.length + 1
    };
    logs.push(newLog);
    await fs.writeFile(ACTIVITY_LOGS_FILE, JSON.stringify(logs, null, 2));
    res.json(newLog);
  } catch (error) {
    console.error('Error writing activity log:', error);
    res.status(500).json({ error: 'Failed to write activity log' });
  }
});

// Update activity log by id
app.put('/api/activity-logs/:id', async (req, res) => {
  try {
    const data = await fs.readFile(ACTIVITY_LOGS_FILE, 'utf8');
    let logs = JSON.parse(data);
    const id = parseInt(req.params.id, 10);
    let updated = false;
    logs = logs.map(log => {
      if (log.id === id) {
        updated = true;
        return { ...log, ...req.body };
      }
      return log;
    });
    if (!updated) {
      return res.status(404).json({ error: 'Log not found' });
    }
    await fs.writeFile(ACTIVITY_LOGS_FILE, JSON.stringify(logs, null, 2));
    res.json(logs.find(log => log.id === id));
  } catch (error) {
    console.error('Error updating activity log:', error);
    res.status(500).json({ error: 'Failed to update activity log' });
  }
});

// Serve application settings
app.get('/api/applicationsettings', async (req, res) => {
  try {
    const data = await fs.readFile(APP_SETTINGS_FILE, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    console.error('Error reading application settings:', error);
    res.status(500).json({ error: 'Failed to read application settings' });
  }
});

// Update application settings
app.put('/api/settings', async (req, res) => {
  try {
    await fs.writeFile(APP_SETTINGS_FILE, JSON.stringify(req.body, null, 2), 'utf8');
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving application settings:', error);
    res.status(500).json({ error: 'Failed to save application settings' });
  }
});

// Get all projects
app.get('/api/projectmgt', async (req, res) => {
  try {
    const data = await fs.readFile(PROJECT_MGT_FILE, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    console.error('Error reading project management data:', error);
    res.status(500).json({ error: 'Failed to read project management data' });
  }
});

// Add new project
app.post('/api/projectmgt', async (req, res) => {
  try {
    const data = await fs.readFile(PROJECT_MGT_FILE, 'utf8');
    const projects = JSON.parse(data);
    const newProject = {
      ...req.body,
      id: req.body.id || `PR-${projects.length + 1}`
    };
    projects.push(newProject);
    await fs.writeFile(PROJECT_MGT_FILE, JSON.stringify(projects, null, 2));
    res.json(newProject);
  } catch (error) {
    console.error('Error writing project:', error);
    res.status(500).json({ error: 'Failed to write project' });
  }
});

// Update project by id
app.put('/api/projectmgt/:id', async (req, res) => {
  try {
    const data = await fs.readFile(PROJECT_MGT_FILE, 'utf8');
    let projects = JSON.parse(data);
    const id = req.params.id;
    let updated = false;
    projects = projects.map(project => {
      if (project.id == id) {
        updated = true;
        return { ...project, ...req.body };
      }
      return project;
    });
    if (!updated) {
      return res.status(404).json({ error: 'Project not found' });
    }
    await fs.writeFile(PROJECT_MGT_FILE, JSON.stringify(projects, null, 2));
    res.json(projects.find(project => project.id == id));
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete project by id
app.delete('/api/projectmgt/:id', async (req, res) => {
  try {
    const data = await fs.readFile(PROJECT_MGT_FILE, 'utf8');
    let projects = JSON.parse(data);
    const id = req.params.id;
    const newProjects = projects.filter(project => project.id != id);
    if (newProjects.length === projects.length) {
      return res.status(404).json({ error: 'Project not found' });
    }
    await fs.writeFile(PROJECT_MGT_FILE, JSON.stringify(newProjects, null, 2));
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// Dashboard data endpoint
app.get('/api/dashboard', (req, res) => {
  // In a real app, this would come from a database and be role-based
  const dashboardData = {
    aiSuggestions: [
      { id: 1, type: 'test_case', title: 'Add test coverage for new API endpoint', confidence: 0.95, priority: 'high' },
      { id: 2, type: 'bug', title: 'Potential race condition in user authentication', confidence: 0.88, priority: 'medium' },
      { id: 3, type: 'optimization', title: 'Optimize database queries in report generation', confidence: 0.92, priority: 'low' },
      { id: 4, type: 'test_case', title: 'Refactor login tests for edge cases', confidence: 0.91, priority: 'medium' },
      { id: 5, type: 'bug', title: 'Check for null pointer in payment flow', confidence: 0.89, priority: 'high' },
      { id: 6, type: 'optimization', title: 'Improve CI pipeline speed', confidence: 0.87, priority: 'low' },
      { id: 7, type: 'test_case', title: 'Add accessibility tests for forms', confidence: 0.93, priority: 'medium' },
      { id: 8, type: 'bug', title: 'Fix flaky test in checkout', confidence: 0.85, priority: 'high' },
      { id: 9, type: 'optimization', title: 'Reduce bundle size for dashboard', confidence: 0.86, priority: 'low' },
      { id: 10, type: 'test_case', title: 'Test multi-language support', confidence: 0.90, priority: 'medium' }
    ],
    recentActivity: [
      { id: 1, type: 'test_case', title: 'Login flow test suite', status: 'completed', timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), user: 'John Doe' },
      { id: 2, type: 'bug', title: 'Payment gateway integration issue', status: 'in_progress', timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), user: 'Jane Smith' },
      { id: 3, type: 'automation', title: 'E2E test suite for checkout flow', status: 'completed', timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(), user: 'Mike Johnson' },
      { id: 4, type: 'test_case', title: 'Profile update test', status: 'completed', timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), user: 'Sarah Wilson' },
      { id: 5, type: 'bug', title: 'UI bug in dashboard', status: 'in_progress', timestamp: new Date(Date.now() - 1000 * 60 * 150).toISOString(), user: 'Tom Brown' },
      { id: 6, type: 'test_case', title: 'Signup flow test', status: 'completed', timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(), user: 'Priya Patel' },
      { id: 7, type: 'automation', title: 'API smoke tests', status: 'completed', timestamp: new Date(Date.now() - 1000 * 60 * 210).toISOString(), user: 'Alex Lee' },
      { id: 8, type: 'bug', title: 'Broken link in footer', status: 'in_progress', timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(), user: 'Chris Green' },
      { id: 9, type: 'test_case', title: 'Dark mode UI test', status: 'completed', timestamp: new Date(Date.now() - 1000 * 60 * 270).toISOString(), user: 'Nina Brown' },
      { id: 10, type: 'automation', title: 'Performance regression suite', status: 'completed', timestamp: new Date(Date.now() - 1000 * 60 * 300).toISOString(), user: 'Sam White' }
    ],
    pendingReviews: [
      { id: 1, type: 'test_case', title: 'User profile update tests', status: 'pending_review', timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), assignedTo: 'Sarah Wilson' },
      { id: 2, type: 'bug', title: 'Mobile responsive layout issue', status: 'pending_review', timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(), assignedTo: 'Tom Brown' },
      { id: 3, type: 'automation', title: 'API regression suite', status: 'pending_review', timestamp: new Date(Date.now() - 1000 * 60 * 200).toISOString(), assignedTo: 'Mike Johnson' },
      { id: 4, type: 'test_case', title: 'Accessibility review', status: 'pending_review', timestamp: new Date(Date.now() - 1000 * 60 * 220).toISOString(), assignedTo: 'Priya Patel' },
      { id: 5, type: 'bug', title: '404 error on settings page', status: 'pending_review', timestamp: new Date(Date.now() - 1000 * 60 * 250).toISOString(), assignedTo: 'Chris Green' },
      { id: 6, type: 'automation', title: 'Security scan results', status: 'pending_review', timestamp: new Date(Date.now() - 1000 * 60 * 280).toISOString(), assignedTo: 'Alex Lee' },
      { id: 7, type: 'test_case', title: 'Multi-browser compatibility', status: 'pending_review', timestamp: new Date(Date.now() - 1000 * 60 * 310).toISOString(), assignedTo: 'Nina Brown' },
      { id: 8, type: 'bug', title: 'Slow load on dashboard', status: 'pending_review', timestamp: new Date(Date.now() - 1000 * 60 * 340).toISOString(), assignedTo: 'Sam White' },
      { id: 9, type: 'automation', title: 'Load test review', status: 'pending_review', timestamp: new Date(Date.now() - 1000 * 60 * 370).toISOString(), assignedTo: 'John Doe' },
      { id: 10, type: 'test_case', title: 'Localization review', status: 'pending_review', timestamp: new Date(Date.now() - 1000 * 60 * 400).toISOString(), assignedTo: 'Jane Smith' }
    ],
    quickStats: {
      openBugs: 15,
      testCoverage: 87,
      sprintHealth: 90,
      activeTestCases: 52,
      failedTests: 4,
      pendingReviews: 10
    },
    roleBasedStats: {
      developer: {
        assignedTasks: 7,
        completedTasks: 15,
        codeCoverage: 90,
        pendingReviews: 4,
        openPRs: 3,
        codeReviews: 5
      },
      qa: {
        testCasesCreated: 30,
        bugsReported: 12,
        testCoverage: 94,
        pendingReviews: 6,
        automationScripts: 8,
        failedTests: 2
      },
      pm: {
        activeSprints: 3,
        completedSprints: 5,
        teamVelocity: 88,
        riskItems: 3,
        blockers: 1,
        teamMembers: 12
      }
    }
  };

  res.json(dashboardData);
});

// CRUD for Profile Settings
app.get('/api/settings/profile', async (req, res) => {
  try {
    const data = await fs.readFile(PROFILE_SETTINGS_FILE, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to read profile settings' });
  }
});
app.put('/api/settings/profile', async (req, res) => {
  try {
    await fs.writeFile(PROFILE_SETTINGS_FILE, JSON.stringify(req.body, null, 2), 'utf8');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile settings' });
  }
});

// CRUD for Notification Settings
app.get('/api/settings/notifications', async (req, res) => {
  try {
    const data = await fs.readFile(NOTIFICATION_SETTINGS_FILE, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to read notification settings' });
  }
});
app.put('/api/settings/notifications', async (req, res) => {
  try {
    await fs.writeFile(NOTIFICATION_SETTINGS_FILE, JSON.stringify(req.body, null, 2), 'utf8');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update notification settings' });
  }
});

// CRUD for Integration Settings
app.get('/api/settings/integrations', async (req, res) => {
  try {
    const data = await fs.readFile(INTEGRATION_SETTINGS_FILE, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to read integration settings' });
  }
});
app.put('/api/settings/integrations', async (req, res) => {
  try {
    await fs.writeFile(INTEGRATION_SETTINGS_FILE, JSON.stringify(req.body, null, 2), 'utf8');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update integration settings' });
  }
});

// CRUD for Theme Settings
app.get('/api/settings/theme', async (req, res) => {
  try {
    const data = await fs.readFile(THEME_SETTINGS_FILE, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to read theme settings' });
  }
});
app.put('/api/settings/theme', async (req, res) => {
  try {
    await fs.writeFile(THEME_SETTINGS_FILE, JSON.stringify(req.body, null, 2), 'utf8');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update theme settings' });
  }
});

// CRUD for Onboarding Settings
app.get('/api/settings/onboarding', async (req, res) => {
  try {
    const data = await fs.readFile(ONBOARDING_SETTINGS_FILE, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to read onboarding settings' });
  }
});
app.put('/api/settings/onboarding', async (req, res) => {
  try {
    await fs.writeFile(ONBOARDING_SETTINGS_FILE, JSON.stringify(req.body, null, 2), 'utf8');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update onboarding settings' });
  }
});

// Jira API endpoints
app.post('/api/jira/tasks', async (req, res) => {
  const { summary, description, type } = req.body;

  // Read Jira credentials from applicationsettings.json (nested 'jira' object)
  let jiraSettings;
  try {
    const appSettingsRaw = await fs.readFile(APP_SETTINGS_FILE, 'utf8');
    const appSettings = JSON.parse(appSettingsRaw);
    jiraSettings = {
      baseUrl: appSettings.jira?.url || appSettings.jiraUrl || appSettings.baseUrl,
      email: appSettings.jira?.username || appSettings.jiraUsername || appSettings.email,
      apiToken: appSettings.jira?.apiToken || appSettings.jiraApiToken || appSettings.apiToken,
      projectKey: appSettings.jira?.projectId || appSettings.jiraProjectId || appSettings.projectKey,
    };
    console.log('Jira settings loaded:', jiraSettings);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to read Jira settings from application settings.' });
  }

  // Log which field is missing if incomplete
  if (!jiraSettings.baseUrl || !jiraSettings.email || !jiraSettings.apiToken || !jiraSettings.projectKey) {
    const missing = [];
    if (!jiraSettings.baseUrl) missing.push('baseUrl');
    if (!jiraSettings.email) missing.push('email');
    if (!jiraSettings.apiToken) missing.push('apiToken');
    if (!jiraSettings.projectKey) missing.push('projectKey');
    console.log('Jira settings are incomplete:', jiraSettings, 'Missing:', missing);
    return res.status(400).json({ error: `Jira settings are incomplete. Missing: ${missing.join(', ')}` });
  }

  // Determine issue type
  let issueType = 'Task';
  if (type && ['Task', 'Bug', 'Story'].includes(type)) {
    issueType = type;
  }

  // Always use uppercase project key for Jira
  const projectKeyUpper = jiraSettings.projectKey.toUpperCase();

  try {
    const payload = {
      fields: {
        project: { key: projectKeyUpper },
        summary,
        description: {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: description || ''
                }
              ]
            }
          ]
        },
        issuetype: { name: issueType }
      }
    };
    console.log('Jira create issue payload:', JSON.stringify(payload, null, 2));
    const openai = new OpenAIApi(new Configuration({ apiKey: jiraSettings.apiToken }));
    const completion = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: JSON.stringify(payload) }
      ],
      max_tokens: 512
    });
    res.json(JSON.parse(completion.data.choices[0].message.content));
  } catch (error) {
    console.error('Jira create issue error:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

app.post('/api/jira/stories', (req, res) => {
  const { summary, description, acceptance } = req.body;
  
  // Mock Jira story creation
  const story = {
    id: `STORY-${Date.now()}`,
    key: `STORY-${Date.now()}`,
    summary,
    description,
    acceptance,
    type: 'User Story',
    status: 'To Do',
    created: new Date().toISOString(),
    assignee: null
  };
  
  res.json(story);
});

// Get Jira settings
app.get('/api/settings/jira', async (req, res) => {
  try {
    const data = await fs.readFile(JIRA_SETTINGS_FILE, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to read Jira settings' });
  }
});

// Update Jira settings
app.put('/api/settings/jira', async (req, res) => {
  try {
    await fs.writeFile(JIRA_SETTINGS_FILE, JSON.stringify(req.body, null, 2), 'utf8');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update Jira settings' });
  }
});

// Link test case/bug to Jira
app.post('/api/jira/link', async (req, res) => {
  const { type, id, jiraKey } = req.body;
  
  // Mock Jira linking
  const link = {
    id: `LINK-${Date.now()}`,
    type,
    zapId: id,
    jiraKey,
    status: 'linked',
    lastSynced: new Date().toISOString()
  };
  
  res.json(link);
});

// Bulk link to Jira
app.post('/api/jira/bulk-link', async (req, res) => {
  const { items } = req.body;
  
  // Mock bulk linking
  const links = items.map(item => ({
    id: `LINK-${Date.now()}-${item.id}`,
    type: item.type,
    zapId: item.id,
    jiraKey: item.jiraKey,
    status: 'linked',
    lastSynced: new Date().toISOString()
  }));
  
  res.json(links);
});

// Get Jira issue details
app.get('/api/jira/issues/:key', async (req, res) => {
  const { key } = req.params;
  
  // Mock Jira issue data
  const issue = {
    key,
    summary: 'Sample Jira Issue',
    description: 'This is a sample Jira issue description',
    status: 'In Progress',
    assignee: 'John Doe',
    created: new Date().toISOString(),
    updated: new Date().toISOString()
  };
  
  res.json(issue);
});

// Update Jira issue status and assignee
app.put('/api/jira/issues/:issueKey', async (req, res) => {
  const { issueKey } = req.params;
  const { status, assignee } = req.body;

  // Load Jira credentials from applicationsettings.json
  const appSettingsRaw = await fs.readFile(APP_SETTINGS_FILE, 'utf8');
  const appSettings = JSON.parse(appSettingsRaw);
  const jiraBaseUrl = appSettings.jira?.url?.replace(/\/$/, '') || '';
  const jiraEmail = appSettings.jira?.username || '';
  const jiraApiToken = appSettings.jira?.apiToken || '';

  try {
    // 1. Update assignee (if provided)
    if (assignee) {
      // Get user accountId by displayName (for Jira Cloud)
      const usersRes = await axios.get(
        `${jiraBaseUrl}/rest/api/3/user/search?query=${encodeURIComponent(assignee)}`,
        { auth: { username: jiraEmail, password: jiraApiToken } }
      );
      const user = usersRes.data.find(u => u.displayName === assignee);
      if (user) {
        await axios.put(
          `${jiraBaseUrl}/rest/api/3/issue/${issueKey}/assignee`,
          { accountId: user.accountId },
          { auth: { username: jiraEmail, password: jiraApiToken } }
        );
      }
    }

    // 2. Update status (transition)
    if (status) {
      // Get available transitions
      const transitionsRes = await axios.get(
        `${jiraBaseUrl}/rest/api/3/issue/${issueKey}/transitions`,
        { auth: { username: jiraEmail, password: jiraApiToken } }
      );
      const transition = transitionsRes.data.transitions.find(t => t.name === status);
      if (transition) {
        await axios.post(
          `${jiraBaseUrl}/rest/api/3/issue/${issueKey}/transitions`,
          { transition: { id: transition.id } },
          { auth: { username: jiraEmail, password: jiraApiToken } }
        );
      }
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper to get OpenAI config
async function getOpenAIConfig() {
  const appSettingsRaw = await fs.readFile(APP_SETTINGS_FILE, 'utf8');
  const appSettings = JSON.parse(appSettingsRaw);
  const openaiApiKey = appSettings.openai?.apiKey || appSettings.openAiApiKey;
  const openaiModel = appSettings.openai?.model || appSettings.openAiModel || 'gpt-4';
  return { apiKey: openaiApiKey, model: openaiModel };
}

// Helper to get SmartChecklist enabled
async function isSmartChecklistEnabled() {
  try {
    const jiraSettingsRaw = await fs.readFile(JIRA_SETTINGS_FILE, 'utf8');
    const jiraSettings = JSON.parse(jiraSettingsRaw);
    return jiraSettings.smartChecklistEnabled === true;
  } catch {
    return false;
  }
}

// Helper to call OpenAI
async function callOpenAI(prompt, detail) {
  const { apiKey, model } = await getOpenAIConfig();
  const openai = new OpenAIApi(new Configuration({ apiKey }));
  console.log('Calling OpenAI with prompt:', prompt);
  console.log('User detail:', detail);
  const completion = await openai.createChatCompletion({
    model,
    messages: [
      { role: 'system', content: prompt },
      { role: 'user', content: detail }
    ],
    max_tokens: 512
  });
  const aiResult = completion.data.choices[0].message.content;
  return aiResult;
}

// Helper to create Jira issue
async function createJiraIssue({ summary, description, type, parent }) {
  const appSettingsRaw = await fs.readFile(APP_SETTINGS_FILE, 'utf8');
  const appSettings = JSON.parse(appSettingsRaw);
  const jiraSettings = {
    baseUrl: appSettings.jira?.url,
    email: appSettings.jira?.username,
    apiToken: appSettings.jira?.apiToken,
    projectKey: appSettings.jira?.projectId,
  };
  const projectKeyUpper = jiraSettings.projectKey.toUpperCase();
  const payload = {
    fields: {
      project: { key: projectKeyUpper },
      summary,
      description: {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: description }
            ]
          }
        ]
      },
      issuetype: { name: type }
    }
  };

  // Add parent field for sub-tasks
  if (type === 'Sub-task' && parent) {
    payload.fields.parent = { key: parent };
  }

  console.log('Sending payload to Jira:', JSON.stringify(payload, null, 2));
  try {
    const response = await axios.post(
      `${jiraSettings.baseUrl.replace(/\/$/, '')}/rest/api/3/issue`,
      payload,
      {
        auth: { username: jiraSettings.email, password: jiraSettings.apiToken },
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Jira API error:', error.response?.data || error.message);
    if (error.response) {
      console.error('Jira API status:', error.response.status);
      console.error('Jira API headers:', error.response.headers);
    }
    throw error;
  }
}

// Helper to link Jira issues
async function linkJiraIssues(newKey, issueId, type = 'Relates') {
  const appSettingsRaw = await fs.readFile(APP_SETTINGS_FILE, 'utf8');
  const appSettings = JSON.parse(appSettingsRaw);
  const jiraSettings = {
    baseUrl: appSettings.jira?.url,
    email: appSettings.jira?.username,
    apiToken: appSettings.jira?.apiToken,
  };
  const payload = {
    type: { name: type },
    inwardIssue: { key: newKey },
    outwardIssue: { key: issueId }
  };
  try {
    await axios.post(
      `${jiraSettings.baseUrl.replace(/\/$/, '')}/rest/api/3/issueLink`,
      payload,
      {
        auth: { username: jiraSettings.email, password: jiraSettings.apiToken },
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Jira Link API error:', error.response?.data || error.message);
    if (error.response) {
      console.error('Jira Link API status:', error.response.status);
      console.error('Jira Link API headers:', error.response.headers);
    }
    throw error;
  }
}

// AI Bug endpoint
app.post('/api/ai/bug', async (req, res) => {
  const { issueId, summary, detail } = req.body;
  try {
    const prompt = `You are the expert QA engineer. Create the bug with this details: ${detail}. Add detail, steps to reproduce, expected and actual result.`;
    const aiResult = await callOpenAI(prompt, detail);
    // For simplicity, use the AI result as the description
    const jiraIssue = await createJiraIssue({ summary, description: aiResult, type: 'Bug' });
    if (issueId) {
      await linkJiraIssues(jiraIssue.key, issueId);
    }
    res.json({ success: true, key: jiraIssue.key });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to create bug via AI' });
  }
});

// AI User Story endpoint
app.post('/api/ai/story', async (req, res) => {
  const { issueId, summary, detail } = req.body;
  try {
    const smartChecklist = await isSmartChecklistEnabled();
    let prompt = `You are the expert project manager/product owner. Create the user story with business rules, technical requirement, and Acceptance Criteria.`;
    if (smartChecklist) {
      prompt += ' Format Acceptance Criteria as a checklist.';
    }
    const aiResult = await callOpenAI(prompt, detail);
    const jiraIssue = await createJiraIssue({ summary, description: aiResult, type: 'Story' });
    if (issueId) {
      await linkJiraIssues(jiraIssue.key, issueId);
    }
    res.json({ success: true, key: jiraIssue.key });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to create user story via AI' });
  }
});

// Add task creation endpoint
app.post('/api/ai/task', async (req, res) => {
  try {
    const { issueId, summary, detail } = req.body;
    console.log('Creating task with:', { issueId, summary, detail });

    // Call OpenAI to enhance the task description
    const prompt = `You are an expert developer. Create a detailed task for this requirement. Include:
1. Technical details and architecture considerations
2. Implementation logic and approach
3. Required dependencies and libraries
4. Potential challenges and solutions
5. Code structure and organization

User's requirement:
Summary: ${summary}
Detail: ${detail}`;

    console.log('Calling OpenAI with prompt:', prompt);
    const enhancedDescription = await callOpenAI(prompt, detail);
    console.log('OpenAI response:', enhancedDescription);

    // Create Jira task
    const jiraResponse = await createJiraIssue({
      summary,
      description: enhancedDescription,
      type: 'Task'
    });
    console.log('Jira response:', jiraResponse);

    // Link to parent issue if provided
    if (issueId) {
      await linkJiraIssues(issueId, jiraResponse.key);
      console.log(`Linked ${jiraResponse.key} to ${issueId}`);
    }

    res.json({ key: jiraResponse.key, status: 'success' });
  } catch (error) {
    console.error('Error in /api/ai/task:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add sub-task creation endpoint
app.post('/api/ai/subtask', async (req, res) => {
  try {
    const { issueId, summary, detail } = req.body;
    console.log('Creating sub-task with:', { issueId, summary, detail });

    if (!issueId) {
      return res.status(400).json({ error: 'Parent issue ID is required for sub-task creation' });
    }

    // Call OpenAI to enhance the sub-task description
    const prompt = `You are an expert developer. Create a detailed sub-task for this requirement. Include:
1. Technical details and implementation steps
2. Dependencies and prerequisites
3. Expected outcomes
4. Any specific considerations

User's requirement:
Summary: ${summary}
Detail: ${detail}`;

    console.log('Calling OpenAI with prompt:', prompt);
    const enhancedDescription = await callOpenAI(prompt, detail);
    console.log('OpenAI response:', enhancedDescription);

    // Create Jira sub-task
    const jiraResponse = await createJiraIssue({
      summary,
      description: enhancedDescription,
      type: 'Sub-task',
      parent: issueId
    });
    console.log('Jira response:', jiraResponse);

    res.json({ key: jiraResponse.key, status: 'success' });
  } catch (error) {
    console.error('Error in /api/ai/subtask:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to get board ID for a project
async function getBoardIdForProject(projectId, jiraBaseUrl, jiraEmail, jiraApiToken) {
  try {
    // First, get all boards
    const boardsRes = await axios.get(
      `${jiraBaseUrl}/rest/agile/1.0/board`,
      { 
        auth: { username: jiraEmail, password: jiraApiToken },
        params: { projectKeyOrId: projectId }
      }
    );

    // DEBUG: Print all boards returned
    console.log(`Boards returned for project ${projectId}:`, JSON.stringify(boardsRes.data, null, 2));

    // Get the first board for the project (ignore type)
    const activeBoard = boardsRes.data.values.find(board => 
      board.location?.projectKey === projectId
    );

    if (!activeBoard) {
      throw new Error(`No active board found for project ${projectId}`);
    }

    console.log(`Found board ID ${activeBoard.id} for project ${projectId}`);
    return activeBoard.id;
  } catch (error) {
    console.error('Error fetching board ID:', error);
    throw error;
  }
}

// Update the sprint endpoint to use dynamic board ID
app.get('/api/jira/projects/:projectId/sprint/current', async (req, res) => {
  try {
    // Load Jira credentials from applicationsettings.json
    const appSettingsRaw = await fs.readFile(APP_SETTINGS_FILE, 'utf8');
    const appSettings = JSON.parse(appSettingsRaw);
    const jiraBaseUrl = appSettings.jira?.url?.replace(/\/$/, '') || '';
    const jiraEmail = appSettings.jira?.username || '';
    const jiraApiToken = appSettings.jira?.apiToken || '';
    
    // Get board ID dynamically
    const boardId = await getBoardIdForProject(
      req.params.projectId,
      jiraBaseUrl,
      jiraEmail,
      jiraApiToken
    );

    console.log(`Using boardId ${boardId} for project ${req.params.projectId}`);

    // 1. Get active sprints for the board
    const sprintsRes = await axios.get(
      `${jiraBaseUrl}/rest/agile/1.0/board/${boardId}/sprint?state=active`,
      { auth: { username: jiraEmail, password: jiraApiToken } }
    );
    const activeSprint = sprintsRes.data.values[0];
    if (!activeSprint) return res.status(404).json({ error: 'No active sprint' });

    // 2. Get issues for the active sprint
    const issuesRes = await axios.get(
      `${jiraBaseUrl}/rest/agile/1.0/sprint/${activeSprint.id}/issue`,
      { auth: { username: jiraEmail, password: jiraApiToken } }
    );

    // 3. Map and return the data
    res.json({
      id: activeSprint.id,
      name: activeSprint.name,
      state: activeSprint.state,
      startDate: activeSprint.startDate,
      endDate: activeSprint.endDate,
      goal: activeSprint.goal,
      issues: issuesRes.data.issues.map(issue => ({
        id: issue.key,
        summary: issue.fields.summary,
        status: issue.fields.status.name,
        assignee: issue.fields.assignee?.displayName || '',
        type: issue.fields.issuetype.name
      }))
    });
  } catch (err) {
    console.error('Error fetching sprint data:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update sprint issues (PATCH or PUT)
app.put('/api/jira/projects/:projectId/sprint/current', async (req, res) => {
  const sprintPath = path.join(__dirname, 'data', 'mysprint.json');
  try {
    await fs.writeFile(sprintPath, JSON.stringify(req.body, null, 2));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update sprint data' });
  }
});

// Create Test Case via OpenAI and Jira
app.post('/api/ai/create-test-case', async (req, res) => {
  const { issueKey, action } = req.body;
  if (!issueKey || action !== 'Create Test Case') {
    console.log('[create-test-case] Invalid parameters:', req.body);
    return res.status(400).json({ error: 'Missing or invalid parameters' });
  }

  // Load Jira credentials and OpenAI config from applicationsettings.json
  const appSettingsRaw = await fs.readFile(APP_SETTINGS_FILE, 'utf8');
  const appSettings = JSON.parse(appSettingsRaw);
  const jiraBaseUrl = appSettings.jira?.url?.replace(/\/$/, '') || '';
  const jiraEmail = appSettings.jira?.username || '';
  const jiraApiToken = appSettings.jira?.apiToken || '';
  const projectKey = appSettings.jira?.projectId || '';
  const openaiApiKey = appSettings.openai?.apiKey;
  const openaiModel = appSettings.openai?.model || 'gpt-4';

  // Load prompt from file
  console.log('[create-test-case] [Step 2] Reading OpenAI prompt from file...');
  const promptsRaw = await fs.readFile(PROMPTS_FILE, 'utf8');
  const prompts = JSON.parse(promptsRaw);
  const testCasePrompt = prompts.createTestCase;

  try {
    // 1. Fetch user story details from Jira
    console.log(`[create-test-case] [Step 1] Fetching Jira story: ${issueKey}`);
    const storyRes = await axios.get(
      `${jiraBaseUrl}/rest/api/3/issue/${issueKey}`,
      { auth: { username: jiraEmail, password: jiraApiToken } }
    );
    const story = storyRes.data;
    const storySummary = story.fields.summary;
    const storyDescription = story.fields.description?.content?.map(c => c.content?.map(cc => cc.text).join(' ')).join('\n') || '';
    console.log('[create-test-case] [Step 1] Jira story summary:', storySummary);
    console.log('[create-test-case] [Step 1] Jira story description:', storyDescription);

    // 2. Combine details and prompt
    const prompt = `${testCasePrompt}\nSummary: ${storySummary}\nDescription: ${storyDescription}`;
    console.log('[create-test-case] [Step 2] Combined prompt for OpenAI:', prompt);

    // 3. Send to OpenAI
    const openai = new OpenAI({ apiKey: openaiApiKey });
    console.log('[create-test-case] [Step 3] Sending prompt to OpenAI...');
    const openaiRes = await openai.chat.completions.create({
      model: openaiModel,
      messages: [
        { role: 'system', content: 'You are an expert QA engineer. Generate a detailed test case for the following Jira user story.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 512
    });
    const openaiTestCase = openaiRes.choices[0].message.content;
    console.log('[create-test-case] [Step 3] OpenAI response:', openaiTestCase);

    // Save OpenAI response to file
    await fs.writeFile(
      path.join(__dirname, 'data', 'openairesponce.json'),
      JSON.stringify({ prompt, response: openaiTestCase, timestamp: new Date().toISOString() }, null, 2)
    );
    console.log('[create-test-case] [Step 3] OpenAI response saved to openairesponce.json');

    // 4. Create Jira test case
    const adfDescription = {
      type: "doc",
      version: 1,
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: openaiTestCase
            }
          ]
        }
      ]
    };
    const payload = {
      fields: {
        project: { key: projectKey.toUpperCase() },
        summary: `Test Case: ${storySummary}`,
        description: adfDescription,
        issuetype: { name: 'Task' }
      }
    };
    // Add parent field for sub-tasks
    if (issueType === 'Sub-task') {
      payload.fields.parent = { key: issueKey };
    }
    console.log('[create-test-case] [Step 4] Payload (UPPERCASE):', JSON.stringify(payload, null, 2));
    try {
      console.log('[create-test-case] [Step 4] Creating Jira test case (UPPERCASE project key)...');
      const testCaseRes = await axios.post(
        `${jiraBaseUrl}/rest/api/3/issue`,
        payload,
        { auth: { username: jiraEmail, password: jiraApiToken } }
      );
      const testCaseKey = testCaseRes.data.key;
      console.log('[create-test-case] [Step 4] Created Jira test case:', testCaseKey);
      // 5. Link test case to user story
      console.log(`[create-test-case] [Step 5] Linking test case ${testCaseKey} to story ${issueKey}...`);
      await axios.post(
        `${jiraBaseUrl}/rest/api/3/issueLink`,
        {
          type: { name: 'Relates' },
          inwardIssue: { key: testCaseKey },
          outwardIssue: { key: issueKey }
        },
        { auth: { username: jiraEmail, password: jiraApiToken } }
      );
      console.log('[create-test-case] [Step 5] Link created successfully.');
      // 6. Respond to frontend
      console.log('[create-test-case] [Step 6] Responding to frontend with Jira id:', testCaseKey);
      return res.json({ jiraId: testCaseKey });
    } catch (err) {
      if (err.response && err.response.data) {
        console.error('[create-test-case] Jira error response (UPPERCASE):', JSON.stringify(err.response.data, null, 2));
      }
      // Try lowercase project key as fallback
      const payloadLower = {
        fields: {
          project: { key: projectKey.toLowerCase() },
          summary: `Test Case: ${storySummary}`,
          description: openaiTestCase,
          issuetype: { name: 'Task' }
        }
      };
      // Add parent field for sub-tasks in lowercase payload
      if (issueType === 'Sub-task') {
        payloadLower.fields.parent = { key: issueKey };
      }
      console.log('[create-test-case] [Step 4] Payload (lowercase):', JSON.stringify(payloadLower, null, 2));
      try {
        console.log('[create-test-case] [Step 4] Creating Jira test case (lowercase project key)...');
        const testCaseRes = await axios.post(
          `${jiraBaseUrl}/rest/api/3/issue`,
          payloadLower,
          { auth: { username: jiraEmail, password: jiraApiToken } }
        );
        const testCaseKey = testCaseRes.data.key;
        console.log('[create-test-case] [Step 4] Created Jira test case (lowercase):', testCaseKey);
        // 5. Link test case to user story
        console.log(`[create-test-case] [Step 5] Linking test case ${testCaseKey} to story ${issueKey}...`);
        await axios.post(
          `${jiraBaseUrl}/rest/api/3/issueLink`,
          {
            type: { name: 'Relates' },
            inwardIssue: { key: testCaseKey },
            outwardIssue: { key: issueKey }
          },
          { auth: { username: jiraEmail, password: jiraApiToken } }
        );
        console.log('[create-test-case] [Step 5] Link created successfully.');
        // 6. Respond to frontend
        console.log('[create-test-case] [Step 6] Responding to frontend with Jira id:', testCaseKey);
        return res.json({ jiraId: testCaseKey });
      } catch (err2) {
        if (err2.response && err2.response.data) {
          console.error('[create-test-case] Jira error response (lowercase):', JSON.stringify(err2.response.data, null, 2));
        }
        console.error('[create-test-case] ERROR:', err2.stack || err2.message || err2);
        return res.status(500).json({ error: err2.message });
      }
    }
  } catch (err) {
    if (err.response && err.response.data) {
      console.error('[create-test-case] Jira error response:', JSON.stringify(err.response.data, null, 2));
    }
    console.error('[create-test-case] ERROR:', err.stack || err.message || err);
    res.status(500).json({ error: err.message });
  }
});

// Create Issue via OpenAI and Jira
app.post('/api/ai/create-issue', async (req, res) => {
  const { issueKey, action, userInput } = req.body;
  if (!issueKey || !['Create Test Case', 'Create Bug', 'Create Task', 'Create Sub Task', 'Create sub Task'].includes(action)) {
    console.log('[create-issue] Invalid parameters:', req.body);
    return res.status(400).json({ error: 'Missing or invalid parameters' });
  }

  // Load Jira credentials and OpenAI config from applicationsettings.json
  const appSettingsRaw = await fs.readFile(APP_SETTINGS_FILE, 'utf8');
  const appSettings = JSON.parse(appSettingsRaw);
  const jiraBaseUrl = appSettings.jira?.url?.replace(/\/$/, '') || '';
  const jiraEmail = appSettings.jira?.username || '';
  const jiraApiToken = appSettings.jira?.apiToken || '';
  const projectKey = appSettings.jira?.projectId || '';
  const openaiApiKey = appSettings.openai?.apiKey;
  const openaiModel = appSettings.openai?.model || 'gpt-4';

  // Load prompts from file
  console.log('[create-issue] Reading OpenAI prompts from file...');
  const promptsRaw = await fs.readFile(PROMPTS_FILE, 'utf8');
  const prompts = JSON.parse(promptsRaw);

  // Select prompt and issue type
  let promptTemplate, issueType;
  if (action === 'Create Test Case') {
    promptTemplate = prompts.createTestCase;
    issueType = 'Task';
  } else if (action === 'Create Bug') {
    promptTemplate = prompts.createBug || 'Generate a detailed bug report for the following Jira user story.';
    issueType = 'Bug';
  } else if (action === 'Create Task') {
    promptTemplate = prompts.createTask || 'Generate a detailed task for the following Jira user story.';
    issueType = 'Task';
  } else if (action === 'Create Sub Task' || action === 'Create sub Task') {
    promptTemplate = prompts.createSubTask || 'Generate a detailed sub-task for the following Jira user story.';
    issueType = 'Sub-task';
  }
  console.log(`[create-issue] Using action: ${action}, issueType: ${issueType}`);
  console.log('[create-issue] Using prompt:', promptTemplate);

  try {
    let storySummary = '', storyDescription = '';
    let prompt;
    // For Bug/Sub Task with userInput, do not fetch user story details
    if ((action === 'Create Bug' || action === 'Create Sub Task' || action === 'Create sub Task') && userInput) {
      prompt = `${promptTemplate}\nUser Input: ${userInput}`;
      storySummary = userInput.split('\n')[0] || '';
    } else {
      // 1. Fetch user story details from Jira
      console.log(`[create-issue] [Step 1] Fetching Jira story: ${issueKey}`);
      const storyRes = await axios.get(
        `${jiraBaseUrl}/rest/api/3/issue/${issueKey}`,
        { auth: { username: jiraEmail, password: jiraApiToken } }
      );
      const story = storyRes.data;
      storySummary = story.fields.summary;
      storyDescription = story.fields.description?.content?.map(c => c.content?.map(cc => cc.text).join(' ')).join('\n') || '';
      console.log('[create-issue] [Step 1] Jira story summary:', storySummary);
      console.log('[create-issue] [Step 1] Jira story description:', storyDescription);
      // 2. Combine details and prompt
      prompt = `${promptTemplate}\nSummary: ${storySummary}\nDescription: ${storyDescription}`;
    }
    console.log('[create-issue] [Step 2] Combined prompt for OpenAI:', prompt);

    // 3. Send to OpenAI
    const openai = new OpenAI({ apiKey: openaiApiKey });
    console.log('[create-issue] [Step 3] Sending prompt to OpenAI...');
    const openaiRes = await openai.chat.completions.create({
      model: openaiModel,
      messages: [
        { role: 'system', content: `You are an expert QA engineer. Generate a detailed ${issueType.toLowerCase()} for the following Jira user story.` },
        { role: 'user', content: prompt }
      ],
      max_tokens: 512
    });
    const openaiContent = openaiRes.choices[0].message.content;
    console.log('[create-issue] [Step 3] OpenAI response:', openaiContent);

    // Save OpenAI response to file
    await fs.writeFile(
      path.join(__dirname, 'data', 'openairesponce.json'),
      JSON.stringify({ prompt, response: openaiContent, timestamp: new Date().toISOString() }, null, 2)
    );
    console.log('[create-issue] [Step 3] OpenAI response saved to openairesponce.json');

    // 4. Create Jira issue (ADF for description)
    const adfDescription = {
      type: "doc",
      version: 1,
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: openaiContent
            }
          ]
        }
      ]
    };
    const payload = {
      fields: {
        project: { key: projectKey.toUpperCase() },
        summary: `${issueType}: ${storySummary}`,
        description: adfDescription,
        issuetype: { name: issueType }
      }
    };
    // Add parent field for sub-tasks
    if (issueType === 'Sub-task') {
      payload.fields.parent = { key: issueKey };
    }
    console.log('[create-issue] [Step 4] Payload (UPPERCASE):', JSON.stringify(payload, null, 2));
    try {
      console.log(`[create-issue] [Step 4] Creating Jira ${issueType} (UPPERCASE project key)...`);
      const issueRes = await axios.post(
        `${jiraBaseUrl}/rest/api/3/issue`,
        payload,
        { auth: { username: jiraEmail, password: jiraApiToken } }
      );
      const newIssueKey = issueRes.data.key;
      console.log(`[create-issue] [Step 4] Created Jira ${issueType}:`, newIssueKey);
      // 5. Link new issue to user story
      console.log(`[create-issue] [Step 5] Linking ${issueType} ${newIssueKey} to story ${issueKey}...`);
      await axios.post(
        `${jiraBaseUrl}/rest/api/3/issueLink`,
        {
          type: { name: 'Relates' },
          inwardIssue: { key: newIssueKey },
          outwardIssue: { key: issueKey }
        },
        { auth: { username: jiraEmail, password: jiraApiToken } }
      );
      console.log(`[create-issue] [Step 5] Link created successfully.`);
      // 6. Respond to frontend
      console.log(`[create-issue] [Step 6] Responding to frontend with Jira id:`, newIssueKey);
      // Save to mysprint-actions.json
      const actionLog = {
        jiraId: newIssueKey,
        issueType,
        summary: `${issueType}: ${storySummary}`,
        parentKey: issueKey,
        timestamp: new Date().toISOString(),
        action,
      };
      try {
        const actionsData = await fs.readFile(MYSPRINT_ACTIONS_FILE, 'utf8');
        const actionsArr = JSON.parse(actionsData);
        actionsArr.push(actionLog);
        await fs.writeFile(MYSPRINT_ACTIONS_FILE, JSON.stringify(actionsArr, null, 2));
      } catch (err) {
        console.error('[mysprint-actions] Failed to log action:', err);
      }
      return res.json({ jiraId: newIssueKey });
    } catch (err) {
      if (err.response && err.response.data) {
        console.error('[create-issue] Jira error response (UPPERCASE):', JSON.stringify(err.response.data, null, 2));
      }
      // Try lowercase project key as fallback
      const payloadLower = {
        fields: {
          project: { key: projectKey.toLowerCase() },
          summary: `${issueType}: ${storySummary}`,
          description: adfDescription,
          issuetype: { name: issueType }
        }
      };
      // Add parent field for sub-tasks in lowercase payload
      if (issueType === 'Sub-task') {
        payloadLower.fields.parent = { key: issueKey };
      }
      console.log('[create-issue] [Step 4] Payload (lowercase):', JSON.stringify(payloadLower, null, 2));
      try {
        console.log(`[create-issue] [Step 4] Creating Jira ${issueType} (lowercase project key)...`);
        const issueRes = await axios.post(
          `${jiraBaseUrl}/rest/api/3/issue`,
          payloadLower,
          { auth: { username: jiraEmail, password: jiraApiToken } }
        );
        const newIssueKey = issueRes.data.key;
        console.log(`[create-issue] [Step 4] Created Jira ${issueType} (lowercase):`, newIssueKey);
        // 5. Link new issue to user story
        console.log(`[create-issue] [Step 5] Linking ${issueType} ${newIssueKey} to story ${issueKey}...`);
        await axios.post(
          `${jiraBaseUrl}/rest/api/3/issueLink`,
          {
            type: { name: 'Relates' },
            inwardIssue: { key: newIssueKey },
            outwardIssue: { key: issueKey }
          },
          { auth: { username: jiraEmail, password: jiraApiToken } }
        );
        console.log(`[create-issue] [Step 5] Link created successfully.`);
        // 6. Respond to frontend
        console.log(`[create-issue] [Step 6] Responding to frontend with Jira id:`, newIssueKey);
        // Save to mysprint-actions.json
        const actionLogLower = {
          jiraId: newIssueKey,
          issueType,
          summary: `${issueType}: ${storySummary}`,
          parentKey: issueKey,
          timestamp: new Date().toISOString(),
          action,
        };
        try {
          const actionsData = await fs.readFile(MYSPRINT_ACTIONS_FILE, 'utf8');
          const actionsArr = JSON.parse(actionsData);
          actionsArr.push(actionLogLower);
          await fs.writeFile(MYSPRINT_ACTIONS_FILE, JSON.stringify(actionsArr, null, 2));
        } catch (err) {
          console.error('[mysprint-actions] Failed to log action:', err);
        }
        return res.json({ jiraId: newIssueKey });
      } catch (err2) {
        if (err2.response && err2.response.data) {
          console.error('[create-issue] Jira error response (lowercase):', JSON.stringify(err2.response.data, null, 2));
        }
        console.error('[create-issue] ERROR:', err2.stack || err2.message || err2);
        return res.status(500).json({ error: err2.message });
      }
    }
  } catch (err) {
    if (err.response && err.response.data) {
      console.error('[create-issue] Jira error response:', JSON.stringify(err.response.data, null, 2));
    }
    console.error('[create-issue] ERROR:', err.stack || err.message || err);
    res.status(500).json({ error: err.message });
  }
});

// GET all My Sprint actions
app.get('/api/mysprint-actions', async (req, res) => {
  try {
    const data = await fs.readFile(MYSPRINT_ACTIONS_FILE, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to read mysprint actions' });
  }
});

// POST a new My Sprint action (for testing/manual use)
app.post('/api/mysprint-actions', async (req, res) => {
  try {
    const data = await fs.readFile(MYSPRINT_ACTIONS_FILE, 'utf8');
    const actions = JSON.parse(data);
    const newAction = { ...req.body, timestamp: new Date().toISOString() };
    actions.push(newAction);
    await fs.writeFile(MYSPRINT_ACTIONS_FILE, JSON.stringify(actions, null, 2));
    res.json(newAction);
  } catch (error) {
    res.status(500).json({ error: 'Failed to write mysprint action' });
  }
});

// Endpoint to update Jira projectId in applicationsettings.json
app.put('/api/jira/project', async (req, res) => {
  const { projectId } = req.body;
  if (!projectId) {
    return res.status(400).json({ error: 'projectId is required' });
  }
  try {
    const appSettingsRaw = await fs.readFile(APP_SETTINGS_FILE, 'utf8');
    const appSettings = JSON.parse(appSettingsRaw);
    appSettings.jira = appSettings.jira || {};
    appSettings.jira.projectId = projectId;
    await fs.writeFile(APP_SETTINGS_FILE, JSON.stringify(appSettings, null, 2), 'utf8');
    res.json({ success: true, projectId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update Jira projectId' });
  }
});

// Endpoint to get all Jira projects (for dropdown)
app.get('/api/jira/projects', async (req, res) => {
  try {
    const appSettingsRaw = await fs.readFile(APP_SETTINGS_FILE, 'utf8');
    const appSettings = JSON.parse(appSettingsRaw);
    const jiraBaseUrl = appSettings.jira?.url?.replace(/\/$/, '') || '';
    const jiraEmail = appSettings.jira?.username || '';
    const jiraApiToken = appSettings.jira?.apiToken || '';

    const projectsRes = await axios.get(
      `${jiraBaseUrl}/rest/api/3/project/search`,
      { auth: { username: jiraEmail, password: jiraApiToken } }
    );
    // Return only key and name for dropdown
    const projects = (projectsRes.data.values || projectsRes.data.projects || projectsRes.data).map(p => ({
      key: p.key,
      name: p.name
    }));
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch Jira projects' });
  }
});

// User login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const userDataPath = path.join(__dirname, 'data', 'userdata.json');
    const usersRaw = await fs.readFile(userDataPath, 'utf8');
    const users = JSON.parse(usersRaw);
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    if (!user.verified) {
      return res.json({ verified: false });
    }
    // Don't send password back
    const { password: _, ...userWithoutPassword } = user;
    return res.json({ verified: true, ...userWithoutPassword });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// DELETE Automated Test History (manual-tests.json)
app.delete('/api/automated-tests', async (req, res) => {
  try {
    const filePath = path.join(__dirname, '../automation-backend/manual-tests.json');
    const { ids } = req.body; // ids: array of test ids to delete
    const data = await fs.readFile(filePath, 'utf8');
    let tests = JSON.parse(data);
    if (Array.isArray(ids)) {
      tests = tests.filter(test => !ids.includes(test.id));
    } else if (typeof ids === 'string' || typeof ids === 'number') {
      tests = tests.filter(test => test.id !== ids);
    }
    await fs.writeFile(filePath, JSON.stringify(tests, null, 2));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete automated test(s)' });
  }
});

// DELETE Automation Test Run Report (automationrunlogs.json)
app.delete('/api/automation-test-runs', async (req, res) => {
  try {
    const filePath = path.join(__dirname, '../automation-backend/automationrunlogs.json');
    const { ids } = req.body; // ids: array of run ids to delete
    const data = await fs.readFile(filePath, 'utf8');
    let runs = JSON.parse(data);
    if (Array.isArray(ids)) {
      runs = runs.filter(run => !ids.includes(run.id));
    } else if (typeof ids === 'string' || typeof ids === 'number') {
      runs = runs.filter(run => run.id !== ids);
    }
    await fs.writeFile(filePath, JSON.stringify(runs, null, 2));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete automation test run(s)' });
  }
});

// Initialize server
const startServer = async () => {
  await ensureDataDir();
  await initActivityLogs();
  await initProjectMgt();
  await initJiraSettings();
  await initMySprintActions();
  app.listen(PORT, () => {
    console.log(`Mock API server running at http://localhost:${PORT}`);
  });
};

startServer(); 