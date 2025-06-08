import React, { useState, useEffect, useRef } from 'react';
import { settingsService } from '../services/api';
import Modal from '../components/Modal';

const navItems = [
  { label: 'Dashboard', icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M13 5v6h6" /></svg>
  ), link: '/' },
  { label: 'User Stories', icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 17l4 4 4-4m0-5V3a1 1 0 00-1-1H7a1 1 0 00-1 1v9m0 0l4 4 4-4" /></svg>
  ), link: '#' },
  { label: 'Activity Logs', icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-6a2 2 0 012-2h2a2 2 0 012 2v6m-6 0h6" /></svg>
  ), link: '/activitylogs' },
  { label: 'Automation', icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" /></svg>
  ), link: '#' },
  { label: 'Settings', icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
  ), link: '/settings' },
];

const AI_SERVICES = [
  { label: 'Zap AI', value: 'openai' },
  { label: 'My AI', value: 'gemini' },
];

const TEST_CASE_FORMATS = [
  { label: 'Gherkin', value: 'gherkin' },
  { label: 'Plain Text', value: 'plain' },
];

const SIDEBAR_OPTIONS = [
  { label: 'Profile', value: 'profile' },
  { label: 'Application', value: 'app' },
];

const SETTINGS_NAV = [
  { label: 'Profile', value: 'profile' },
  { label: 'Notifications', value: 'notifications' },
  { label: 'Integrations', value: 'integrations' },
  { label: 'Theme', value: 'theme' },
  { label: 'Onboarding', value: 'onboarding' },
  { label: 'Application', value: 'app' },
  {
    name: 'Jira Integration',
    description: 'Configure Jira integration settings',
    href: '/settings/jira',
    icon: '🔗'
  },
];

const onboardingChecklist = [
  { label: 'Complete your profile', key: 'profile' },
  { label: 'Connect an integration', key: 'integrations' },
  { label: 'Set notification preferences', key: 'notifications' },
  { label: 'Choose a theme', key: 'theme' },
];

// Tooltip component for info icons
const InfoTooltip = ({ message }) => (
  <span className="relative group inline-block ml-2 align-middle">
    <svg className="w-5 h-5 text-white/80 group-hover:text-white cursor-pointer inline" fill="currentColor" viewBox="0 0 20 20">
      <path d="M18 10A8 8 0 11 2 10a8 8 0 0116 0zm-8-3a1 1 0 100-2 1 1 0 000 2zm2 7a1 1 0 10-2 0v-4a1 1 0 112 0v4z" />
    </svg>
    <span className="absolute left-1/2 -translate-x-1/2 mt-2 w-64 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none shadow-lg">
      {message}
    </span>
  </span>
);

const mapAppSettingsToState = (data) => ({
  aiService: data.selectedAIService || 'openai',
  openai: {
    url: data.openAiApiUrl || '',
    apiKey: data.openAiApiKey || '',
    model: data.openAiModel || 'gpt-4',
  },
  automation: {
    projectLocation: data.automationProjectLocation || '',
    scriptLanguage: data.scriptLanguage || 'java',
  },
  jira: {
    url: data.jiraUrl || '',
    username: data.jiraUsername || '',
    apiToken: data.jiraApiToken || '',
    projectId: data.jiraProjectId || '',
    bugLinkType: data.jiraBugLinkType || '',
    testCaseLinkType: data.jiraLinkType || '',
    testCaseIssueType: data.jiraTestCaseIssueType || '',
  },
  testCaseFormat: data.testCaseFormat || 'gherkin',
  profile: {
    firstName: '',
    lastName: '',
    email: '',
    avatar: '',
  },
  integration: 'jira',
});

const INTEGRATIONS_LIST = [
  { key: 'slack', name: 'Slack', desc: 'Slack workspace integration' },
  { key: 'jira', name: 'Jira', desc: 'Atlassian Jira integration' },
  { key: 'testrail', name: 'TestRail', desc: 'TestRail integration' },
  { key: 'tfs', name: 'TFS', desc: 'Azure DevOps / TFS integration' },
  { key: 'github', name: 'GitHub', desc: 'GitHub integration' },
  { key: 'gitlab', name: 'GitLab', desc: 'GitLab integration' },
  { key: 'bitbucket', name: 'Bitbucket', desc: 'Bitbucket integration' },
  { key: 'azure', name: 'Azure DevOps', desc: 'Azure DevOps integration' },
];

const INTEGRATION_FIELDS = {
  slack: [
    { label: 'Bot Token', key: 'botToken', type: 'password', required: true },
    { label: 'App Signing Secret', key: 'signingSecret', type: 'password', required: true },
    { label: 'App ID', key: 'appId', type: 'text', required: true },
    { label: 'Default Channel', key: 'defaultChannel', type: 'text', required: true },
  ],
  jira: [
    { label: 'Jira URL', key: 'url', type: 'text', required: true },
    { label: 'User Email', key: 'email', type: 'email', required: true },
    { label: 'API Token', key: 'token', type: 'password', required: true },
  ],
  testrail: [
    { label: 'TestRail URL', key: 'url', type: 'text', required: true },
    { label: 'User', key: 'user', type: 'text', required: true },
    { label: 'API Key', key: 'token', type: 'password', required: true },
  ],
  tfs: [
    { label: 'TFS/Azure URL', key: 'url', type: 'text', required: true },
    { label: 'User', key: 'user', type: 'text', required: true },
    { label: 'Token', key: 'token', type: 'password', required: true },
  ],
  github: [
    { label: 'GitHub Username', key: 'user', type: 'text', required: true },
    { label: 'Personal Access Token', key: 'token', type: 'password', required: true },
  ],
  gitlab: [
    { label: 'GitLab Username', key: 'user', type: 'text', required: true },
    { label: 'Access Token', key: 'token', type: 'password', required: true },
  ],
  bitbucket: [
    { label: 'Bitbucket Username', key: 'user', type: 'text', required: true },
    { label: 'App Password', key: 'token', type: 'password', required: true },
  ],
  azure: [
    { label: 'Azure DevOps Org', key: 'org', type: 'text', required: true },
    { label: 'Personal Access Token', key: 'token', type: 'password', required: true },
  ],
};

const Settings = ({ themeMode, setThemeMode }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [settings, setSettings] = useState({
    aiService: 'openai',
    openai: {
      url: '',
      apiKey: '',
      model: 'gpt-4',
    },
    automation: {
      projectLocation: '',
      scriptLanguage: 'java',
    },
    jira: {
      url: '',
      username: '',
      apiToken: '',
      projectId: '',
      bugLinkType: '',
      testCaseLinkType: '',
      testCaseIssueType: '',
    },
    testCaseFormat: 'gherkin',
    profile: {
      firstName: '',
      lastName: '',
      email: '',
      avatar: '',
    },
    integration: 'jira',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [testing, setTesting] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState('');
  const fileInputRef = useRef();
  const [appSettings, setAppSettings] = useState(null);
  const [notifPrefs, setNotifPrefs] = useState({ email: true, slack: false, inApp: true });
  const [theme, setTheme] = useState(themeMode || 'light');
  const [onboarding, setOnboarding] = useState({ profile: false, integrations: false, notifications: false, theme: false });
  const [originalProfile, setOriginalProfile] = useState(null);
  const [originalApp, setOriginalApp] = useState(null);
  const [appEmailError, setAppEmailError] = useState('');
  const [integrationState, setIntegrationState] = useState({
    slack: null,
    jira: null,
    testrail: null,
    tfs: null,
    github: null,
    gitlab: null,
    bitbucket: null,
    azure: null,
  });
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestIntegration, setRequestIntegration] = useState('');
  const [disconnectConfirm, setDisconnectConfirm] = useState({ show: false, key: null, name: '' });
  const [connectModal, setConnectModal] = useState({ show: false, key: null, name: '', fields: {} });
  const [showConnectedBanner, setShowConnectedBanner] = useState({ show: false, name: '' });
  const [showDisconnectedBanner, setShowDisconnectedBanner] = useState({ show: false, name: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState(null);
  const [themeLoading, setThemeLoading] = useState(false);
  const [themeError, setThemeError] = useState(null);
  const [onboardingLoading, setOnboardingLoading] = useState(false);
  const [onboardingError, setOnboardingError] = useState(null);
  const [appLoading, setAppLoading] = useState(false);
  const [appError, setAppError] = useState(null);
  const [profileSuccess, setProfileSuccess] = useState(null);

  // Sync local theme state with global themeMode
  useEffect(() => {
    setTheme(themeMode);
  }, [themeMode]);

  useEffect(() => {
    fetchSettings();
    settingsService.getApplicationSettings().then(data => {
      setAppSettings(data);
    });
  }, []);

  useEffect(() => {
    setOriginalProfile(settings.profile);
    setOriginalApp({ ...settings });
  }, [loading]);

  useEffect(() => {
    if (activeTab === 'profile') {
      setProfileLoading(true);
      settingsService.getProfile()
        .then(data => {
          setSettings(s => ({ ...s, profile: { ...data } }));
          setOriginalProfile(data);
          setProfileError(null);
        })
        .catch(() => setProfileError('Failed to load profile'))
        .finally(() => setProfileLoading(false));
    }
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    switch (activeTab) {
      case 'notifications':
        setNotificationsLoading(true);
        settingsService.getNotifications()
          .then(data => {
            setNotifPrefs(data);
            setNotificationsError(null);
          })
          .catch(() => setNotificationsError('Failed to load notification preferences'))
          .finally(() => setNotificationsLoading(false));
        break;
      case 'theme':
        setThemeLoading(true);
        settingsService.getTheme()
          .then(data => {
            setTheme(data.theme);
            setThemeError(null);
          })
          .catch(() => setThemeError('Failed to load theme settings'))
          .finally(() => setThemeLoading(false));
        break;
      case 'onboarding':
        setOnboardingLoading(true);
        settingsService.getOnboarding()
          .then(data => {
            setOnboarding(data);
            setOnboardingError(null);
          })
          .catch(() => setOnboardingError('Failed to load onboarding status'))
          .finally(() => setOnboardingLoading(false));
        break;
      case 'app':
        setAppLoading(true);
        settingsService.getApplicationSettings()
          .then(data => {
            setSettings(mapAppSettingsToState(data));
            setAppError(null);
          })
          .catch(() => setAppError('Failed to load application settings'))
          .finally(() => setAppLoading(false));
        break;
    }
  }, [activeTab]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await settingsService.getApplicationSettings();
      setSettings(mapAppSettingsToState(data));
      setError(null);
    } catch (err) {
      setError('Failed to fetch settings');
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (section, field, value) => {
    setSettings({
      ...settings,
      [section]: {
        ...settings[section],
        [field]: value,
      },
    });
  };

  const handleRootChange = (field, value) => {
    setSettings({
      ...settings,
      [field]: value,
    });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
        setSettings({
          ...settings,
          profile: {
            ...settings.profile,
            avatar: reader.result,
          },
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarDelete = () => {
    setAvatarPreview('');
    setSettings({
      ...settings,
      profile: {
        ...settings.profile,
        avatar: '',
      },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccess(null);
      await settingsService.update(settings);
      setSuccess('Settings saved successfully');
    } catch (err) {
      setError('Failed to save settings');
      console.error('Error saving settings:', err);
    }
  };

  const handleTestJira = async () => {
    try {
      setTesting(true);
      setError(null);
      setSuccess(null);
      await settingsService.testJiraConnection(settings.jira);
      setSuccess('Jira connection successful');
    } catch (err) {
      setError('Failed to connect to Jira');
      console.error('Error testing Jira connection:', err);
    } finally {
      setTesting(false);
    }
  };

  // New handlers for enhancements
  const handleNotifChange = (type) => setNotifPrefs(p => ({ ...p, [type]: !p[type] }));
  const handleThemeChange = (t) => {
    setTheme(t);
    setThemeMode(t);
    setOnboarding(o => ({ ...o, theme: true }));
  };
  const handleOnboardingCheck = (key) => setOnboarding(o => ({ ...o, [key]: true }));

  // Cancel handlers
  const handleProfileCancel = () => {
    setSettings(s => ({ ...s, profile: { ...originalProfile } }));
  };
  const handleAppCancel = () => {
    setSettings({ ...originalApp });
    setAppEmailError('');
  };

  // Email validation for Application settings
  const validateAppEmail = (email) => {
    if (!email) return '';
    // Simple email regex
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? '' : 'Invalid email format';
  };

  // Modified handleSubmit for Application settings
  const handleAppSubmit = async (e) => {
    e.preventDefault();
    const emailErr = validateAppEmail(settings.jira.username);
    setAppEmailError(emailErr);
    if (emailErr) return;
    try {
      setError(null);
      setSuccess(null);
      await settingsService.update(settings);
      setSuccess('Settings saved successfully');
    } catch (err) {
      setError('Failed to save settings');
      console.error('Error saving settings:', err);
    }
  };

  const handleConnect = (key, name) => {
    setConnectModal({ show: true, key, name, fields: {} });
  };

  const handleConnectFieldChange = (field, value) => {
    setConnectModal(modal => ({ ...modal, fields: { ...modal.fields, [field]: value } }));
  };

  const handleConnectSubmit = (e) => {
    e.preventDefault();
    let display;
    let mappedFields = { ...connectModal.fields };
    if (connectModal.key === 'slack') {
      // Map frontend keys to backend keys for Slack
      mappedFields = {
        'slack.bot.token': connectModal.fields.botToken,
        'slack.app.signing.secret': connectModal.fields.signingSecret,
        'slack.app.id': connectModal.fields.appId,
        'slack.default.channel': connectModal.fields.defaultChannel,
      };
      display = connectModal.fields.defaultChannel || connectModal.fields.appId || connectModal.name + ' Connected';
    } else {
      display = connectModal.fields.workspace || connectModal.fields.user || connectModal.fields.email || connectModal.fields.org || connectModal.name + ' Connected';
    }
    setIntegrationState(s => ({ ...s, [connectModal.key]: display }));
    // Here you would send mappedFields to your backend if needed
    setConnectModal({ show: false, key: null, name: '', fields: {} });
    setShowConnectedBanner({ show: true, name: connectModal.name });
    setTimeout(() => setShowConnectedBanner({ show: false, name: '' }), 15000);
  };

  const handleConnectCancel = () => {
    setConnectModal({ show: false, key: null, name: '', fields: {} });
  };

  const handleDisconnect = (key, name) => {
    setDisconnectConfirm({ show: true, key, name });
  };

  const confirmDisconnect = () => {
    setIntegrationState(s => ({ ...s, [disconnectConfirm.key]: null }));
    if (showConnectedBanner.name === disconnectConfirm.name) {
      setShowConnectedBanner({ show: false, name: '' });
    }
    setDisconnectConfirm({ show: false, key: null, name: '' });
    setShowDisconnectedBanner({ show: true, name: disconnectConfirm.name });
    setTimeout(() => setShowDisconnectedBanner({ show: false, name: '' }), 3000);
  };

  const cancelDisconnect = () => {
    setDisconnectConfirm({ show: false, key: null, name: '' });
  };

  const handleRequestSubmit = (e) => {
    e.preventDefault();
    setShowRequestModal(false);
    setRequestIntegration('');
    // Optionally show a toast or message
    alert('Integration request submitted!');
  };

  // Save profile to API
  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError(null);
    setProfileSuccess(null);
    try {
      await settingsService.updateProfile(settings.profile);
      setOriginalProfile(settings.profile);
      setProfileSuccess('Profile updated successfully');
    } catch {
      setProfileError('Failed to save profile');
    } finally {
      setProfileLoading(false);
    }
  };

  // Save handlers for each tab
  const handleNotificationsSave = async (e) => {
    e.preventDefault();
    setNotificationsLoading(true);
    setNotificationsError(null);
    try {
      await settingsService.updateNotifications(notifPrefs);
    } catch {
      setNotificationsError('Failed to save notification preferences');
    } finally {
      setNotificationsLoading(false);
    }
  };

  const handleThemeSave = async (e) => {
    e.preventDefault();
    setThemeLoading(true);
    setThemeError(null);
    try {
      await settingsService.updateTheme({ theme });
      setThemeMode(theme);
    } catch {
      setThemeError('Failed to save theme settings');
    } finally {
      setThemeLoading(false);
    }
  };

  const handleOnboardingSave = async (e) => {
    e.preventDefault();
    setOnboardingLoading(true);
    setOnboardingError(null);
    try {
      await settingsService.updateOnboarding(onboarding);
    } catch {
      setOnboardingError('Failed to save onboarding status');
    } finally {
      setOnboardingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-neutral-900 dark:text-gray-100 flex">
      {/* Left Navigation */}
      <aside className="w-64 bg-white dark:bg-neutral-800 border-r border-neutral-200 dark:border-neutral-700 flex flex-col py-8 px-4">
        <h2 className="text-xl font-bold mb-8">Settings</h2>
        <nav className="flex flex-col gap-2">
          {SETTINGS_NAV.map(item => (
            <button
              key={item.value}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-left transition font-medium ${activeTab === item.value ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200' : 'hover:bg-gray-100 text-gray-700 dark:hover:bg-neutral-700 dark:text-gray-200'}`}
              onClick={() => setActiveTab(item.value)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>
      {/* Right Details Panel */}
      <section className="flex-1 p-10 bg-white dark:bg-neutral-900">
        {activeTab === 'profile' && (
          <form onSubmit={handleProfileSave} className="w-full max-w-2xl">
            <h3 className="text-lg font-bold mb-4">Profile</h3>
            {profileError && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{profileError}</div>}
            {profileSuccess && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{profileSuccess}</div>}
            {profileLoading && <div className="text-gray-500 mb-4">Loading...</div>}
            <div className="mb-4 flex items-center gap-4">
              <div className="relative group">
                <img
                  src={settings.profile.avatar && settings.profile.avatar.startsWith('data:image/') ? settings.profile.avatar : (settings.profile.avatar || 'https://ui-avatars.com/api/?name=User')}
                  alt="avatar"
                  className="w-16 h-16 rounded-full border"
                />
                {settings.profile.avatar && (
                  <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-64 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none shadow-lg break-all">
                    {settings.profile.avatar.length > 100 
                      ? `${settings.profile.avatar.substring(0, 100)}...` 
                      : settings.profile.avatar}
                  </div>
                )}
              </div>
              <input type="file" ref={fileInputRef} className="hidden" onChange={handleAvatarChange} />
              <button className="px-3 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800" onClick={() => fileInputRef.current.click()} type="button">Change Avatar</button>
              {settings.profile.avatar && <button className="px-3 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800" onClick={handleAvatarDelete} type="button">Remove</button>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-gray-900 dark:text-gray-100">First Name <InfoTooltip message="Your given name." /></label>
                <input className="w-full border rounded px-3 py-2 bg-white text-gray-900 border-gray-300 placeholder-gray-400 dark:bg-neutral-800 dark:text-gray-100 dark:border-neutral-700 dark:placeholder-gray-400" value={settings.profile.firstName} onChange={e => handleInputChange('profile', 'firstName', e.target.value)} />
              </div>
              <div>
                <label className="block font-medium text-gray-900 dark:text-gray-100">Last Name <InfoTooltip message="Your family name." /></label>
                <input className="w-full border rounded px-3 py-2 bg-white text-gray-900 border-gray-300 placeholder-gray-400 dark:bg-neutral-800 dark:text-gray-100 dark:border-neutral-700 dark:placeholder-gray-400" value={settings.profile.lastName} onChange={e => handleInputChange('profile', 'lastName', e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <label className="block font-medium text-gray-900 dark:text-gray-100">Email <InfoTooltip message="Your contact email address." /></label>
                <input className="w-full border rounded px-3 py-2 bg-white text-gray-900 border-gray-300 placeholder-gray-400 dark:bg-neutral-800 dark:text-gray-100 dark:border-neutral-700 dark:placeholder-gray-400" value={settings.profile.email} onChange={e => handleInputChange('profile', 'email', e.target.value)} />
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button type="submit" className="px-8 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700" disabled={profileLoading}>Save</button>
              <button type="button" className="px-8 py-2 rounded bg-gray-400 text-white hover:bg-gray-500 dark:bg-neutral-700 dark:text-gray-200 dark:hover:bg-neutral-600" onClick={handleProfileCancel} disabled={profileLoading}>Cancel</button>
            </div>
          </form>
        )}
        {activeTab === 'notifications' && (
          <form onSubmit={handleNotificationsSave} className="w-full max-w-2xl">
            <h3 className="text-lg font-bold mb-4">Notification Preferences</h3>
            {notificationsError && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{notificationsError}</div>}
            {notificationsLoading && <div className="text-gray-500 mb-4">Loading...</div>}
            <div className="flex flex-col gap-4">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={notifPrefs.email} onChange={() => handleNotifChange('email')} />
                Email Notifications <InfoTooltip message="Receive updates via email." />
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={notifPrefs.slack} onChange={() => handleNotifChange('slack')} />
                Slack Notifications <InfoTooltip message="Get notified in Slack channels." />
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={notifPrefs.inApp} onChange={() => handleNotifChange('inApp')} />
                In-App Notifications <InfoTooltip message="See notifications inside the app." />
              </label>
            </div>
            <div className="flex gap-4 mt-8">
              <button type="submit" className="btn-primary px-8 py-2" disabled={notificationsLoading}>Save</button>
            </div>
          </form>
        )}
        {activeTab === 'integrations' && (
          <div className="relative">
            <h3 className="text-lg font-bold mb-4">Integrations</h3>
            {showConnectedBanner.show && (
              <div className="absolute left-1/2 top-0 transform -translate-x-1/2 mt-2 z-50">
                <div className="bg-green-200 text-green-900 text-lg font-bold px-8 py-2 rounded-xl shadow animate-fade-in">
                  {showConnectedBanner.name} Connected
                </div>
              </div>
            )}
            {showDisconnectedBanner.show && (
              <div className="absolute left-1/2 top-0 transform -translate-x-1/2 mt-2 z-50">
                <div className="bg-red-200 text-red-900 text-lg font-bold px-8 py-2 rounded-xl shadow animate-fade-in">
                  {showDisconnectedBanner.name} Disconnected
                </div>
              </div>
            )}
            <div className="flex flex-col gap-6 mt-8">
              {INTEGRATIONS_LIST.map(intg => (
                <div key={intg.key} className="flex items-center gap-4 border-b pb-3 relative">
                  <div className="flex-1">
                    <div className="font-bold text-lg">{intg.name}</div>
                    <div className="text-gray-500 text-sm">{intg.desc}</div>
                  </div>
                  {integrationState[intg.key] ? (
                    <>
                      <span className="text-green-700 font-medium">{integrationState[intg.key]}</span>
                      <button className="px-3 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800" onClick={() => handleDisconnect(intg.key, intg.name)}>Disconnect</button>
                    </>
                  ) : (
                    <button className="px-3 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800" onClick={() => handleConnect(intg.key, intg.name)}>Connect</button>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-8">
              <button className="px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-neutral-700 dark:text-gray-200 dark:hover:bg-neutral-600" onClick={() => setShowRequestModal(true)}>
                Request a new integration
              </button>
            </div>
            {showRequestModal && (
              <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Request Integration</h2>
                    <button className="text-gray-400 hover:text-gray-700 text-2xl" onClick={() => setShowRequestModal(false)}>&times;</button>
                  </div>
                  <form onSubmit={handleRequestSubmit} className="space-y-4">
                    <label className="block font-medium">Integration Name</label>
                    <input className="w-full border rounded px-3 py-2 bg-white text-gray-900 border-gray-300 placeholder-gray-400 dark:bg-neutral-800 dark:text-gray-100 dark:border-neutral-700 dark:placeholder-gray-400" value={requestIntegration} onChange={e => setRequestIntegration(e.target.value)} placeholder="e.g. Notion, Confluence, etc." required />
                    <button type="submit" className="btn-primary px-8 py-2 w-full">Submit Request</button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
        {activeTab === 'theme' && (
          <form onSubmit={handleThemeSave} className="w-full max-w-2xl">
            <h3 className="text-lg font-bold mb-4">Theme</h3>
            {themeError && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{themeError}</div>}
            {themeLoading && <div className="text-gray-500 mb-4">Loading...</div>}
            <div className="flex gap-4 items-center">
              <button
                type="button"
                className={`px-4 py-2 rounded ${theme === 'light' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                onClick={() => handleThemeChange('light')}
              >Light</button>
              <button
                type="button"
                className={`px-4 py-2 rounded ${theme === 'dark' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                onClick={() => handleThemeChange('dark')}
              >Dark</button>
              <InfoTooltip message="Choose your preferred color theme." />
            </div>
            <div className="flex gap-4 mt-8">
              <button type="submit" className="btn-primary px-8 py-2" disabled={themeLoading}>Save</button>
            </div>
          </form>
        )}
        {activeTab === 'onboarding' && (
          <form onSubmit={handleOnboardingSave} className="w-full max-w-2xl">
            <h3 className="text-lg font-bold mb-4">Onboarding Checklist</h3>
            {onboardingError && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{onboardingError}</div>}
            {onboardingLoading && <div className="text-gray-500 mb-4">Loading...</div>}
            <ul className="space-y-3">
              {onboardingChecklist.map(item => (
                <li key={item.key} className="flex items-center gap-3">
                  <input type="checkbox" checked={onboarding[item.key]} onChange={() => handleOnboardingCheck(item.key)} />
                  <span>{item.label}</span>
                  <InfoTooltip message={`Mark as done when you ${item.label.toLowerCase()}.`} />
                </li>
              ))}
            </ul>
            <div className="flex gap-4 mt-8">
              <button type="submit" className="btn-primary px-8 py-2" disabled={onboardingLoading}>Save</button>
            </div>
          </form>
        )}
        {activeTab === 'app' && (
          <form onSubmit={handleAppSubmit} className="w-full max-w-3xl">
            <h3 className="text-lg font-bold mb-4">Application Settings</h3>
            {appError && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{appError}</div>}
            {appLoading && <div className="text-gray-500 mb-4">Loading...</div>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* AI Service Selection */}
              <div className="col-span-2 flex gap-3 mb-4">
                {AI_SERVICES.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    className={`px-5 py-2 rounded-full font-semibold text-base border transition-colors focus:outline-none min-w-[90px] ${
                      settings.aiService === s.value
                        ? 'bg-blue-400 text-white border-blue-400 shadow'
                        : 'bg-white text-blue-900 border-blue-400 hover:bg-blue-50'
                    }`}
                    onClick={() => handleRootChange('aiService', s.value)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              {/* AI Fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700">AI API URL*</label>
                <input type="text" value={settings.openai.url} onChange={e => handleInputChange('openai', 'url', e.target.value)} className="input mt-1 w-full bg-white text-gray-900 border-gray-300 placeholder-gray-400 dark:bg-neutral-800 dark:text-gray-100 dark:border-neutral-700 dark:placeholder-gray-400" placeholder="https://api.openai.com/v1/chat/completions" disabled={settings.aiService === 'openai'} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">API Key*</label>
                <input type="password" value={settings.openai.apiKey} onChange={e => handleInputChange('openai', 'apiKey', e.target.value)} className="input mt-1 w-full bg-white text-gray-900 border-gray-300 placeholder-gray-400 dark:bg-neutral-800 dark:text-gray-100 dark:border-neutral-700 dark:placeholder-gray-400" placeholder="Your OpenAI API key" disabled={settings.aiService === 'openai'} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">AI Model</label>
                <input type="text" value={settings.openai.model} onChange={e => handleInputChange('openai', 'model', e.target.value)} className="input mt-1 w-full bg-white text-gray-900 border-gray-300 placeholder-gray-400 dark:bg-neutral-800 dark:text-gray-100 dark:border-neutral-700 dark:placeholder-gray-400" placeholder="gpt-4o" disabled={settings.aiService === 'openai'} />
              </div>
              {/* Automation Fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Project Location*</label>
                <input type="text" value={settings.automation.projectLocation} onChange={e => handleInputChange('automation', 'projectLocation', e.target.value)} className="input mt-1 w-full bg-white text-gray-900 border-gray-300 placeholder-gray-400 dark:bg-neutral-800 dark:text-gray-100 dark:border-neutral-700 dark:placeholder-gray-400" placeholder="/path/to/your/project" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Script Language*</label>
                <input type="text" value={settings.automation.scriptLanguage} onChange={e => handleInputChange('automation', 'scriptLanguage', e.target.value)} className="input mt-1 w-full bg-white text-gray-900 border-gray-300 placeholder-gray-400 dark:bg-neutral-800 dark:text-gray-100 dark:border-neutral-700 dark:placeholder-gray-400" placeholder="java" />
              </div>
              {/* Project Management Fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Project ID*</label>
                <input type="text" value={settings.jira.projectId} onChange={e => handleInputChange('jira', 'projectId', e.target.value)} className="input mt-1 w-full bg-white text-gray-900 border-gray-300 placeholder-gray-400 dark:bg-neutral-800 dark:text-gray-100 dark:border-neutral-700 dark:placeholder-gray-400" placeholder="scrum" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">TC Link Type</label>
                <input type="text" value={settings.jira.testCaseLinkType} onChange={e => handleInputChange('jira', 'testCaseLinkType', e.target.value)} className="input mt-1 w-full bg-white text-gray-900 border-gray-300 placeholder-gray-400 dark:bg-neutral-800 dark:text-gray-100 dark:border-neutral-700 dark:placeholder-gray-400" placeholder="Relates" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">URL*</label>
                <input type="text" value={settings.jira.url} onChange={e => handleInputChange('jira', 'url', e.target.value)} className="input mt-1 w-full bg-white text-gray-900 border-gray-300 placeholder-gray-400 dark:bg-neutral-800 dark:text-gray-100 dark:border-neutral-700 dark:placeholder-gray-400" placeholder="https://your-domain.atlassian.net" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">API Token*</label>
                <input type="password" value={settings.jira.apiToken} onChange={e => handleInputChange('jira', 'apiToken', e.target.value)} className="input mt-1 w-full bg-white text-gray-900 border-gray-300 placeholder-gray-400 dark:bg-neutral-800 dark:text-gray-100 dark:border-neutral-700 dark:placeholder-gray-400" placeholder="Your Jira API token" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">User Name</label>
                <input type="email" value={settings.jira.username} onChange={e => handleInputChange('jira', 'username', e.target.value)} className={`input mt-1 w-full bg-white text-gray-900 border-gray-300 placeholder-gray-400 dark:bg-neutral-800 dark:text-gray-100 dark:border-neutral-700 dark:placeholder-gray-400 ${appEmailError ? 'border-red-500' : ''}`} placeholder="your-email@example.com" />
                {appEmailError && <div className="text-red-600 text-xs mt-1">{appEmailError}</div>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Bug Link Type</label>
                <input type="text" value={settings.jira.bugLinkType} onChange={e => handleInputChange('jira', 'bugLinkType', e.target.value)} className="input mt-1 w-full bg-white text-gray-900 border-gray-300 placeholder-gray-400 dark:bg-neutral-800 dark:text-gray-100 dark:border-neutral-700 dark:placeholder-gray-400" placeholder="Blocks" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">TC Issue Type</label>
                <input type="text" value={settings.jira.testCaseIssueType} onChange={e => handleInputChange('jira', 'testCaseIssueType', e.target.value)} className="input mt-1 w-full bg-white text-gray-900 border-gray-300 placeholder-gray-400 dark:bg-neutral-800 dark:text-gray-100 dark:border-neutral-700 dark:placeholder-gray-400" placeholder="Task" />
              </div>
              {/* Test Case Format */}
              <div className="col-span-2 flex items-center gap-3 mt-2">
                <label className="block text-sm font-medium text-gray-700">Test Case Format</label>
                <select value={settings.testCaseFormat} onChange={e => handleRootChange('testCaseFormat', e.target.value)} className="input w-auto bg-white text-gray-900 border-gray-300 placeholder-gray-400 dark:bg-neutral-800 dark:text-gray-100 dark:border-neutral-700 dark:placeholder-gray-400">
                  {TEST_CASE_FORMATS.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button type="submit" className="btn-primary px-8 py-2">Save</button>
              <button type="button" className="btn-primary px-8 py-2 bg-gray-400 hover:bg-gray-500" onClick={handleAppCancel}>Cancel</button>
            </div>
          </form>
        )}
      </section>
      {disconnectConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-red-50 border border-red-400 rounded-xl shadow-lg p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-red-700">Disconnect Integration</h2>
              <button className="text-red-400 hover:text-red-700 text-2xl" onClick={cancelDisconnect}>&times;</button>
            </div>
            <div className="mb-6 text-red-700">Are you sure you want to disconnect <b>{disconnectConfirm.name}</b>?</div>
            <div className="flex gap-4 justify-end">
              <button className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300" onClick={cancelDisconnect}>Cancel</button>
              <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-bold shadow" onClick={confirmDisconnect}>Disconnect</button>
            </div>
          </div>
        </div>
      )}
      {connectModal.show && (
        <Modal open={connectModal.show} onClose={handleConnectCancel} title={`Connect to ${connectModal.name}`} width="max-w-md">
          <form onSubmit={handleConnectSubmit} className="space-y-4">
            {INTEGRATION_FIELDS[connectModal.key]?.map(field => (
              <div key={field.key}>
                <label className="block font-medium mb-1">{field.label}</label>
                <input
                  type={field.type}
                  required={field.required}
                  className="w-full border rounded px-3 py-2 bg-white text-gray-900 border-gray-300 placeholder-gray-400 dark:bg-neutral-800 dark:text-gray-100 dark:border-neutral-700 dark:placeholder-gray-400"
                  value={connectModal.fields[field.key] || ''}
                  onChange={e => handleConnectFieldChange(field.key, e.target.value)}
                />
              </div>
            ))}
            <div className="flex gap-4 justify-end mt-6">
              <button type="button" className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 dark:bg-neutral-700 dark:text-gray-100" onClick={handleConnectCancel}>Cancel</button>
              <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Connect</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Settings; 
