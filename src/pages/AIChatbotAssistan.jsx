import React, { useState, useRef, useEffect } from 'react';
import { chatService } from '../services/api';

const welcomeInfo = `📜 User Story 📝 Test Case Generation 🤖 Automation Scripts 🐞 Bugs Creation 🎑 Image analysis for UI element\n`;

export default function AIChatbotAssistan() {
  // Chat state
  const [messages, setMessages] = useState([
    { id: 0, text: `👋 Welcome to Zap⚡️ - Your AI Assistant!\n\nI can help you with:\n\n📝 Test Case Generation:\n- Generate test cases from user stories\n- link test cases to user stories\n- automate test cases\n\n🤖 Automation Scripts:\n- Create automation scripts from test cases or user stories\n- upload script to project\n\n🐞 Bugs Creation:\n- Create bug from user story\n- link bug to user story\n\n🎑 Image analysis for UI element:\n- UI element detection\n- create test case for UI element\n- create automation script for UI element\n\n🔍 How to get started:\n1. Use 'id ISSUE-ID' to work with a specific issue\n2. Type 'settings' to configure the application\n\nWhat would you like to do today? 🚀`, sender: 'bot'},
    { id: 1, text: 'Hello.', sender: 'user' },
    { id: 2, text: 'Hello! How can I help you today?', sender: 'bot' },
    { id: 3, text: 'I need help with my bug creation.', sender: 'user' },
    { id: 4, text: 'Sure, I can help you with that. if you want to create bug for jira issue please share the issue id.', sender: 'bot' },
    { id: 5, text: 'id SCRUM-1', sender: 'user' },
    { id: 6, text: 'User Story: Logout from the App\nSummary: As a user I want to logout from the App\nDescription: logout from the app\nnavigate to setting and click on logout button\nAcceptance Criteria:\n.1. The logout button should be visible in the sidebar.\n.2. The logout button should be clickable.\n.3. The logout button should logout the user from the app.\n 👉🏻 To generate a test case for this user story, reply with: Test Case\n 🐞 To report a bug for this user story, reply with: Bug', sender: 'bot' },
    { id: 7, text: 'bug', sender: 'user' },
    { id: 8, text: 'Great, you found a bug! To proceed with bug creation, can you provide as much detail as possible about the bug, please?\nTo cancel the process, reply with: cancel', sender: 'bot' },
    { id: 9, text: 'Logout Button on Sidebar Not Clickable', sender: 'user' },
    { id: 10, text: 'Bug: Logout Button on Sidebar Not Clickable\nSummary:\nAs a user, I want to log out of the app using the logout button in the sidebar, but the button is currently not clickable.\n\nDescription:\nThe logout button is visible in the sidebar, but clicking on it does not trigger any action. This prevents users from logging out through the expected interface.\n\nSteps to Reproduce:\n1. Log in to the application.\n2. Locate the logout button in the sidebar.\n3. Attempt to click the button.\n4. Observe that no logout action is performed.\n\nExpected Behavior:\n1. The logout button should be clearly visible.\n2. The button should be clickable.\n3. Clicking the button should log the user out, clear the session, and redirect to the login screen.\n\nActual Behavior:\n1. The logout button is visible but not responsive to user interaction.\n2. No logout or redirection occurs when clicked.\n\nSeverity: Major\nPriority: High\n\nEnvironment: [Specify environment, e.g., QA, Staging | Browser: Chrome 123 | OS: Windows 11]\n\n 🖼️ Would you like to attach a screenshot to this bug? (reply with: yes or no)', sender: 'bot' },
    { id: 11, text: 'yes', sender: 'user' },
    { id: 12, text: '📎 Please upload your screenshot(s) for the bug (max 3). Use the upload image 🏞️ button. When done, reply with: done or yes to create the bug.', sender: 'bot' },
    { id: 13, text: 'Image: zap-prototype/public/screenshots/step-4.png', sender: 'user' },
    { id: 14, text: 'Screenshot received! Are you done uploading? (yes/no) Or, once done, reply "done" to create the bug.', sender: 'bot' },
    { id: 15, text: 'done', sender: 'user' },
    { id: 16, text: '✅ Bug created successfully with ID: SCRUM-11\n🔗 The bug has been linked to the user story SCRUM-1', sender: 'bot' },
    { id: 17, text: 'You just created a bug. 🚀 If you want to add more details, please specify, or use a command like \'create test case\', \'create bug\', \'create User story\', \'create automation script\', or provide a Jira ID. and follow the instructions.', sender: 'bot' }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const audioRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [attachedFile, setAttachedFile] = useState(null);

  // Send message handler
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      setMessages([...messages, { id: messages.length + 1, text: newMessage, sender: 'user' }]);
      setNewMessage('');
    }
  };

  // File attach handler
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setAttachedFile(e.target.files[0]);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (messages.length > 0 && messages[messages.length - 1].sender === 'bot') {
      audioRef.current && audioRef.current.play().catch(() => {});
    }
  }, [messages]);

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-neutral-900 dark:text-gray-100 flex flex-col p-0">
      {/* Header/Welcome Panel */}
      <div className="flex flex-col gap-2 p-6 pb-2 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 sticky top-0 z-10">
        <h2 className="text-2xl font-bold">👋 Welcome to Zap⚡️ - Your AI Assistant!</h2>
        <div className="text-lg whitespace-pre-line leading-relaxed text-blue-200 dark:text-blue-200">
          📜 User Story 📝 Test Case Generation 🤖 Automation Scripts 🐞 Bugs Creation 🎑 Image analysis for UI element
        </div>
      </div>
      {/* Chat area with scrollable messages */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-4 py-6" style={{ maxHeight: 'calc(100vh - 260px)' }}>
          {messages.length === 0 ? (
            <div className="text-gray-400 text-base dark:text-gray-300">Ask me anything about test cases, automation, bugs, or UI analysis!</div>
          ) : (
            messages.map((message) => {
              const msgText = message.text || message.message || '';
              return (
                <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}> 
                  {msgText.startsWith('Image: ') && message.sender === 'user' ? (
                    <img
                      src={msgText.replace('Image: zap-prototype/public', '')}
                      alt="User uploaded screenshot"
                      className="max-w-xs rounded-lg border border-neutral-700 shadow"
                      style={{ background: '#222' }}
                    />
                  ) : (
                    <div className={`w-auto max-w-5xl p-4 rounded-lg shadow-sm break-words whitespace-pre-line ${message.sender === 'user' ? 'bg-blue-900/30 text-blue-200 dark:bg-blue-900/60 dark:text-blue-100' : 'bg-neutral-100 text-gray-900 dark:bg-neutral-800 dark:text-gray-100'}`}> 
                      {msgText.split('\n').map((line, i) => <div key={i}>{line}</div>)}
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
          {loading && <div className="self-start text-xs text-gray-400 dark:text-gray-300">AI is typing...</div>}
        </div>
        {/* Fixed message input panel at the bottom */}
        <div className="sticky bottom-0 z-20 bg-neutral-900 dark:bg-neutral-900 border-t border-neutral-800">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2 px-4 py-4">
            <label className="flex items-center cursor-pointer mr-2">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full border-2 border-blue-400 bg-neutral-900 text-blue-400 hover:bg-blue-950 hover:border-blue-500 dark:bg-neutral-900 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-950 transition">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-3A2.25 2.25 0 008.25 5.25V9m7.5 0v9A2.25 2.25 0 0113.5 20.25h-3A2.25 2.25 0 018.25 18V9m7.5 0H8.25" />
                </svg>
              </span>
              <input type="file" className="hidden" onChange={handleFileChange} />
            </label>
            <div className="flex-1 flex items-center">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="w-full rounded-full px-6 py-3 border-2 border-blue-400 focus:border-blue-500 outline-none bg-white text-gray-900 placeholder-gray-400 text-lg transition dark:bg-neutral-900 dark:text-gray-100 dark:placeholder-gray-400 dark:border-blue-400 dark:focus:border-blue-500"
                placeholder="Type your message..."
                disabled={loading}
                style={{boxShadow: '0 0 0 2px #2563eb22'}}
              />
            </div>
            <button
              type="submit"
              className="ml-2 px-8 py-3 rounded-full bg-[#10a3f9] text-white text-lg font-semibold shadow hover:bg-[#0e8ad6] transition disabled:opacity-60"
              disabled={loading || !newMessage.trim()}
              style={{minWidth: 90}}
            >Send</button>
          </form>
          {attachedFile && (
            <div className="flex items-center gap-2 mt-1 mb-2 ml-2">
              <span className="text-sm text-gray-300 dark:text-gray-200 truncate max-w-xs">{attachedFile.name}</span>
              <button type="button" className="text-xs text-red-400 hover:text-red-600" onClick={() => setAttachedFile(null)} title="Remove file">✕</button>
            </div>
          )}
        </div>
      </div>
      {/* Audio for bot message */}
      <audio ref={audioRef} preload="auto">
        <source src="/sounds/send.wav" type="audio/wav" />
        Your browser does not support the audio element.
      </audio>
    </div>
  );
} 