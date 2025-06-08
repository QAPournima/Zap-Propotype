# Zap⚡️ Platform Prototype

This is a prototype of the Zap⚡️ Platform, showcasing the main features and UI components.

## Features

- Dashboard with test statistics and recent runs
- Live Test interface for manual testing
- Automated Test execution with progress tracking
- Test History with filtering and sorting
- Modern, responsive UI

## Setup

1. Make sure you have Python 3.x installed
2. Clone this repository
3. Navigate to the prototype directory:
   ```bash
   cd zap-prototype
   ```
4. Start the server:
   ```bash
   python server.py
   ```
5. Open your browser and visit:
   ```
   http://localhost:3000
   ```

## Pages

1. **Dashboard**
   - Overview of test statistics
   - Recent test runs
   - Quick action buttons

2. **Live Test**
   - Test case selection
   - Step-by-step test execution
   - Pass/Fail actions

3. **Automated Test**
   - Test suite selection
   - Progress tracking
   - Real-time status updates

4. **Test History**
   - Filterable test run list
   - Status badges
   - Date sorting
   - Pagination

## Mock Data

The prototype uses mock data to simulate:
- Test cases
- Test runs
- Statistics
- User information

## Development

To modify the prototype:
1. Edit the HTML in `index.html`
2. Update styles in `styles.css`
3. Modify behavior in `script.js`
4. Restart the server to see changes

## Notes

- This is a prototype and does not connect to any backend services
- All data is static and resets on page refresh
- Some features are simulated for demonstration purposes 
