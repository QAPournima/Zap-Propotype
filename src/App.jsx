import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import ActivityLogs from './pages/ActivityLogs';
import Settings from './pages/Settings';
import ZapAIFeatures from './pages/ProjectManagement';
import { chatService } from './services/api';
import { logActivity, updateActivityLog, createActivityObject, ActivityTypes } from './utils/activityLogger';
import ChatBox from './components/ChatBox';
import axios from 'axios';
import api from './services/api';
import TopNavBar from './components/TopNavBar';
import JiraSettings from './pages/JiraSettings';
import AIChatbotAssistan from './pages/AIChatbotAssistan';
import TestDark from './pages/TestDark';
import MySprint from './pages/MySprint';
import LiveTest from './pages/LiveTest';
import AutomatedTest from './pages/AutomationTest';
import Login from './pages/Login';
import Contactus from './pages/Contactus';

function PrivateRoute({ children }) {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  return isLoggedIn ? children : <Navigate to="/login" replace />;
}

function AppRoutes(props) {
  const location = useLocation();
  const {
    chatOpen, setChatOpen, messages, setMessages, input, setInput, loading, setLoading,
    audioRef, messagesEndRef, uploadedFile, setUploadedFile, actionLoading, setActionLoading,
    followupActions, setFollowupActions, followupError, setFollowupError, followupMessageIdx, setFollowupMessageIdx, buttonClickedIdx, setButtonClickedIdx,
    sendMessage, handleFileUpload, handleGenerate, handleFollowupAction, welcomeMessage, activityLogsRefreshKey, chatProps, themeMode, setThemeMode,
    sidebarCollapsed, setSidebarCollapsed
  } = props;

  // If on /login, render only the Login component
  if (location.pathname === '/login') {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
      </Routes>
    );
  }

  // Redirect root path '/' to '/login' using React Router
  if (location.pathname === '/') {
    return <Navigate to="/login" replace />;
  }

  // Otherwise, render the full layout
  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-neutral-900 dark:text-gray-100 flex flex-col">
      <TopNavBar />
      <div className="flex flex-1 mt-14">
        <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
        <main className={`flex-1 overflow-auto transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-60'}`}> 
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={
              <PrivateRoute>
                <Dashboard {...chatProps} />
              </PrivateRoute>
            } />
            <Route path="/activity" element={<ActivityLogs refreshKey={activityLogsRefreshKey} {...chatProps} />} />
            <Route path="/settings" element={<Settings themeMode={themeMode} setThemeMode={setThemeMode} />} />
            <Route path="/settings/jira" element={<JiraSettings />} />
            <Route path="/zap-ai-features" element={<ZapAIFeatures />} />
            <Route path="/live-test/:jiraId" element={<LiveTest />} />
            <Route path="/live-test" element={<LiveTest />} />
            <Route path="/ai-chatbot-assistan" element={<AIChatbotAssistan />} />
            <Route path="/test-dark" element={<TestDark />} />
            <Route path="/my-sprint" element={<MySprint />} />
            <Route path="/automatedtest" element={<AutomatedTest />} />
            <Route path="/AutomationTest" element={<AutomatedTest />} />
            <Route path="/contactus" element={<Contactus />} />
          </Routes>
          {/* Floating Chat Open Button (global) */}
          {location.pathname !== '/ai-chatbot-assistan' && !chatOpen && (
            <button
              className="fixed bottom-8 right-8 z-50 bg-blue-500 text-white rounded-full shadow-lg w-16 h-16 flex items-center justify-center text-3xl hover:bg-blue-600 transition"
              onClick={() => setChatOpen(true)}
              title="Open Chat"
            >
              💬
            </button>
          )}
          {/* Global ChatBox UI */}
          {location.pathname !== '/ai-chatbot-assistan' && <ChatBox {...chatProps} />}
        </main>
      </div>
    </div>
  );
}

function App() {
  // Global chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 0, sender: 'ai', message: `👋 Welcome to Zap⚡️ - Your AI Assistant!\n\nI can help you with:\n\n📝 Test Case Generation:\n- Generate test cases from user stories\n- link test cases to user stories\n- automate test cases\n\n🤖 Automation Scripts:\n- Create automation scripts from test cases or user stories\n- upload script to project\n\n🐞 Bugs Creation:\n- Create bug from user story\n- link bug to user story\n\n🎑 Image analysis for UI element:\n- UI element detection\n- create test case for UI element\n- create automation script for UI element\n\n🔍 How to get started:\n1. Use 'id ISSUE-ID' to work with a specific issue\n2. Type 'settings' to configure the application\n\nWhat would you like to do today? 🚀` },
    { id: 1, sender: 'ai', message: 'Hello! How can I help you today?' },
    { id: 2, sender: 'user', message: 'I need help with my test automation.' },
    { id: 3, sender: 'ai', message: 'Sure, I can help you with that. What specific issue are you facing?' },
    { id: 4, sender: 'user', message: 'id SCRUM-1' },
    { id: 5, sender: 'ai', message: 'User Story: Logout from the App\nSummary: As a user I want to logout from the App\nDescription: logout from the app\nnavigate to setting and click on logout button\nAcceptance Criteria:\n.1. The logout button should be visible in the sidebar.\n.2. The logout button should be clickable.\n.3. The logout button should logout the user from the app.\n 👉🏻 To generate a test case for this user story, reply with: Test Case\n 🐞 To report a bug for this user story, reply with: Bug' },
    { id: 6, sender: 'user', message: 'bug' },
    { id: 7, sender: 'ai', message: 'Great, you found a bug! To proceed with bug creation, can you provide as much detail as possible about the bug, please?\nTo cancel the process, reply with: cancel' },
    { id: 8, sender: 'user', message: 'Logout Button on Sidebar Not Clickable' },
    { id: 9, sender: 'ai', message: 'Bug: Logout Button on Sidebar Not Clickable\nSummary:\nAs a user, I want to log out of the app using the logout button in the sidebar, but the button is currently not clickable.\n\nDescription:\nThe logout button is visible in the sidebar, but clicking on it does not trigger any action. This prevents users from logging out through the expected interface.\n\nSteps to Reproduce:\n1. Log in to the application.\n2. Locate the logout button in the sidebar.\n3. Attempt to click the button.\n4. Observe that no logout action is performed.\n\nExpected Behavior:\n1. The logout button should be clearly visible.\n2. The button should be clickable.\n3. Clicking the button should log the user out, clear the session, and redirect to the login screen.\n\nActual Behavior:\n1. The logout button is visible but not responsive to user interaction.\n2. No logout or redirection occurs when clicked.\n\nSeverity: Major\nPriority: High\n\nEnvironment: [Specify environment, e.g., QA, Staging | Browser: Chrome 123 | OS: Windows 11]\n\n 🖼️ Would you like to attach a screenshot to this bug? (reply with: yes or no)' },
    { id: 10, sender: 'user', message: 'yes' },
    { id: 11, sender: 'ai', message: '📎 Please upload your screenshot(s) for the bug (max 3). Use the upload image 🏞️ button. When done, reply with: done or yes to create the bug.' },
    { id: 12, sender: 'user', message: '❌  Image upload failed' },
    { id: 13, sender: 'ai', message: 'Would you like to try again(Yes), or proceed without uploading an image(No)?.' },
    { id: 14, sender: 'user', message: 'No' },
    { id: 15, sender: 'ai', message: '✅ Bug created successfully with ID: SCRUM-11\n🔗 The bug has been linked to the user story SCRUM-1' },
    { id: 16, sender: 'ai', message: 'You just created a bug. 🚀 If you want to add more details, please specify, or use a command like \'create test case\', \'create bug\', \'create User story\', \'create automation script\', or provide a Jira ID. and follow the instructions.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const audioRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [followupActions, setFollowupActions] = useState(null);
  const [followupError, setFollowupError] = useState(null);
  const [followupMessageIdx, setFollowupMessageIdx] = useState(null);
  const [buttonClickedIdx, setButtonClickedIdx] = useState(null);
  const [activityLogsRefreshKey, setActivityLogsRefreshKey] = useState(0);
  const [themeMode, setThemeMode] = useState('light');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (themeMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    console.log('Current <html> class:', document.documentElement.className);
  }, [themeMode]);

  useEffect(() => {
    fetch('http://localhost:4000/api/chat/history')
      .then(res => res.json())
      .then(data => setMessages(data))
      .catch(err => console.error('Error fetching chat history:', err));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Play sound when a new AI message arrives
  useEffect(() => {
    if (
      chatOpen &&
      messages.length > 0 &&
      messages[messages.length - 1].sender === 'ai'
    ) {
      audioRef.current && audioRef.current.play().catch((e) => { });
    }
  }, [messages, chatOpen]);

  // Chat logic handlers
  const sendMessage = async (e, overrideInput) => {
    e.preventDefault();
    const messageToSend = overrideInput !== undefined ? overrideInput : input;
    if (!messageToSend.trim()) return;
    setMessages([...messages, { sender: 'user', message: messageToSend }]);
    setInput('');
    setLoading(true);

    try {
      const res = await chatService.sendMessage(messageToSend);
      const aiMsg = res.data.message;
      if (aiMsg && aiMsg.trim()) {
        setMessages(prev => [...prev, { sender: 'ai', message: aiMsg }]);
      }

      // --- LOGGING LOGIC: Log based on AI response ---
      if (res.data.message) {
        const aiMsg = res.data.message.toLowerCase();
        if (aiMsg.includes('generated test case')) {
          const activity = createActivityObject(
            'Test Case',
            'AI generated a test case',
            ActivityTypes.TEST_CASE,
            'new'
          );
          await logActivity(activity);
          setActivityLogsRefreshKey(k => k + 1);
        } else if (aiMsg.includes('bug has been created') || aiMsg.includes('bug created')) {
          const activity = createActivityObject(
            'Bug',
            'AI created a bug',
            ActivityTypes.BUG,
            'new'
          );
          await logActivity(activity);
          setActivityLogsRefreshKey(k => k + 1);
        } else if (aiMsg.includes('automation script') && aiMsg.includes('successfully')) {
          const activity = createActivityObject(
            'Automation Script',
            'AI generated an automation script',
            ActivityTypes.AUTOMATION_SCRIPT,
            'new'
          );
          await logActivity(activity);
          setActivityLogsRefreshKey(k => k + 1);
        }
      }
      // --- END LOGGING LOGIC ---
    } catch {
      setMessages(prev => [...prev, { sender: 'ai', message: 'Error from AI.' }]);
    }
    setLoading(false);
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    const file = files[0];
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post('/api/chat/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const { url, name, type } = res.data;
      const fileUrl = url && url.startsWith('/uploads/') ? `${process.env.REACT_APP_API_URL || 'http://localhost:8080'}${url}` : url;
      setUploadedFile({ name, type, url: fileUrl });
      const activity = createActivityObject(
        'File Upload',
        `Uploaded ${name} (${type})`,
        type === 'application/pdf' ? ActivityTypes.PDF_DOCUMENT : ActivityTypes.USER_STORY,
        'new'
      );
      await logActivity(activity);
      setActivityLogsRefreshKey(k => k + 1);
      if (type && type.startsWith('image/')) {
        setMessages(prev => [
          ...prev,
          { sender: 'user', message: <img src={fileUrl} alt={name} style={{ maxWidth: 200, borderRadius: 8 }} /> },
          { type: 'fileActions', file: { name, type, url: fileUrl } }
        ]);
      } else if (type === 'application/pdf') {
        setMessages(prev => [
          ...prev,
          { sender: 'user', message: (
            <a href={fileUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M6 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8.828A2 2 0 0 0 19.414 7.414l-4.828-4.828A2 2 0 0 0 12.172 2H6zm6 1.414L18.586 10H14a2 2 0 0 1-2-2V3.414zM6 4h5v4a4 4 0 0 0 4 4h4v10a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4z"/></svg>
              <span>{name}</span>
            </a>
          ) },
          { type: 'fileActions', file: { name, type, url: fileUrl } }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          { sender: 'user', message: `Unsupported file type: ${name}` },
          { sender: 'ai', message: 'File uploaded, but no analysis available for this type.' }
        ]);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setMessages(prev => [
        ...prev,
        { sender: 'ai', message: 'Failed to upload file. Please try again.' }
      ]);
    }
  };

  const handleGenerate = async (type, fileName) => {
    setActionLoading(true);
    setFollowupError(null);
    let logId = null;
    try {
      let response;
      let activityType;
      let title;
      let description;
      switch (type) {
        case 'userStory':
          activityType = ActivityTypes.USER_STORY;
          title = 'User Story';
          description = `Generating user story from ${fileName}`;
          break;
        case 'testCase':
          activityType = ActivityTypes.TEST_CASE;
          title = 'Test Case';
          description = `Generating test case from ${fileName}`;
          break;
        default:
          throw new Error('Invalid generation type');
      }
      const activity = createActivityObject(title, description, activityType, 'in progress');
      const log = await logActivity(activity);
      logId = log.id;
      setActivityLogsRefreshKey(k => k + 1);
      switch (type) {
        case 'userStory':
          response = await chatService.generateUserStory(fileName);
          break;
        case 'testCase':
          response = await chatService.generateTestCase(fileName);
          break;
      }
      await updateActivityLog(logId, {
        status: 'done',
        description: description.replace('Generating', 'Generated')
      });
      const aiMsg = response.data.message;
      if (aiMsg && aiMsg.trim()) {
        setMessages(prev => [...prev, { sender: 'ai', message: aiMsg }]);
      }
      setFollowupActions(response.data.actions);
      setFollowupMessageIdx(messages.length);
    } catch (error) {
      if (logId) {
        await updateActivityLog(logId, { status: 'failed' });
      }
      console.error('Error generating:', error);
      setFollowupError('Failed to generate. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFollowupAction = async (action, content) => {
    setActionLoading(true);
    setFollowupError(null);
    try {
      let response;
      let activityType;
      let title;
      let description;
      switch (action) {
        case 'linkToJira':
          response = await chatService.linkToJira(content);
          activityType = ActivityTypes.TEST_CASE;
          title = 'Jira Integration';
          description = 'Linked content to Jira';
          break;
        case 'downloadAsPDF':
          response = await chatService.downloadAsPDF(content);
          activityType = ActivityTypes.PDF_DOCUMENT;
          title = 'PDF Download';
          description = 'Downloaded content as PDF';
          break;
        case 'generateAutomation':
          response = await chatService.generateAutomationScript(content);
          activityType = ActivityTypes.AUTOMATION_SCRIPT;
          title = 'Automation Script';
          description = 'Generated automation script';
          break;
        default:
          throw new Error('Invalid action type');
      }
      const activity = createActivityObject(title, description, activityType, 'in progress');
      await logActivity(activity);
      setActivityLogsRefreshKey(k => k + 1);
      if (action === 'downloadAsPDF') {
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'generated-content.pdf';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const aiMsg = response.data.message;
        if (aiMsg && aiMsg.trim()) {
          setMessages(prev => [...prev, { sender: 'ai', message: aiMsg }]);
        }
      }
      setFollowupActions(null);
      setFollowupMessageIdx(null);
    } catch (error) {
      console.error('Error performing follow-up action:', error);
      setFollowupError('Failed to perform action. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const welcomeMessage = `👋 Welcome to Zap⚡️ - Your AI Testing Assistant!\n\nI can help you with:\n\n📝 Test Case Generation:\n   - Generate test cases from user stories\n   - link test cases to user stories\n   - automate test cases\n\n🤖 Automation Scripts:\n   - Create automation scripts from test cases or user stories\n   - upload script to project\n\n🐞 Bugs Creation:\n   - Create bug from user story\n   - link bug to user story\n\n🎑 Image analysis for UI element:\n   - UI element detection\n   - create test case for UI element\n   - create automation script for UI element\n\n🔍 How to get started:\n1. Use 'id ISSUE-ID' to work with a specific issue\n2. Type 'settings' to configure the application\n\nWhat would you like to do today? 🚀`;

  const theme = createTheme({
    palette: {
      mode: themeMode,
      primary: { main: '#0ea5e9' },
      secondary: { main: '#64748b' },
      background: {
        default: themeMode === 'dark' ? '#181A1B' : '#fff',
        paper: themeMode === 'dark' ? '#23272f' : '#fff',
      },
      text: {
        primary: themeMode === 'dark' ? '#F4F5F7' : '#1A1E1D',
        secondary: themeMode === 'dark' ? '#B3B8C2' : '#4B5563',
      },
      divider: themeMode === 'dark' ? '#23272f' : '#E5E7EB',
    },
  });

  // Props to pass to chat-enabled pages and ChatBox
  const chatProps = {
    chatOpen, setChatOpen, messages, setMessages, input, setInput, loading, setLoading,
    audioRef, messagesEndRef, uploadedFile, setUploadedFile, actionLoading, setActionLoading,
    followupActions, setFollowupActions, followupError, setFollowupError, followupMessageIdx, setFollowupMessageIdx, buttonClickedIdx, setButtonClickedIdx,
    sendMessage, handleFileUpload, handleGenerate, handleFollowupAction, welcomeMessage
  };

  return (
    <Router>
      <AppRoutes
        chatOpen={chatOpen}
        setChatOpen={setChatOpen}
        messages={messages}
        setMessages={setMessages}
        input={input}
        setInput={setInput}
        loading={loading}
        setLoading={setLoading}
        audioRef={audioRef}
        messagesEndRef={messagesEndRef}
        uploadedFile={uploadedFile}
        setUploadedFile={setUploadedFile}
        actionLoading={actionLoading}
        setActionLoading={setActionLoading}
        followupActions={followupActions}
        setFollowupActions={setFollowupActions}
        followupError={followupError}
        setFollowupError={setFollowupError}
        followupMessageIdx={followupMessageIdx}
        setFollowupMessageIdx={setFollowupMessageIdx}
        buttonClickedIdx={buttonClickedIdx}
        setButtonClickedIdx={setButtonClickedIdx}
        sendMessage={sendMessage}
        handleFileUpload={handleFileUpload}
        handleGenerate={handleGenerate}
        handleFollowupAction={handleFollowupAction}
        welcomeMessage={welcomeMessage}
        activityLogsRefreshKey={activityLogsRefreshKey}
        chatProps={chatProps}
        themeMode={themeMode}
        setThemeMode={setThemeMode}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
      />
    </Router>
  );
}

export default App; 
