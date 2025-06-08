// Mock Data
const mockTestHistory = [
    {
        id: 'TR-001',
        name: 'TC-001: Login Functionality',
        status: 'Passed',
        date: '15/05/24, 10:30',
        steps: 3,
        passed: 3,
        failed: 0
    },
    {
        id: 'TR-002',
        name: 'TC-002: User Registration',
        status: 'Failed',
        date: '15/05/24, 11:45',
        steps: 4,
        passed: 2,
        failed: 2
    },
    {
        id: 'TR-003',
        name: 'TC-003: Password Reset',
        status: 'Passed',
        date: '15/05/24, 14:20',
        steps: 5,
        passed: 5,
        failed: 0
    }
];

const mockActivities = [
    {
        id: 'ACT-001',
        type: 'Test Run',
        description: 'Manual test run completed for TC-001: Login Functionality',
        status: 'Passed',
        date: '15/05/24, 10:30',
        user: 'demo_user'
    },
    {
        id: 'ACT-002',
        type: 'Automated Test',
        description: 'Automated test suite "Login Test Suite" completed',
        status: 'Failed',
        date: '15/05/24, 11:45',
        user: 'demo_user'
    },
    {
        id: 'ACT-003',
        type: 'Test Run',
        description: 'Manual test run completed for TC-003: Password Reset',
        status: 'Passed',
        date: '15/05/24, 14:20',
        user: 'demo_user'
    }
];

// Login Handler
function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Mock login validation
    if (username && password) {
        document.getElementById('login').style.display = 'none';
        document.querySelector('.app-container').style.display = 'flex';
        document.querySelector('.username').textContent = username;
    }
}

// Chatbox Functions
function toggleChatbox() {
    const chatbox = document.getElementById('chatbox');
    chatbox.classList.toggle('active');
}

function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (message) {
        const chatMessages = document.getElementById('chatMessages');
        
        // Add user message
        const userMessage = document.createElement('div');
        userMessage.className = 'message user';
        userMessage.textContent = message;
        chatMessages.appendChild(userMessage);
        
        // Clear input
        input.value = '';
        
        // Simulate bot response
        setTimeout(() => {
            const botMessage = document.createElement('div');
            botMessage.className = 'message bot';
            botMessage.textContent = getBotResponse(message);
            chatMessages.appendChild(botMessage);
            
            // Scroll to bottom
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 1000);
    }
}

function getBotResponse(message) {
    // Simple response logic
    const responses = {
        'help': 'I can help you with running tests, viewing reports, and more. What would you like to know?',
        'test': 'Would you like to run a manual test or an automated test?',
        'report': 'You can find test reports in the Test History section.',
        'default': 'I\'m here to help! You can ask me about running tests, viewing reports, or any other QA-related questions.'
    };
    
    message = message.toLowerCase();
    for (let key in responses) {
        if (message.includes(key)) {
            return responses[key];
        }
    }
    return responses.default;
}

// Activity Logs Functions
function populateActivityLogs() {
    const activityList = document.getElementById('activityList');
    activityList.innerHTML = '';

    mockActivities.forEach(activity => {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        activityItem.innerHTML = `
            <div class="activity-info">
                <div class="activity-type">${activity.type}</div>
                <div class="activity-description">${activity.description}</div>
                <div class="activity-date">${activity.date}</div>
            </div>
            <span class="status-badge ${activity.status.toLowerCase()}">${activity.status}</span>
        `;
        activityList.appendChild(activityItem);
    });
}

function sortActivityByDate() {
    mockActivities.sort((a, b) => {
        const dateA = new Date(a.date.split(',')[0].split('/').reverse().join('-'));
        const dateB = new Date(b.date.split(',')[0].split('/').reverse().join('-'));
        return dateB - dateA;
    });
    populateActivityLogs();
}

// Navigation
function navigateTo(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(sectionId).classList.add('active');
    
    // Update navigation links
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
        }
    });
}

// Initialize navigation
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const sectionId = link.getAttribute('href').substring(1);
        navigateTo(sectionId);
    });
});

// Populate Test History Table
function populateTestHistory() {
    const tableBody = document.getElementById('historyTableBody');
    tableBody.innerHTML = '';

    mockTestHistory.forEach(test => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${test.name}</td>
            <td><span class="status-badge ${test.status.toLowerCase()}">${test.status}</span></td>
            <td>${test.date}</td>
            <td>
                <button class="btn secondary" onclick="viewTestReport('${test.id}')">View Report</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Sort Test History by Date
function sortByDate() {
    mockTestHistory.sort((a, b) => {
        const dateA = new Date(a.date.split(',')[0].split('/').reverse().join('-'));
        const dateB = new Date(b.date.split(',')[0].split('/').reverse().join('-'));
        return dateB - dateA;
    });
    populateTestHistory();
}

// Start Manual Test
function startTest() {
    const testCase = document.getElementById('testCaseSelect').value;
    console.log(`Starting manual test: ${testCase}`);
    
    // Add activity log
    const newActivity = {
        id: `ACT-${mockActivities.length + 1}`,
        type: 'Test Run',
        description: `Manual test started for ${testCase}`,
        status: 'In Progress',
        date: new Date().toLocaleString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).replace(',', ''),
        user: 'demo_user'
    };
    mockActivities.unshift(newActivity);
    populateActivityLogs();
}

// Run Automated Test
function runAutomatedTest() {
    const testSuite = document.getElementById('testSuiteSelect').value;
    console.log(`Running automated test suite: ${testSuite}`);
    
    // Add activity log
    const newActivity = {
        id: `ACT-${mockActivities.length + 1}`,
        type: 'Automated Test',
        description: `Automated test suite "${testSuite}" started`,
        status: 'In Progress',
        date: new Date().toLocaleString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).replace(',', ''),
        user: 'demo_user'
    };
    mockActivities.unshift(newActivity);
    populateActivityLogs();
    
    // Simulate progress
    let progress = 0;
    const progressBar = document.getElementById('testProgress');
    const progressText = document.getElementById('progressText');
    
    const interval = setInterval(() => {
        progress += 10;
        progressBar.style.width = `${progress}%`;
        progressText.textContent = `${progress}%`;
        
        if (progress >= 100) {
            clearInterval(interval);
            // Update activity status
            newActivity.status = 'Completed';
            populateActivityLogs();
        }
    }, 500);
}

// View Test Report
function viewTestReport(testId) {
    const test = mockTestHistory.find(t => t.id === testId);
    if (test) {
        console.log(`Viewing report for test: ${test.name}`);
        // Add activity log
        const newActivity = {
            id: `ACT-${mockActivities.length + 1}`,
            type: 'Report View',
            description: `Viewed report for ${test.name}`,
            status: 'Info',
            date: new Date().toLocaleString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            }).replace(',', ''),
            user: 'demo_user'
        };
        mockActivities.unshift(newActivity);
        populateActivityLogs();
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    populateTestHistory();
    populateActivityLogs();
}); 