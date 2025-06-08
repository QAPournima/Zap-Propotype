import { http } from 'msw';
// import testCases from '../mock-data/test-cases.json';
// import bugs from '../mock-data/bugs.json';
import dashboardData from '../mock-data/dashboard';
import activityLogs from '../mock-data/activityLogs.json';
import mysprintActions from '../mock-data/mysprint-actions.json';
import manualTests from '../mock-data/manual-tests.json';
import automationRunLogs from '../mock-data/automationrunlogs.json';
import jiraProjects from '../mock-data/jiraProjects.json';
import sprintIssues from '../mock-data/sprintIssues.json';

// Module-level counter for create-issue calls
let createIssueCallCount = 0;

export const handlers = [
  // Mock GET /api/test-cases
  // http.get('/api/test-cases', (req, res, ctx) => {
  //   return res(ctx.status(200), ctx.json(testCases));
  // }),

  // Mock GET /api/bugs
  // http.get('/api/bugs', (req, res, ctx) => {
  //   return res(ctx.status(200), ctx.json(bugs));
  // }),

  // Mock POST /api/login
  http.post('/api/login', () => {
    return new Response(
      JSON.stringify({ token: 'mock-token', user: { name: 'Demo User' } }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }),

  http.get('/api/applicationsettings', () => {
    return new Response(
      JSON.stringify({
        jira: { projectId: 'SCRUM' },
        theme: 'dark',
        notifications: true,
        testCoverage: 94,
        assignedTasks: 6,
        testCasesCreated: 30,
        bugsReported: 12,
        automationScripts: 8,
        failedTests: 2,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }),

  http.get('/api/activity-logs', () => {
    return new Response(
      JSON.stringify(activityLogs),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }),

  http.get('/api/settings/profile', () => {
    return new Response(
      JSON.stringify({
        name: 'Demo User',
        email: 'demo@zap.com',
        role: 'QA',
        avatar: 'https://ui-avatars.com/api/?name=Demo+User'
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }),

  http.put('/api/settings/profile', () => {
    return new Response(null, { status: 200 });
  }),

  http.get('/api/dashboard', () => {
    return new Response(
      JSON.stringify(dashboardData),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }),

  http.get('/api/mysprint-actions', () => {
    return new Response(
      JSON.stringify(mysprintActions),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }),

  http.get('/manual-tests.json', () => {
    return new Response(
      JSON.stringify(manualTests),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }),

  http.get('/automationrunlogs.json', () => {
    return new Response(
      JSON.stringify(automationRunLogs),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }),

  http.post('/api/activity-logs', async (req) => {
    const body = await req.request.json();
    // Optionally, add an id or timestamp to the returned log
    return new Response(
      JSON.stringify({ ...body, id: Date.now() }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }),

  http.post('/api/run-automation-test', async (req) => {
    // Return a mock test run result
    return new Response(
      JSON.stringify({
        success: true,
        run: {
          status: 'passed',
          htmlReport: '/mock-report.html',
          name: 'Mock Automated Test'
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }),

  http.post('/api/save-steps', async (req) => {
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }),

  http.get('/api/jira/projects', () => {
    return new Response(
      JSON.stringify(jiraProjects),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }),

  http.get('/api/jira/projects/:projectId/sprint/current', () => {
    return new Response(
      JSON.stringify({
        name: 'Demo Sprint',
        state: 'active',
        startDate: '2025-06-02',
        endDate: '2025-06-23',
        goal: 'Complete all UI components and backend flows.',
        issues: sprintIssues
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }),

  http.put('/api/jira/project', async (req) => {
    // Optionally parse the body if needed
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }),

  // Handler for POST /api/ai/create-issue
  http.post('/api/ai/create-issue', async (req) => {
    createIssueCallCount++;
    // Fail for the first and third call (simulate error for 2 records)
    if (createIssueCallCount === 1 || createIssueCallCount === 3) {
      return new Response(
        JSON.stringify({ error: 'Failed to create issue (demo error)' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    // Otherwise, return a fake Jira ID
    const body = await req.request.json();
    return new Response(
      JSON.stringify({ jiraId: `SCRUM-10${createIssueCallCount}` }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }),

  // Add more handlers as needed...
];