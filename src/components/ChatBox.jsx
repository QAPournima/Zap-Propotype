import React, { useState, useEffect } from 'react';
import { chatService } from '../services/api';

// Helper functions for prompt detection
function isTestCaseBugPrompt(message) {
  if (!message) return false;
  const lower = message.toLowerCase();
  return lower.includes('to generate a test case') && lower.includes('to report a bug');
}
function isBugCancelPrompt(message) {
  if (!message) return false;
  const lower = message.toLowerCase();
  return lower.includes('do you want to cancel') || lower.includes('cancel bug creation');
}
function isYesNoPrompt(message) {
  if (!message) return false;
  const lower = message.toLowerCase();
  return lower.includes('would you like to') && lower.includes('yes/no');
}
function isErrorMessage(message) {
  if (!message) return false;
  return message.toLowerCase().includes('error');
}
function isGenerateAutomationPrompt(message) {
  if (!message) return false;
  return message.toLowerCase().includes('would you like to generate an automation script for this test case?');
}
function isLinkedTestCasePrompt(message) {
  if (!message) return false;
  return message.toLowerCase().includes('there are already linked test cases. do you still want to create a new test case for this user story?');
}

const ChatBox = ({
  chatOpen, setChatOpen, messages, setMessages, input, setInput, loading, setLoading,
  audioRef, messagesEndRef, uploadedFile, setUploadedFile, actionLoading, setActionLoading,
  followupActions, setFollowupActions, followupError, setFollowupError, followupMessageIdx, setFollowupMessageIdx, buttonClickedIdx, setButtonClickedIdx,
  sendMessage, handleGenerate, handleFollowupAction, welcomeMessage
}) => {
  // Add state to track which result message should show the action buttons
  const [resultActionIdx, setResultActionIdx] = useState(null);

  // 1. Add new state for workflow
  const [postUploadAction, setPostUploadAction] = useState(null); // 'userStory' | 'testCase' | null
  const [processState, setProcessState] = useState('idle'); // 'idle' | 'awaitingAction' | 'awaitingAI' | 'showResult' | 'awaitingJiraId'
  const [aiResult, setAiResult] = useState(null); // { content, pdfUrl, ... }
  const [jiraIssueId, setJiraIssueId] = useState('');

  // Updated handlers using chatService
  const handleDownloadPDF = async (msg) => {
    try {
      const response = await chatService.downloadAsPDF(msg.message);
      // Assume response contains a file URL or blob
      if (response.data && response.data.fileUrl) {
        window.open(response.data.fileUrl, '_blank');
      } else if (response.data && response.data.blob) {
        // If backend returns a blob
        const url = window.URL.createObjectURL(new Blob([response.data.blob], { type: 'application/pdf' }));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'user_story.pdf');
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
      } else {
        alert('PDF download response format not recognized.');
      }
    } catch (err) {
      alert('Failed to download PDF');
    }
  };
  const handleCreateJiraIssue = async (msg) => {
    try {
      await chatService.linkToJira(msg.message);
      alert('Jira issue created!');
    } catch (err) {
      alert('Failed to create Jira issue');
    }
  };
  const handleCancelResult = (msg) => {
    setResultActionIdx(null);
  };

  // Helper to send a direct message (for prompt buttons)
  const sendMessageDirect = async (msg) => {
    setButtonClickedIdx(messages.length - 1);
    setInput(''); // Clear the input box immediately
    await sendMessage({ preventDefault: () => {} }, msg);
  };

  // 2. Update handleFileUpload to set uploadedFile and move to next step
  const handleFileUpload = async (file) => {
    setProcessState('idle');
    setUploadedFile(null);
    setPostUploadAction(null);
    setAiResult(null);
    setJiraIssueId('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await chatService.uploadDocument(formData);
      setUploadedFile({ name: response.data.name, ...response.data });
      setProcessState('awaitingAction');
      setMessages(prev => [...prev, {
        sender: 'ai',
        message: 'Document uploaded. What would you like to do?',
        fileName: response.data.name,
        type: 'info',
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        sender: 'ai',
        message: 'Failed to upload document.',
        type: 'error',
      }]);
    }
  };

  // 3. Handler for post-upload action selection
  const handlePostUploadAction = async (action) => {
    setPostUploadAction(action);
    setProcessState('awaitingAI');
    setMessages(prev => [...prev, {
      sender: 'user',
      message: `Create ${action === 'userStory' ? 'User Story' : 'Test Case'} from uploaded document`,
      type: 'action',
    }]);
    try {
      // Send to backend: fileName, action, and prompt (if any)
      const response = await chatService.generateFromDocument({
        fileName: uploadedFile.name,
        action,
        prompt: '', // Add prompt if needed
      });
      setAiResult(response.data);
      setProcessState('showResult');
      setMessages(prev => [...prev, {
        sender: 'ai',
        message: response.data.content || 'AI result ready.',
        type: 'aiResult',
        fileName: uploadedFile.name,
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        sender: 'ai',
        message: 'Failed to generate output.',
        type: 'error',
      }]);
      setProcessState('awaitingAction');
    }
  };

  // 4. Handlers for result actions
  const handleLinkToJira = () => {
    setProcessState('awaitingJiraId');
  };
  const handleJiraSubmit = async () => {
    try {
      await chatService.linkToJira({
        fileName: uploadedFile.name,
        aiResult: aiResult.content,
        issueId: jiraIssueId,
      });
      setMessages(prev => [...prev, {
        sender: 'ai',
        message: `Linked to Jira issue ${jiraIssueId}`,
        type: 'info',
      }]);
      setProcessState('idle');
      setUploadedFile(null);
      setAiResult(null);
      setJiraIssueId('');
    } catch (err) {
      setMessages(prev => [...prev, {
        sender: 'ai',
        message: 'Failed to link to Jira.',
        type: 'error',
      }]);
    }
  };
  const handleCancel = () => {
    setProcessState('idle');
    setUploadedFile(null);
    setAiResult(null);
    setJiraIssueId('');
  };

  useEffect(() => {
    if (messagesEndRef && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, messagesEndRef]);

  if (!chatOpen) return null;
  return (
    <div className="fixed bottom-8 right-8 z-50 flex justify-end items-end w-full pointer-events-none">
      <div className="flex flex-col rounded-3xl shadow-2xl border w-full max-w-xl h-[80vh] pointer-events-auto overflow-hidden bg-[#1A1E1D]">
        {/* Chat Header */}
        <div className="flex items-center gap-3 px-6 py-4 bg-[#1A1E1D] border-b rounded-t-3xl shadow-md">
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center font-bold text-blue-600 text-xl overflow-hidden border-2 border-blue-200 shadow">
            <img
              src="/images/oldbot_avatar.png"
              alt="AI Avatar"
              className="w-full h-full object-cover"
              onError={e => {
                e.target.onerror = null;
                e.target.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'><circle cx='24' cy='24' r='24' fill='%233b82f6'/><text x='50%' y='54%' text-anchor='middle' fill='white' font-size='22' font-family='Arial' dy='.3em'>🤖</text></svg>";
              }}
            />
          </div>
          <div className="font-bold text-xl text-white drop-shadow">AI Agent</div>
          <div className="ml-auto flex gap-2 items-center">
            {/* Minimize button (horizontal line) */}
            <button className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow hover:bg-blue-100 transition" onClick={() => setChatOpen(false)} title="Minimize">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12" strokeWidth="2" strokeLinecap="round" /></svg>
            </button>
          </div>
        </div>
        {/* Chat Messages */}
        <div className="flex-1 flex flex-col gap-3 px-4 py-6 overflow-y-auto bg-blue-50/70" style={{backdropFilter: 'blur(2px)'}}>
          {messages.length === 0 ? (
            <div className="bg-white rounded-xl p-6 text-gray-700 text-base whitespace-pre-line shadow max-w-[90%] mx-auto mt-10">
              {welcomeMessage}
            </div>
          ) : (
            messages.map((msg, index) => {
              const isPrompt =
                msg.sender === 'ai' &&
                typeof msg.message === 'string' &&
                msg.message.toLowerCase().includes('reply with: *test case*') &&
                msg.message.toLowerCase().includes('reply with: *bug*');
              const isYesNoPrompt =
                msg.sender === 'ai' &&
                typeof msg.message === 'string' &&
                (msg.message.toLowerCase().includes('do you still want to create a new test case') ||
                 msg.message.toLowerCase().includes('would you like to') ||
                 msg.message.toLowerCase().includes('yes/no'));
              // Detect document upload summary (empty or summary message, and has file info)
              const isUploadSummary =
                msg.sender === 'ai' &&
                ((msg.message === '' || (msg.message && msg.message.length < 200)) && (msg.file || msg.fileName));

              // Handler for creating test case from uploaded file
              const handleCreateTestCaseFromFile = async () => {
                try {
                  setLoading(true);
                  const response = await chatService.generateTestCaseFromFile(msg.fileName || msg.file);
                  setMessages(prev => [...prev, {
                    sender: 'ai',
                    message: response.data.message,
                    type: 'testCase',
                  }]);
                } catch (err) {
                  setMessages(prev => [...prev, {
                    sender: 'ai',
                    message: 'Failed to generate test case from file.',
                    type: 'error',
                  }]);
                } finally {
                  setLoading(false);
                }
              };
              // Handler for creating user story from uploaded file
              const handleCreateUserStoryFromFile = async () => {
                try {
                  setLoading(true);
                  const response = await chatService.generateUserStoryFromFile(msg.fileName || msg.file);
                  setMessages(prev => [...prev, {
                    sender: 'ai',
                    message: response.data.message,
                    type: 'userStory',
                  }]);
                } catch (err) {
                  setMessages(prev => [...prev, {
                    sender: 'ai',
                    message: 'Failed to generate user story from file.',
                    type: 'error',
                  }]);
                } finally {
                  setLoading(false);
                }
              };

              return (
                <div
                  key={index}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} w-full`}
                >
                  <div
                    className={`rounded-xl px-5 py-3 shadow-md mb-2 max-w-[75%] break-words whitespace-pre-wrap transition-all
                      ${msg.sender === 'user'
                        ? 'bg-blue-500 text-white rounded-br-sm ml-auto'
                        : msg.type === 'error'
                        ? 'bg-red-100 text-red-800 border border-red-200'
                        : msg.type === 'status'
                        ? 'bg-gray-100 text-gray-600 italic border border-gray-200'
                        : 'bg-white text-gray-900 rounded-bl-sm border border-gray-200'}
                    `}
                  >
                    {msg.type === 'userStory' || msg.type === 'testCase' ? (
                      <div className="space-y-2">
                        <div className="font-semibold">{msg.message}</div>
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleDownloadPDF(msg.message)}
                            className="text-xs bg-white text-blue-600 border border-blue-200 px-3 py-1 rounded hover:bg-blue-50 transition"
                          >
                            Download PDF
                          </button>
                          <button
                            onClick={() => handleCreateJiraIssue(msg.message)}
                            className="text-xs bg-white text-blue-600 border border-blue-200 px-3 py-1 rounded hover:bg-blue-50 transition"
                          >
                            Create Jira Issue
                          </button>
                          <button
                            onClick={() => handleCancelResult(msg)}
                            className="text-xs bg-white text-red-600 border border-red-200 px-3 py-1 rounded hover:bg-red-50 transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>{msg.message}</div>
                    )}
                    {isPrompt && (
                      <div className="flex gap-3 mt-4">
                        <button
                          className="px-4 py-2 rounded bg-blue-500 text-white font-semibold shadow hover:bg-blue-600 transition"
                          onClick={() => sendMessageDirect('test case')}
                        >
                          Generate Test Case
                        </button>
                        <button
                          className="px-4 py-2 rounded bg-red-500 text-white font-semibold shadow hover:bg-red-600 transition"
                          onClick={() => sendMessageDirect('bug')}
                        >
                          Report Bug
                        </button>
                      </div>
                    )}
                    {isYesNoPrompt && (
                      <div className="flex gap-3 mt-4">
                        <button
                          className="px-4 py-2 rounded bg-green-500 text-white font-semibold shadow hover:bg-green-600 transition"
                          onClick={() => sendMessageDirect('yes')}
                        >
                          Yes
                        </button>
                        <button
                          className="px-4 py-2 rounded bg-gray-400 text-white font-semibold shadow hover:bg-gray-500 transition"
                          onClick={() => sendMessageDirect('no')}
                        >
                          No
                        </button>
                      </div>
                    )}
                    {isUploadSummary && (
                      <div className="flex gap-3 mt-4">
                        <button
                          className="px-4 py-2 rounded bg-blue-500 text-white font-semibold shadow hover:bg-blue-600 transition"
                          onClick={handleCreateTestCaseFromFile}
                        >
                          Create Test Case
                        </button>
                        <button
                          className="px-4 py-2 rounded bg-green-500 text-white font-semibold shadow hover:bg-green-600 transition"
                          onClick={handleCreateUserStoryFromFile}
                        >
                          Create User Story
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          {/* Dummy div for auto-scroll */}
          <div ref={messagesEndRef} />
          {loading && <div className="self-start text-xs text-gray-400">AI is typing...</div>}
          {processState === 'awaitingAction' && (
            <div className="flex gap-4 mt-4">
              <button onClick={() => handlePostUploadAction('userStory')} className="btn-primary">Create User Story</button>
              <button onClick={() => handlePostUploadAction('testCase')} className="btn-primary">Create Test Case</button>
            </div>
          )}
          {processState === 'showResult' && aiResult && (
            <div className="flex gap-4 mt-4">
              <button onClick={handleDownloadPDF} className="btn-primary">Download PDF</button>
              <button onClick={handleLinkToJira} className="btn-primary">Link to Jira</button>
              <button onClick={handleCancel} className="btn-secondary">Cancel</button>
            </div>
          )}
          {processState === 'awaitingJiraId' && (
            <div className="flex gap-2 mt-4 items-center">
              <input value={jiraIssueId} onChange={e => setJiraIssueId(e.target.value)} placeholder="Enter Jira Issue ID" className="input" />
              <button onClick={handleJiraSubmit} className="btn-primary">Submit</button>
              <button onClick={handleCancel} className="btn-secondary">Cancel</button>
            </div>
          )}
        </div>
        {/* Compose Bar */}
        <form onSubmit={sendMessage} className="flex items-center gap-2 px-4 py-4 border-t rounded-b-3xl shadow-inner bg-[#1A1E1D]">
          {/* Attach Button */}
          <label className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-blue-50 cursor-pointer transition">
            <input
              type="file"
              accept="application/pdf"
              style={{ display: 'none' }}
              onChange={e => {
                const file = e.target.files[0];
                if (file) {
                  setMessages(prev => [
                    ...prev,
                    { sender: 'user', message: `Uploaded: ${file.name}`, type: 'file', fileName: file.name }
                  ]);
                  handleFileUpload(file);
                }
              }}
            />
            <svg className="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 002.828 2.828l6.586-6.586a2 2 0 00-2.828-2.828z" />
            </svg>
          </label>
          <input
            className="input flex-1 rounded-full border-2 border-blue-400 focus:ring-2 focus:ring-blue-400 px-5 py-3 text-base shadow-sm bg-white text-gray-900 placeholder-gray-400"
            type="text"
            placeholder="Type your message..."
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading}
            style={{ minHeight: '48px' }}
          />
          <button className="btn-primary rounded-full px-6 py-2 text-base shadow hover:bg-blue-600 transition" type="submit" disabled={loading || !input.trim()}>Send</button>
        </form>
        {/* Audio for bot message */}
        <audio ref={audioRef} preload="auto">
          <source src="/sounds/send.wav" type="audio/wav" />
          Your browser does not support the audio element.
        </audio>
      </div>
    </div>
  );
};

export default ChatBox; 